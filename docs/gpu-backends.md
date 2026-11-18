# Gramix Compute Engines for AMD and NVIDIA

English | [Русский](gpu-backends.ru.md)

I develop three independent compute paths: CPU, portable Vulkan Compute, and vendor-specific CUDA/HIP. Releases ship the verified CPU and Vulkan engines. CUDA/HIP sources exist, but their modules are not included in the installers and have not been validated on vendor hardware.

## Common Rules

- The CPU is the reference for the recovery phrase, PBKDF2-HMAC-SHA512, SLIP-0010, Ed25519, wallet StateInit, and address encoding.
- A GPU engine may search only after it reproduces the CPU reference vectors on that specific device.
- Speed is measured as **complete GRAM addresses** generated and checked, not as a single PBKDF2 step.
- One physical GPU is counted once, even if both Vulkan and CUDA/HIP detect it. Running two APIs on it at once needs a separate measurement.
- Every device uses independent random candidates. Buffers are allocated up front; batches run asynchronously with a memory limit.
- A found wallet is saved before the result is announced, and every GPU match is re-checked on the CPU.
- The tuning profile depends on the GPU, driver, OS, engine and shader version, wallet type, and phrase scheme. Any change triggers a new calibration.
- A GPU failure falls back to Vulkan on the same device, then to the CPU. A missing SDK from another vendor never blocks the build or launch.

## AMD

### Compatibility

Vulkan Compute is the main path for compatible Radeon cards. HIP/ROCm is enabled only for a GPU, OS, driver, and SDK combination listed in AMD's official matrix, and only after it passes the test computations. Detecting the HIP runtime does not by itself mean search support.

On my Windows machine the RX 6650 XT is not supported by HIP SDK 7.2.0 for Windows, so Vulkan or the CPU is used there. On Linux, compatibility depends on the installed ROCm version and distribution, not just on the AMD device ID.

### Optimization Plan

1. Compare 32-bit and 64-bit SHA-512 on RDNA2 by full search speed. The experimental 32-bit shader still takes too long to compile in the driver and is not used in production.
2. Tune batch size, active threads, registers, and wave size per GPU architecture.
3. On supported ROCm/HIP, build a separate HIP module with batched PBKDF2-HMAC-SHA512 and SLIP-0010. It must pass the same reference vectors and measurement as Vulkan.
4. Overlap candidate upload, computation, and result readback with asynchronous queues and double buffering.
5. Move Ed25519, StateInit, and SHA-256 to the GPU only after a proven full-search speedup; keep the CPU match check.

On the RX 6650 XT, caching constant HMAC states locally sped up a short Vulkan run from about 302 to 631 addresses/s. The CPU of the same PC reached about 6,700 addresses/s, so Auto should prefer the CPU there. These numbers do not carry over to other GPUs or drivers.

### AMD Validation

- RX 6650 XT on Windows: Vulkan passes the test vector; HIP is not offered as a verified engine; Auto chooses by full search speed.
- A supported AMD GPU: HIP and Vulkan pass the vectors and a short search, can be selected manually, and Auto picks the fastest verified mode.

## NVIDIA

1. Vulkan stays the portable mode. CUDA is an independent optional module built with the CUDA Toolkit and loaded when a driver is available.
2. The CUDA kernel runs batched PBKDF2-HMAC-SHA512 and SLIP-0010. Launch configuration, registers, buffers, and streams are tuned per architecture. If NVRTC is used, its components must ship with the app or be declared as a dependency.
3. CUDA and Vulkan are compared on the same card with the same inputs by the speed of finished GRAM addresses. Each mode first passes the CPU vectors and the repeated match check.
4. On a CUDA failure the search falls back to Vulkan, then to the CPU; a saved wallet is never lost.

### NVIDIA Validation

- CUDA and Vulkan build independently and pass checks on a real NVIDIA GPU.
- A missing CUDA installation does not prevent Vulkan or CPU from running.
- Manual selection offers only verified engines; Auto picks the fastest by full search.

## Status

Windows/Linux packaging, safe wallet storage, and CPU/Vulkan search are done. CUDA/HIP, multiple physical GPUs, and moving the whole cryptographic pipeline to the GPU remain unverified. A Windows installer alone does not prove these items.

## Sources

- [HIP SDK compatibility on Windows](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/system-requirements.html)
- [HIP runtime compilation](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_rtc.html)
- [CUDA runtime compilation](https://docs.nvidia.com/cuda/nvrtc/)
- [CUDA driver and runtime](https://docs.nvidia.com/cuda/cuda-runtime-api/driver-vs-runtime-api.html)
