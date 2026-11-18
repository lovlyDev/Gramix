# Gramix 0.2.2

A fix release: export now works in the desktop app.

## Downloads

- Windows: `Gramix_0.2.2_x64-setup.exe` (NSIS).
- Linux: `Gramix_0.2.2_amd64.deb` or `Gramix_0.2.2_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## Fixes

- Export buttons did nothing in the app. Every export now opens the system "Save as" dialog and writes the file only to the path you choose: public wallet data, wallet check report, QR code, transaction, BOC and cell JSON, contract state, Contract Vanity StateInit and report, Sandbox scenario and results, Builder artifacts, Benchmark JSON/CSV, and Developer CLI output.
- After saving, the app shows the file path; errors are shown instead of being silently ignored.

## Upgrading

- Windows and AppImage: Settings → Updates → "Update".
- Linux DEB: install the new `.deb` package from this release.

## Known Limitations

- CUDA and HIP exist in source, but their modules are not in the installers: they have not been validated on NVIDIA and AMD cards. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- Running several physical GPUs together is not confirmed by hardware testing.
- The Windows installer is not signed with a publisher certificate; SmartScreen may show a warning.
