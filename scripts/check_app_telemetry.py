# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE and LICENSING.md for details.

"""Fail if the desktop bundle contains the site telemetry collector or module."""
import pathlib
import sys

DIST = pathlib.Path(__file__).resolve().parents[1] / "desktop" / "dist"
MARKERS = [b"telemetry.invalid", b"gramix.telemetry", b"/api/send"]


def main():
    if not DIST.is_dir():
        print("desktop/dist is missing: build the application first", file=sys.stderr)
        return 1
    hits = [f"{path.relative_to(DIST)}: {marker.decode()}" for path in DIST.rglob("*") if path.is_file()
            for marker in MARKERS if marker in path.read_bytes()]
    for hit in hits:
        print(f"telemetry marker in application bundle: {hit}", file=sys.stderr)
    if hits:
        return 1
    print("Application bundle: no telemetry")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
