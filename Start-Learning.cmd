@echo off
cd /d "%~dp0"
echo Open http://127.0.0.1:4330/ in your browser.
python -m http.server 4330 --bind 127.0.0.1
if errorlevel 1 pause
