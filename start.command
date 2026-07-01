#!/bin/bash
# Double-click me on a Mac to launch the Bachelor Party HQ.
# Serves the app locally and opens it in your browser.
cd "$(dirname "$0")" || exit 1
PORT=8000
echo "Starting Bachelor Party HQ on http://localhost:$PORT ..."
( sleep 1 && open "http://localhost:$PORT" ) &
python3 -m http.server "$PORT"
