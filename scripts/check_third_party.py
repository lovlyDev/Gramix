# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.

"""Check that every locked npm and Cargo package is present in THIRD_PARTY."""

import json
import pathlib
import re
import sys
import tomllib


ROOT = pathlib.Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "docs/third-party/THIRD_PARTY.md"


def locked():
    rows = set()
    for lock in ("desktop/package-lock.json", "tools/oracle/package-lock.json"):
        data = json.loads((ROOT / lock).read_text("utf-8"))
        for path, package in data["packages"].items():
            if not path:
                continue
            name = path.rsplit("node_modules/", 1)[-1]
            rows.add(("npm", name, package["version"]))
    cargo = tomllib.loads((ROOT / "desktop/src-tauri/Cargo.lock").read_text("utf-8"))
    for package in cargo["package"]:
        if package.get("source", "").startswith("registry+"):
            rows.add(("Cargo", package["name"], package["version"]))
    return rows


def main():
    if not INVENTORY.exists():
        print(f"missing {INVENTORY.relative_to(ROOT)}", file=sys.stderr)
        return 1
    text = INVENTORY.read_text("utf-8")
    actual = set(re.findall(r"^\| (npm|Cargo) \| `([^`]+)` \| `([^`]+)` \|", text, re.M))
    expected = locked()
    missing = expected - actual
    stale = actual - expected
    for row in sorted(missing):
        print(f"missing third-party record: {row}", file=sys.stderr)
    for row in sorted(stale):
        print(f"stale third-party record: {row}", file=sys.stderr)
    if missing or stale:
        return 1
    print(f"Third-party inventory: {len(expected)} locked npm/Cargo packages accounted for")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
