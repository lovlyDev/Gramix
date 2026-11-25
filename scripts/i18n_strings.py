#!/usr/bin/env python3
# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.
"""Collect Russian interface strings and check the English dictionary.

The desktop/website UI is written in Russian. English is applied at runtime from
desktop/src/i18n/en.json. This script lists every Russian string literal and JSX
text in desktop/src (and user-facing messages from the Tauri commands) and fails
when one of them has no English entry.

    python scripts/i18n_strings.py            # check coverage
    python scripts/i18n_strings.py --missing  # print missing keys as JSON
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "desktop" / "src"
RUST = ROOT / "desktop" / "src-tauri" / "src"
DICTIONARY = SRC / "i18n" / "en.json"
CYRILLIC = re.compile(r"[А-Яа-яЁё]")
SKIP_PARTS = {"i18n", "workers"}
SKIP_SUFFIX = (".test.ts", ".test.tsx", ".d.ts", "i18n.ts")
STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'|`(?:[^`\\]|\\.)*`', re.S)


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def strip_comments(code: str) -> str:
    out, i, n = [], 0, len(code)
    while i < n:
        ch = code[i]
        if ch in "\"'`":
            match = STRING.match(code, i)
            if match:
                out.append(match.group(0)); i = match.end(); continue
        if code.startswith("/*", i):
            end = code.find("*/", i + 2)
            i = n if end < 0 else end + 2; continue
        if code.startswith("//", i) and (i == 0 or code[i - 1] in " \t\n;{}(,"):
            end = code.find("\n", i)
            i = n if end < 0 else end; continue
        out.append(ch); i += 1
    return "".join(out)


def template_key(body: str) -> str:
    """`Версия ${a} из ${b}` -> «Версия {0} из {1}»."""
    parts, depth, index, buf, i = [], 0, 0, [], 0
    while i < len(body):
        if body.startswith("${", i) and depth == 0:
            parts.append("".join(buf)); buf = []; depth = 1; i += 2; continue
        if depth:
            if body[i] == "{": depth += 1
            elif body[i] == "}":
                depth -= 1
                if depth == 0:
                    parts.append("{%d}" % index); index += 1; i += 1; continue
            i += 1; continue
        buf.append(body[i]); i += 1
    parts.append("".join(buf))
    return "".join(parts)


def unescape(text: str) -> str:
    return text.replace('\\"', '"').replace("\\'", "'").replace("\\n", " ").replace("\\\\", "\\")


def literal_keys(literal: str) -> list[str]:
    quote, body = literal[0], literal[1:-1]
    if quote == "`":
        # Nested template literals inside ${…} carry their own strings.
        nested = [key for inner in re.findall(r"`[^`]*`", body) for key in literal_keys(inner)]
        nested += [unescape(inner[1:-1]) for inner in re.findall(r'"(?:[^"\\\n]|\\.)*"', body)]
        return [template_key(unescape(body))] + nested
    return [unescape(body)]


def keys_from_ts(code: str) -> set[str]:
    code = strip_comments(code)
    keys: set[str] = set()
    rest = []
    last = 0
    for match in STRING.finditer(code):
        rest.append(code[last:match.start()]); rest.append(" \0 "); last = match.end()
        for key in literal_keys(match.group(0)):
            for piece in re.split(r"\{\d+\}", key) if False else [key]:
                if CYRILLIC.search(piece): keys.add(normalize(piece))
    rest.append(code[last:])
    # JSX text: Cyrillic left outside strings and comments, split by tags and {expressions}.
    for run in re.findall(r"[^<>{}\0]*[А-Яа-яЁё][^<>{}\0]*", "".join(rest)):
        if CYRILLIC.search(run): keys.add(normalize(run))
    return keys


def keys_from_rust(code: str) -> set[str]:
    keys = set()
    for match in re.finditer(r'"((?:[^"\\]|\\.)*)"', strip_comments(code)):
        text = match.group(1)
        if not CYRILLIC.search(text): continue
        index = iter(range(100))
        keys.add(normalize(re.sub(r"\{[^{}]*\}", lambda _: "{%d}" % next(index), unescape(text))))
    return keys


def collect() -> set[str]:
    keys: set[str] = set()
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".ts", ".tsx"} or path.name.endswith(SKIP_SUFFIX): continue
        if SKIP_PARTS & set(path.relative_to(SRC).parts): continue
        keys |= keys_from_ts(path.read_text(encoding="utf-8"))
    for path in sorted(RUST.rglob("*.rs")):
        keys |= keys_from_rust(path.read_text(encoding="utf-8"))
    return {key for key in keys if key}


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    keys = collect()
    data = json.loads(DICTIONARY.read_text(encoding="utf-8")) if DICTIONARY.exists() else {}
    known = set(data.get("strings", {})) | set(data.get("ignore", []))
    missing = sorted(keys - known)
    if "--missing" in sys.argv:
        print(json.dumps(missing, ensure_ascii=False, indent=1)); return 0
    if "--all" in sys.argv:
        print(json.dumps(sorted(keys), ensure_ascii=False, indent=1)); return 0
    if missing:
        print(f"English dictionary is missing {len(missing)} of {len(keys)} strings:")
        for key in missing[:40]: print(f"  {key}")
        print("Run: python scripts/i18n_strings.py --missing")
        return 1
    print(f"English interface: {len(keys)} strings translated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
