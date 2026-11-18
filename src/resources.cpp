/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

#include "gramix/resources.hpp"

#include <cstdlib>
#include <string>

#include <stdexcept>
#include <cstdlib>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace gramix {
const char* environment_value(const char* name) {
    const std::string suffix(name);
    if (const auto* value = std::getenv(("GRAMIX_" + suffix).c_str())) return value;
    return std::getenv(("VANTIX_" + suffix).c_str());
}

std::filesystem::path resource_path(const std::filesystem::path& relative) {
    std::filesystem::path executable;
#ifdef _WIN32
    std::wstring buffer(32768, L'\0');
    const auto count = GetModuleFileNameW(nullptr, buffer.data(),
                                          static_cast<DWORD>(buffer.size()));
    if (count == 0 || count >= buffer.size())
        throw std::runtime_error("Cannot locate Gramix executable");
    buffer.resize(count);
    executable = std::filesystem::path(buffer);
#else
    executable = std::filesystem::read_symlink("/proc/self/exe");
#endif
    const auto installed = executable.parent_path() / relative;
    if (std::filesystem::is_regular_file(installed)) return installed;
    if (const auto* bundle = environment_value("RESOURCE_DIR")) {
        const auto bundled = std::filesystem::path(bundle) / relative;
        if (std::filesystem::is_regular_file(bundled)) return bundled;
    }
#ifdef GRAMIX_SOURCE_RESOURCE_ROOT
    const auto development = std::filesystem::path(GRAMIX_SOURCE_RESOURCE_ROOT) / relative;
    if (std::filesystem::is_regular_file(development)) return development;
#endif
    throw std::runtime_error("Gramix resource is missing: " + relative.string());
}
}
