/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#pragma once

#include "vantix/compute.hpp"

namespace vantix {

// Vendor modules are loaded only when their runtime is present. Missing modules
// leave Vulkan and CPU usable without a CUDA or HIP installation.
std::vector<std::shared_ptr<IComputeBackend>> load_vendor_backends(
    ComputeApi api, WalletVersion version, MnemonicScheme scheme);

}  // namespace vantix
