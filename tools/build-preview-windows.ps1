# Copyright (C) 2026 [COPYRIGHT HOLDER].
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of VANTIX.
#
# VANTIX is dual-licensed under the GNU Affero General
# Public License v3.0 and a separate commercial license.
#
# See LICENSE and LICENSING.md for details.

param([switch]$SkipBundle, [string]$PreviewVersion = '0.2.0-dev.5')

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$desktop = Join-Path $root 'desktop'
$tauri = Join-Path $desktop 'src-tauri'
$preview = Join-Path $root 'build/preview-windows'
$cmake = Join-Path $root '.tools/vcpkg/downloads/tools/cmake-4.4.3-windows/cmake-4.4.3-windows-x86_64/bin/cmake.exe'
$ctest = Join-Path $root '.tools/vcpkg/downloads/tools/cmake-4.4.3-windows/cmake-4.4.3-windows-x86_64/bin/ctest.exe'
$native = Join-Path $root 'build/release'

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command exited with code $LASTEXITCODE" }
}

function Initialize-MsvcLibraries {
    $vswhere = "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe"
    if (-not (Test-Path -LiteralPath $vswhere)) { throw 'Visual Studio Build Tools are missing' }
    $installation = & $vswhere -latest -products '*' `
        -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($LASTEXITCODE -ne 0 -or -not $installation) { throw 'MSVC installation not found' }
    $msvc = Get-ChildItem (Join-Path $installation 'VC/Tools/MSVC') -Directory |
        Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
    $sdkRoot = "${env:ProgramFiles(x86)}/Windows Kits/10"
    $sdkVersion = Get-ChildItem (Join-Path $sdkRoot 'Lib') -Directory |
        Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty Name
    if (-not $msvc -or -not $sdkVersion) { throw 'MSVC or Windows SDK libraries are missing' }
    $env:LIB = "$(Join-Path $msvc 'lib/x64');$(Join-Path $sdkRoot "Lib/$sdkVersion/um/x64");$(Join-Path $sdkRoot "Lib/$sdkVersion/ucrt/x64")"
    $env:INCLUDE = "$(Join-Path $msvc 'include');$(Join-Path $sdkRoot "Include/$sdkVersion/ucrt");$(Join-Path $sdkRoot "Include/$sdkVersion/shared");$(Join-Path $sdkRoot "Include/$sdkVersion/um");$(Join-Path $sdkRoot "Include/$sdkVersion/winrt")"
}

Initialize-MsvcLibraries

if (-not (Test-Path -LiteralPath $cmake)) { throw 'Local CMake is missing' }
if (-not (Test-Path -LiteralPath (Join-Path $native 'CMakeCache.txt'))) {
    throw 'Configure build/release with the static vcpkg triplet first'
}
New-Item -ItemType Directory -Force -Path $preview | Out-Null
Invoke-Checked $cmake @('--build', $native, '--config', 'Release', '--parallel', '4')
Invoke-Checked $ctest @('--test-dir', $native, '-C', 'Release', '--output-on-failure')
$exe = Join-Path $native 'Release/vantix.exe'
Invoke-Checked $exe @('--self-test', '--backend', 'cpu')

$target = (& rustc --print host-tuple).Trim()
if ($LASTEXITCODE -ne 0 -or $target -ne 'x86_64-pc-windows-msvc') {
    throw 'Only Windows x64 MSVC is supported by this preview script'
}
$sidecar = Join-Path $tauri "binaries/vantix-$target.exe"
New-Item -ItemType Directory -Force -Path (Split-Path $sidecar) | Out-Null
Copy-Item -LiteralPath $exe -Destination $sidecar -Force

$nodeVersion = (& node --version).Trim()
if ($LASTEXITCODE -ne 0 -or $nodeVersion -ne 'v24.18.0') {
    throw 'Node.js 24.18.0 is required for the bundled runtime and license'
}
$nodePath = Join-Path $desktop 'runtime/bin/node.exe'
New-Item -ItemType Directory -Force -Path (Split-Path $nodePath) | Out-Null
Copy-Item -LiteralPath (Get-Command node).Source -Destination $nodePath -Force

@{
    productName = 'VANTIX Preview'
    identifier = 'app.vantix.desktop.preview'
    version = $PreviewVersion
    bundle = @{
        createUpdaterArtifacts = $false
        targets = @('nsis')
        resources = @{
            '../../data/ton-english.txt' = 'data/ton-english.txt'
            '../../gpu/vulkan/derive.spv' = 'gpu/vulkan/derive.spv'
            '../runtime/bundle/sandbox-scenario.cjs' = 'runtime/sandbox-scenario.cjs'
            '../runtime/bundle/tolk-build.cjs' = 'runtime/tolk-build.cjs'
            '../runtime/bin/node.exe' = 'runtime/node.exe'
            '../../docs/licenses/node-24.18.0.LICENSE' = 'licenses/node.LICENSE'
            '../../docs/licenses/ton-sandbox.LICENSE' = 'licenses/ton-sandbox.LICENSE'
            '../../docs/licenses/ton-tolk-js.LICENSE' = 'licenses/ton-tolk-js.LICENSE'
            '../../docs/licenses/ton-core.LICENSE' = 'licenses/ton-core.LICENSE'
            '../../docs/licenses/buffer.LICENSE' = 'licenses/buffer.LICENSE'
            '../../docs/licenses/Inter-Fontsource.LICENSE' = 'licenses/Inter-Fontsource.LICENSE'
            '../../docs/licenses/JetBrainsMono-Fontsource.LICENSE' = 'licenses/JetBrainsMono-Fontsource.LICENSE'
            '../../docs/licenses/qrcode.react.LICENSE' = 'licenses/qrcode.react.LICENSE'
            '../../docs/licenses/qrcodegen.MIT.LICENSE' = 'licenses/qrcodegen.MIT.LICENSE'
            '../../docs/licenses/lucide-react.LICENSE' = 'licenses/lucide-react.LICENSE'
        }
    }
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $preview 'tauri.preview.json') -Encoding utf8

Push-Location $desktop
try {
    Invoke-Checked 'npm' @('test')
    if (-not $SkipBundle) {
        Invoke-Checked 'npm' @('run', 'tauri', '--', 'build', '--config',
            (Join-Path $preview 'tauri.preview.json'))
    }
} finally { Pop-Location }

if (-not $SkipBundle) {
    $installer = Join-Path $tauri "target/release/bundle/nsis/VANTIX Preview_${PreviewVersion}_x64-setup.exe"
    if (-not (Test-Path -LiteralPath $installer)) { throw 'Preview NSIS installer is missing' }
    Get-FileHash -LiteralPath $installer -Algorithm SHA256 |
        Select-Object Path, Hash | Format-List
}
