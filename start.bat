@echo off
REM Double-click me on Windows to launch the Bachelor Party HQ.
cd /d "%~dp0"
set PORT=8000
echo Starting Bachelor Party HQ on http://localhost:%PORT% ...
start "" "http://localhost:%PORT%"
python -m http.server %PORT%
