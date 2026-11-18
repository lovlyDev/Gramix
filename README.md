# VANTIX

I develop VANTIX, a TON vanity address generator with a C++23 compute core and a Tauri/React desktop app for Windows and Linux. Release 0.1.0 includes CPU and Vulkan Compute modes. CUDA and HIP sources are present, but their modules are absent from the installers and have not been validated on supported GPUs.

[Русский README](README.ru.md).

## Download

[Release 0.1.0](https://github.com/lovlyDev/VANTIX/releases/tag/v0.1.0) provides a Windows NSIS installer (`VANTIX_0.1.0_x64-setup.exe`), Linux DEB (`VANTIX_0.1.0_amd64.deb`), Linux AppImage (`VANTIX_0.1.0_amd64.AppImage`), and `SHA256SUMS.txt`.

The app detects devices, tests available compute modes, and lets you choose automatic or manual mode selection. The 12-word search can use Vulkan Compute, with results rechecked on CPU. The 24-word search uses CPU. Multiple physical GPUs have not yet been hardware-validated together. The Windows installer is not publisher certificate signed.

## Features

- TON Wallet V5R1 and V4R2; 12- and 24-word recovery phrases.
- Prefix, suffix, or substring search, with an optional case-insensitive mode.
- CPU, Vulkan Compute, and hybrid CPU/GPU modes where validated.
- Pause/resume, device selection, speed chart, and GPU load control.
- Encrypted saved phrases: DPAPI on Windows and AES-256-GCM with a password on Linux.
- Signed in-app updates for Windows NSIS and Linux AppImage; DEB updates through the package manager.

The `data/ton-english.txt` mnemonic list is unrelated to the allowed address search substring. It is the BIP-39 English word list under the MIT license; see [NOTICE.md](NOTICE.md).

## Build from Source

You need a C++23 compiler, CMake 3.24+, vcpkg, Node.js, and Rust for the desktop app. vcpkg installs OpenSSL 3, Vulkan headers, Volk, CLI11, and toml++. CUDA Toolkit and HIP SDK are optional for CPU/Vulkan builds.

Windows:

```powershell
cmake -S . -B build -G "Visual Studio 17 2022" -A x64 -DCMAKE_TOOLCHAIN_FILE="$env:VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake"
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```

Linux:

```bash
cmake -S . -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE="$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake"
cmake --build build
ctest --test-dir build --output-on-failure
```

For the desktop frontend, run `npm ci` and `npm run build` in `desktop/`. Vendor backend validation is described in [docs/vendor-validation.md](docs/vendor-validation.md).

## Command Line

```text
vantix --devices
vantix --backends-json
vantix --self-test
vantix --benchmark
vantix --contains lucky --ignore-case --mnemonic 12 --backend auto
vantix --prefix UQabc --wallet v5 --max 100000 --out matches
```

A recovery phrase controls a wallet. Never use source test phrases for funds. The Linux app requires a password of at least 12 characters; the CLI reads `VANTIX_WALLET_PASSWORD`. Losing the password prevents decryption of a saved result.

## License

Gramix is free software under **AGPL-3.0-only**: see the [license text](LICENSE), [licensing notes](LICENSING.md), [notices](NOTICE.md), [name and logo rules](TRADEMARKS.md), and [third-party components](licenses/THIRD_PARTY.md).

## TON References

- [TON wallet description](https://github.com/ton-blockchain/TEPs/blob/master/text/0003-wallets.md)
- [TON mnemonic reference](https://github.com/ton-org/ton-crypto/blob/master/src/mnemonic/mnemonic.ts)
- [Wallet V4R2 contract](https://github.com/ton-org/ton/blob/master/src/wallets/v4/WalletContractV4.ts)
- [Wallet V5R1 contract](https://github.com/ton-org/ton/blob/master/src/wallets/v5r1/WalletContractV5R1.ts)
