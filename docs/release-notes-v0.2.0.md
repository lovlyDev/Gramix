# Gramix 0.2.0

Gramix is the new name of VANTIX. Instead of a single address generator it is now a set of 12 tools for the GRAM network, and the same tools run on the website [gram.lovlydev.ru](https://gram.lovlydev.ru).

## Downloads

- Windows: `Gramix_0.2.0_x64-setup.exe` (NSIS).
- Linux: `Gramix_0.2.0_amd64.deb` or `Gramix_0.2.0_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## What's New

- New interface: top navigation with Wallets, Blockchain, and Development sections, search by address, hash, BOC, or explorer link, an overview home page, and dark, OLED, and light themes.
- Tools: vanity address search, new wallet, wallet check, address inspector, transaction decoder, BOC Explorer, contracts and get-methods, Contract Vanity, Sandbox, Tolk Builder, Benchmark, and Developer CLI.
- Amounts are shown in GRAM with digit grouping; the exact value is in a tooltip.
- Website gram.lovlydev.ru: the same tools in the browser, except Developer CLI and entering your own recovery phrase. Direct links like `/address/…`, `/tx/…`, and `/contract/…`.
- License: AGPL-3.0-only.

## Upgrading from VANTIX

- On first launch Gramix copies saved wallets and found addresses from the VANTIX data folder. The old folder is kept.
- Gramix installs as a separate app; after checking your data you can uninstall VANTIX 0.1.0.
- Interface settings and Benchmark history start fresh.
- CLI variables are now `GRAMIX_WALLET_PASSWORD` and `GRAMIX_RESOURCE_DIR`; the old `VANTIX_*` names still work.

## Telemetry

- The app sends nothing: it contains no statistics code, and CI checks this on every build.
- The website collects statistics only after the visitor agrees. Recovery phrases, keys, and files are never sent. Details are on the site's privacy page.

## Known Limitations

- CUDA and HIP exist in source, but their modules are not in the installers: they have not been validated on NVIDIA and AMD cards. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- On the website, address search and Benchmark run only on the CPU in Web Workers and are much slower than the app; the 24-word scheme is very slow in the browser.
- Running several physical GPUs together is not confirmed by hardware testing.
- The Windows installer is not signed with a publisher certificate; SmartScreen may show a warning.
