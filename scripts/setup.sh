#!/bin/sh
# One-command setup for judges, run from a fresh clone:  sh scripts/setup.sh
# Checks the Mac, installs and builds the app, downloads Gemma 4 E2B through
# LM Studio, and installs the Edge AI Launcher. Safe to re-run: every step
# skips what is already done.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
MODEL="google/gemma-4-e2b"
LAUNCHER_URL="https://github.com/appbuildersph/modes/releases/latest/download/Edge-AI-Launcher-macOS.zip"
APP_DIR="$HOME/Applications"
APP="$APP_DIR/Edge AI Launcher.app"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\n\033[31mStopped: %s\033[0m\n' "$1" >&2; exit 1; }

say "1/5  Checking this Mac"
[ "$(uname -s)" = "Darwin" ] || fail "SIBOL's edge server needs macOS (LM Studio's MLX build runs on Apple Silicon)."
[ "$(uname -m)" = "arm64" ] || fail "This Mac is not Apple Silicon; the MLX model needs an M-series chip."
command -v node >/dev/null || fail "Node.js not found. Install Node 24 from https://nodejs.org, then re-run this script."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || fail "Node $(node -v) is too old. Install Node 24 from https://nodejs.org."
LMS="$HOME/.lmstudio/bin/lms"
[ -x "$LMS" ] || LMS="$(command -v lms || true)"
[ -n "$LMS" ] || fail "LM Studio not found. Install it from https://lmstudio.ai, open it once (that installs its 'lms' tool), then re-run this script."
echo "macOS on Apple Silicon, Node $(node -v), LM Studio CLI at $LMS"

say "2/5  Installing the app's packages (npm install)"
npm install --no-audit --no-fund

say "3/5  Building the app (npm run build)"
npm run build

say "4/5  Downloading Gemma 4 E2B in LM Studio (about 4.4 GB, once)"
if "$LMS" ls 2>/dev/null | grep -q "$MODEL"; then
  echo "$MODEL is already downloaded."
else
  "$LMS" get "$MODEL" --mlx --yes
fi

say "5/5  Installing the Edge AI Launcher"
mkdir -p "$APP_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if curl -fsSL -o "$TMP/launcher.zip" "$LAUNCHER_URL"; then
  rm -rf "$APP"
  ditto -x -k "$TMP/launcher.zip" "$APP_DIR"
  # Remember this clone so the app does not have to search for it.
  defaults write local.edge-ai-launcher EdgeRepo "$REPO"
  echo "Installed: $APP"
else
  echo "Could not download the launcher; you can still start SIBOL by hand (see below)."
  APP=""
fi

say "Done."
if [ -n "$APP" ]; then
  echo "Opening the Edge AI Launcher. Press START, wait for the green READY, then open http://localhost:8787"
  open "$APP"
else
  echo "Start SIBOL with:  node scripts/edge-hub.mjs   then open http://localhost:8787"
  echo "(LM Studio's server must be running:  $LMS server start  and  $LMS load $MODEL)"
fi
