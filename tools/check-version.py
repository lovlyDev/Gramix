#!/usr/bin/env python3
# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.

"""Fail a release when the app, native core, lockfile, and tag disagree."""

import json
import os
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
desktop = root / "desktop"
package = json.loads((desktop / "package.json").read_text(encoding="utf-8"))
lock = json.loads((desktop / "package-lock.json").read_text(encoding="utf-8"))
tauri = json.loads((desktop / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
cmake = (root / "CMakeLists.txt").read_text(encoding="utf-8")
cargo = (desktop / "src-tauri/Cargo.toml").read_text(encoding="utf-8")
cargo_lock = (desktop / "src-tauri/Cargo.lock").read_text(encoding="utf-8")

version = package["version"]
values = {
    "package-lock": lock["version"],
    "package-lock root": lock["packages"][""]["version"],
    "Tauri": tauri["version"],
    "CMake": re.search(r"project\(Gramix VERSION ([0-9.]+)", cmake).group(1),
    "Cargo": re.search(r'^version = "([0-9.]+)"', cargo, re.M).group(1),
    "Cargo.lock": re.search(
        r'\[\[package\]\]\s+name = "gramix-desktop"\s+version = "([0-9.]+)"',
        cargo_lock,
    ).group(1),
}
tag = os.environ.get("GITHUB_REF_NAME", "")
if tag.startswith("v"):
    values["Git tag"] = tag[1:]
for name, actual in values.items():
    if actual != version:
        raise SystemExit(f"{name}: {actual} differs from desktop package {version}")
print(f"Gramix version {version} is consistent")
