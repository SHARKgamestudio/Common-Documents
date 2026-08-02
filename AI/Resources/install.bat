@echo off
rem Installer - delegates to the tool's own install.bat.
rem The renderer files already exist, this only installs
rem the npm dependencies and Chromium browser.
cd /d "%~dp0html2png_tool"
call install.bat