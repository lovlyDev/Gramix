# VANTIX 0.1.0

The first public release, published under the name VANTIX (now Gramix), for Windows and Linux. The app searches addresses by a chosen fragment, checks the available CPU and Vulkan GPUs, and lets you pick the compute mode automatically or manually.

## Downloads

- Windows: `VANTIX_0.1.0_x64-setup.exe` (NSIS).
- Linux: `VANTIX_0.1.0_amd64.deb` or `VANTIX_0.1.0_amd64.AppImage`.
- Checksums are in `SHA256SUMS.txt`.

## Features

- Wallet V5R1 and V4R2; 12- and 24-word recovery phrases.
- Search by prefix, suffix, or any part of the address, optionally case-insensitive.
- CPU, Vulkan Compute, and hybrid search; GPU results are re-checked on the CPU.
- Pause and stop, speed monitoring, and device selection in the app.
- Encrypted saved phrase: DPAPI on Windows, AES-256-GCM with a password on Linux.
- Signed in-app updates for Windows NSIS and Linux AppImage; DEB updates through the package manager.

## Known Limitations

- CUDA and HIP exist in source, but their modules are not included in the 0.1.0 installers: building and running on supported NVIDIA/AMD cards has not been validated. Those cards can use Vulkan Compute if the driver supports it; the CPU remains the fallback.
- Running several physical GPUs together is not confirmed by hardware testing.
- GPU acceleration covers the 12-word scheme. The 24-word scheme uses the CPU.
- The Windows installer is not signed with a publisher certificate; Windows SmartScreen may show a warning.
