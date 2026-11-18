/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#pragma once

#include "gramix/compute.hpp"

namespace gramix {
std::vector<IComputeBackend*> load_tuning_profile(
    const BackendRegistry& registry, const std::vector<DeviceInfo>& devices,
    WalletVersion wallet, MnemonicScheme scheme);
void save_tuning_profile(
    const BackendRegistry& registry,
    const std::vector<IComputeBackend*>& backends,
    const std::vector<DeviceInfo>& devices,
    WalletVersion wallet, MnemonicScheme scheme);
}
