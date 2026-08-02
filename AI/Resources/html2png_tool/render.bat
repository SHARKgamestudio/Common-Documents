@echo off
rem Launcher. Usage: render.bat input.html [output.png] [--largest]
node "%~dp0render.js" %*
echo.
pause
