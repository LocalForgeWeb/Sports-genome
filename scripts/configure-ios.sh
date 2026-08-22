#!/usr/bin/env bash
#
# Apply the native configuration that `npx cap add ios` cannot generate.
#
# Both of these are otherwise manual Xcode steps, and both are silent failures:
# a missing URL scheme means login hangs forever, and a privacy manifest that
# is not a target member is simply absent from the build and rejected at review.
# Scripting them keeps the native project reproducible, which is what lets the
# whole iOS build run on a cloud macOS runner with no Mac in the room.
#
# Idempotent — safe to re-run after every `cap sync`.
#
# Usage:  bash scripts/configure-ios.sh
# Env:    NATIVE_APP_SCHEME  (default: sportsgenome)
#         IOS_BUNDLE_ID      (default: read from capacitor.config.ts)

set -euo pipefail

SCHEME="${NATIVE_APP_SCHEME:-sportsgenome}"
APP_DIR="ios/App/App"
PLIST="$APP_DIR/Info.plist"
PROJECT="ios/App/App.xcodeproj"

if [ ! -f "$PLIST" ]; then
  echo "error: $PLIST not found. Run 'npx cap add ios' first." >&2
  exit 1
fi

if [ -z "${IOS_BUNDLE_ID:-}" ]; then
  # Pull appId straight from the Capacitor config so the two cannot drift.
  IOS_BUNDLE_ID=$(grep -oE 'appId:[[:space:]]*"[^"]+"' capacitor.config.ts | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
fi

if [ -z "$IOS_BUNDLE_ID" ]; then
  echo "error: could not determine the bundle id; set IOS_BUNDLE_ID." >&2
  exit 1
fi

echo "==> Bundle id: $IOS_BUNDLE_ID"
echo "==> URL scheme: $SCHEME"

# --- 1. Register the custom URL scheme -------------------------------------
# Rebuilt from scratch each run rather than appended, so repeat runs cannot
# stack duplicate entries.
/usr/libexec/PlistBuddy -c "Delete :CFBundleURLTypes" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string $IOS_BUNDLE_ID" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string $SCHEME" "$PLIST"

# Keeps the status bar under StatusBar.setStyle() in lib/nativeShell.ts.
/usr/libexec/PlistBuddy -c "Set :UIViewControllerBasedStatusBarAppearance true" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :UIViewControllerBasedStatusBarAppearance bool true" "$PLIST"

echo "==> Info.plist configured"

# --- 2. Privacy manifest ----------------------------------------------------
cp ios-assets/PrivacyInfo.xcprivacy "$APP_DIR/PrivacyInfo.xcprivacy"

# Copying the file is not enough: Xcode only bundles a resource that belongs to
# the target, so this adds it to the App target's resource build phase.
# xcodeproj ships as a CocoaPods dependency, so it is present wherever pods are.
ruby - "$PROJECT" <<'RUBY'
require "xcodeproj"

project_path = ARGV[0]
project = Xcodeproj::Project.open(project_path)

target = project.targets.find { |t| t.name == "App" }
abort "error: no 'App' target in #{project_path}" if target.nil?

group = project.main_group.find_subpath("App", false)
abort "error: no 'App' group in #{project_path}" if group.nil?

name = "PrivacyInfo.xcprivacy"
existing = group.files.find { |f| f.path == name }
ref = existing || group.new_reference(name)

already_bundled = target.resources_build_phase.files.any? do |build_file|
  build_file.file_ref && build_file.file_ref.path == name
end

if already_bundled
  puts "==> Privacy manifest already in the App target"
else
  target.add_resources([ref])
  project.save
  puts "==> Privacy manifest added to the App target"
end
RUBY

echo "==> Done. The native project is configured."
