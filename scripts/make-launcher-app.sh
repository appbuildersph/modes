#!/bin/sh
# Builds the native "SIBOL.app" launcher (native/edge-launcher/EdgeLauncher.swift)
# in /Applications (or ~/Applications if that is not writable), or at the path
# given as the first argument. Spotlight finds it there as "SIBOL". Needs the Xcode
# command line tools (swiftc). The repo path and the Node path are baked into the
# app's Info.plist, so re-run this after moving the repo or reinstalling Node.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
if [ -w /Applications ]; then DEFAULT_DIR=/Applications; else DEFAULT_DIR="$HOME/Applications"; mkdir -p "$DEFAULT_DIR"; fi
APP="${1:-$DEFAULT_DIR/SIBOL.app}"
[ -n "$NODE" ] || { echo "node not found on PATH" >&2; exit 1; }
command -v swiftc >/dev/null || { echo "swiftc not found: run xcode-select --install" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -parse-as-library -O -swift-version 5 \
  "$REPO/native/edge-launcher/EdgeLauncher.swift" \
  -o "$APP/Contents/MacOS/EdgeLauncher"

# App icon from the PWA icon.
ICONSET="$TMP/AppIcon.iconset"
mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z $size $size "$REPO/public/pwa-512x512.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  [ $double -le 1024 ] && sips -z $double $double "$REPO/public/pwa-512x512.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>SIBOL</string>
  <key>CFBundleDisplayName</key><string>SIBOL</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.education</string>
  <key>CFBundleIdentifier</key><string>local.edge-ai-launcher</string>
  <key>CFBundleExecutable</key><string>EdgeLauncher</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <!-- The launcher engine answers on 127.0.0.1:8700 over plain http. -->
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
  <key>EdgeRepo</key><string>$REPO</string>
  <key>EdgeNode</key><string>$NODE</string>
</dict>
</plist>
PLIST

codesign --force --sign - "$APP" >/dev/null 2>&1 || true
mdimport "$APP" 2>/dev/null || true
echo "Built: $APP"
