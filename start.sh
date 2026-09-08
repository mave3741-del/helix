#!/bin/sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org then run this again."
  exit 1
fi
echo "Installing Helix dependencies..."
npm install
echo
echo "Starting Helix. Open http://localhost:8080 in your browser."
echo "Press Ctrl+C to stop."
echo
npm run dev
