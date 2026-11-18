/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

#pragma once

#include <filesystem>

namespace gramix {
std::filesystem::path resource_path(const std::filesystem::path& relative);
// Reads GRAMIX_<name>; falls back to the pre-rename VANTIX_<name> for existing scripts.
const char* environment_value(const char* name);
}
