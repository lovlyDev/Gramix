/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#pragma once

#include "vantix/ton.hpp"

#include <string>
#include <string_view>

namespace vantix {

// Offline representation of a TON address. Network account state is not inferred.
struct InspectedAddress {
    int workchain = 0;
    Bytes32 hash{};
    bool input_was_friendly = false;
    bool input_bounceable = false;
    bool input_testnet = false;
    std::string raw;
    std::string bounceable;
    std::string non_bounceable;
};

// Accepts strict raw (signed int8 workchain:64 hex digits) or 48-character
// standard/URL-safe friendly addresses. Throws std::invalid_argument on errors.
InspectedAddress inspect_address(std::string_view input);

}  // namespace vantix
