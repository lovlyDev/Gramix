/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

#include "gramix/address_inspector.hpp"

#include <openssl/evp.h>

#include <algorithm>
#include <array>
#include <charconv>
#include <cstdint>
#include <span>
#include <stdexcept>

namespace gramix {
namespace {

int hex_digit(char value) {
    if (value >= '0' && value <= '9') return value - '0';
    if (value >= 'a' && value <= 'f') return value - 'a' + 10;
    if (value >= 'A' && value <= 'F') return value - 'A' + 10;
    return -1;
}

std::uint16_t crc16(std::span<const std::uint8_t> bytes) {
    std::uint16_t crc = 0;
    for (const auto byte : bytes) {
        crc ^= static_cast<std::uint16_t>(byte) << 8;
        for (int bit = 0; bit < 8; ++bit)
            crc = (crc & 0x8000) ? static_cast<std::uint16_t>((crc << 1) ^ 0x1021)
                                 : static_cast<std::uint16_t>(crc << 1);
    }
    return crc;
}

std::string hash_hex(const Bytes32& hash) {
    constexpr char digits[] = "0123456789abcdef";
    std::string result;
    result.reserve(64);
    for (const auto byte : hash) {
        result.push_back(digits[byte >> 4]);
        result.push_back(digits[byte & 15]);
    }
    return result;
}

std::string encode_friendly(int workchain, const Bytes32& hash,
                            bool bounceable, bool testnet) {
    std::array<std::uint8_t, 36> bytes{};
    bytes[0] = static_cast<std::uint8_t>((bounceable ? 0x11 : 0x51) |
                                         (testnet ? 0x80 : 0));
    bytes[1] = static_cast<std::uint8_t>(workchain);
    std::copy(hash.begin(), hash.end(), bytes.begin() + 2);
    const auto checksum = crc16(std::span<const std::uint8_t>(bytes.data(), 34));
    bytes[34] = static_cast<std::uint8_t>(checksum >> 8);
    bytes[35] = static_cast<std::uint8_t>(checksum);
    std::array<unsigned char, 49> encoded{};
    if (EVP_EncodeBlock(encoded.data(), bytes.data(), 36) != 48)
        throw std::runtime_error("TON address encoding failed");
    std::string result(reinterpret_cast<const char*>(encoded.data()), 48);
    std::replace(result.begin(), result.end(), '+', '-');
    std::replace(result.begin(), result.end(), '/', '_');
    return result;
}

void parse_raw(std::string_view input, InspectedAddress& result) {
    const auto colon = input.find(':');
    if (colon == std::string_view::npos || input.find(':', colon + 1) != std::string_view::npos)
        throw std::invalid_argument("raw address must contain one colon");
    const auto chain_text = input.substr(0, colon);
    const auto hash_text = input.substr(colon + 1);
    if (chain_text.empty() || hash_text.size() != 64)
        throw std::invalid_argument("raw address needs a workchain and 64 hex digits");
    int chain = 0;
    const auto [end, error] = std::from_chars(chain_text.data(),
                                              chain_text.data() + chain_text.size(), chain);
    if (error != std::errc{} || end != chain_text.data() + chain_text.size() ||
        chain < -128 || chain > 127)
        throw std::invalid_argument("workchain must be a signed 8-bit integer");
    result.workchain = chain;
    for (std::size_t index = 0; index < result.hash.size(); ++index) {
        const int high = hex_digit(hash_text[index * 2]);
        const int low = hex_digit(hash_text[index * 2 + 1]);
        if (high < 0 || low < 0)
            throw std::invalid_argument("raw address contains a non-hex digit");
        result.hash[index] = static_cast<std::uint8_t>((high << 4) | low);
    }
}

void parse_friendly(std::string_view input, InspectedAddress& result) {
    if (input.size() != 48)
        throw std::invalid_argument("friendly address must have 48 characters");
    std::array<unsigned char, 49> encoded{};
    for (std::size_t index = 0; index < input.size(); ++index) {
        const char ch = input[index];
        const bool allowed = (ch >= 'A' && ch <= 'Z') ||
                             (ch >= 'a' && ch <= 'z') ||
                             (ch >= '0' && ch <= '9') ||
                             ch == '+' || ch == '/' || ch == '-' || ch == '_';
        if (!allowed) throw std::invalid_argument("invalid friendly address alphabet");
        encoded[index] = static_cast<unsigned char>(ch == '-' ? '+' : ch == '_' ? '/' : ch);
    }
    std::array<unsigned char, 37> decoded{};
    if (EVP_DecodeBlock(decoded.data(), encoded.data(), 48) != 36)
        throw std::invalid_argument("invalid friendly address encoding");
    const auto checksum = crc16(std::span<const std::uint8_t>(decoded.data(), 34));
    if (decoded[34] != static_cast<std::uint8_t>(checksum >> 8) ||
        decoded[35] != static_cast<std::uint8_t>(checksum))
        throw std::invalid_argument("invalid TON address checksum");
    const auto tag = decoded[0] & 0x7f;
    if (tag != 0x11 && tag != 0x51)
        throw std::invalid_argument("unknown TON address tag");
    result.input_was_friendly = true;
    result.input_bounceable = tag == 0x11;
    result.input_testnet = (decoded[0] & 0x80) != 0;
    result.workchain = static_cast<std::int8_t>(decoded[1]);
    std::copy_n(decoded.begin() + 2, 32, result.hash.begin());
}

}  // namespace

InspectedAddress inspect_address(std::string_view input) {
    InspectedAddress result;
    if (input.find(':') != std::string_view::npos)
        parse_raw(input, result);
    else
        parse_friendly(input, result);
    result.raw = std::to_string(result.workchain) + ':' + hash_hex(result.hash);
    result.bounceable = encode_friendly(result.workchain, result.hash, true,
                                       result.input_testnet);
    result.non_bounceable = encode_friendly(result.workchain, result.hash, false,
                                           result.input_testnet);
    return result;
}

}  // namespace gramix
