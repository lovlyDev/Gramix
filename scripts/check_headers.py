# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.

"""Check and add headers only to files classified as project source."""

import argparse
import datetime
import json
import pathlib
import re
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / "licenses/header-policy.json").read_text("utf-8"))
EXTENSIONS = set(POLICY["extensions"])
HASH_EXTENSIONS = {".py", ".sh", ".ps1", ".cmake"}
COPYRIGHT = re.compile(r"Copyright\s*(?:\(C\)|©)?\s*(\d{4})(?:-(\d{4}))?\s+(.+)", re.I)


def candidates():
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT, check=True, capture_output=True,
    )
    for item in result.stdout.decode("utf-8", "surrogateescape").split("\0"):
        if not item:
            continue
        path = item.replace("\\", "/")
        if any(path == x or path.startswith(x) for x in POLICY["exclude"] + POLICY["third_party"]):
            continue
        if not any(path == x or path.startswith(x) for x in POLICY["include"]):
            continue
        if pathlib.PurePosixPath(path).suffix.lower() not in EXTENSIONS and pathlib.PurePosixPath(path).name not in POLICY["special_names"]:
            continue
        yield path


def comment_style(path):
    suffix = pathlib.PurePosixPath(path).suffix.lower()
    if suffix == ".xml":
        return "xml"
    if suffix in HASH_EXTENSIONS or pathlib.PurePosixPath(path).name == "CMakeLists.txt":
        return "hash"
    return "block"


def insertion_offset(content):
    lines = content.splitlines(keepends=True)
    offset = 0
    for line in lines[:3]:
        if line.startswith(("#!", "# coding:", "# -*- coding:", "/// <reference", "<?xml", "<!DOCTYPE", "\ufeff")):
            offset += len(line)
        else:
            break
    return offset


def first_year(path):
    result = subprocess.run(
        ["git", "log", "--follow", "--format=%ad", "--date=format:%Y", "--", path],
        cwd=ROOT, capture_output=True, text=True,
    )
    years = [int(y) for y in result.stdout.splitlines() if y.isdigit()]
    return min(years) if years else datetime.date.today().year


def make_header(path):
    year = first_year(path)
    now = datetime.date.today().year
    years = str(year) if year >= now else f"{year}-{now}"
    holder = POLICY["copyright_holder"]
    body = [
        f"Copyright (C) {years} {holder}.",
        "SPDX-License-Identifier: AGPL-3.0-only",
        "",
        "This file is part of Gramix.",
        "",
        "See LICENSE for details.",
    ]
    if comment_style(path) == "hash":
        return "\n".join("# " + line if line else "#" for line in body) + "\n\n"
    if comment_style(path) == "xml":
        return "<!--\n" + "\n".join("  " + line for line in body) + "\n-->\n\n"
    return "/*\n" + "\n".join(" * " + line if line else " *" for line in body) + "\n */\n\n"


def check_one(path, fix):
    file = ROOT / path
    try:
        original = file.read_text("utf-8")
    except (UnicodeDecodeError, OSError) as exc:
        return f"{path}: cannot read UTF-8 source: {exc}"
    beginning = original[:1800]
    if any(marker in beginning.lower() for marker in POLICY["generated_markers"]):
        return None
    spdx = re.search(r"SPDX-License-Identifier:\s*([^\s*]+)", beginning)
    copyright_match = COPYRIGHT.search(beginning)
    if spdx or copyright_match:
        if not spdx or not copyright_match:
            return f"{path}: existing notice needs manual review (missing SPDX or copyright)"
        if spdx.group(1) != "AGPL-3.0-only":
            return f"{path}: existing SPDX {spdx.group(1)} needs manual review"
        if POLICY["copyright_holder"] not in copyright_match.group(3):
            return f"{path}: different copyright holder needs manual review"
        if "LICENSE" not in beginning:
            return f"{path}: full project header needs a LICENSE reference"
        return None
    if not fix:
        return f"{path}: missing project copyright and SPDX header"
    offset = insertion_offset(original)
    file.write_text(original[:offset] + make_header(path) + original[offset:], "utf-8", newline="")
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="add headers only where no existing notices occur")
    parser.add_argument("paths", nargs="*", help="optional repository-relative files to check")
    args = parser.parse_args()
    selected = {p.replace("\\", "/") for p in args.paths}
    errors = []
    for path in candidates():
        if selected and path not in selected:
            continue
        issue = check_one(path, args.fix)
        if issue:
            errors.append(issue)
    for issue in errors:
        print(issue, file=sys.stderr)
    if errors:
        print(f"{len(errors)} header issue(s)", file=sys.stderr)
        return 1
    print("Source headers: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
