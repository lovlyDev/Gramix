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

#include <string>

namespace vantix {

struct AppConfig {
    WalletVersion wallet = WalletVersion::v5r1;
    MnemonicScheme mnemonic_scheme = MnemonicScheme::multichain12;
    SearchOptions search;
};

AppConfig load_config(const std::string& path);

}  // namespace vantix
