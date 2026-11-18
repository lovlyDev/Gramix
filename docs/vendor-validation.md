# Automated CUDA and HIP Validation

English | [Русский](vendor-validation.ru.md)

On Windows, run one command from the project root:

```powershell
pwsh -File tools/verify-vendor.ps1
```

With only Windows PowerShell installed, use `powershell -File tools/verify-vendor.ps1`. The script detects the CUDA and HIP compilers, reads the AMD architecture from `hipInfo`, builds the matching modules, detects the GPUs, and checks every available CUDA/HIP backend against the reference phrase and a short search. No card model, `gfx` target, or CUDA architecture needs to be entered. The report is written to `build/vendor-validation/vendor-report.txt`; send that file, plus the build output if the build stopped before the report.

On Linux, run `bash tools/verify-vendor.sh`. It also picks the available modules and devices and writes the report to `build/vendor-validation/vendor-report.txt`.

You need a compatible driver, the vendor SDK, a C++ toolchain, and vcpkg. CUDA and HIP are independent: NVIDIA validation does not need the HIP SDK, and AMD validation does not need the CUDA Toolkit. If the SDK or card is incompatible, the report shows `UNAVAILABLE` and the app keeps working through Vulkan or the CPU. Check AMD support in the [HIP SDK matrix](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/system-requirements.html); the RX 6650 XT on the main Gramix machine is not in the HIP SDK 7.2.0 matrix for Windows.

The Windows HIP SDK does not support the CMake HIP language, so the project calls `hipcc` for a separate DLL. On Linux the HIP build uses the CMake HIP language. After validation, compare only the speed of **complete verified GRAM address generation** printed by `--benchmark`.

CUDA/HIP are implemented in source but not confirmed on suitable hardware and not included in the installers. I will add them to a release after a successful build, reference vectors, a short search, and wallet saving on a supported card.
