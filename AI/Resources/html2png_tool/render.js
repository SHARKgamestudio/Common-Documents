// render.js
// Renders an HTML file to a transparent PNG, cropped to the top-most
// visible element in the page (the element right after the main viewport
// container). Optionally use --largest to crop to the biggest element
// instead (more robust when generated HTML wraps the artwork in divs).
//
//   node render.js input.html [output.png] [--largest]

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
    const args = process.argv.slice(2);

    const useLargest = args.includes("--largest");
    const positional = args.filter(a => !a.startsWith("-"));
    const input = positional[0];
    let output = positional[1];

    if (!input) {
        console.log("Usage: node render.js input.html [output.png] [--largest]");
        process.exit(1);
    }

    const absInput = path.resolve(input);
    if (!fs.existsSync(absInput)) {
        console.error("File not found: " + absInput);
        process.exit(1);
    }

    if (!output) output = absInput.replace(/\.html$/i, ".png");
    const absOutput = path.resolve(output);

    const browser = await chromium.launch({ headless: true });

    // Fixed "main viewport" so responsive layouts compute correctly.
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
    });

    await page.goto("file://" + absInput, {
        waitUntil: "networkidle",
        timeout: 60000
    });

    // Transparent background + remove default margins/padding.
    await page.evaluate(() => {
        for (const el of [document.documentElement, document.body]) {
            el.style.background = "transparent";
            el.style.margin = "0";
            el.style.padding = "0";
        }
    });

    // Locate the target element.
    const info = await page.evaluate((useLargest) => {
        const isVisible = (el) => {
            const s = getComputedStyle(el);
            if (s.display === "none" || s.visibility === "hidden") return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        };

        let target;
        if (useLargest) {
            target = [...document.querySelectorAll("body *")]
                .filter(isVisible)
                .sort((a, b) => {
                    const ra = a.getBoundingClientRect();
                    const rb = b.getBoundingClientRect();
                    return rb.width * rb.height - ra.width * ra.height;
                })[0];
        } else {
            // "Top element": first visible direct child of <body>.
            target = [...document.body.children].find(isVisible);
        }

        if (!target) return null;

        const r = target.getBoundingClientRect();
        return {
            tag: target.tagName,
            id: target.id || null,
            cls: typeof target.className === "string" ? target.className : null,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height
        };
    }, useLargest);

    if (!info) {
        console.error("No visible element found in " + absInput);
        await browser.close();
        process.exit(1);
    }

    console.log("Target: <" + info.tag + ">"
        + (info.id ? " id=\"" + info.id + "\"" : "")
        + (info.cls ? " class=\"" + info.cls + "\"" : ""));
    console.log("Crop  : " + Math.round(info.width) + " x " + Math.round(info.height)
        + " at (" + Math.round(info.x) + ", " + Math.round(info.y) + ")");

    // Capture exactly that element with a transparent background.
    await page.screenshot({
        path: absOutput,
        omitBackground: true,
        clip: {
            x: info.x,
            y: info.y,
            width: info.width,
            height: info.height
        }
    });

    await browser.close();
    console.log("Created: " + absOutput);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
