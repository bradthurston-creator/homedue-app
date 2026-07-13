#!/usr/bin/env python3
"""Modify Xcode project.pbxproj to add code signing settings for distribution."""
import sys, re

pbxproj = sys.argv[1]
profile_name = sys.argv[2]

with open(pbxproj, 'r') as f:
    content = f.read()

# Count how many times we change things
changes = 0

# Replace CODE_SIGN_STYLE values
old_count = len(content)
content, count = re.subn(r'CODE_SIGN_STYLE = [^;]+;', 'CODE_SIGN_STYLE = Manual;', content)
changes += count
print(f"  CODE_SIGN_STYLE: {count} replacements")

# Set CODE_SIGN_IDENTITY to iPhone Distribution for ALL target configs
content, count = re.subn(
    r'CODE_SIGN_IDENTITY = "iPhone Developer"',
    'CODE_SIGN_IDENTITY = "iPhone Distribution"',
    content
)
changes += count
print(f"  CODE_SIGN_IDENTITY: {count} replacements")

# Add DEVELOPMENT_TEAM after ASSETCATALOG_COMPILER_APPICON_NAME
content, count = re.subn(
    r'(ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;)',
    r'\1\n\t\t\t\tDEVELOPMENT_TEAM = DN52659LL2;',
    content
)
changes += count
print(f"  DEVELOPMENT_TEAM: {count} insertions")

# Add PROVISIONING_PROFILE_SPECIFIER
content, count = re.subn(
    r'(DEVELOPMENT_TEAM = DN52659LL2;)',
    r'\1\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "' + profile_name + '";',
    content
)
changes += count
print(f"  PROVISIONING_PROFILE_SPECIFIER: {count} insertions")

with open(pbxproj, 'w') as f:
    f.write(content)

print(f"Total changes: {changes}")