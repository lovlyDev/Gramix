/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#pragma once

#include <filesystem>

namespace vantix {
std::filesystem::path resource_path(const std::filesystem::path& relative);
}
