#!/bin/sh
# Builds "Edge AI Launcher.app" on the Desktop: double-click it to start
# scripts/launcher.mjs (if it is not already running) and open its page.
# Re-run this after moving the repo or reinstalling Node, since both paths are baked in.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
APP="${1:-$HOME/Desktop/Edge AI Launcher.app}"
[ -n "$NODE" ] || { echo "node not found on PATH" >&2; exit 1; }

osacompile -o "$APP" <<OSA
set repo to "$REPO"
set nodeBin to "$NODE"
try
  do shell script "/usr/bin/curl -s -o /dev/null -m 1 http://127.0.0.1:8700/status"
on error
  do shell script "cd " & quoted form of repo & " && nohup " & quoted form of nodeBin & " scripts/launcher.mjs > /dev/null 2>&1 &"
  delay 1
end try
open location "http://127.0.0.1:8700"
OSA
echo "Built: $APP"
