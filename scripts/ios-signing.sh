#!/usr/bin/env bash
# Set up code signing, install profiles, and configure exportOptions.plist
set -euo pipefail
APP_ID="$1"

echo "=== Step 1: Initialize keychain ==="
keychain initialize

echo "=== Step 2: Fetch signing files ==="
app-store-connect fetch-signing-files "$APP_ID" --type IOS_APP_STORE --create

echo "=== Step 3: Add certificates ==="
keychain add-certificates

echo "=== Step 4: Use profiles in project ==="
xcode-project use-profiles

echo "=== Step 5: Copy profiles to MobileDevice ==="
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/"*.mobileprovision "$HOME/Library/MobileDevice/Provisioning Profiles/" 2>/dev/null || true

echo "=== Step 6: Extract profile UUID ==="
PROFILE_FILE=$(ls "$HOME/Library/MobileDevice/Provisioning Profiles/"*.mobileprovision 2>/dev/null | head -1)
if [ -n "$PROFILE_FILE" ]; then
  PROFILE_UUID=$(security cms -D -i "$PROFILE_FILE" 2>/dev/null | plutil -extract UUID raw - 2>/dev/null || echo "")
  echo "Profile UUID: $PROFILE_UUID"
  echo "$PROFILE_UUID" > /tmp/homedue_profile_uuid.txt
fi

echo "=== Code signing setup complete ==="