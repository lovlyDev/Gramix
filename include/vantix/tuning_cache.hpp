/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

#pragma once

#include "vantix/compute.hpp"

namespace vantix {
std::vector<IComputeBackend*> load_tuning_profile(
    const BackendRegistry& registry, const std::vector<DeviceInfo>& devices,
    WalletVersion wallet, MnemonicScheme scheme);
void save_tuning_profile(
    const BackendRegistry& registry,
    const std::vector<IComputeBackend*>& backends,
    const std::vector<DeviceInfo>& devices,
    WalletVersion wallet, MnemonicScheme scheme);
}
