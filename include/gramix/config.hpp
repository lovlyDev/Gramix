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

#include <string>

namespace gramix {

struct AppConfig {
    WalletVersion wallet = WalletVersion::v5r1;
    MnemonicScheme mnemonic_scheme = MnemonicScheme::multichain12;
    SearchOptions search;
};

AppConfig load_config(const std::string& path);

}  // namespace gramix
