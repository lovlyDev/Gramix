# Releasing Gramix

English | [Русский](release.ru.md)

Users install a ready package from GitHub Releases. CMake, Node.js, Rust, and GPU compilers are needed only by the build system. On launch Gramix detects the CPU and GPUs, verifies the available compute engines, and in Auto mode picks the fastest verified one; manual selection is available in Settings. CUDA/HIP modules are not included in the installers until they pass hardware validation.

## Automated Build

The [release.yml](../.github/workflows/release.yml) workflow starts when a `vX.Y.Z` tag is pushed. It first runs [Quality](../.github/workflows/ci.yml), then builds the Windows NSIS installer and the Linux DEB/AppImage separately. Publishing starts only if both platforms succeed. The workflow creates a draft GitHub Release with the installers, update signatures, `latest.json`, and `SHA256SUMS.txt`, using `docs/release-notes-vX.Y.Z.md` as the description. A manual run builds the same packages as artifacts for testing and publishes nothing.

The [Windows](../tools/build-release-windows.ps1) and [Linux](../tools/build-release-linux.sh) build scripts rebuild the C++ core, run the reference checks, copy the fresh `gramix` sidecar, and add the word list and Vulkan shader. CUDA/HIP modules are included only if the corresponding SDK built them. Module availability is detected at launch and confirmed by a cryptographic self-test.

[check-version.py](../tools/check-version.py) checks that CMake, npm, Cargo, Tauri, and the Git tag carry the same version. Local package build: `pwsh -File tools/build-release-windows.ps1` on Windows, `bash tools/build-release-linux.sh` on Linux.

## Website

The [Site](../.github/workflows/pages.yml) workflow builds `npm run build:web` on every push to `main` and publishes it to GitHub Pages at gram.lovlydev.ru. The repository variables `TELEMETRY_URL` and `TELEMETRY_SITE_ID` connect the statistics collector; without them the site sends nothing and shows no consent banner.

## Signed Updates

Tauri reads `latest.json` from the latest GitHub Release. On Windows and in the Linux AppImage the app shows the new version and installs it after the search stops. The Linux DEB is updated by the package manager. [make-update-manifest.py](../tools/make-update-manifest.py) takes the `.sig` signatures from the build artifacts and links both installers. The Tauri update signature is separate from Windows code signing.

The update key is stored locally in the Git-ignored `.tools/signing/` folder and in the GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY`. The public key is embedded in the Tauri configuration. The private key is required for every future update; losing it would prevent existing users from updating in-app, so it must be backed up in the owner's secure storage.

## Publishing Conditions

A release needs successful Windows/Linux builds and CPU/Vulkan checks. On Linux the result is encrypted with the user's password, which must be kept separately. Before claiming CUDA/HIP support I run the [hardware validation](vendor-validation.md) on a supported card.

The Windows installer may download WebView2 Runtime if it is missing; Tauri handles that automatically. Windows code signing is not configured yet, so SmartScreen may warn about a new publisher.
