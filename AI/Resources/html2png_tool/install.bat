@echo off
setlocal
title HTML2PNG - Installer
cd /d "%~dp0"

echo ============================================
echo  HTML2PNG - Playwright Installer
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Install it from https://nodejs.org and run this again.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODEVER=%%v"
echo Using Node.js %NODEVER%
echo.

echo [1/2] Installing Playwright ...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed. See messages above.
    pause
    exit /b 1
)

echo.
echo [2/2] Downloading Chromium ...
call npx playwright install chromium
if errorlevel 1 (
    echo.
    echo ERROR: Chromium download failed. See messages above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  INSTALL COMPLETE
echo ============================================
echo.
echo Usage:
echo   1. Drag an HTML file onto render.bat
echo   or run:  render.bat input.html [output.png]
echo.
echo Output is a transparent PNG cropped to the
echo top element, saved next to your HTML file.
echo.
pause
