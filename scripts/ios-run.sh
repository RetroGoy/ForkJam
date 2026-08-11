#!/usr/bin/env bash
# Build + install + launch ForkJam dans le simulateur iOS bootté.
# Contourne le bug codesign "detritus" causé par la synchro iCloud du Desktop
# en mettant le DerivedData hors du dossier synchronisé (/tmp).
#
# Prérequis : un simulateur bootté (Simulator.app) + `npm run dev` sur :3000.
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 COPYFILE_DISABLE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DD="/tmp/forkjam-ios-dd"
BUNDLE_ID="com.forkjam.app"

echo "▶ cap sync…"
npx cap sync ios

echo "▶ build (DerivedData: $DD)…"
xcodebuild \
  -workspace "$ROOT/ios/App/App.xcworkspace" \
  -scheme App -configuration Debug -sdk iphonesimulator \
  -derivedDataPath "$DD" \
  -destination "generic/platform=iOS Simulator" \
  build

APP="$DD/Build/Products/Debug-iphonesimulator/App.app"
echo "▶ install $APP → simulateur bootté…"
xcrun simctl install booted "$APP"

echo "▶ launch $BUNDLE_ID…"
xcrun simctl launch booted "$BUNDLE_ID"
echo "✅ Lancé. (Assure-toi que 'npm run dev' tourne sur :3000)"
