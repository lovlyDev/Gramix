# Gramix 0.2.1

This release makes the desktop app look and work like a desktop application instead of a website, and adds one-click updates.

## Downloads

- Windows: `Gramix_0.2.1_x64-setup.exe` (NSIS).
- Linux: `Gramix_0.2.1_amd64.deb` or `Gramix_0.2.1_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## What's New

- New app layout: a sidebar with tool groups, search by address, hash or tool (Ctrl+K), favorites, and a collapsed mode (Ctrl+B); a toolbar with the screen title; a status bar with devices, compute engines, and address search progress.
- Overview: quick actions and a chart of your computer's speed across Benchmark runs.
- Updates: one "Update" button in Settings → Updates checks GitHub Releases, downloads the new version, verifies its signature, installs it, and restarts the app. The app also checks at launch and every 6 hours and shows an update button in the sidebar when a new version is out.
- About: the document language is chosen from a list; links between documents open inside the app, and web links open in the browser.
- Smooth charts in Benchmark and address search.

## Upgrading

- Windows and AppImage: users of 0.2.0 can update from Settings → Updates.
- Linux DEB: install the new `.deb` package from this release.

## Known Limitations

- CUDA and HIP exist in source, but their modules are not in the installers: they have not been validated on NVIDIA and AMD cards. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- Running several physical GPUs together is not confirmed by hardware testing.
- The Windows installer is not signed with a publisher certificate; SmartScreen may show a warning.
