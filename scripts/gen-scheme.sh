#!/usr/bin/env bash
# Generate Xcode shared scheme with correct target UUID
set -euo pipefail
PBXPROJ="$1"
SCHEME_DIR="$2"

if [ ! -f "$PBXPROJ" ]; then
  echo "ERROR: pbxproj not found at $PBXPROJ" >&2
  exit 1
fi

# Try multiple patterns to find the native target UUID
TARGET_UUID=""
# Pattern 1: standard PBXNativeTarget section
TARGET_UUID=$(grep -B1 "ProductName = App" "$PBXPROJ" | grep -oE "[A-F0-9]{24}" | head -1 || echo "")
# Pattern 2: alternative format 
if [ -z "$TARGET_UUID" ]; then
  TARGET_UUID=$(grep "ProductName = App" "$PBXPROJ" | grep -oE "[A-Z0-9]{24}" | head -1 || echo "")
fi
# Pattern 3: look for any UUID in the NativeTarget section
if [ -z "$TARGET_UUID" ]; then
  TARGET_UUID=$(sed -n '/Begin PBXNativeTarget section/,/End PBXNativeTarget section/p' "$PBXPROJ" | grep -oE "[A-F0-9]{24}" | head -1 || echo "")
fi

if [ -z "$TARGET_UUID" ]; then
  echo "ERROR: Could not find target UUID in pbxproj" >&2
  echo "--- Grepping for ProductName = App ---" >&2
  grep -n "ProductName = App" "$PBXPROJ" >&2 || echo "  (not found)" >&2
  echo "--- NativeTarget section ---" >&2
  sed -n '/Begin PBXNativeTarget section/,/End PBXNativeTarget section/p' "$PBXPROJ" >&2 || echo "  (no section)" >&2
  exit 1
fi

echo "Target UUID: $TARGET_UUID"
mkdir -p "$SCHEME_DIR"

cat > "$SCHEME_DIR/App.xcscheme" << SCHEME_END
<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1500" version="1.7">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
    <BuildActionEntries>
      <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${TARGET_UUID}" BuildableName="App.app" BlueprintName="App" ReferencedContainer="container:App.xcodeproj"/>
      </BuildActionEntry>
    </BuildActionEntries>
  </BuildAction>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
SCHEME_END
echo "Scheme created for UUID $TARGET_UUID"