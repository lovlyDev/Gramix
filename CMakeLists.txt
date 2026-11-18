# Copyright (C) 2026 lovlydev.
# SPDX-License-Identifier: AGPL-3.0-only
#
# This file is part of Gramix.
#
# See LICENSE and LICENSING.md for details.

cmake_minimum_required(VERSION 3.24)
project(Gramix VERSION 0.2.0 LANGUAGES CXX)

include(CheckLanguage)
check_language(CUDA)
option(GRAMIX_ENABLE_CUDA "Build the optional NVIDIA CUDA backend module"
    ${CMAKE_CUDA_COMPILER})
if(WIN32)
    find_program(GRAMIX_HIPCC NAMES hipcc.exe hipcc HINTS "$ENV{HIP_PATH}/bin")
    option(GRAMIX_ENABLE_HIP "Build the optional AMD HIP backend module"
        ${GRAMIX_HIPCC})
else()
    check_language(HIP)
    option(GRAMIX_ENABLE_HIP "Build the optional AMD HIP backend module"
        ${CMAKE_HIP_COMPILER})
endif()

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
if(MSVC AND VCPKG_TARGET_TRIPLET MATCHES "-static$")
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

find_package(OpenSSL 3 REQUIRED)
find_package(CLI11 CONFIG REQUIRED)
find_package(tomlplusplus CONFIG REQUIRED)
find_package(volk CONFIG REQUIRED)
find_path(VULKAN_INCLUDE_DIR vulkan/vulkan.h REQUIRED)

add_library(gramix_core
    src/ton.cpp
    src/address_inspector.cpp
    src/wallet_generator.cpp
    src/cpu_backend.cpp
    src/device_manager.cpp
    src/runtime.cpp
    src/config.cpp
    src/vulkan_backend.cpp
    src/resources.cpp
    src/tuning_cache.cpp
    src/vendor_backend.cpp
)
set_target_properties(gramix_core PROPERTIES POSITION_INDEPENDENT_CODE ON)
target_include_directories(gramix_core PUBLIC include PRIVATE ${VULKAN_INCLUDE_DIR})
target_compile_definitions(gramix_core PRIVATE GRAMIX_SOURCE_RESOURCE_ROOT="${CMAKE_CURRENT_SOURCE_DIR}")
target_link_libraries(gramix_core PRIVATE OpenSSL::Crypto tomlplusplus::tomlplusplus volk::volk ${CMAKE_DL_LIBS})
if(WIN32)
    target_compile_definitions(gramix_core PRIVATE NOMINMAX WIN32_LEAN_AND_MEAN)
    target_link_libraries(gramix_core PRIVATE Crypt32)
endif()

add_executable(gramix src/main.cpp)
target_link_libraries(gramix PRIVATE gramix_core CLI11::CLI11)

if(GRAMIX_ENABLE_CUDA)
    enable_language(CUDA)
    find_package(CUDAToolkit REQUIRED)
    add_library(gramix_cuda MODULE gpu/vendor/cuda_backend.cu)
    set_target_properties(gramix_cuda PROPERTIES CUDA_STANDARD 20
        CUDA_STANDARD_REQUIRED ON OUTPUT_NAME gramix_cuda)
    target_link_libraries(gramix_cuda PRIVATE CUDA::cudart_static CUDA::cuda_driver)
endif()

if(GRAMIX_ENABLE_HIP)
    if(WIN32)
        # AMD's Windows HIP SDK does not support CMake's HIP language.
        # Compile only the independent C ABI module with AMD's hipcc driver.
        find_program(GRAMIX_HIPINFO NAMES hipInfo.exe hipInfo
            HINTS "$ENV{HIP_PATH}/bin")
        set(GRAMIX_HIP_ARCH_FLAGS)
        if(GRAMIX_HIPINFO)
            execute_process(COMMAND "${GRAMIX_HIPINFO}"
                OUTPUT_VARIABLE GRAMIX_HIPINFO_OUTPUT ERROR_QUIET)
            string(REGEX MATCHALL "gcnArchName:[ \t]*gfx[0-9A-Za-z]+"
                GRAMIX_HIP_ARCH_LINES "${GRAMIX_HIPINFO_OUTPUT}")
            foreach(GRAMIX_HIP_ARCH_LINE IN LISTS GRAMIX_HIP_ARCH_LINES)
                string(REGEX MATCH "gfx[0-9A-Za-z]+" GRAMIX_HIP_ARCH
                    "${GRAMIX_HIP_ARCH_LINE}")
                list(APPEND GRAMIX_HIP_ARCH_FLAGS "--offload-arch=${GRAMIX_HIP_ARCH}")
            endforeach()
            list(REMOVE_DUPLICATES GRAMIX_HIP_ARCH_FLAGS)
        endif()
        if(GRAMIX_HIP_ARCH_FLAGS)
            add_custom_target(gramix_hip ALL
                COMMAND "${GRAMIX_HIPCC}" -x hip -std=c++20 -O3
                    ${GRAMIX_HIP_ARCH_FLAGS} -shared
                    "${CMAKE_CURRENT_SOURCE_DIR}/gpu/vendor/hip_backend.hip"
                    -o "$<TARGET_FILE_DIR:gramix>/gramix_hip.dll"
                DEPENDS gpu/vendor/hip_backend.hip gpu/vendor/backend_impl.hpp
                    gpu/vendor/derive_kernel.hpp gpu/vulkan/sha512_constants.slang
                COMMAND_EXPAND_LISTS VERBATIM)
            add_dependencies(gramix_hip gramix)
        else()
            message(WARNING "HIP SDK found, but hipInfo found no compatible AMD GPU; HIP module skipped")
        endif()
    else()
        enable_language(HIP)
        find_package(hip CONFIG REQUIRED)
        add_library(gramix_hip MODULE gpu/vendor/hip_backend.hip)
        set_target_properties(gramix_hip PROPERTIES HIP_STANDARD 20
            HIP_STANDARD_REQUIRED ON OUTPUT_NAME gramix_hip)
        target_link_libraries(gramix_hip PRIVATE hip::host)
    endif()
endif()

include(CTest)
if(BUILD_TESTING)
    add_executable(gramix_tests tests/core_tests.cpp)
    target_link_libraries(gramix_tests PRIVATE gramix_core OpenSSL::Crypto)
    add_test(NAME core COMMAND gramix_tests)
    add_executable(gramix_vendor_kernel_tests tests/vendor_kernel_tests.cpp)
    target_link_libraries(gramix_vendor_kernel_tests PRIVATE gramix_core OpenSSL::Crypto)
    add_test(NAME vendor_kernel_reference COMMAND gramix_vendor_kernel_tests)
    add_executable(gramix_vendor_module_mock_tests tests/vendor_module_mock_tests.cpp)
    target_link_libraries(gramix_vendor_module_mock_tests PRIVATE gramix_core)
    add_test(NAME vendor_module_mock COMMAND gramix_vendor_module_mock_tests)
    add_test(NAME address_inspect_cli COMMAND gramix address inspect
        0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO --json)
    set_tests_properties(address_inspect_cli PROPERTIES
        PASS_REGULAR_EXPRESSION "\"workchain\":0")
    add_test(NAME address_inspect_bad_checksum COMMAND gramix address inspect
        EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJA --json)
    set_tests_properties(address_inspect_bad_checksum PROPERTIES WILL_FAIL TRUE)
endif()
