/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

#pragma once

#include "gramix/ton.hpp"

#include <filesystem>

namespace gramix {

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

}  // namespace gramix
