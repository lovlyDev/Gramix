/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#include "vantix/wallet_generator.hpp"
#include "vantix/compute.hpp"

#include <openssl/crypto.h>

#include <stdexcept>

namespace vantix {

GeneratedWalletPublic generate_wallet_and_save(
    WalletVersion version, MnemonicScheme scheme,
    const std::filesystem::path& output_directory) {
    if (output_directory.empty())
        throw std::invalid_argument("wallet output directory is required");
    auto phrase = scheme == MnemonicScheme::multichain12
        ? generate_multichain_mnemonic() : generate_ton_mnemonic();
    WalletCandidate candidate;
    try {
        candidate = candidate_from_mnemonic(phrase, version, scheme);
        OPENSSL_cleanse(phrase.data(), phrase.size());
        phrase.clear();
        GeneratedWalletPublic result;
        result.public_key = candidate.public_key;
        result.address_hash = candidate.address_hash;
        result.address = candidate.address;
        result.encrypted_file = save_wallet_candidate(candidate, output_directory);
        OPENSSL_cleanse(candidate.mnemonic.data(), candidate.mnemonic.size());
        return result;
    } catch (...) {
        OPENSSL_cleanse(phrase.data(), phrase.size());
        OPENSSL_cleanse(candidate.mnemonic.data(), candidate.mnemonic.size());
        throw;
    }
}

}  // namespace vantix
