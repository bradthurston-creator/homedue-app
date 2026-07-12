#!/usr/bin/env bash
# Generate Xcode shared scheme with correct target UUID
set -euo pipefail
PBXPROJ="$1"
SCHEME_DIR="$2"

if [ ! -f "$PBXPROJ" ]; then
  echo "ERROR: pbxproj not found at $PBXPROJ" >&2
  exit 1
fi

# Extract target UUID from pbxproj
TARGET_UUID=$(grep -B1 "ProductName = App" "$PBXPROJ" | grep -oE "[A-F0-9]{24}" | head -1)

if [ -z "$TARGET_UUID" ]; then
  echo "ERROR: Could not find target UUID in pbxproj" >&2
  grep "ProductName = App" "$PBXPROJ" >&2 || echo "  (ProductName = App not found at all)" >&2
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
echo "Scheme created"