#!/usr/bin/env python3
"""Modify Xcode project.pbxproj to add code signing settings for distribution."""
import sys, re

pbxproj = sys.argv[1]
profile_name = sys.argv[2]

with open(pbxproj, 'r') as f:
    content = f.read()

# Replace CODE_SIGN_STYLE values
content = re.sub(r'CODE_SIGN_STYLE = [^;]+;', 'CODE_SIGN_STYLE = Manual;', content)

# Add DEVELOPMENT_TEAM after each ASSETCATALOG_COMPILER_APPICON_NAME line
content = re.sub(
    r'(ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;)',
    r'\1\n\t\t\t\tDEVELOPMENT_TEAM = DN52659LL2;',
    content
)

# Add PROVISIONING_PROFILE_SPECIFIER
content = re.sub(
    r'(DEVELOPMENT_TEAM = DN52659LL2;)',
    r'\1\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "' + profile_name + '";',
    content
)

# Set CODE_SIGN_IDENTITY to iPhone Distribution for Release configs
content = re.sub(
    r'/\* Release \*/(.*?)CODE_SIGN_IDENTITY = "iPhone Developer"',
    r'/* Release */\1CODE_SIGN_IDENTITY = "iPhone Distribution"',
    content
)

with open(pbxproj, 'w') as f:
    f.write(content)

print(f"Patched {pbxproj} with profile: {profile_name}")