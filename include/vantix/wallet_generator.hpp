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

#include "vantix/ton.hpp"

#include <filesystem>

namespace vantix {

struct GeneratedWalletPublic {
    Bytes32 public_key{};
    Bytes32 address_hash{};
    std::string address;
    std::filesystem::path encrypted_file;
};

// Generates a new local wallet and saves its recovery phrase only in the
// platform-protected result format. The return value contains public data only.
GeneratedWalletPublic generate_wallet_and_save(
    WalletVersion version, MnemonicScheme scheme,
    const std::filesystem::path& output_directory);

}  // namespace vantix
