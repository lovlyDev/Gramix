#!/usr/bin/env bash
# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE for details.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
build="$root/build/package-linux"
desktop="$root/desktop"
tauri="$desktop/src-tauri"
version=$(python3 -c "import json; print(json.load(open('$root/desktop/package.json'))['version'])" 2>/dev/null || echo unknown)
if [[ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]]; then
    if [[ -f "$root/.tools/signing/gramix.key" ]]; then
        export TAURI_SIGNING_PRIVATE_KEY="$root/.tools/signing/gramix.key"
    elif [[ "${1:-}" != --skip-bundle ]]; then
        echo 'TAURI_SIGNING_PRIVATE_KEY is required to sign updater artifacts' >&2
        exit 1
    fi
fi
target="$(rustc --print host-tuple)"

if [[ "$target" != x86_64-unknown-linux-gnu ]]; then
    printf 'Unsupported release target: %s\n' "$target" >&2
    exit 1
fi
if [[ ! -f "${VCPKG_ROOT:-$root/.tools/vcpkg}/scripts/buildsystems/vcpkg.cmake" ]]; then
    printf 'vcpkg toolchain is missing\n' >&2
    exit 1
fi
toolchain="${VCPKG_ROOT:-$root/.tools/vcpkg}/scripts/buildsystems/vcpkg.cmake"

cmake -S "$root" -B "$build" -G Ninja \
    "-DCMAKE_TOOLCHAIN_FILE=$toolchain" -DVCPKG_TARGET_TRIPLET=x64-linux
cmake --build "$build" --parallel
ctest --test-dir "$build" --output-on-failure
"$build/gramix" --self-test --backend cpu
"$build/gramix" --backends-json

mkdir -p "$tauri/binaries"
cp "$build/gramix" "$tauri/binaries/gramix-$target"
chmod 755 "$tauri/binaries/gramix-$target"

python3 - "$root" "$build" "$tauri" <<'PY'
import json
import pathlib
import sys

root, build, tauri = map(pathlib.Path, sys.argv[1:])
resources = {
    "../../data/ton-english.txt": "data/ton-english.txt",
    "../../gpu/vulkan/derive.spv": "gpu/vulkan/derive.spv",
}
for api in ("cuda", "hip"):
    if (build / f"libgramix_{api}.so").exists():
        resources[f"../../build/package-linux/libgramix_{api}.so"] = f"libgramix_{api}.so"
config = {"bundle": {"targets": ["deb", "appimage"], "resources": resources}}
(tauri / "tauri.release.json").write_text(json.dumps(config, indent=2) + "\n")
PY

if [[ "${1:-}" != --skip-bundle ]]; then
    cd "$desktop"
    npm run tauri -- build --config src-tauri/tauri.release.json
    compgen -G "$tauri/target/release/bundle/appimage/*.AppImage.sig" > /dev/null || {
        echo 'Signed AppImage is missing' >&2
        exit 1
    }
    find "$tauri/target/release/bundle" -maxdepth 2 -type f \
        \( -name '*.deb' -o -name '*.AppImage' \) -print
fi
