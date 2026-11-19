# Gramix Third-Party Components

English | [Русский](THIRD_PARTY.ru.md)

I record versions from the current lockfiles. A package in a lockfile is not necessarily present in every installer. Before release, inspect each delivered artifact and include the complete license text and copyright notices for redistributed components.

A registry license declaration does not replace inspection of the actual package license and notices. `UNKNOWN` must be resolved before a release. MIT/BSD/ISC generally require preserving copyright and permission notices; Apache-2.0 requires its license text and applicable notices; MPL/LGPL/GPL and other copyleft terms need individual source-distribution review. The actual version's terms control.

## Direct C++ vcpkg dependencies

vcpkg baseline: `ee6a47dac031930715bea2e6dfb9ad60caaa5d83`. The versions below come from local `vcpkg_installed/vcpkg/status`; the manifest alone does not pin them for every future build.

| Package | Local version | Port license declaration | Source |
| --- | --- | --- | --- |
| `cli11` | `2.7.2` | `BSD-3-Clause` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/cli11) |
| `gtest` | `1.18.0` | `BSD-3-Clause` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/gtest) |
| `openssl` | `3.6.4#1` | `Apache-2.0` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/openssl) |
| `tomlplusplus` | `3.4.0#1` | `MIT` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/tomlplusplus) |
| `volk` | `1.4.357.0` | `MIT` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/volk) |
| `vulkan-headers` | `1.4.357.0` | `Apache-2.0 OR MIT` | [vcpkg port](https://github.com/microsoft/vcpkg/tree/ee6a47dac031930715bea2e6dfb9ad60caaa5d83/ports/vulkan-headers) |

## npm and Cargo: exact lockfile versions

| Ecosystem | Package | Version | Declared license | Source |
| --- | --- | --- | --- | --- |
| npm | `@esbuild/aix-ppc64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Faix-ppc64/v/0.28.2) |
| npm | `@esbuild/android-arm` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fandroid-arm/v/0.28.2) |
| npm | `@esbuild/android-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fandroid-arm64/v/0.28.2) |
| npm | `@esbuild/android-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fandroid-x64/v/0.28.2) |
| npm | `@esbuild/darwin-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fdarwin-arm64/v/0.28.2) |
| npm | `@esbuild/darwin-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fdarwin-x64/v/0.28.2) |
| npm | `@esbuild/freebsd-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Ffreebsd-arm64/v/0.28.2) |
| npm | `@esbuild/freebsd-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Ffreebsd-x64/v/0.28.2) |
| npm | `@esbuild/linux-arm` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-arm/v/0.28.2) |
| npm | `@esbuild/linux-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-arm64/v/0.28.2) |
| npm | `@esbuild/linux-ia32` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-ia32/v/0.28.2) |
| npm | `@esbuild/linux-loong64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-loong64/v/0.28.2) |
| npm | `@esbuild/linux-mips64el` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-mips64el/v/0.28.2) |
| npm | `@esbuild/linux-ppc64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-ppc64/v/0.28.2) |
| npm | `@esbuild/linux-riscv64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-riscv64/v/0.28.2) |
| npm | `@esbuild/linux-s390x` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-s390x/v/0.28.2) |
| npm | `@esbuild/linux-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Flinux-x64/v/0.28.2) |
| npm | `@esbuild/netbsd-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fnetbsd-arm64/v/0.28.2) |
| npm | `@esbuild/netbsd-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fnetbsd-x64/v/0.28.2) |
| npm | `@esbuild/openbsd-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fopenbsd-arm64/v/0.28.2) |
| npm | `@esbuild/openbsd-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fopenbsd-x64/v/0.28.2) |
| npm | `@esbuild/openharmony-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fopenharmony-arm64/v/0.28.2) |
| npm | `@esbuild/sunos-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fsunos-x64/v/0.28.2) |
| npm | `@esbuild/win32-arm64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fwin32-arm64/v/0.28.2) |
| npm | `@esbuild/win32-ia32` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fwin32-ia32/v/0.28.2) |
| npm | `@esbuild/win32-x64` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/%40esbuild%2Fwin32-x64/v/0.28.2) |
| npm | `@floating-ui/core` | `1.8.0` | `MIT` | [npm](https://www.npmjs.com/package/%40floating-ui%2Fcore/v/1.8.0) |
| npm | `@floating-ui/dom` | `1.8.0` | `MIT` | [npm](https://www.npmjs.com/package/%40floating-ui%2Fdom/v/1.8.0) |
| npm | `@floating-ui/react-dom` | `2.1.9` | `MIT` | [npm](https://www.npmjs.com/package/%40floating-ui%2Freact-dom/v/2.1.9) |
| npm | `@floating-ui/utils` | `0.2.12` | `MIT` | [npm](https://www.npmjs.com/package/%40floating-ui%2Futils/v/0.2.12) |
| npm | `@fontsource-variable/inter` | `5.3.0` | `OFL-1.1` | [npm](https://www.npmjs.com/package/%40fontsource-variable%2Finter/v/5.3.0) |
| npm | `@fontsource-variable/jetbrains-mono` | `5.3.0` | `OFL-1.1` | [npm](https://www.npmjs.com/package/%40fontsource-variable%2Fjetbrains-mono/v/5.3.0) |
| npm | `@jridgewell/gen-mapping` | `0.3.13` | `MIT` | [npm](https://www.npmjs.com/package/%40jridgewell%2Fgen-mapping/v/0.3.13) |
| npm | `@jridgewell/remapping` | `2.3.5` | `MIT` | [npm](https://www.npmjs.com/package/%40jridgewell%2Fremapping/v/2.3.5) |
| npm | `@jridgewell/resolve-uri` | `3.1.2` | `MIT` | [npm](https://www.npmjs.com/package/%40jridgewell%2Fresolve-uri/v/3.1.2) |
| npm | `@jridgewell/sourcemap-codec` | `1.6.0` | `MIT` | [npm](https://www.npmjs.com/package/%40jridgewell%2Fsourcemap-codec/v/1.6.0) |
| npm | `@jridgewell/trace-mapping` | `0.3.31` | `MIT` | [npm](https://www.npmjs.com/package/%40jridgewell%2Ftrace-mapping/v/0.3.31) |
| npm | `@monaco-editor/loader` | `1.7.0` | `MIT` | [npm](https://www.npmjs.com/package/%40monaco-editor%2Floader/v/1.7.0) |
| npm | `@monaco-editor/react` | `4.7.0` | `MIT` | [npm](https://www.npmjs.com/package/%40monaco-editor%2Freact/v/4.7.0) |
| npm | `@oxc-project/types` | `0.151.0` | `MIT` | [npm](https://www.npmjs.com/package/%40oxc-project%2Ftypes/v/0.151.0) |
| npm | `@radix-ui/number` | `1.1.3` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Fnumber/v/1.1.3) |
| npm | `@radix-ui/primitive` | `1.1.7` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Fprimitive/v/1.1.7) |
| npm | `@radix-ui/react-arrow` | `1.1.15` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-arrow/v/1.1.15) |
| npm | `@radix-ui/react-checkbox` | `1.3.11` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-checkbox/v/1.3.11) |
| npm | `@radix-ui/react-collection` | `1.1.15` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-collection/v/1.1.15) |
| npm | `@radix-ui/react-compose-refs` | `1.1.5` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-compose-refs/v/1.1.5) |
| npm | `@radix-ui/react-context` | `1.2.2` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-context/v/1.2.2) |
| npm | `@radix-ui/react-dialog` | `1.1.23` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-dialog/v/1.1.23) |
| npm | `@radix-ui/react-direction` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-direction/v/1.1.4) |
| npm | `@radix-ui/react-dismissable-layer` | `1.1.19` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-dismissable-layer/v/1.1.19) |
| npm | `@radix-ui/react-focus-guards` | `1.1.6` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-focus-guards/v/1.1.6) |
| npm | `@radix-ui/react-focus-scope` | `1.1.16` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-focus-scope/v/1.1.16) |
| npm | `@radix-ui/react-id` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-id/v/1.1.4) |
| npm | `@radix-ui/react-popper` | `1.3.7` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-popper/v/1.3.7) |
| npm | `@radix-ui/react-portal` | `1.1.17` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-portal/v/1.1.17) |
| npm | `@radix-ui/react-presence` | `1.1.10` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-presence/v/1.1.10) |
| npm | `@radix-ui/react-primitive` | `2.1.10` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-primitive/v/2.1.10) |
| npm | `@radix-ui/react-roving-focus` | `1.1.19` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-roving-focus/v/1.1.19) |
| npm | `@radix-ui/react-select` | `2.3.7` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-select/v/2.3.7) |
| npm | `@radix-ui/react-slot` | `1.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-slot/v/1.3.3) |
| npm | `@radix-ui/react-switch` | `1.3.7` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-switch/v/1.3.7) |
| npm | `@radix-ui/react-tabs` | `1.1.21` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-tabs/v/1.1.21) |
| npm | `@radix-ui/react-use-callback-ref` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-callback-ref/v/1.1.4) |
| npm | `@radix-ui/react-use-controllable-state` | `1.2.6` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-controllable-state/v/1.2.6) |
| npm | `@radix-ui/react-use-effect-event` | `0.0.5` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-effect-event/v/0.0.5) |
| npm | `@radix-ui/react-use-is-hydrated` | `0.1.3` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-is-hydrated/v/0.1.3) |
| npm | `@radix-ui/react-use-layout-effect` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-layout-effect/v/1.1.4) |
| npm | `@radix-ui/react-use-previous` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-previous/v/1.1.4) |
| npm | `@radix-ui/react-use-rect` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-rect/v/1.1.4) |
| npm | `@radix-ui/react-use-size` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-use-size/v/1.1.4) |
| npm | `@radix-ui/react-visually-hidden` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Freact-visually-hidden/v/1.2.11) |
| npm | `@radix-ui/rect` | `1.1.3` | `MIT` | [npm](https://www.npmjs.com/package/%40radix-ui%2Frect/v/1.1.3) |
| npm | `@rolldown/binding-android-arm-eabi` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-android-arm-eabi/v/1.2.11) |
| npm | `@rolldown/binding-android-arm64` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-android-arm64/v/1.2.11) |
| npm | `@rolldown/binding-darwin-arm64` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-darwin-arm64/v/1.2.11) |
| npm | `@rolldown/binding-darwin-x64` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-darwin-x64/v/1.2.11) |
| npm | `@rolldown/binding-freebsd-x64` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-freebsd-x64/v/1.2.11) |
| npm | `@rolldown/binding-linux-arm-gnueabihf` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-arm-gnueabihf/v/1.2.11) |
| npm | `@rolldown/binding-linux-arm64-gnu` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-arm64-gnu/v/1.2.11) |
| npm | `@rolldown/binding-linux-arm64-musl` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-arm64-musl/v/1.2.11) |
| npm | `@rolldown/binding-linux-ppc64-gnu` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-ppc64-gnu/v/1.2.11) |
| npm | `@rolldown/binding-linux-s390x-gnu` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-s390x-gnu/v/1.2.11) |
| npm | `@rolldown/binding-linux-x64-gnu` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-x64-gnu/v/1.2.11) |
| npm | `@rolldown/binding-linux-x64-musl` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-linux-x64-musl/v/1.2.11) |
| npm | `@rolldown/binding-openharmony-arm64` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-openharmony-arm64/v/1.2.11) |
| npm | `@rolldown/binding-win32-arm64-msvc` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-win32-arm64-msvc/v/1.2.11) |
| npm | `@rolldown/binding-win32-x64-msvc` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fbinding-win32-x64-msvc/v/1.2.11) |
| npm | `@rolldown/pluginutils` | `1.0.1` | `MIT` | [npm](https://www.npmjs.com/package/%40rolldown%2Fpluginutils/v/1.0.1) |
| npm | `@tailwindcss/node` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Fnode/v/4.3.3) |
| npm | `@tailwindcss/oxide` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide/v/4.3.3) |
| npm | `@tailwindcss/oxide-android-arm64` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-android-arm64/v/4.3.3) |
| npm | `@tailwindcss/oxide-darwin-arm64` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-darwin-arm64/v/4.3.3) |
| npm | `@tailwindcss/oxide-darwin-x64` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-darwin-x64/v/4.3.3) |
| npm | `@tailwindcss/oxide-freebsd-x64` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-freebsd-x64/v/4.3.3) |
| npm | `@tailwindcss/oxide-linux-arm-gnueabihf` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-linux-arm-gnueabihf/v/4.3.3) |
| npm | `@tailwindcss/oxide-linux-arm64-gnu` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-linux-arm64-gnu/v/4.3.3) |
| npm | `@tailwindcss/oxide-linux-arm64-musl` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-linux-arm64-musl/v/4.3.3) |
| npm | `@tailwindcss/oxide-linux-x64-gnu` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-linux-x64-gnu/v/4.3.3) |
| npm | `@tailwindcss/oxide-linux-x64-musl` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-linux-x64-musl/v/4.3.3) |
| npm | `@tailwindcss/oxide-wasm32-wasi` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-wasm32-wasi/v/4.3.3) |
| npm | `@tailwindcss/oxide-win32-arm64-msvc` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-win32-arm64-msvc/v/4.3.3) |
| npm | `@tailwindcss/oxide-win32-x64-msvc` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Foxide-win32-x64-msvc/v/4.3.3) |
| npm | `@tailwindcss/vite` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/%40tailwindcss%2Fvite/v/4.3.3) |
| npm | `@tauri-apps/api` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fapi/v/2.12.0) |
| npm | `@tauri-apps/cli` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli/v/2.12.0) |
| npm | `@tauri-apps/cli-darwin-arm64` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-darwin-arm64/v/2.12.0) |
| npm | `@tauri-apps/cli-darwin-x64` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-darwin-x64/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-arm-gnueabihf` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-arm-gnueabihf/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-arm64-gnu` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-arm64-gnu/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-arm64-musl` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-arm64-musl/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-riscv64-gnu` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-riscv64-gnu/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-x64-gnu` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-x64-gnu/v/2.12.0) |
| npm | `@tauri-apps/cli-linux-x64-musl` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-linux-x64-musl/v/2.12.0) |
| npm | `@tauri-apps/cli-win32-arm64-msvc` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-win32-arm64-msvc/v/2.12.0) |
| npm | `@tauri-apps/cli-win32-ia32-msvc` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-win32-ia32-msvc/v/2.12.0) |
| npm | `@tauri-apps/cli-win32-x64-msvc` | `2.12.0` | `Apache-2.0 OR MIT` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fcli-win32-x64-msvc/v/2.12.0) |
| npm | `@tauri-apps/plugin-dialog` | `2.8.0` | `MIT OR Apache-2.0` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fplugin-dialog/v/2.8.0) |
| npm | `@tauri-apps/plugin-notification` | `2.8.1` | `MIT OR Apache-2.0` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fplugin-notification/v/2.8.1) |
| npm | `@tauri-apps/plugin-process` | `2.4.0` | `MIT OR Apache-2.0` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fplugin-process/v/2.4.0) |
| npm | `@tauri-apps/plugin-shell` | `2.3.6` | `MIT OR Apache-2.0` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fplugin-shell/v/2.3.6) |
| npm | `@tauri-apps/plugin-updater` | `2.13.0` | `MIT OR Apache-2.0` | [npm](https://www.npmjs.com/package/%40tauri-apps%2Fplugin-updater/v/2.13.0) |
| npm | `@ton-community/func-js` | `0.11.0` | `MIT` | [npm](https://www.npmjs.com/package/%40ton-community%2Ffunc-js/v/0.11.0) |
| npm | `@ton-community/func-js-bin` | `0.4.6-wasmfix.debugger.1` | `MIT` | [npm](https://www.npmjs.com/package/%40ton-community%2Ffunc-js-bin/v/0.4.6-wasmfix.debugger.1) |
| npm | `@ton/core` | `0.63.1` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Fcore/v/0.63.1) |
| npm | `@ton/crypto` | `3.3.0` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Fcrypto/v/3.3.0) |
| npm | `@ton/crypto-primitives` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Fcrypto-primitives/v/2.1.0) |
| npm | `@ton/sandbox` | `0.45.0` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Fsandbox/v/0.45.0) |
| npm | `@ton/tasm` | `0.6.1` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Ftasm/v/0.6.1) |
| npm | `@ton/tolk-js` | `1.4.2` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Ftolk-js/v/1.4.2) |
| npm | `@ton/ton` | `16.3.0` | `MIT` | [npm](https://www.npmjs.com/package/%40ton%2Fton/v/16.3.0) |
| npm | `@tonstudio/parser-runtime` | `0.0.1` | `UNKNOWN` | [npm](https://www.npmjs.com/package/%40tonstudio%2Fparser-runtime/v/0.0.1) |
| npm | `@types/chai` | `5.2.3` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fchai/v/5.2.3) |
| npm | `@types/debug` | `4.1.13` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fdebug/v/4.1.13) |
| npm | `@types/deep-eql` | `4.0.2` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fdeep-eql/v/4.0.2) |
| npm | `@types/estree` | `1.0.9` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Festree/v/1.0.9) |
| npm | `@types/estree-jsx` | `1.0.5` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Festree-jsx/v/1.0.5) |
| npm | `@types/hast` | `3.0.5` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fhast/v/3.0.5) |
| npm | `@types/mdast` | `4.0.4` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fmdast/v/4.0.4) |
| npm | `@types/ms` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fms/v/2.1.0) |
| npm | `@types/node` | `24.19.2` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Fnode/v/24.19.2) |
| npm | `@types/react` | `19.3.0` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Freact/v/19.3.0) |
| npm | `@types/react-dom` | `19.3.0` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Freact-dom/v/19.3.0) |
| npm | `@types/trusted-types` | `2.0.7` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Ftrusted-types/v/2.0.7) |
| npm | `@types/unist` | `2.0.11` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Funist/v/2.0.11) |
| npm | `@types/unist` | `3.0.3` | `MIT` | [npm](https://www.npmjs.com/package/%40types%2Funist/v/3.0.3) |
| npm | `@typescript/typescript-aix-ppc64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-aix-ppc64/v/7.0.2) |
| npm | `@typescript/typescript-darwin-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-darwin-arm64/v/7.0.2) |
| npm | `@typescript/typescript-darwin-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-darwin-x64/v/7.0.2) |
| npm | `@typescript/typescript-freebsd-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-freebsd-arm64/v/7.0.2) |
| npm | `@typescript/typescript-freebsd-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-freebsd-x64/v/7.0.2) |
| npm | `@typescript/typescript-linux-arm` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-arm/v/7.0.2) |
| npm | `@typescript/typescript-linux-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-arm64/v/7.0.2) |
| npm | `@typescript/typescript-linux-loong64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-loong64/v/7.0.2) |
| npm | `@typescript/typescript-linux-mips64el` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-mips64el/v/7.0.2) |
| npm | `@typescript/typescript-linux-ppc64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-ppc64/v/7.0.2) |
| npm | `@typescript/typescript-linux-riscv64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-riscv64/v/7.0.2) |
| npm | `@typescript/typescript-linux-s390x` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-s390x/v/7.0.2) |
| npm | `@typescript/typescript-linux-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-linux-x64/v/7.0.2) |
| npm | `@typescript/typescript-netbsd-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-netbsd-arm64/v/7.0.2) |
| npm | `@typescript/typescript-netbsd-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-netbsd-x64/v/7.0.2) |
| npm | `@typescript/typescript-openbsd-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-openbsd-arm64/v/7.0.2) |
| npm | `@typescript/typescript-openbsd-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-openbsd-x64/v/7.0.2) |
| npm | `@typescript/typescript-sunos-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-sunos-x64/v/7.0.2) |
| npm | `@typescript/typescript-win32-arm64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-win32-arm64/v/7.0.2) |
| npm | `@typescript/typescript-win32-x64` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/%40typescript%2Ftypescript-win32-x64/v/7.0.2) |
| npm | `@ungap/structured-clone` | `1.4.0` | `ISC` | [npm](https://www.npmjs.com/package/%40ungap%2Fstructured-clone/v/1.4.0) |
| npm | `@vitejs/plugin-react` | `6.1.1` | `MIT` | [npm](https://www.npmjs.com/package/%40vitejs%2Fplugin-react/v/6.1.1) |
| npm | `@vitest/mocker` | `5.0.2` | `MIT` | [npm](https://www.npmjs.com/package/%40vitest%2Fmocker/v/5.0.2) |
| npm | `@vitest/spy` | `5.0.2` | `MIT` | [npm](https://www.npmjs.com/package/%40vitest%2Fspy/v/5.0.2) |
| npm | `@xterm/addon-fit` | `0.11.0` | `MIT` | [npm](https://www.npmjs.com/package/%40xterm%2Faddon-fit/v/0.11.0) |
| npm | `@xterm/xterm` | `6.0.0` | `MIT` | [npm](https://www.npmjs.com/package/%40xterm%2Fxterm/v/6.0.0) |
| npm | `agent-base` | `6.0.2` | `MIT` | [npm](https://www.npmjs.com/package/agent-base/v/6.0.2) |
| npm | `ajv` | `8.20.0` | `MIT` | [npm](https://www.npmjs.com/package/ajv/v/8.20.0) |
| npm | `ansi-regex` | `5.0.1` | `MIT` | [npm](https://www.npmjs.com/package/ansi-regex/v/5.0.1) |
| npm | `ansi-styles` | `4.3.0` | `MIT` | [npm](https://www.npmjs.com/package/ansi-styles/v/4.3.0) |
| npm | `arg` | `5.0.2` | `MIT` | [npm](https://www.npmjs.com/package/arg/v/5.0.2) |
| npm | `aria-hidden` | `1.2.6` | `MIT` | [npm](https://www.npmjs.com/package/aria-hidden/v/1.2.6) |
| npm | `assertion-error` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/assertion-error/v/2.0.1) |
| npm | `astral-regex` | `2.0.0` | `MIT` | [npm](https://www.npmjs.com/package/astral-regex/v/2.0.0) |
| npm | `asynckit` | `0.4.0` | `MIT` | [npm](https://www.npmjs.com/package/asynckit/v/0.4.0) |
| npm | `axios` | `1.20.0` | `MIT` | [npm](https://www.npmjs.com/package/axios/v/1.20.0) |
| npm | `axios` | `1.21.1` | `MIT` | [npm](https://www.npmjs.com/package/axios/v/1.21.1) |
| npm | `bail` | `2.0.2` | `MIT` | [npm](https://www.npmjs.com/package/bail/v/2.0.2) |
| npm | `base64-js` | `1.5.1` | `MIT` | [npm](https://www.npmjs.com/package/base64-js/v/1.5.1) |
| npm | `buffer` | `6.0.3` | `MIT` | [npm](https://www.npmjs.com/package/buffer/v/6.0.3) |
| npm | `cac` | `6.7.14` | `MIT` | [npm](https://www.npmjs.com/package/cac/v/6.7.14) |
| npm | `call-bind-apply-helpers` | `1.0.2` | `MIT` | [npm](https://www.npmjs.com/package/call-bind-apply-helpers/v/1.0.2) |
| npm | `ccount` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/ccount/v/2.0.1) |
| npm | `chai` | `6.2.2` | `MIT` | [npm](https://www.npmjs.com/package/chai/v/6.2.2) |
| npm | `chalk` | `4.1.2` | `MIT` | [npm](https://www.npmjs.com/package/chalk/v/4.1.2) |
| npm | `character-entities` | `2.0.2` | `MIT` | [npm](https://www.npmjs.com/package/character-entities/v/2.0.2) |
| npm | `character-entities-html4` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/character-entities-html4/v/2.1.0) |
| npm | `character-entities-legacy` | `3.0.0` | `MIT` | [npm](https://www.npmjs.com/package/character-entities-legacy/v/3.0.0) |
| npm | `character-reference-invalid` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/character-reference-invalid/v/2.0.1) |
| npm | `color-convert` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/color-convert/v/2.0.1) |
| npm | `color-name` | `1.1.4` | `MIT` | [npm](https://www.npmjs.com/package/color-name/v/1.1.4) |
| npm | `combined-stream` | `1.0.8` | `MIT` | [npm](https://www.npmjs.com/package/combined-stream/v/1.0.8) |
| npm | `comma-separated-tokens` | `2.0.3` | `MIT` | [npm](https://www.npmjs.com/package/comma-separated-tokens/v/2.0.3) |
| npm | `csstype` | `3.2.3` | `MIT` | [npm](https://www.npmjs.com/package/csstype/v/3.2.3) |
| npm | `dataloader` | `2.2.3` | `MIT` | [npm](https://www.npmjs.com/package/dataloader/v/2.2.3) |
| npm | `debug` | `4.4.3` | `MIT` | [npm](https://www.npmjs.com/package/debug/v/4.4.3) |
| npm | `decode-named-character-reference` | `1.3.0` | `MIT` | [npm](https://www.npmjs.com/package/decode-named-character-reference/v/1.3.0) |
| npm | `delayed-stream` | `1.0.0` | `MIT` | [npm](https://www.npmjs.com/package/delayed-stream/v/1.0.0) |
| npm | `dequal` | `2.0.3` | `MIT` | [npm](https://www.npmjs.com/package/dequal/v/2.0.3) |
| npm | `detect-libc` | `2.1.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/detect-libc/v/2.1.2) |
| npm | `detect-node-es` | `1.1.0` | `MIT` | [npm](https://www.npmjs.com/package/detect-node-es/v/1.1.0) |
| npm | `devlop` | `1.1.0` | `MIT` | [npm](https://www.npmjs.com/package/devlop/v/1.1.0) |
| npm | `dompurify` | `3.4.15` | `(MPL-2.0 OR Apache-2.0)` | [npm](https://www.npmjs.com/package/dompurify/v/3.4.15) |
| npm | `dunder-proto` | `1.0.1` | `MIT` | [npm](https://www.npmjs.com/package/dunder-proto/v/1.0.1) |
| npm | `emoji-regex` | `8.0.0` | `MIT` | [npm](https://www.npmjs.com/package/emoji-regex/v/8.0.0) |
| npm | `enhanced-resolve` | `5.25.1` | `MIT` | [npm](https://www.npmjs.com/package/enhanced-resolve/v/5.25.1) |
| npm | `es-define-property` | `1.0.1` | `MIT` | [npm](https://www.npmjs.com/package/es-define-property/v/1.0.1) |
| npm | `es-errors` | `1.3.0` | `MIT` | [npm](https://www.npmjs.com/package/es-errors/v/1.3.0) |
| npm | `es-module-lexer` | `2.3.2` | `MIT` | [npm](https://www.npmjs.com/package/es-module-lexer/v/2.3.2) |
| npm | `es-object-atoms` | `1.1.2` | `MIT` | [npm](https://www.npmjs.com/package/es-object-atoms/v/1.1.2) |
| npm | `es-set-tostringtag` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/es-set-tostringtag/v/2.1.0) |
| npm | `esbuild` | `0.28.2` | `MIT` | [npm](https://www.npmjs.com/package/esbuild/v/0.28.2) |
| npm | `escape-string-regexp` | `5.0.0` | `MIT` | [npm](https://www.npmjs.com/package/escape-string-regexp/v/5.0.0) |
| npm | `estree-util-is-identifier-name` | `3.0.0` | `MIT` | [npm](https://www.npmjs.com/package/estree-util-is-identifier-name/v/3.0.0) |
| npm | `estree-walker` | `3.0.3` | `MIT` | [npm](https://www.npmjs.com/package/estree-walker/v/3.0.3) |
| npm | `expect-type` | `1.4.0` | `Apache-2.0` | [npm](https://www.npmjs.com/package/expect-type/v/1.4.0) |
| npm | `extend` | `3.0.2` | `MIT` | [npm](https://www.npmjs.com/package/extend/v/3.0.2) |
| npm | `fast-deep-equal` | `3.1.3` | `MIT` | [npm](https://www.npmjs.com/package/fast-deep-equal/v/3.1.3) |
| npm | `fast-uri` | `3.1.8` | `BSD-3-Clause` | [npm](https://www.npmjs.com/package/fast-uri/v/3.1.8) |
| npm | `fdir` | `6.5.0` | `MIT` | [npm](https://www.npmjs.com/package/fdir/v/6.5.0) |
| npm | `fflate` | `0.8.3` | `MIT` | [npm](https://www.npmjs.com/package/fflate/v/0.8.3) |
| npm | `follow-redirects` | `1.16.0` | `MIT` | [npm](https://www.npmjs.com/package/follow-redirects/v/1.16.0) |
| npm | `follow-redirects` | `1.16.3` | `MIT` | [npm](https://www.npmjs.com/package/follow-redirects/v/1.16.3) |
| npm | `form-data` | `4.0.6` | `MIT` | [npm](https://www.npmjs.com/package/form-data/v/4.0.6) |
| npm | `fsevents` | `2.3.3` | `MIT` | [npm](https://www.npmjs.com/package/fsevents/v/2.3.3) |
| npm | `function-bind` | `1.1.2` | `MIT` | [npm](https://www.npmjs.com/package/function-bind/v/1.1.2) |
| npm | `get-intrinsic` | `1.3.0` | `MIT` | [npm](https://www.npmjs.com/package/get-intrinsic/v/1.3.0) |
| npm | `get-nonce` | `1.0.1` | `MIT` | [npm](https://www.npmjs.com/package/get-nonce/v/1.0.1) |
| npm | `get-proto` | `1.0.1` | `MIT` | [npm](https://www.npmjs.com/package/get-proto/v/1.0.1) |
| npm | `gopd` | `1.2.0` | `MIT` | [npm](https://www.npmjs.com/package/gopd/v/1.2.0) |
| npm | `graceful-fs` | `4.2.11` | `ISC` | [npm](https://www.npmjs.com/package/graceful-fs/v/4.2.11) |
| npm | `has-flag` | `4.0.0` | `MIT` | [npm](https://www.npmjs.com/package/has-flag/v/4.0.0) |
| npm | `has-symbols` | `1.1.0` | `MIT` | [npm](https://www.npmjs.com/package/has-symbols/v/1.1.0) |
| npm | `has-tostringtag` | `1.0.2` | `MIT` | [npm](https://www.npmjs.com/package/has-tostringtag/v/1.0.2) |
| npm | `hasown` | `2.0.4` | `MIT` | [npm](https://www.npmjs.com/package/hasown/v/2.0.4) |
| npm | `hast-util-to-jsx-runtime` | `2.3.6` | `MIT` | [npm](https://www.npmjs.com/package/hast-util-to-jsx-runtime/v/2.3.6) |
| npm | `hast-util-whitespace` | `3.0.0` | `MIT` | [npm](https://www.npmjs.com/package/hast-util-whitespace/v/3.0.0) |
| npm | `html-url-attributes` | `3.0.1` | `MIT` | [npm](https://www.npmjs.com/package/html-url-attributes/v/3.0.1) |
| npm | `https-proxy-agent` | `5.0.1` | `MIT` | [npm](https://www.npmjs.com/package/https-proxy-agent/v/5.0.1) |
| npm | `ieee754` | `1.2.1` | `BSD-3-Clause` | [npm](https://www.npmjs.com/package/ieee754/v/1.2.1) |
| npm | `inline-style-parser` | `0.2.7` | `MIT` | [npm](https://www.npmjs.com/package/inline-style-parser/v/0.2.7) |
| npm | `is-alphabetical` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/is-alphabetical/v/2.0.1) |
| npm | `is-alphanumerical` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/is-alphanumerical/v/2.0.1) |
| npm | `is-decimal` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/is-decimal/v/2.0.1) |
| npm | `is-fullwidth-code-point` | `3.0.0` | `MIT` | [npm](https://www.npmjs.com/package/is-fullwidth-code-point/v/3.0.0) |
| npm | `is-hexadecimal` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/is-hexadecimal/v/2.0.1) |
| npm | `is-plain-obj` | `4.1.0` | `MIT` | [npm](https://www.npmjs.com/package/is-plain-obj/v/4.1.0) |
| npm | `jiti` | `2.7.0` | `MIT` | [npm](https://www.npmjs.com/package/jiti/v/2.7.0) |
| npm | `json-schema-traverse` | `1.0.0` | `MIT` | [npm](https://www.npmjs.com/package/json-schema-traverse/v/1.0.0) |
| npm | `jssha` | `3.2.0` | `BSD-3-Clause` | [npm](https://www.npmjs.com/package/jssha/v/3.2.0) |
| npm | `lightningcss` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss/v/1.32.0) |
| npm | `lightningcss` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss/v/1.33.0) |
| npm | `lightningcss-android-arm64` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-android-arm64/v/1.32.0) |
| npm | `lightningcss-android-arm64` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-android-arm64/v/1.33.0) |
| npm | `lightningcss-darwin-arm64` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-darwin-arm64/v/1.32.0) |
| npm | `lightningcss-darwin-arm64` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-darwin-arm64/v/1.33.0) |
| npm | `lightningcss-darwin-x64` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-darwin-x64/v/1.32.0) |
| npm | `lightningcss-darwin-x64` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-darwin-x64/v/1.33.0) |
| npm | `lightningcss-freebsd-x64` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-freebsd-x64/v/1.32.0) |
| npm | `lightningcss-freebsd-x64` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-freebsd-x64/v/1.33.0) |
| npm | `lightningcss-linux-arm-gnueabihf` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm-gnueabihf/v/1.32.0) |
| npm | `lightningcss-linux-arm-gnueabihf` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm-gnueabihf/v/1.33.0) |
| npm | `lightningcss-linux-arm64-gnu` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm64-gnu/v/1.32.0) |
| npm | `lightningcss-linux-arm64-gnu` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm64-gnu/v/1.33.0) |
| npm | `lightningcss-linux-arm64-musl` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm64-musl/v/1.32.0) |
| npm | `lightningcss-linux-arm64-musl` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-arm64-musl/v/1.33.0) |
| npm | `lightningcss-linux-x64-gnu` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-x64-gnu/v/1.32.0) |
| npm | `lightningcss-linux-x64-gnu` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-x64-gnu/v/1.33.0) |
| npm | `lightningcss-linux-x64-musl` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-x64-musl/v/1.32.0) |
| npm | `lightningcss-linux-x64-musl` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-linux-x64-musl/v/1.33.0) |
| npm | `lightningcss-win32-arm64-msvc` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-win32-arm64-msvc/v/1.32.0) |
| npm | `lightningcss-win32-arm64-msvc` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-win32-arm64-msvc/v/1.33.0) |
| npm | `lightningcss-win32-x64-msvc` | `1.32.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-win32-x64-msvc/v/1.32.0) |
| npm | `lightningcss-win32-x64-msvc` | `1.33.0` | `MPL-2.0` | [npm](https://www.npmjs.com/package/lightningcss-win32-x64-msvc/v/1.33.0) |
| npm | `lodash.truncate` | `4.4.2` | `MIT` | [npm](https://www.npmjs.com/package/lodash.truncate/v/4.4.2) |
| npm | `longest-streak` | `3.1.0` | `MIT` | [npm](https://www.npmjs.com/package/longest-streak/v/3.1.0) |
| npm | `lucide-react` | `1.48.0` | `ISC` | [npm](https://www.npmjs.com/package/lucide-react/v/1.48.0) |
| npm | `magic-string` | `0.30.21` | `MIT` | [npm](https://www.npmjs.com/package/magic-string/v/0.30.21) |
| npm | `magic-string` | `1.4.2` | `MIT` | [npm](https://www.npmjs.com/package/magic-string/v/1.4.2) |
| npm | `markdown-table` | `3.0.4` | `MIT` | [npm](https://www.npmjs.com/package/markdown-table/v/3.0.4) |
| npm | `marked` | `14.0.0` | `MIT` | [npm](https://www.npmjs.com/package/marked/v/14.0.0) |
| npm | `math-intrinsics` | `1.1.0` | `MIT` | [npm](https://www.npmjs.com/package/math-intrinsics/v/1.1.0) |
| npm | `mdast-util-find-and-replace` | `3.0.2` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-find-and-replace/v/3.0.2) |
| npm | `mdast-util-from-markdown` | `2.0.3` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-from-markdown/v/2.0.3) |
| npm | `mdast-util-gfm` | `3.1.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm/v/3.1.0) |
| npm | `mdast-util-gfm-autolink-literal` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm-autolink-literal/v/2.0.1) |
| npm | `mdast-util-gfm-footnote` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm-footnote/v/2.1.0) |
| npm | `mdast-util-gfm-strikethrough` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm-strikethrough/v/2.0.1) |
| npm | `mdast-util-gfm-table` | `2.0.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm-table/v/2.0.0) |
| npm | `mdast-util-gfm-task-list-item` | `2.0.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-gfm-task-list-item/v/2.0.0) |
| npm | `mdast-util-mdx-expression` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-mdx-expression/v/2.0.1) |
| npm | `mdast-util-mdx-jsx` | `3.2.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-mdx-jsx/v/3.2.0) |
| npm | `mdast-util-mdxjs-esm` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-mdxjs-esm/v/2.0.1) |
| npm | `mdast-util-phrasing` | `4.1.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-phrasing/v/4.1.0) |
| npm | `mdast-util-to-hast` | `13.2.1` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-to-hast/v/13.2.1) |
| npm | `mdast-util-to-markdown` | `2.1.3` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-to-markdown/v/2.1.3) |
| npm | `mdast-util-to-string` | `4.0.0` | `MIT` | [npm](https://www.npmjs.com/package/mdast-util-to-string/v/4.0.0) |
| npm | `micromark` | `4.0.3` | `MIT` | [npm](https://www.npmjs.com/package/micromark/v/4.0.3) |
| npm | `micromark-core-commonmark` | `2.0.4` | `MIT` | [npm](https://www.npmjs.com/package/micromark-core-commonmark/v/2.0.4) |
| npm | `micromark-extension-gfm` | `3.0.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm/v/3.0.0) |
| npm | `micromark-extension-gfm-autolink-literal` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-autolink-literal/v/2.1.0) |
| npm | `micromark-extension-gfm-footnote` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-footnote/v/2.1.0) |
| npm | `micromark-extension-gfm-strikethrough` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-strikethrough/v/2.1.0) |
| npm | `micromark-extension-gfm-table` | `2.1.2` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-table/v/2.1.2) |
| npm | `micromark-extension-gfm-tagfilter` | `2.0.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-tagfilter/v/2.0.0) |
| npm | `micromark-extension-gfm-task-list-item` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-extension-gfm-task-list-item/v/2.1.0) |
| npm | `micromark-factory-destination` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-factory-destination/v/2.0.1) |
| npm | `micromark-factory-label` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-factory-label/v/2.0.1) |
| npm | `micromark-factory-space` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-factory-space/v/2.1.0) |
| npm | `micromark-factory-title` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-factory-title/v/2.0.1) |
| npm | `micromark-factory-whitespace` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-factory-whitespace/v/2.0.1) |
| npm | `micromark-util-character` | `2.1.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-character/v/2.1.1) |
| npm | `micromark-util-chunked` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-chunked/v/2.0.1) |
| npm | `micromark-util-classify-character` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-classify-character/v/2.0.1) |
| npm | `micromark-util-combine-extensions` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-combine-extensions/v/2.0.1) |
| npm | `micromark-util-decode-numeric-character-reference` | `2.0.2` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-decode-numeric-character-reference/v/2.0.2) |
| npm | `micromark-util-decode-string` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-decode-string/v/2.0.1) |
| npm | `micromark-util-edit-map` | `1.0.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-edit-map/v/1.0.0) |
| npm | `micromark-util-encode` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-encode/v/2.0.1) |
| npm | `micromark-util-html-tag-name` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-html-tag-name/v/2.0.1) |
| npm | `micromark-util-normalize-identifier` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-normalize-identifier/v/2.0.1) |
| npm | `micromark-util-resolve-all` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-resolve-all/v/2.0.1) |
| npm | `micromark-util-sanitize-uri` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-sanitize-uri/v/2.0.1) |
| npm | `micromark-util-subtokenize` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-subtokenize/v/2.1.0) |
| npm | `micromark-util-symbol` | `2.0.1` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-symbol/v/2.0.1) |
| npm | `micromark-util-types` | `2.0.3` | `MIT` | [npm](https://www.npmjs.com/package/micromark-util-types/v/2.0.3) |
| npm | `mime-db` | `1.52.0` | `MIT` | [npm](https://www.npmjs.com/package/mime-db/v/1.52.0) |
| npm | `mime-types` | `2.1.35` | `MIT` | [npm](https://www.npmjs.com/package/mime-types/v/2.1.35) |
| npm | `monaco-editor` | `0.57.0` | `MIT` | [npm](https://www.npmjs.com/package/monaco-editor/v/0.57.0) |
| npm | `ms` | `2.1.3` | `MIT` | [npm](https://www.npmjs.com/package/ms/v/2.1.3) |
| npm | `nanoid` | `3.3.19` | `MIT` | [npm](https://www.npmjs.com/package/nanoid/v/3.3.19) |
| npm | `obug` | `2.2.1` | `MIT` | [npm](https://www.npmjs.com/package/obug/v/2.2.1) |
| npm | `parse-entities` | `4.0.2` | `MIT` | [npm](https://www.npmjs.com/package/parse-entities/v/4.0.2) |
| npm | `picocolors` | `1.1.1` | `ISC` | [npm](https://www.npmjs.com/package/picocolors/v/1.1.1) |
| npm | `picomatch` | `4.0.7` | `MIT` | [npm](https://www.npmjs.com/package/picomatch/v/4.0.7) |
| npm | `playwright-core` | `1.63.0` | `Apache-2.0` | [npm](https://www.npmjs.com/package/playwright-core/v/1.63.0) |
| npm | `postcss` | `8.5.28` | `MIT` | [npm](https://www.npmjs.com/package/postcss/v/8.5.28) |
| npm | `property-information` | `7.2.0` | `MIT` | [npm](https://www.npmjs.com/package/property-information/v/7.2.0) |
| npm | `proxy-from-env` | `2.1.0` | `MIT` | [npm](https://www.npmjs.com/package/proxy-from-env/v/2.1.0) |
| npm | `qrcode.react` | `4.2.0` | `ISC` | [npm](https://www.npmjs.com/package/qrcode.react/v/4.2.0) |
| npm | `react` | `19.3.0` | `MIT` | [npm](https://www.npmjs.com/package/react/v/19.3.0) |
| npm | `react-dom` | `19.3.0` | `MIT` | [npm](https://www.npmjs.com/package/react-dom/v/19.3.0) |
| npm | `react-icons` | `5.5.0` | `MIT` | [npm](https://www.npmjs.com/package/react-icons/v/5.5.0) |
| npm | `react-markdown` | `10.1.0` | `MIT` | [npm](https://www.npmjs.com/package/react-markdown/v/10.1.0) |
| npm | `react-remove-scroll` | `2.7.2` | `MIT` | [npm](https://www.npmjs.com/package/react-remove-scroll/v/2.7.2) |
| npm | `react-remove-scroll-bar` | `2.3.8` | `MIT` | [npm](https://www.npmjs.com/package/react-remove-scroll-bar/v/2.3.8) |
| npm | `react-resizable-panels` | `4.14.1` | `MIT` | [npm](https://www.npmjs.com/package/react-resizable-panels/v/4.14.1) |
| npm | `react-style-singleton` | `2.2.3` | `MIT` | [npm](https://www.npmjs.com/package/react-style-singleton/v/2.2.3) |
| npm | `remark-gfm` | `4.0.1` | `MIT` | [npm](https://www.npmjs.com/package/remark-gfm/v/4.0.1) |
| npm | `remark-parse` | `11.0.0` | `MIT` | [npm](https://www.npmjs.com/package/remark-parse/v/11.0.0) |
| npm | `remark-rehype` | `11.1.2` | `MIT` | [npm](https://www.npmjs.com/package/remark-rehype/v/11.1.2) |
| npm | `remark-stringify` | `11.0.0` | `MIT` | [npm](https://www.npmjs.com/package/remark-stringify/v/11.0.0) |
| npm | `require-from-string` | `2.0.2` | `MIT` | [npm](https://www.npmjs.com/package/require-from-string/v/2.0.2) |
| npm | `rolldown` | `1.2.11` | `MIT` | [npm](https://www.npmjs.com/package/rolldown/v/1.2.11) |
| npm | `scheduler` | `0.28.0` | `MIT` | [npm](https://www.npmjs.com/package/scheduler/v/0.28.0) |
| npm | `slice-ansi` | `4.0.0` | `MIT` | [npm](https://www.npmjs.com/package/slice-ansi/v/4.0.0) |
| npm | `source-map-js` | `1.2.1` | `BSD-3-Clause` | [npm](https://www.npmjs.com/package/source-map-js/v/1.2.1) |
| npm | `space-separated-tokens` | `2.0.2` | `MIT` | [npm](https://www.npmjs.com/package/space-separated-tokens/v/2.0.2) |
| npm | `state-local` | `1.0.7` | `MIT` | [npm](https://www.npmjs.com/package/state-local/v/1.0.7) |
| npm | `std-env` | `4.2.0` | `MIT` | [npm](https://www.npmjs.com/package/std-env/v/4.2.0) |
| npm | `string-width` | `4.2.3` | `MIT` | [npm](https://www.npmjs.com/package/string-width/v/4.2.3) |
| npm | `stringify-entities` | `4.0.4` | `MIT` | [npm](https://www.npmjs.com/package/stringify-entities/v/4.0.4) |
| npm | `strip-ansi` | `6.0.1` | `MIT` | [npm](https://www.npmjs.com/package/strip-ansi/v/6.0.1) |
| npm | `style-to-js` | `1.1.21` | `MIT` | [npm](https://www.npmjs.com/package/style-to-js/v/1.1.21) |
| npm | `style-to-object` | `1.0.14` | `MIT` | [npm](https://www.npmjs.com/package/style-to-object/v/1.0.14) |
| npm | `supports-color` | `7.2.0` | `MIT` | [npm](https://www.npmjs.com/package/supports-color/v/7.2.0) |
| npm | `table` | `6.9.0` | `BSD-3-Clause` | [npm](https://www.npmjs.com/package/table/v/6.9.0) |
| npm | `tailwindcss` | `4.3.3` | `MIT` | [npm](https://www.npmjs.com/package/tailwindcss/v/4.3.3) |
| npm | `tapable` | `2.3.3` | `MIT` | [npm](https://www.npmjs.com/package/tapable/v/2.3.3) |
| npm | `tinybench` | `6.2.0` | `MIT` | [npm](https://www.npmjs.com/package/tinybench/v/6.2.0) |
| npm | `tinyexec` | `1.3.1` | `MIT` | [npm](https://www.npmjs.com/package/tinyexec/v/1.3.1) |
| npm | `tinyglobby` | `0.2.17` | `MIT` | [npm](https://www.npmjs.com/package/tinyglobby/v/0.2.17) |
| npm | `ton-source-map` | `0.2.2` | `MIT` | [npm](https://www.npmjs.com/package/ton-source-map/v/0.2.2) |
| npm | `trim-lines` | `3.0.1` | `MIT` | [npm](https://www.npmjs.com/package/trim-lines/v/3.0.1) |
| npm | `trough` | `2.2.0` | `MIT` | [npm](https://www.npmjs.com/package/trough/v/2.2.0) |
| npm | `tslib` | `2.8.1` | `0BSD` | [npm](https://www.npmjs.com/package/tslib/v/2.8.1) |
| npm | `tweetnacl` | `1.0.3` | `Unlicense` | [npm](https://www.npmjs.com/package/tweetnacl/v/1.0.3) |
| npm | `typescript` | `7.0.2` | `Apache-2.0` | [npm](https://www.npmjs.com/package/typescript/v/7.0.2) |
| npm | `undici-types` | `7.24.6` | `MIT` | [npm](https://www.npmjs.com/package/undici-types/v/7.24.6) |
| npm | `unified` | `11.0.5` | `MIT` | [npm](https://www.npmjs.com/package/unified/v/11.0.5) |
| npm | `unist-util-is` | `6.0.1` | `MIT` | [npm](https://www.npmjs.com/package/unist-util-is/v/6.0.1) |
| npm | `unist-util-position` | `5.0.0` | `MIT` | [npm](https://www.npmjs.com/package/unist-util-position/v/5.0.0) |
| npm | `unist-util-stringify-position` | `4.0.0` | `MIT` | [npm](https://www.npmjs.com/package/unist-util-stringify-position/v/4.0.0) |
| npm | `unist-util-visit` | `5.1.0` | `MIT` | [npm](https://www.npmjs.com/package/unist-util-visit/v/5.1.0) |
| npm | `unist-util-visit-parents` | `6.0.2` | `MIT` | [npm](https://www.npmjs.com/package/unist-util-visit-parents/v/6.0.2) |
| npm | `use-callback-ref` | `1.3.3` | `MIT` | [npm](https://www.npmjs.com/package/use-callback-ref/v/1.3.3) |
| npm | `use-sidecar` | `1.1.3` | `MIT` | [npm](https://www.npmjs.com/package/use-sidecar/v/1.1.3) |
| npm | `vfile` | `6.0.3` | `MIT` | [npm](https://www.npmjs.com/package/vfile/v/6.0.3) |
| npm | `vfile-message` | `4.0.3` | `MIT` | [npm](https://www.npmjs.com/package/vfile-message/v/4.0.3) |
| npm | `vite` | `8.3.1` | `MIT` | [npm](https://www.npmjs.com/package/vite/v/8.3.1) |
| npm | `vitest` | `5.0.2` | `MIT` | [npm](https://www.npmjs.com/package/vitest/v/5.0.2) |
| npm | `why-is-node-running` | `3.2.2` | `MIT` | [npm](https://www.npmjs.com/package/why-is-node-running/v/3.2.2) |
| npm | `zod` | `3.25.76` | `MIT` | [npm](https://www.npmjs.com/package/zod/v/3.25.76) |
| npm | `zustand` | `5.0.15` | `MIT` | [npm](https://www.npmjs.com/package/zustand/v/5.0.15) |
| npm | `zwitch` | `2.0.4` | `MIT` | [npm](https://www.npmjs.com/package/zwitch/v/2.0.4) |
| Cargo | `adler2` | `2.0.1` | `0BSD OR MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/adler2/2.0.1) |
| Cargo | `aho-corasick` | `1.1.5` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/aho-corasick/1.1.5) |
| Cargo | `alloc-no-stdlib` | `3.0.0` | `BSD-3-Clause` | [crates.io](https://crates.io/crates/alloc-no-stdlib/3.0.0) |
| Cargo | `alloc-stdlib` | `0.3.0` | `BSD-3-Clause` | [crates.io](https://crates.io/crates/alloc-stdlib/0.3.0) |
| Cargo | `android_system_properties` | `0.1.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/android_system_properties/0.1.6) |
| Cargo | `anyhow` | `1.0.104` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/anyhow/1.0.104) |
| Cargo | `arbitrary` | `1.4.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/arbitrary/1.4.2) |
| Cargo | `async-broadcast` | `0.7.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/async-broadcast/0.7.2) |
| Cargo | `async-channel` | `2.5.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-channel/2.5.0) |
| Cargo | `async-executor` | `1.14.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-executor/1.14.1) |
| Cargo | `async-io` | `2.6.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-io/2.6.0) |
| Cargo | `async-lock` | `3.5.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-lock/3.5.0) |
| Cargo | `async-process` | `2.5.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-process/2.5.0) |
| Cargo | `async-recursion` | `1.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/async-recursion/1.2.0) |
| Cargo | `async-signal` | `0.2.14` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-signal/0.2.14) |
| Cargo | `async-task` | `4.7.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/async-task/4.7.1) |
| Cargo | `async-trait` | `0.1.92` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/async-trait/0.1.92) |
| Cargo | `atk` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/atk/0.18.2) |
| Cargo | `atk-sys` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/atk-sys/0.18.2) |
| Cargo | `atomic-waker` | `1.1.2` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/atomic-waker/1.1.2) |
| Cargo | `autocfg` | `1.5.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/autocfg/1.5.1) |
| Cargo | `aws-lc-rs` | `1.18.1` | `ISC AND (Apache-2.0 OR ISC)` | [crates.io](https://crates.io/crates/aws-lc-rs/1.18.1) |
| Cargo | `aws-lc-sys` | `0.45.0` | `ISC AND (Apache-2.0 OR ISC) AND Apache-2.0 AND MIT AND BSD-3-Clause AND (Apache-2.0 OR ISC OR MIT) AND (Apache-2.0 OR ISC OR MIT-0)` | [crates.io](https://crates.io/crates/aws-lc-sys/0.45.0) |
| Cargo | `base64` | `0.21.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/base64/0.21.7) |
| Cargo | `base64` | `0.22.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/base64/0.22.1) |
| Cargo | `base64` | `0.23.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/base64/0.23.1) |
| Cargo | `bit-set` | `0.8.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/bit-set/0.8.0) |
| Cargo | `bit-vec` | `0.8.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/bit-vec/0.8.0) |
| Cargo | `bitflags` | `1.3.2` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/bitflags/1.3.2) |
| Cargo | `bitflags` | `2.13.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/bitflags/2.13.2) |
| Cargo | `block-buffer` | `0.10.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/block-buffer/0.10.4) |
| Cargo | `block2` | `0.6.2` | `MIT` | [crates.io](https://crates.io/crates/block2/0.6.2) |
| Cargo | `blocking` | `1.7.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/blocking/1.7.0) |
| Cargo | `brotli` | `9.0.0` | `BSD-3-Clause AND MIT` | [crates.io](https://crates.io/crates/brotli/9.0.0) |
| Cargo | `brotli-decompressor` | `6.0.1` | `BSD-3-Clause/MIT` | [crates.io](https://crates.io/crates/brotli-decompressor/6.0.1) |
| Cargo | `bs58` | `0.5.1` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/bs58/0.5.1) |
| Cargo | `bumpalo` | `3.20.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/bumpalo/3.20.3) |
| Cargo | `bytemuck` | `1.25.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/bytemuck/1.25.2) |
| Cargo | `byteorder` | `1.5.0` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/byteorder/1.5.0) |
| Cargo | `bytes` | `1.12.1` | `MIT` | [crates.io](https://crates.io/crates/bytes/1.12.1) |
| Cargo | `cairo-rs` | `0.18.5` | `MIT` | [crates.io](https://crates.io/crates/cairo-rs/0.18.5) |
| Cargo | `cairo-sys-rs` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/cairo-sys-rs/0.18.2) |
| Cargo | `camino` | `1.2.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/camino/1.2.6) |
| Cargo | `cargo-platform` | `0.1.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cargo-platform/0.1.9) |
| Cargo | `cargo_metadata` | `0.19.2` | `MIT` | [crates.io](https://crates.io/crates/cargo_metadata/0.19.2) |
| Cargo | `cargo_toml` | `1.0.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/cargo_toml/1.0.1) |
| Cargo | `cc` | `1.5.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cc/1.5.1) |
| Cargo | `cesu8` | `1.1.0` | `Apache-2.0/MIT` | [crates.io](https://crates.io/crates/cesu8/1.1.0) |
| Cargo | `cfb` | `0.14.0` | `MIT` | [crates.io](https://crates.io/crates/cfb/0.14.0) |
| Cargo | `cfb` | `0.7.3` | `MIT` | [crates.io](https://crates.io/crates/cfb/0.7.3) |
| Cargo | `cfg-expr` | `0.15.8` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cfg-expr/0.15.8) |
| Cargo | `cfg-if` | `1.0.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cfg-if/1.0.5) |
| Cargo | `cfg_aliases` | `0.2.2` | `MIT` | [crates.io](https://crates.io/crates/cfg_aliases/0.2.2) |
| Cargo | `chacha20` | `0.10.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/chacha20/0.10.1) |
| Cargo | `chrono` | `0.4.45` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/chrono/0.4.45) |
| Cargo | `cmake` | `0.1.58` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cmake/0.1.58) |
| Cargo | `combine` | `4.6.8` | `MIT` | [crates.io](https://crates.io/crates/combine/4.6.8) |
| Cargo | `concurrent-queue` | `2.5.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/concurrent-queue/2.5.0) |
| Cargo | `cookie` | `0.18.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cookie/0.18.2) |
| Cargo | `core-foundation` | `0.10.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/core-foundation/0.10.1) |
| Cargo | `core-foundation` | `0.9.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/core-foundation/0.9.4) |
| Cargo | `core-foundation-sys` | `0.8.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/core-foundation-sys/0.8.7) |
| Cargo | `core-graphics` | `0.25.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/core-graphics/0.25.0) |
| Cargo | `core-graphics-types` | `0.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/core-graphics-types/0.2.0) |
| Cargo | `core_detect` | `1.0.0` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/core_detect/1.0.0) |
| Cargo | `cpufeatures` | `0.2.17` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cpufeatures/0.2.17) |
| Cargo | `cpufeatures` | `0.3.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/cpufeatures/0.3.0) |
| Cargo | `crc32fast` | `1.5.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/crc32fast/1.5.2) |
| Cargo | `crossbeam-channel` | `0.5.17` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/crossbeam-channel/0.5.17) |
| Cargo | `crossbeam-utils` | `0.8.23` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/crossbeam-utils/0.8.23) |
| Cargo | `crypto-common` | `0.1.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/crypto-common/0.1.7) |
| Cargo | `cssparser` | `0.37.0` | `MPL-2.0` | [crates.io](https://crates.io/crates/cssparser/0.37.0) |
| Cargo | `cssparser-macros` | `0.7.1` | `MPL-2.0` | [crates.io](https://crates.io/crates/cssparser-macros/0.7.1) |
| Cargo | `ctor` | `1.0.13` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/ctor/1.0.13) |
| Cargo | `darling` | `0.24.1` | `MIT` | [crates.io](https://crates.io/crates/darling/0.24.1) |
| Cargo | `darling_core` | `0.24.1` | `MIT` | [crates.io](https://crates.io/crates/darling_core/0.24.1) |
| Cargo | `darling_macro` | `0.24.1` | `MIT` | [crates.io](https://crates.io/crates/darling_macro/0.24.1) |
| Cargo | `dbus` | `0.9.12` | `Apache-2.0/MIT` | [crates.io](https://crates.io/crates/dbus/0.9.12) |
| Cargo | `defmt` | `1.1.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/defmt/1.1.1) |
| Cargo | `defmt-macros` | `1.1.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/defmt-macros/1.1.1) |
| Cargo | `defmt-parser` | `1.0.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/defmt-parser/1.0.0) |
| Cargo | `deranged` | `0.5.8` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/deranged/0.5.8) |
| Cargo | `derive_arbitrary` | `1.4.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/derive_arbitrary/1.4.2) |
| Cargo | `derive_more` | `2.1.1` | `MIT` | [crates.io](https://crates.io/crates/derive_more/2.1.1) |
| Cargo | `derive_more-impl` | `2.1.1` | `MIT` | [crates.io](https://crates.io/crates/derive_more-impl/2.1.1) |
| Cargo | `digest` | `0.10.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/digest/0.10.7) |
| Cargo | `dirs` | `6.0.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/dirs/6.0.0) |
| Cargo | `dirs` | `7.0.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/dirs/7.0.0) |
| Cargo | `dirs-sys` | `0.5.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/dirs-sys/0.5.0) |
| Cargo | `dispatch2` | `0.3.1` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/dispatch2/0.3.1) |
| Cargo | `displaydoc` | `0.2.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/displaydoc/0.2.7) |
| Cargo | `dlopen2` | `0.8.2` | `MIT` | [crates.io](https://crates.io/crates/dlopen2/0.8.2) |
| Cargo | `dlopen2_derive` | `0.4.3` | `MIT` | [crates.io](https://crates.io/crates/dlopen2_derive/0.4.3) |
| Cargo | `dom_query` | `0.28.0` | `MIT` | [crates.io](https://crates.io/crates/dom_query/0.28.0) |
| Cargo | `dpi` | `0.1.2` | `Apache-2.0 AND MIT` | [crates.io](https://crates.io/crates/dpi/0.1.2) |
| Cargo | `dtoa` | `1.0.11` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/dtoa/1.0.11) |
| Cargo | `dtoa-short` | `0.3.5` | `MPL-2.0` | [crates.io](https://crates.io/crates/dtoa-short/0.3.5) |
| Cargo | `dunce` | `1.0.5` | `CC0-1.0 OR MIT-0 OR Apache-2.0` | [crates.io](https://crates.io/crates/dunce/1.0.5) |
| Cargo | `dyn-clone` | `1.0.20` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/dyn-clone/1.0.20) |
| Cargo | `embed-resource` | `3.0.11` | `MIT` | [crates.io](https://crates.io/crates/embed-resource/3.0.11) |
| Cargo | `embed_plist` | `1.2.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/embed_plist/1.2.2) |
| Cargo | `encoding_rs` | `0.8.42` | `(Apache-2.0 OR MIT) AND BSD-3-Clause` | [crates.io](https://crates.io/crates/encoding_rs/0.8.42) |
| Cargo | `endi` | `1.1.1` | `MIT` | [crates.io](https://crates.io/crates/endi/1.1.1) |
| Cargo | `enumflags2` | `0.7.12` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/enumflags2/0.7.12) |
| Cargo | `enumflags2_derive` | `0.7.12` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/enumflags2_derive/0.7.12) |
| Cargo | `equivalent` | `1.0.2` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/equivalent/1.0.2) |
| Cargo | `erased-serde` | `0.4.10` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/erased-serde/0.4.10) |
| Cargo | `errno` | `0.3.14` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/errno/0.3.14) |
| Cargo | `event-listener` | `5.4.2` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/event-listener/5.4.2) |
| Cargo | `event-listener-strategy` | `0.5.4` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/event-listener-strategy/0.5.4) |
| Cargo | `fastrand` | `2.5.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/fastrand/2.5.0) |
| Cargo | `fdeflate` | `0.3.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/fdeflate/0.3.7) |
| Cargo | `field-offset` | `0.3.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/field-offset/0.3.6) |
| Cargo | `filetime` | `0.2.29` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/filetime/0.2.29) |
| Cargo | `find-msvc-tools` | `0.1.14` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/find-msvc-tools/0.1.14) |
| Cargo | `flate2` | `1.1.10` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/flate2/1.1.10) |
| Cargo | `fnv` | `1.0.7` | `Apache-2.0 / MIT` | [crates.io](https://crates.io/crates/fnv/1.0.7) |
| Cargo | `foldhash` | `0.2.0` | `Zlib` | [crates.io](https://crates.io/crates/foldhash/0.2.0) |
| Cargo | `foreign-types` | `0.5.0` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/foreign-types/0.5.0) |
| Cargo | `foreign-types-macros` | `0.2.4` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/foreign-types-macros/0.2.4) |
| Cargo | `foreign-types-shared` | `0.3.1` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/foreign-types-shared/0.3.1) |
| Cargo | `form_urlencoded` | `1.2.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/form_urlencoded/1.2.2) |
| Cargo | `fs_extra` | `1.3.0` | `MIT` | [crates.io](https://crates.io/crates/fs_extra/1.3.0) |
| Cargo | `futures-channel` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-channel/0.3.34) |
| Cargo | `futures-core` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-core/0.3.34) |
| Cargo | `futures-executor` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-executor/0.3.34) |
| Cargo | `futures-io` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-io/0.3.34) |
| Cargo | `futures-lite` | `2.6.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/futures-lite/2.6.1) |
| Cargo | `futures-macro` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-macro/0.3.34) |
| Cargo | `futures-sink` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-sink/0.3.34) |
| Cargo | `futures-task` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-task/0.3.34) |
| Cargo | `futures-util` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/futures-util/0.3.34) |
| Cargo | `gdk` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gdk/0.18.2) |
| Cargo | `gdk-pixbuf` | `0.18.5` | `MIT` | [crates.io](https://crates.io/crates/gdk-pixbuf/0.18.5) |
| Cargo | `gdk-pixbuf-sys` | `0.18.0` | `MIT` | [crates.io](https://crates.io/crates/gdk-pixbuf-sys/0.18.0) |
| Cargo | `gdk-sys` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gdk-sys/0.18.2) |
| Cargo | `gdkwayland-sys` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gdkwayland-sys/0.18.2) |
| Cargo | `gdkx11` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gdkx11/0.18.2) |
| Cargo | `gdkx11-sys` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gdkx11-sys/0.18.2) |
| Cargo | `generic-array` | `0.14.7` | `MIT` | [crates.io](https://crates.io/crates/generic-array/0.14.7) |
| Cargo | `getrandom` | `0.2.17` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/getrandom/0.2.17) |
| Cargo | `getrandom` | `0.3.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/getrandom/0.3.4) |
| Cargo | `getrandom` | `0.4.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/getrandom/0.4.3) |
| Cargo | `gio` | `0.18.4` | `MIT` | [crates.io](https://crates.io/crates/gio/0.18.4) |
| Cargo | `gio-sys` | `0.18.1` | `MIT` | [crates.io](https://crates.io/crates/gio-sys/0.18.1) |
| Cargo | `glib` | `0.18.5` | `MIT` | [crates.io](https://crates.io/crates/glib/0.18.5) |
| Cargo | `glib-macros` | `0.18.5` | `MIT` | [crates.io](https://crates.io/crates/glib-macros/0.18.5) |
| Cargo | `glib-sys` | `0.18.1` | `MIT` | [crates.io](https://crates.io/crates/glib-sys/0.18.1) |
| Cargo | `glob` | `0.3.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/glob/0.3.4) |
| Cargo | `gobject-sys` | `0.18.0` | `MIT` | [crates.io](https://crates.io/crates/gobject-sys/0.18.0) |
| Cargo | `gtk` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gtk/0.18.2) |
| Cargo | `gtk-sys` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gtk-sys/0.18.2) |
| Cargo | `gtk3-macros` | `0.18.2` | `MIT` | [crates.io](https://crates.io/crates/gtk3-macros/0.18.2) |
| Cargo | `hashbrown` | `0.12.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/hashbrown/0.12.3) |
| Cargo | `hashbrown` | `0.17.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/hashbrown/0.17.1) |
| Cargo | `heck` | `0.4.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/heck/0.4.1) |
| Cargo | `heck` | `0.5.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/heck/0.5.0) |
| Cargo | `hermit-abi` | `0.5.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/hermit-abi/0.5.3) |
| Cargo | `hex` | `0.4.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/hex/0.4.3) |
| Cargo | `html5ever` | `0.39.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/html5ever/0.39.0) |
| Cargo | `http` | `1.5.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/http/1.5.0) |
| Cargo | `http-body` | `1.1.0` | `MIT` | [crates.io](https://crates.io/crates/http-body/1.1.0) |
| Cargo | `http-body-util` | `0.1.5` | `MIT` | [crates.io](https://crates.io/crates/http-body-util/0.1.5) |
| Cargo | `httparse` | `1.10.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/httparse/1.10.1) |
| Cargo | `hyper` | `1.11.1` | `MIT` | [crates.io](https://crates.io/crates/hyper/1.11.1) |
| Cargo | `hyper-rustls` | `0.27.10` | `Apache-2.0 OR ISC OR MIT` | [crates.io](https://crates.io/crates/hyper-rustls/0.27.10) |
| Cargo | `hyper-util` | `0.1.21` | `MIT` | [crates.io](https://crates.io/crates/hyper-util/0.1.21) |
| Cargo | `iana-time-zone` | `0.1.65` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/iana-time-zone/0.1.65) |
| Cargo | `iana-time-zone-haiku` | `0.1.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/iana-time-zone-haiku/0.1.2) |
| Cargo | `ico` | `0.5.0` | `MIT` | [crates.io](https://crates.io/crates/ico/0.5.0) |
| Cargo | `icu_collections` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_collections/2.3.0) |
| Cargo | `icu_locale_core` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_locale_core/2.3.0) |
| Cargo | `icu_normalizer` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_normalizer/2.3.0) |
| Cargo | `icu_normalizer_data` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_normalizer_data/2.3.0) |
| Cargo | `icu_properties` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_properties/2.3.0) |
| Cargo | `icu_properties_data` | `2.3.0` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_properties_data/2.3.0) |
| Cargo | `icu_provider` | `2.3.1` | `Unicode-3.0` | [crates.io](https://crates.io/crates/icu_provider/2.3.1) |
| Cargo | `ident_case` | `1.0.1` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/ident_case/1.0.1) |
| Cargo | `idna` | `1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/idna/1.1.0) |
| Cargo | `idna_adapter` | `1.2.2` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/idna_adapter/1.2.2) |
| Cargo | `indexmap` | `1.9.3` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/indexmap/1.9.3) |
| Cargo | `indexmap` | `2.14.2` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/indexmap/2.14.2) |
| Cargo | `infer` | `0.19.0` | `MIT` | [crates.io](https://crates.io/crates/infer/0.19.0) |
| Cargo | `infer` | `0.22.0` | `MIT` | [crates.io](https://crates.io/crates/infer/0.22.0) |
| Cargo | `ipnet` | `2.12.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ipnet/2.12.2) |
| Cargo | `is-docker` | `0.2.0` | `MIT` | [crates.io](https://crates.io/crates/is-docker/0.2.0) |
| Cargo | `is-wsl` | `0.4.0` | `MIT` | [crates.io](https://crates.io/crates/is-wsl/0.4.0) |
| Cargo | `itoa` | `1.0.18` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/itoa/1.0.18) |
| Cargo | `javascriptcore-rs` | `1.1.2` | `MIT` | [crates.io](https://crates.io/crates/javascriptcore-rs/1.1.2) |
| Cargo | `javascriptcore-rs-sys` | `1.1.1` | `MIT` | [crates.io](https://crates.io/crates/javascriptcore-rs-sys/1.1.1) |
| Cargo | `jiff` | `0.2.37` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/jiff/0.2.37) |
| Cargo | `jiff-core` | `0.1.1` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/jiff-core/0.1.1) |
| Cargo | `jiff-static` | `0.2.37` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/jiff-static/0.2.37) |
| Cargo | `jiff-tzdb` | `0.1.8` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/jiff-tzdb/0.1.8) |
| Cargo | `jiff-tzdb-platform` | `0.1.3` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/jiff-tzdb-platform/0.1.3) |
| Cargo | `jni` | `0.21.1` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/jni/0.21.1) |
| Cargo | `jni` | `0.22.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jni/0.22.4) |
| Cargo | `jni-macros` | `0.22.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jni-macros/0.22.4) |
| Cargo | `jni-sys` | `0.3.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jni-sys/0.3.1) |
| Cargo | `jni-sys` | `0.4.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jni-sys/0.4.1) |
| Cargo | `jni-sys-macros` | `0.4.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jni-sys-macros/0.4.1) |
| Cargo | `jobserver` | `0.1.35` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jobserver/0.1.35) |
| Cargo | `js-sys` | `0.3.106` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/js-sys/0.3.106) |
| Cargo | `json-patch` | `4.2.0` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/json-patch/4.2.0) |
| Cargo | `jsonptr` | `0.7.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/jsonptr/0.7.1) |
| Cargo | `keyboard-types` | `0.8.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/keyboard-types/0.8.3) |
| Cargo | `libappindicator` | `0.9.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/libappindicator/0.9.0) |
| Cargo | `libappindicator-sys` | `0.9.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/libappindicator-sys/0.9.0) |
| Cargo | `libc` | `0.2.189` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/libc/0.2.189) |
| Cargo | `libdbus-sys` | `0.2.7` | `Apache-2.0/MIT` | [crates.io](https://crates.io/crates/libdbus-sys/0.2.7) |
| Cargo | `libloading` | `0.7.4` | `ISC` | [crates.io](https://crates.io/crates/libloading/0.7.4) |
| Cargo | `libredox` | `0.1.25` | `MIT` | [crates.io](https://crates.io/crates/libredox/0.1.25) |
| Cargo | `linux-raw-sys` | `0.12.1` | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/linux-raw-sys/0.12.1) |
| Cargo | `litemap` | `0.8.3` | `Unicode-3.0` | [crates.io](https://crates.io/crates/litemap/0.8.3) |
| Cargo | `lock_api` | `0.4.14` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/lock_api/0.4.14) |
| Cargo | `log` | `0.4.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/log/0.4.34) |
| Cargo | `lru-slab` | `0.1.2` | `MIT OR Apache-2.0 OR Zlib` | [crates.io](https://crates.io/crates/lru-slab/0.1.2) |
| Cargo | `mac-notification-sys` | `0.6.15` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/mac-notification-sys/0.6.15) |
| Cargo | `markup5ever` | `0.39.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/markup5ever/0.39.0) |
| Cargo | `memchr` | `2.8.3` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/memchr/2.8.3) |
| Cargo | `memoffset` | `0.9.1` | `MIT` | [crates.io](https://crates.io/crates/memoffset/0.9.1) |
| Cargo | `mime` | `0.3.17` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/mime/0.3.17) |
| Cargo | `minisign-verify` | `0.2.5` | `MIT` | [crates.io](https://crates.io/crates/minisign-verify/0.2.5) |
| Cargo | `miniz_oxide` | `0.8.9` | `MIT OR Zlib OR Apache-2.0` | [crates.io](https://crates.io/crates/miniz_oxide/0.8.9) |
| Cargo | `miniz_oxide` | `0.9.1` | `MIT OR Zlib OR Apache-2.0` | [crates.io](https://crates.io/crates/miniz_oxide/0.9.1) |
| Cargo | `mio` | `1.2.3` | `MIT` | [crates.io](https://crates.io/crates/mio/1.2.3) |
| Cargo | `muda` | `0.20.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/muda/0.20.0) |
| Cargo | `multiversion_no_op` | `1.0.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/multiversion_no_op/1.0.0) |
| Cargo | `ndk` | `0.9.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ndk/0.9.0) |
| Cargo | `ndk-context` | `0.1.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ndk-context/0.1.1) |
| Cargo | `ndk-sys` | `0.6.0+11769913` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ndk-sys/0.6.0+11769913) |
| Cargo | `new_debug_unreachable` | `1.0.6` | `MIT` | [crates.io](https://crates.io/crates/new_debug_unreachable/1.0.6) |
| Cargo | `notify-rust` | `4.19.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/notify-rust/4.19.0) |
| Cargo | `num-conv` | `0.2.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/num-conv/0.2.2) |
| Cargo | `num-traits` | `0.2.19` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/num-traits/0.2.19) |
| Cargo | `num_enum` | `0.7.6` | `BSD-3-Clause OR MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/num_enum/0.7.6) |
| Cargo | `num_enum_derive` | `0.7.6` | `BSD-3-Clause OR MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/num_enum_derive/0.7.6) |
| Cargo | `objc2` | `0.6.4` | `MIT` | [crates.io](https://crates.io/crates/objc2/0.6.4) |
| Cargo | `objc2-app-kit` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-app-kit/0.3.2) |
| Cargo | `objc2-cloud-kit` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-cloud-kit/0.3.2) |
| Cargo | `objc2-core-data` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-data/0.3.2) |
| Cargo | `objc2-core-foundation` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-foundation/0.3.2) |
| Cargo | `objc2-core-graphics` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-graphics/0.3.2) |
| Cargo | `objc2-core-image` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-image/0.3.2) |
| Cargo | `objc2-core-location` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-location/0.3.2) |
| Cargo | `objc2-core-text` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-core-text/0.3.2) |
| Cargo | `objc2-encode` | `4.1.0` | `MIT` | [crates.io](https://crates.io/crates/objc2-encode/4.1.0) |
| Cargo | `objc2-exception-helper` | `0.1.1` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-exception-helper/0.1.1) |
| Cargo | `objc2-foundation` | `0.3.2` | `MIT` | [crates.io](https://crates.io/crates/objc2-foundation/0.3.2) |
| Cargo | `objc2-io-surface` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-io-surface/0.3.2) |
| Cargo | `objc2-osa-kit` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-osa-kit/0.3.2) |
| Cargo | `objc2-quartz-core` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-quartz-core/0.3.2) |
| Cargo | `objc2-ui-kit` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-ui-kit/0.3.2) |
| Cargo | `objc2-user-notifications` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-user-notifications/0.3.2) |
| Cargo | `objc2-web-kit` | `0.3.2` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/objc2-web-kit/0.3.2) |
| Cargo | `once_cell` | `1.21.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/once_cell/1.21.4) |
| Cargo | `open` | `5.4.4` | `MIT` | [crates.io](https://crates.io/crates/open/5.4.4) |
| Cargo | `openssl-probe` | `0.2.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/openssl-probe/0.2.1) |
| Cargo | `option-ext` | `0.2.0` | `MPL-2.0` | [crates.io](https://crates.io/crates/option-ext/0.2.0) |
| Cargo | `ordered-stream` | `0.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ordered-stream/0.2.0) |
| Cargo | `os_pipe` | `1.2.3` | `MIT` | [crates.io](https://crates.io/crates/os_pipe/1.2.3) |
| Cargo | `osakit` | `0.3.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/osakit/0.3.1) |
| Cargo | `pango` | `0.18.3` | `MIT` | [crates.io](https://crates.io/crates/pango/0.18.3) |
| Cargo | `pango-sys` | `0.18.0` | `MIT` | [crates.io](https://crates.io/crates/pango-sys/0.18.0) |
| Cargo | `parking` | `2.2.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/parking/2.2.1) |
| Cargo | `parking_lot` | `0.12.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/parking_lot/0.12.5) |
| Cargo | `parking_lot_core` | `0.9.12` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/parking_lot_core/0.9.12) |
| Cargo | `percent-encoding` | `2.3.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/percent-encoding/2.3.2) |
| Cargo | `phf` | `0.13.1` | `MIT` | [crates.io](https://crates.io/crates/phf/0.13.1) |
| Cargo | `phf_codegen` | `0.13.1` | `MIT` | [crates.io](https://crates.io/crates/phf_codegen/0.13.1) |
| Cargo | `phf_generator` | `0.13.1` | `MIT` | [crates.io](https://crates.io/crates/phf_generator/0.13.1) |
| Cargo | `phf_macros` | `0.13.1` | `MIT` | [crates.io](https://crates.io/crates/phf_macros/0.13.1) |
| Cargo | `phf_shared` | `0.13.1` | `MIT` | [crates.io](https://crates.io/crates/phf_shared/0.13.1) |
| Cargo | `pin-project-lite` | `0.2.17` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/pin-project-lite/0.2.17) |
| Cargo | `piper` | `0.2.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/piper/0.2.5) |
| Cargo | `pkg-config` | `0.3.34` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/pkg-config/0.3.34) |
| Cargo | `plist` | `1.10.1` | `MIT` | [crates.io](https://crates.io/crates/plist/1.10.1) |
| Cargo | `png` | `0.17.16` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/png/0.17.16) |
| Cargo | `png` | `0.18.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/png/0.18.1) |
| Cargo | `polling` | `3.11.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/polling/3.11.0) |
| Cargo | `portable-atomic` | `1.15.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/portable-atomic/1.15.0) |
| Cargo | `portable-atomic-util` | `0.2.8` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/portable-atomic-util/0.2.8) |
| Cargo | `potential_utf` | `0.1.6` | `Unicode-3.0` | [crates.io](https://crates.io/crates/potential_utf/0.1.6) |
| Cargo | `powerfmt` | `0.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/powerfmt/0.2.0) |
| Cargo | `precomputed-hash` | `0.1.1` | `MIT` | [crates.io](https://crates.io/crates/precomputed-hash/0.1.1) |
| Cargo | `proc-macro-crate` | `1.3.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro-crate/1.3.1) |
| Cargo | `proc-macro-crate` | `2.0.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro-crate/2.0.2) |
| Cargo | `proc-macro-crate` | `3.5.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro-crate/3.5.0) |
| Cargo | `proc-macro-error` | `1.0.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro-error/1.0.4) |
| Cargo | `proc-macro-error-attr` | `1.0.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro-error-attr/1.0.4) |
| Cargo | `proc-macro2` | `1.0.107` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/proc-macro2/1.0.107) |
| Cargo | `quick-xml` | `0.42.0` | `MIT` | [crates.io](https://crates.io/crates/quick-xml/0.42.0) |
| Cargo | `quinn` | `0.11.11` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/quinn/0.11.11) |
| Cargo | `quinn-proto` | `0.11.16` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/quinn-proto/0.11.16) |
| Cargo | `quinn-udp` | `0.5.15` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/quinn-udp/0.5.15) |
| Cargo | `quote` | `1.0.47` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/quote/1.0.47) |
| Cargo | `r-efi` | `5.3.0` | `MIT OR Apache-2.0 OR LGPL-2.1-or-later` | [crates.io](https://crates.io/crates/r-efi/5.3.0) |
| Cargo | `r-efi` | `6.0.0` | `MIT OR Apache-2.0 OR LGPL-2.1-or-later` | [crates.io](https://crates.io/crates/r-efi/6.0.0) |
| Cargo | `rand` | `0.10.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rand/0.10.2) |
| Cargo | `rand_core` | `0.10.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rand_core/0.10.1) |
| Cargo | `rand_pcg` | `0.10.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rand_pcg/0.10.2) |
| Cargo | `raw-window-handle` | `0.6.2` | `MIT OR Apache-2.0 OR Zlib` | [crates.io](https://crates.io/crates/raw-window-handle/0.6.2) |
| Cargo | `redox_syscall` | `0.5.18` | `MIT` | [crates.io](https://crates.io/crates/redox_syscall/0.5.18) |
| Cargo | `redox_users` | `0.5.3` | `MIT` | [crates.io](https://crates.io/crates/redox_users/0.5.3) |
| Cargo | `ref-cast` | `1.0.27` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ref-cast/1.0.27) |
| Cargo | `ref-cast-impl` | `1.0.27` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/ref-cast-impl/1.0.27) |
| Cargo | `regex` | `1.13.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/regex/1.13.1) |
| Cargo | `regex-automata` | `0.4.18` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/regex-automata/0.4.18) |
| Cargo | `regex-syntax` | `0.8.11` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/regex-syntax/0.8.11) |
| Cargo | `reqwest` | `0.13.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/reqwest/0.13.5) |
| Cargo | `rfd` | `0.16.0` | `MIT` | [crates.io](https://crates.io/crates/rfd/0.16.0) |
| Cargo | `ring` | `0.17.14` | `Apache-2.0 AND ISC` | [crates.io](https://crates.io/crates/ring/0.17.14) |
| Cargo | `rustc-hash` | `2.1.3` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/rustc-hash/2.1.3) |
| Cargo | `rustc_version` | `0.4.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rustc_version/0.4.1) |
| Cargo | `rustix` | `1.1.5` | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/rustix/1.1.5) |
| Cargo | `rustls` | `0.23.45` | `Apache-2.0 OR ISC OR MIT` | [crates.io](https://crates.io/crates/rustls/0.23.45) |
| Cargo | `rustls-native-certs` | `0.8.4` | `Apache-2.0 OR ISC OR MIT` | [crates.io](https://crates.io/crates/rustls-native-certs/0.8.4) |
| Cargo | `rustls-pki-types` | `1.15.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rustls-pki-types/1.15.1) |
| Cargo | `rustls-platform-verifier` | `0.7.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rustls-platform-verifier/0.7.1) |
| Cargo | `rustls-platform-verifier-android` | `0.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rustls-platform-verifier-android/0.2.0) |
| Cargo | `rustls-webpki` | `0.103.15` | `ISC` | [crates.io](https://crates.io/crates/rustls-webpki/0.103.15) |
| Cargo | `rustversion` | `1.0.23` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/rustversion/1.0.23) |
| Cargo | `same-file` | `1.0.6` | `Unlicense/MIT` | [crates.io](https://crates.io/crates/same-file/1.0.6) |
| Cargo | `schannel` | `0.1.29` | `MIT` | [crates.io](https://crates.io/crates/schannel/0.1.29) |
| Cargo | `schemars` | `0.8.22` | `MIT` | [crates.io](https://crates.io/crates/schemars/0.8.22) |
| Cargo | `schemars` | `0.9.0` | `MIT` | [crates.io](https://crates.io/crates/schemars/0.9.0) |
| Cargo | `schemars` | `1.2.2` | `MIT` | [crates.io](https://crates.io/crates/schemars/1.2.2) |
| Cargo | `schemars_derive` | `0.8.22` | `MIT` | [crates.io](https://crates.io/crates/schemars_derive/0.8.22) |
| Cargo | `scopeguard` | `1.2.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/scopeguard/1.2.0) |
| Cargo | `security-framework` | `3.7.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/security-framework/3.7.0) |
| Cargo | `security-framework-sys` | `2.17.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/security-framework-sys/2.17.0) |
| Cargo | `selectors` | `0.38.0` | `MPL-2.0` | [crates.io](https://crates.io/crates/selectors/0.38.0) |
| Cargo | `semver` | `1.0.28` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/semver/1.0.28) |
| Cargo | `serde` | `1.0.229` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde/1.0.229) |
| Cargo | `serde-untagged` | `0.1.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde-untagged/0.1.9) |
| Cargo | `serde_core` | `1.0.229` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_core/1.0.229) |
| Cargo | `serde_derive` | `1.0.229` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_derive/1.0.229) |
| Cargo | `serde_derive_internals` | `0.29.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_derive_internals/0.29.1) |
| Cargo | `serde_json` | `1.0.151` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_json/1.0.151) |
| Cargo | `serde_repr` | `0.1.21` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_repr/0.1.21) |
| Cargo | `serde_spanned` | `0.6.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_spanned/0.6.9) |
| Cargo | `serde_spanned` | `1.1.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_spanned/1.1.1) |
| Cargo | `serde_with` | `3.24.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_with/3.24.0) |
| Cargo | `serde_with_macros` | `3.24.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serde_with_macros/3.24.0) |
| Cargo | `serialize-to-javascript` | `0.1.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serialize-to-javascript/0.1.2) |
| Cargo | `serialize-to-javascript-impl` | `0.1.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/serialize-to-javascript-impl/0.1.2) |
| Cargo | `servo_arc` | `0.4.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/servo_arc/0.4.3) |
| Cargo | `sha2` | `0.10.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/sha2/0.10.9) |
| Cargo | `shared_child` | `1.1.2` | `MIT` | [crates.io](https://crates.io/crates/shared_child/1.1.2) |
| Cargo | `shlex` | `2.0.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/shlex/2.0.1) |
| Cargo | `sigchld` | `0.2.5` | `MIT` | [crates.io](https://crates.io/crates/sigchld/0.2.5) |
| Cargo | `signal-hook` | `0.4.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/signal-hook/0.4.4) |
| Cargo | `signal-hook-registry` | `1.4.8` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/signal-hook-registry/1.4.8) |
| Cargo | `simd-adler32` | `0.3.10` | `MIT` | [crates.io](https://crates.io/crates/simd-adler32/0.3.10) |
| Cargo | `simd_cesu8` | `1.2.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/simd_cesu8/1.2.0) |
| Cargo | `simdutf8` | `0.1.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/simdutf8/0.1.5) |
| Cargo | `siphasher` | `1.0.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/siphasher/1.0.4) |
| Cargo | `slab` | `0.4.12` | `MIT` | [crates.io](https://crates.io/crates/slab/0.4.12) |
| Cargo | `smallvec` | `1.16.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/smallvec/1.16.2) |
| Cargo | `socket2` | `0.6.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/socket2/0.6.5) |
| Cargo | `softbuffer` | `0.4.8` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/softbuffer/0.4.8) |
| Cargo | `soup3` | `0.5.0` | `MIT` | [crates.io](https://crates.io/crates/soup3/0.5.0) |
| Cargo | `soup3-sys` | `0.5.0` | `MIT` | [crates.io](https://crates.io/crates/soup3-sys/0.5.0) |
| Cargo | `stable_deref_trait` | `1.2.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/stable_deref_trait/1.2.1) |
| Cargo | `string_cache` | `0.9.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/string_cache/0.9.0) |
| Cargo | `string_cache_codegen` | `0.6.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/string_cache_codegen/0.6.1) |
| Cargo | `strsim` | `0.11.1` | `MIT` | [crates.io](https://crates.io/crates/strsim/0.11.1) |
| Cargo | `subtle` | `2.6.1` | `BSD-3-Clause` | [crates.io](https://crates.io/crates/subtle/2.6.1) |
| Cargo | `swift-rs` | `1.0.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/swift-rs/1.0.9) |
| Cargo | `syn` | `1.0.109` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/syn/1.0.109) |
| Cargo | `syn` | `2.0.119` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/syn/2.0.119) |
| Cargo | `syn` | `3.0.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/syn/3.0.6) |
| Cargo | `sync_wrapper` | `1.0.2` | `Apache-2.0` | [crates.io](https://crates.io/crates/sync_wrapper/1.0.2) |
| Cargo | `synstructure` | `0.14.0` | `MIT` | [crates.io](https://crates.io/crates/synstructure/0.14.0) |
| Cargo | `system-configuration` | `0.7.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/system-configuration/0.7.0) |
| Cargo | `system-configuration-sys` | `0.6.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/system-configuration-sys/0.6.0) |
| Cargo | `system-deps` | `6.2.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/system-deps/6.2.2) |
| Cargo | `tao` | `0.37.1` | `Apache-2.0` | [crates.io](https://crates.io/crates/tao/0.37.1) |
| Cargo | `tao-macros` | `0.1.4` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tao-macros/0.1.4) |
| Cargo | `tar` | `0.4.46` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tar/0.4.46) |
| Cargo | `target-lexicon` | `0.12.16` | `Apache-2.0 WITH LLVM-exception` | [crates.io](https://crates.io/crates/target-lexicon/0.12.16) |
| Cargo | `tauri` | `2.12.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri/2.12.0) |
| Cargo | `tauri-build` | `2.7.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-build/2.7.0) |
| Cargo | `tauri-codegen` | `2.7.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-codegen/2.7.0) |
| Cargo | `tauri-macros` | `2.7.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-macros/2.7.0) |
| Cargo | `tauri-plugin` | `2.7.4` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin/2.7.4) |
| Cargo | `tauri-plugin-dialog` | `2.8.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-dialog/2.8.0) |
| Cargo | `tauri-plugin-fs` | `2.6.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-fs/2.6.0) |
| Cargo | `tauri-plugin-notification` | `2.8.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-notification/2.8.1) |
| Cargo | `tauri-plugin-process` | `2.4.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-process/2.4.0) |
| Cargo | `tauri-plugin-shell` | `2.3.6` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-shell/2.3.6) |
| Cargo | `tauri-plugin-updater` | `2.13.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-plugin-updater/2.13.0) |
| Cargo | `tauri-runtime` | `2.12.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-runtime/2.12.0) |
| Cargo | `tauri-runtime-wry` | `2.12.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-runtime-wry/2.12.0) |
| Cargo | `tauri-utils` | `2.10.4` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tauri-utils/2.10.4) |
| Cargo | `tauri-winres` | `0.3.6` | `MIT` | [crates.io](https://crates.io/crates/tauri-winres/0.3.6) |
| Cargo | `tauri-winrt-notification` | `0.8.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tauri-winrt-notification/0.8.1) |
| Cargo | `tempfile` | `3.27.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tempfile/3.27.0) |
| Cargo | `tendril` | `0.5.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tendril/0.5.1) |
| Cargo | `thiserror` | `1.0.69` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/thiserror/1.0.69) |
| Cargo | `thiserror` | `2.0.21` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/thiserror/2.0.21) |
| Cargo | `thiserror-impl` | `1.0.69` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/thiserror-impl/1.0.69) |
| Cargo | `thiserror-impl` | `2.0.21` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/thiserror-impl/2.0.21) |
| Cargo | `time` | `0.3.55` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/time/0.3.55) |
| Cargo | `time-core` | `0.1.9` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/time-core/0.1.9) |
| Cargo | `time-macros` | `0.2.32` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/time-macros/0.2.32) |
| Cargo | `tinystr` | `0.8.4` | `Unicode-3.0` | [crates.io](https://crates.io/crates/tinystr/0.8.4) |
| Cargo | `tinyvec` | `1.13.3` | `Zlib OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/tinyvec/1.13.3) |
| Cargo | `tokio` | `1.53.1` | `MIT` | [crates.io](https://crates.io/crates/tokio/1.53.1) |
| Cargo | `tokio-rustls` | `0.26.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tokio-rustls/0.26.5) |
| Cargo | `tokio-util` | `0.7.19` | `MIT` | [crates.io](https://crates.io/crates/tokio-util/0.7.19) |
| Cargo | `toml` | `0.8.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml/0.8.2) |
| Cargo | `toml` | `1.1.6+spec-1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml/1.1.6+spec-1.1.0) |
| Cargo | `toml_datetime` | `0.6.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_datetime/0.6.3) |
| Cargo | `toml_datetime` | `1.1.1+spec-1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_datetime/1.1.1+spec-1.1.0) |
| Cargo | `toml_edit` | `0.19.15` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_edit/0.19.15) |
| Cargo | `toml_edit` | `0.20.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_edit/0.20.2) |
| Cargo | `toml_edit` | `0.25.15+spec-1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_edit/0.25.15+spec-1.1.0) |
| Cargo | `toml_parser` | `1.1.3+spec-1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_parser/1.1.3+spec-1.1.0) |
| Cargo | `toml_writer` | `1.1.2+spec-1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/toml_writer/1.1.2+spec-1.1.0) |
| Cargo | `tower` | `0.5.3` | `MIT` | [crates.io](https://crates.io/crates/tower/0.5.3) |
| Cargo | `tower-http` | `0.6.11` | `MIT` | [crates.io](https://crates.io/crates/tower-http/0.6.11) |
| Cargo | `tower-layer` | `0.3.3` | `MIT` | [crates.io](https://crates.io/crates/tower-layer/0.3.3) |
| Cargo | `tower-service` | `0.3.3` | `MIT` | [crates.io](https://crates.io/crates/tower-service/0.3.3) |
| Cargo | `tracing` | `0.1.44` | `MIT` | [crates.io](https://crates.io/crates/tracing/0.1.44) |
| Cargo | `tracing-attributes` | `0.1.31` | `MIT` | [crates.io](https://crates.io/crates/tracing-attributes/0.1.31) |
| Cargo | `tracing-core` | `0.1.36` | `MIT` | [crates.io](https://crates.io/crates/tracing-core/0.1.36) |
| Cargo | `tray-icon` | `0.25.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/tray-icon/0.25.1) |
| Cargo | `try-lock` | `0.2.5` | `MIT` | [crates.io](https://crates.io/crates/try-lock/0.2.5) |
| Cargo | `typeid` | `1.0.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/typeid/1.0.3) |
| Cargo | `typenum` | `1.20.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/typenum/1.20.1) |
| Cargo | `uds_windows` | `1.2.1` | `MIT` | [crates.io](https://crates.io/crates/uds_windows/1.2.1) |
| Cargo | `unicode-ident` | `1.0.26` | `(MIT OR Apache-2.0) AND Unicode-3.0` | [crates.io](https://crates.io/crates/unicode-ident/1.0.26) |
| Cargo | `unicode-segmentation` | `1.13.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/unicode-segmentation/1.13.3) |
| Cargo | `untrusted` | `0.9.0` | `ISC` | [crates.io](https://crates.io/crates/untrusted/0.9.0) |
| Cargo | `url` | `2.5.8` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/url/2.5.8) |
| Cargo | `urlpattern` | `0.6.0` | `MIT` | [crates.io](https://crates.io/crates/urlpattern/0.6.0) |
| Cargo | `utf8_iter` | `1.0.4` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/utf8_iter/1.0.4) |
| Cargo | `uuid` | `1.26.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/uuid/1.26.1) |
| Cargo | `version-compare` | `0.2.1` | `MIT` | [crates.io](https://crates.io/crates/version-compare/0.2.1) |
| Cargo | `version_check` | `0.9.5` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/version_check/0.9.5) |
| Cargo | `vswhom` | `0.1.0` | `MIT` | [crates.io](https://crates.io/crates/vswhom/0.1.0) |
| Cargo | `vswhom-sys` | `0.1.3` | `MIT` | [crates.io](https://crates.io/crates/vswhom-sys/0.1.3) |
| Cargo | `walkdir` | `2.5.0` | `Unlicense/MIT` | [crates.io](https://crates.io/crates/walkdir/2.5.0) |
| Cargo | `want` | `0.3.1` | `MIT` | [crates.io](https://crates.io/crates/want/0.3.1) |
| Cargo | `wasi` | `0.11.1+wasi-snapshot-preview1` | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/wasi/0.11.1+wasi-snapshot-preview1) |
| Cargo | `wasip2` | `1.0.4+wasi-0.2.12` | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/wasip2/1.0.4+wasi-0.2.12) |
| Cargo | `wasm-bindgen` | `0.2.129` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-bindgen/0.2.129) |
| Cargo | `wasm-bindgen-futures` | `0.4.79` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-bindgen-futures/0.4.79) |
| Cargo | `wasm-bindgen-macro` | `0.2.129` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-bindgen-macro/0.2.129) |
| Cargo | `wasm-bindgen-macro-support` | `0.2.129` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-bindgen-macro-support/0.2.129) |
| Cargo | `wasm-bindgen-shared` | `0.2.129` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-bindgen-shared/0.2.129) |
| Cargo | `wasm-streams` | `0.5.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/wasm-streams/0.5.0) |
| Cargo | `web-sys` | `0.3.106` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/web-sys/0.3.106) |
| Cargo | `web-time` | `1.1.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/web-time/1.1.0) |
| Cargo | `web_atoms` | `0.2.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/web_atoms/0.2.6) |
| Cargo | `webkit2gtk` | `2.0.2` | `MIT` | [crates.io](https://crates.io/crates/webkit2gtk/2.0.2) |
| Cargo | `webkit2gtk-sys` | `2.0.2` | `MIT` | [crates.io](https://crates.io/crates/webkit2gtk-sys/2.0.2) |
| Cargo | `webpki-root-certs` | `1.0.9` | `CDLA-Permissive-2.0` | [crates.io](https://crates.io/crates/webpki-root-certs/1.0.9) |
| Cargo | `webview2-com` | `0.39.1` | `MIT` | [crates.io](https://crates.io/crates/webview2-com/0.39.1) |
| Cargo | `webview2-com-macros` | `0.8.1` | `MIT` | [crates.io](https://crates.io/crates/webview2-com-macros/0.8.1) |
| Cargo | `webview2-com-sys` | `0.39.1` | `MIT` | [crates.io](https://crates.io/crates/webview2-com-sys/0.39.1) |
| Cargo | `winapi` | `0.3.9` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/winapi/0.3.9) |
| Cargo | `winapi-i686-pc-windows-gnu` | `0.4.0` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/winapi-i686-pc-windows-gnu/0.4.0) |
| Cargo | `winapi-util` | `0.1.11` | `Unlicense OR MIT` | [crates.io](https://crates.io/crates/winapi-util/0.1.11) |
| Cargo | `winapi-x86_64-pc-windows-gnu` | `0.4.0` | `MIT/Apache-2.0` | [crates.io](https://crates.io/crates/winapi-x86_64-pc-windows-gnu/0.4.0) |
| Cargo | `window-vibrancy` | `0.8.1` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/window-vibrancy/0.8.1) |
| Cargo | `windows` | `0.62.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows/0.62.2) |
| Cargo | `windows-collections` | `0.3.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-collections/0.3.2) |
| Cargo | `windows-core` | `0.62.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-core/0.62.2) |
| Cargo | `windows-future` | `0.3.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-future/0.3.2) |
| Cargo | `windows-implement` | `0.60.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-implement/0.60.2) |
| Cargo | `windows-interface` | `0.59.3` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-interface/0.59.3) |
| Cargo | `windows-link` | `0.2.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-link/0.2.1) |
| Cargo | `windows-numerics` | `0.3.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-numerics/0.3.1) |
| Cargo | `windows-registry` | `0.6.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-registry/0.6.1) |
| Cargo | `windows-result` | `0.4.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-result/0.4.1) |
| Cargo | `windows-strings` | `0.5.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-strings/0.5.1) |
| Cargo | `windows-sys` | `0.45.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-sys/0.45.0) |
| Cargo | `windows-sys` | `0.52.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-sys/0.52.0) |
| Cargo | `windows-sys` | `0.59.0` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-sys/0.59.0) |
| Cargo | `windows-sys` | `0.60.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-sys/0.60.2) |
| Cargo | `windows-sys` | `0.61.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-sys/0.61.2) |
| Cargo | `windows-targets` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-targets/0.42.2) |
| Cargo | `windows-targets` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-targets/0.52.6) |
| Cargo | `windows-targets` | `0.53.5` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-targets/0.53.5) |
| Cargo | `windows-threading` | `0.2.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-threading/0.2.1) |
| Cargo | `windows-version` | `0.1.7` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows-version/0.1.7) |
| Cargo | `windows_aarch64_gnullvm` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_gnullvm/0.42.2) |
| Cargo | `windows_aarch64_gnullvm` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_gnullvm/0.52.6) |
| Cargo | `windows_aarch64_gnullvm` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_gnullvm/0.53.1) |
| Cargo | `windows_aarch64_msvc` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_msvc/0.42.2) |
| Cargo | `windows_aarch64_msvc` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_msvc/0.52.6) |
| Cargo | `windows_aarch64_msvc` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_aarch64_msvc/0.53.1) |
| Cargo | `windows_i686_gnu` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_gnu/0.42.2) |
| Cargo | `windows_i686_gnu` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_gnu/0.52.6) |
| Cargo | `windows_i686_gnu` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_gnu/0.53.1) |
| Cargo | `windows_i686_gnullvm` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_gnullvm/0.52.6) |
| Cargo | `windows_i686_gnullvm` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_gnullvm/0.53.1) |
| Cargo | `windows_i686_msvc` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_msvc/0.42.2) |
| Cargo | `windows_i686_msvc` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_msvc/0.52.6) |
| Cargo | `windows_i686_msvc` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_i686_msvc/0.53.1) |
| Cargo | `windows_x86_64_gnu` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnu/0.42.2) |
| Cargo | `windows_x86_64_gnu` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnu/0.52.6) |
| Cargo | `windows_x86_64_gnu` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnu/0.53.1) |
| Cargo | `windows_x86_64_gnullvm` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnullvm/0.42.2) |
| Cargo | `windows_x86_64_gnullvm` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnullvm/0.52.6) |
| Cargo | `windows_x86_64_gnullvm` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_gnullvm/0.53.1) |
| Cargo | `windows_x86_64_msvc` | `0.42.2` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_msvc/0.42.2) |
| Cargo | `windows_x86_64_msvc` | `0.52.6` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_msvc/0.52.6) |
| Cargo | `windows_x86_64_msvc` | `0.53.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/windows_x86_64_msvc/0.53.1) |
| Cargo | `winnow` | `0.5.40` | `MIT` | [crates.io](https://crates.io/crates/winnow/0.5.40) |
| Cargo | `winnow` | `1.0.4` | `MIT` | [crates.io](https://crates.io/crates/winnow/1.0.4) |
| Cargo | `winreg` | `0.55.0` | `MIT` | [crates.io](https://crates.io/crates/winreg/0.55.0) |
| Cargo | `wit-bindgen` | `0.57.1` | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/wit-bindgen/0.57.1) |
| Cargo | `writeable` | `0.6.4` | `Unicode-3.0` | [crates.io](https://crates.io/crates/writeable/0.6.4) |
| Cargo | `wry` | `0.57.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/wry/0.57.0) |
| Cargo | `x11` | `2.21.0` | `MIT` | [crates.io](https://crates.io/crates/x11/2.21.0) |
| Cargo | `x11-dl` | `2.21.0` | `MIT` | [crates.io](https://crates.io/crates/x11-dl/2.21.0) |
| Cargo | `xattr` | `1.6.1` | `MIT OR Apache-2.0` | [crates.io](https://crates.io/crates/xattr/1.6.1) |
| Cargo | `yoke` | `0.8.3` | `Unicode-3.0` | [crates.io](https://crates.io/crates/yoke/0.8.3) |
| Cargo | `yoke-derive` | `0.8.3` | `Unicode-3.0` | [crates.io](https://crates.io/crates/yoke-derive/0.8.3) |
| Cargo | `zbus` | `5.19.0` | `MIT` | [crates.io](https://crates.io/crates/zbus/5.19.0) |
| Cargo | `zbus` | `6.3.0` | `MIT` | [crates.io](https://crates.io/crates/zbus/6.3.0) |
| Cargo | `zbus_macros` | `5.19.0` | `MIT` | [crates.io](https://crates.io/crates/zbus_macros/5.19.0) |
| Cargo | `zbus_macros` | `6.3.0` | `MIT` | [crates.io](https://crates.io/crates/zbus_macros/6.3.0) |
| Cargo | `zbus_names` | `4.3.5` | `MIT` | [crates.io](https://crates.io/crates/zbus_names/4.3.5) |
| Cargo | `zbus_utils` | `6.1.0` | `MIT` | [crates.io](https://crates.io/crates/zbus_utils/6.1.0) |
| Cargo | `zcheapstr` | `1.2.0` | `MIT` | [crates.io](https://crates.io/crates/zcheapstr/1.2.0) |
| Cargo | `zerofrom` | `0.1.8` | `Unicode-3.0` | [crates.io](https://crates.io/crates/zerofrom/0.1.8) |
| Cargo | `zerofrom-derive` | `0.1.8` | `Unicode-3.0` | [crates.io](https://crates.io/crates/zerofrom-derive/0.1.8) |
| Cargo | `zeroize` | `1.9.0` | `Apache-2.0 OR MIT` | [crates.io](https://crates.io/crates/zeroize/1.9.0) |
| Cargo | `zerotrie` | `0.2.5` | `Unicode-3.0` | [crates.io](https://crates.io/crates/zerotrie/0.2.5) |
| Cargo | `zerovec` | `0.11.8` | `Unicode-3.0` | [crates.io](https://crates.io/crates/zerovec/0.11.8) |
| Cargo | `zerovec-derive` | `0.11.6` | `Unicode-3.0` | [crates.io](https://crates.io/crates/zerovec-derive/0.11.6) |
| Cargo | `zip` | `4.6.1` | `MIT` | [crates.io](https://crates.io/crates/zip/4.6.1) |
| Cargo | `zlib-rs` | `0.6.8` | `Zlib` | [crates.io](https://crates.io/crates/zlib-rs/0.6.8) |
| Cargo | `zmij` | `1.0.23` | `MIT` | [crates.io](https://crates.io/crates/zmij/1.0.23) |
| Cargo | `zruntime` | `0.2.3` | `MIT` | [crates.io](https://crates.io/crates/zruntime/0.2.3) |
| Cargo | `zvariant` | `5.15.1` | `MIT` | [crates.io](https://crates.io/crates/zvariant/5.15.1) |
| Cargo | `zvariant_derive` | `5.15.1` | `MIT` | [crates.io](https://crates.io/crates/zvariant_derive/5.15.1) |
| Cargo | `zvariant_utils` | `4.2.0` | `MIT` | [crates.io](https://crates.io/crates/zvariant_utils/4.2.0) |

## Other assets and bundled runtimes

- `data/ton-english.txt`: the [BIP-39 English word list](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) by Marek Palatinus, Pavol Rusnak, Aaron Voisine, and Sean Bowe, MIT license; see [NOTICE.md](../../NOTICE.md).
- `desktop/src-tauri/icons/`, `desktop/public/favicon.svg`, `desktop/src/assets/icons/gramix-app.svg`: the Gramix logo and icons drawn for this project by lovlydev; see [TRADEMARKS.md](../../TRADEMARKS.md).

## Unresolved records

- npm `@tonstudio/parser-runtime@0.0.1`
