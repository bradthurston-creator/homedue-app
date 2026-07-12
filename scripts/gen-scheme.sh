#!/bin/bash
# Generate Xcode shared scheme with correct target UUID
set -e
PBXPROJ="$1"
SCHEME_DIR="$2"
TARGET_UUID=$(grep -B1 "ProductName = App" "$PBXPROJ" | grep -oE "[A-F0-9]{24}")
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
