# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.

"""Check essential legal-document links and the exact AGPL text digest."""

import hashlib
import pathlib
import re
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
AGPL_SHA256 = "0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0"
REQUIRED = [
    "LICENSE", "docs/LICENSING.md", "docs/LICENSING.ru.md", "NOTICE.md", "NOTICE.ru.md",
    "TRADEMARKS.md", "TRADEMARKS.ru.md", "CONTRIBUTING.md", "CONTRIBUTING.ru.md",
    "README.md", "README.ru.md",
    "docs/third-party/THIRD_PARTY.md", "docs/third-party/THIRD_PARTY.ru.md",
    "docs/LICENSE_FAQ.md", "docs/LICENSE_FAQ.ru.md",
    "docs/SOURCE_DISTRIBUTION.md", "docs/SOURCE_DISTRIBUTION.ru.md",
]


def main():
    issues = [f"missing {name}" for name in REQUIRED if not (ROOT / name).is_file()]
    license_file = ROOT / "LICENSE"
    if license_file.exists() and hashlib.sha256(license_file.read_bytes()).hexdigest() != AGPL_SHA256:
        issues.append("LICENSE does not match verified GNU AGPLv3 plain-text SHA-256")
    for name in ("README.md", "README.ru.md"):
        file = ROOT / name
        if not file.exists():
            continue
        for link in re.findall(r"\]\(([^)]+)\)", file.read_text("utf-8")):
            if link.startswith(("http://", "https://", "#")):
                continue
            if not (file.parent / link.split("#", 1)[0]).exists():
                issues.append(f"{name}: broken local link {link}")
    for issue in issues:
        print(issue, file=sys.stderr)
    if issues:
        return 1
    print("Legal documents and README links: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
