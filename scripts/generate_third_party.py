# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE and LICENSING.md for details.

"""Refresh exact locked dependency versions and declared licenses."""

import concurrent.futures
import json
import pathlib
import tomllib
import urllib.parse
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / "licenses/cargo-license-cache.json"
USER_AGENT = "Gramix license inventory (https://github.com/lovlyDev/VANTIX)"


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def cargo_license(package):
    name, version = package["name"], package["version"]
    for manifest in pathlib.Path.home().glob(
        f".cargo/registry/src/*/{name}-{version}/Cargo.toml"
    ):
        data = tomllib.loads(manifest.read_text("utf-8"))
        license_id = data.get("package", {}).get("license")
        if license_id:
            return license_id, "local registry manifest"
    data = fetch_json(
        f"https://crates.io/api/v1/crates/{urllib.parse.quote(name)}/{urllib.parse.quote(version)}"
    )
    return data["version"].get("license") or "UNKNOWN", "crates.io version API"


def main():
    cache = json.loads(CACHE.read_text("utf-8")) if CACHE.exists() else {}
    cargo = tomllib.loads((ROOT / "desktop/src-tauri/Cargo.lock").read_text("utf-8"))
    packages = [p for p in cargo["package"] if p.get("source", "").startswith("registry+")]
    missing = [p for p in packages if f"{p['name']}@{p['version']}" not in cache]
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(cargo_license, p): p for p in missing}
        for future in concurrent.futures.as_completed(futures):
            p = futures[future]
            key = f"{p['name']}@{p['version']}"
            try:
                license_id, source = future.result()
            except Exception as exc:
                license_id, source = "UNKNOWN", f"lookup failed: {exc.__class__.__name__}"
                errors.append(key)
            cache[key] = {"license": license_id, "source": source}
    CACHE.write_text(json.dumps(dict(sorted(cache.items())), indent=2, ensure_ascii=False) + "\n", "utf-8")

    lines = [
        "# Gramix Third-Party Components",
        "",
        "I record versions from the current lockfiles. A package in a lockfile is not necessarily present in every installer. Before release, inspect each delivered artifact and include the complete license text and copyright notices for redistributed components.",
        "",
        "A registry license declaration does not replace inspection of the actual package license and notices. `UNKNOWN` blocks a claim that the commercial distribution is ready. MIT/BSD/ISC generally require preserving copyright and permission notices; Apache-2.0 requires its license text and applicable notices; MPL/LGPL/GPL and other copyleft terms need individual source-distribution review. The actual version's terms control.",
        "",
        "## Direct C++ vcpkg dependencies",
        "",
        "vcpkg baseline: `ee6a47dac031930715bea2e6dfb9ad60caaa5d83`. The versions below come from local `vcpkg_installed/vcpkg/status`; the manifest alone does not pin them for every future build.",
        "",
        "| Package | Local version | Port license declaration | Source |",
        "| --- | --- | --- | --- |",
    ]
    vcpkg = {
        "cli11": ("2.7.2", "BSD-3-Clause"),
        "gtest": ("1.18.0", "BSD-3-Clause"),
        "openssl": ("3.6.4#1", "Apache-2.0"),
        "tomlplusplus": ("3.4.0#1", "MIT"),
        "volk": ("1.4.357.0", "MIT"),
        "vulkan-headers": ("1.4.357.0", "Apache-2.0 OR MIT"),
    }
    for name, (version, license_id) in vcpkg.items():
        lines.append(f"| `{name}` | `{version}` | `{license_id}` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/{name}) |")
    lines += [
        "", "## npm and Cargo: exact lockfile versions", "",
        "| Ecosystem | Package | Version | Declared license | Source |",
        "| --- | --- | --- | --- | --- |",
    ]
    npm = {}
    for lock in ("desktop/package-lock.json", "tools/oracle/package-lock.json"):
        data = json.loads((ROOT / lock).read_text("utf-8"))
        for path, package in data["packages"].items():
            if not path:
                continue
            name = path.rsplit("node_modules/", 1)[-1]
            key = (name, package["version"])
            if key in npm:
                continue
            license_id = package.get("license")
            if not license_id:
                try:
                    encoded = urllib.parse.quote(name, safe="")
                    info = fetch_json(f"https://registry.npmjs.org/{encoded}/{package['version']}")
                    license_id = info.get("license")
                except Exception:
                    license_id = None
            npm[key] = license_id or "UNKNOWN"
    for (name, version), license_id in sorted(npm.items()):
        encoded = urllib.parse.quote(name, safe="")
        lines.append(f"| npm | `{name}` | `{version}` | `{license_id}` | [npm](https://www.npmjs.com/package/{encoded}/v/{version}) |")
    for package in sorted(packages, key=lambda p: (p["name"], p["version"])):
        name, version = package["name"], package["version"]
        license_id = cache[f"{name}@{version}"]["license"]
        lines.append(f"| Cargo | `{name}` | `{version}` | `{license_id}` | [crates.io](https://crates.io/crates/{name}/{version}) |")
    lines += [
        "", "## Other assets and bundled runtimes", "",
        "- `data/ton-english.txt`: all 2,048 words match the [BIP39 English list](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) after newline normalization. [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) declares MIT and names Marek Palatinus, Pavol Rusnak, Aaron Voisine, and Sean Bowe. The exact source of the copy and required notice still need confirmation; it is not project-owned code.",
        "- `desktop/src-tauri/icons/`: the origin of SVG/PNG/ICO files and rights in the logo require confirmation.",
        "", "## Unresolved records", "",
    ]
    unknown = [f"Cargo `{k}`" for k, v in cache.items() if v["license"] == "UNKNOWN"]
    unknown += [f"npm `{n}@{v}`" for (n, v), l in npm.items() if l == "UNKNOWN"]
    lines += [f"- {x}" for x in sorted(unknown)] or ["- No unknown license declarations in package metadata; delivered license texts and notices still require verification."]
    lines += ["", "[Russian translation](THIRD_PARTY.ru.md)."]
    (ROOT / "licenses/THIRD_PARTY.md").write_text("\n".join(lines) + "\n", "utf-8")
    print(f"Recorded {len(npm)} npm and {len(packages)} Cargo packages; lookup failures: {len(errors)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
