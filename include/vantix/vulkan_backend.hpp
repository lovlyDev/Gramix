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

class VulkanBackend final : public IComputeBackend {
public:
    static std::vector<std::shared_ptr<VulkanBackend>> create_all(
        WalletVersion version, MnemonicScheme scheme);
    ~VulkanBackend() override;
    BackendInfo info() const override;
    bool self_test() override;
    std::uint64_t run_batch(std::uint32_t size, const SearchPattern& pattern,
        const std::function<void(WalletCandidate&&)>& on_match) override;
private:
    struct Impl;
    explicit VulkanBackend(std::unique_ptr<Impl> impl);
    std::unique_ptr<Impl> impl_;
};

} // namespace vantix
