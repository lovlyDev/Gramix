/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

#include "gramix/compute.hpp"
#include "gramix/address_inspector.hpp"
#include "gramix/wallet_generator.hpp"
#include "gramix/config.hpp"
#include "gramix/vulkan_backend.hpp"
#include "gramix/vendor_backend.hpp"
#include "gramix/tuning_cache.hpp"

#include <CLI/CLI.hpp>
#include <openssl/crypto.h>

#include <algorithm>
#include <atomic>
#include <cstdint>
#include <exception>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <unordered_set>

namespace {
std::string hex32(const gramix::Bytes32& value) {
    std::ostringstream out;
    out << std::hex << std::setfill('0');
    for (const auto byte : value) out << std::setw(2) << static_cast<unsigned>(byte);
    return out.str();
}

std::string json_string(const std::string& value) {
    std::ostringstream out;
    out << '"';
    for (const unsigned char ch : value) {
        switch (ch) {
            case '"': out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (ch < 32) {
                    constexpr char hex[] = "0123456789abcdef";
                    out << "\\u00" << hex[ch >> 4] << hex[ch & 15];
                } else {
                    out << static_cast<char>(ch);
                }
        }
    }
    out << '"';
    return out.str();
}

std::vector<gramix::IComputeBackend*> one_backend_per_device(
    const std::vector<gramix::TuningResult>& ranked) {
    std::vector<gramix::IComputeBackend*> result;
    std::unordered_set<std::string> seen;
    for (const auto& entry : ranked) {
        if (seen.insert(entry.backend->info().hardware_id).second)
            result.push_back(entry.backend.get());
    }
    return result;
}
}

int main(int argc, char** argv) {
    CLI::App app{"Gramix — TON vanity generator; V5R1 mainnet wallet by default"};
    auto* address_command = app.add_subcommand("address", "Offline TON address tools");
    auto* inspect_command = address_command->add_subcommand("inspect", "Validate raw or friendly address");
    address_command->require_subcommand(1);
    std::string address_input;
    inspect_command->add_option("value", address_input, "Raw or friendly TON address")->required();
    bool address_json = false;
    inspect_command->add_flag("--json", address_json, "Print machine-readable JSON");
    auto* wallet_command = app.add_subcommand("wallet", "Local TON wallet tools");
    auto* generate_command = wallet_command->add_subcommand("generate", "Create and encrypt a new wallet");
    auto* session_command = wallet_command->add_subcommand("session", "Generate a wallet in memory; save only after an explicit command");
    wallet_command->require_subcommand(1);
    std::string generate_scheme = "12";
    std::string generate_version = "v5";
    std::string generate_output;
    bool generate_json = false;
    generate_command->add_option("--scheme", generate_scheme, "12 or 24 words");
    generate_command->add_option("--version", generate_version, "v5 or v4");
    generate_command->add_option("--out", generate_output, "Encrypted wallet output directory")->required();
    generate_command->add_flag("--json", generate_json, "Print public data only as JSON");
    std::string session_scheme = "12";
    std::string session_version = "v5";
    std::string session_output;
    session_command->add_option("--scheme", session_scheme, "12 or 24 words");
    session_command->add_option("--version", session_version, "v5 or v4");
    session_command->add_option("--out", session_output, "Encrypted wallet output directory")->required();
    auto* verify_command = wallet_command->add_subcommand("verify", "Verify an owned encrypted wallet file locally");
    auto* verify_phrase_command = wallet_command->add_subcommand("verify-phrase", "Derive public wallet data from a recovery phrase on stdin");
    std::string phrase_scheme = "12";
    std::string phrase_version = "v5";
    std::string expected_address;
    verify_phrase_command->add_option("--scheme", phrase_scheme, "12 or 24 words");
    verify_phrase_command->add_option("--version", phrase_version, "v5 or v4");
    verify_phrase_command->add_option("--expected", expected_address, "Optional raw or friendly address to compare");
    std::string verify_file;
    bool verify_json = false;
    verify_command->add_option("--file", verify_file, "Encrypted Gramix wallet file")->required();
    verify_command->add_flag("--json", verify_json, "Print public verification status as JSON");
    std::string config_path;
    std::string cli_wallet;
    std::string cli_mnemonic_scheme;
    std::string cli_prefix;
    std::string cli_suffix;
    std::string cli_contains;
    std::string cli_out;
    std::string reveal_path;
    std::string cli_backend = "auto";
    std::string cli_device;
    std::uint64_t cli_max = 0;
    std::uint32_t cli_batch = 0;
    std::uint32_t cli_threads = 0;
    std::uint32_t cli_gpu_duty = 100;
    bool show_devices = false;
    bool show_devices_json = false;
    bool show_backends_json = false;
    bool self_test = false;
    bool benchmark = false;
    bool benchmark_json = false;
    bool retune = false;
    bool ignore_case = false;
    bool progress = false;
    bool control_stdin = false;
    app.add_option("--config", config_path, "TOML configuration file");
    app.add_option("--backend", cli_backend, "auto, cpu, vulkan, cuda, hip or hybrid");
    app.add_option("--device", cli_device, "Restrict GPU search to a hardware ID from --devices");
    auto* wallet_option = app.add_option("--wallet", cli_wallet, "v5 or v4");
    auto* scheme_option = app.add_option("--mnemonic", cli_mnemonic_scheme,
                                         "12-word multichain or 24-word TON");
    auto* prefix_option = app.add_option("--prefix", cli_prefix, "Case-sensitive address prefix");
    auto* suffix_option = app.add_option("--suffix", cli_suffix, "Case-sensitive address suffix");
    auto* contains_option = app.add_option("--contains", cli_contains, "Text anywhere in address");
    app.add_flag("--ignore-case", ignore_case, "Match ASCII letters without case");
    app.add_flag("--control-stdin", control_stdin, "Read PAUSE and RESUME commands from stdin");
    auto* max_option = app.add_option("--max", cli_max, "Maximum addresses; 0 is unlimited");
    auto* batch_option = app.add_option("--batch", cli_batch, "Candidates per batch");
    auto* threads_option = app.add_option("--threads", cli_threads, "CPU worker threads");
    app.add_option("--gpu-duty", cli_gpu_duty, "GPU compute duty percentage, 1..100");
    auto* out_option = app.add_option("--out", cli_out, "Result directory");
    app.add_option("--reveal", reveal_path, "Decrypt and verify a saved wallet file");
    app.add_flag("--devices", show_devices, "List detected compute devices");
    app.add_flag("--devices-json", show_devices_json, "List devices as JSON");
    app.add_flag("--backends-json", show_backends_json,
                 "List compute backends that pass reference-vector self-tests");
    app.add_flag("--progress", progress, "Print progress records each second");
    app.add_flag("--self-test", self_test, "Check TON derivation against official vectors");
    app.add_flag("--benchmark", benchmark, "Measure full address throughput");
    app.add_flag("--benchmark-json", benchmark_json, "Measure full address throughput as JSON");
    app.add_flag("--retune", retune, "Ignore the cached hardware profile");
    try {
        app.parse(argc, argv);
    } catch (const CLI::ParseError& error) {
        return app.exit(error);
    }
    if (argc == 1) {
        std::cout << app.help();
        return 0;
    }

    try {
        if (*verify_phrase_command) {
            if (phrase_scheme != "12" && phrase_scheme != "24")
                throw std::invalid_argument("--scheme must be 12 or 24");
            if (phrase_version != "v5" && phrase_version != "v4")
                throw std::invalid_argument("--version must be v5 or v4");
            const auto expected_raw = expected_address.empty() ? std::string{}
                : gramix::inspect_address(expected_address).raw;
            std::string phrase;
            if (!std::getline(std::cin, phrase) || phrase.empty() || phrase.size() > 4096) {
                OPENSSL_cleanse(phrase.data(), phrase.size());
                throw std::invalid_argument("Recovery phrase must be provided on stdin");
            }
            gramix::WalletCandidate candidate;
            try {
                const bool valid = phrase_scheme == "12"
                    ? gramix::is_valid_multichain_mnemonic(phrase)
                    : gramix::is_valid_ton_mnemonic(phrase);
                if (!valid) throw std::invalid_argument("Invalid recovery phrase");
                candidate = gramix::candidate_from_mnemonic(phrase,
                    phrase_version == "v5" ? gramix::WalletVersion::v5r1 : gramix::WalletVersion::v4r2,
                    phrase_scheme == "12" ? gramix::MnemonicScheme::multichain12 : gramix::MnemonicScheme::ton24);
            } catch (...) {
                OPENSSL_cleanse(phrase.data(), phrase.size());
                throw std::runtime_error("Фраза восстановления не прошла локальную проверку.");
            }
            OPENSSL_cleanse(phrase.data(), phrase.size());
            const auto raw = std::string("0:") + hex32(candidate.address_hash);
            const bool matches = expected_raw.empty() || expected_raw == raw;
            std::cout << "{\"source\":\"local\",\"verified\":true,\"address\":"
                      << json_string(candidate.address) << ",\"raw\":" << json_string(raw)
                      << ",\"public_key\":" << json_string(hex32(candidate.public_key))
                      << ",\"matches_expected\":" << (matches ? "true" : "false") << "}\n";
            OPENSSL_cleanse(candidate.mnemonic.data(), candidate.mnemonic.size());
            return 0;
        }
        if (*session_command) {
            if (session_scheme != "12" && session_scheme != "24")
                throw std::invalid_argument("--scheme must be 12 or 24");
            if (session_version != "v5" && session_version != "v4")
                throw std::invalid_argument("--version must be v5 or v4");
            const auto scheme = session_scheme == "12"
                ? gramix::MnemonicScheme::multichain12 : gramix::MnemonicScheme::ton24;
            const auto version = session_version == "v5"
                ? gramix::WalletVersion::v5r1 : gramix::WalletVersion::v4r2;
            auto phrase = scheme == gramix::MnemonicScheme::multichain12
                ? gramix::generate_multichain_mnemonic() : gramix::generate_ton_mnemonic();
            gramix::WalletCandidate candidate;
            try {
                candidate = gramix::candidate_from_mnemonic(phrase, version, scheme);
                OPENSSL_cleanse(phrase.data(), phrase.size());
                phrase.clear();
                std::cout << "{\"type\":\"generated\",\"address\":"
                          << json_string(candidate.address) << ",\"raw\":"
                          << json_string(std::string("0:") + hex32(candidate.address_hash))
                          << ",\"public_key\":" << json_string(hex32(candidate.public_key))
                          << ",\"wallet\":" << json_string(session_version)
                          << ",\"scheme\":" << json_string(session_scheme) << "}\n" << std::flush;
                std::string command;
                while (std::getline(std::cin, command)) {
                    if (command == "DISCARD") break;
                    if (command == "REVEAL") {
                        std::cout << "{\"type\":\"revealed\",\"phrase\":"
                                  << json_string(candidate.mnemonic) << "}\n" << std::flush;
                        continue;
                    }
                    if (command == "SAVE") {
                        try {
                            const auto path = gramix::save_wallet_candidate(candidate, session_output);
                            std::cout << "{\"type\":\"saved\",\"encrypted_file\":"
                                      << json_string(path.string()) << "}\n" << std::flush;
                            break;
                        } catch (const std::exception&) {
                            std::cout << "{\"type\":\"save_error\",\"message\":"
                                      << json_string("Не удалось сохранить защищённый файл кошелька.")
                                      << "}\n" << std::flush;
                        }
                    }
                }
            } catch (...) {
                OPENSSL_cleanse(phrase.data(), phrase.size());
                OPENSSL_cleanse(candidate.mnemonic.data(), candidate.mnemonic.size());
                throw;
            }
            OPENSSL_cleanse(candidate.mnemonic.data(), candidate.mnemonic.size());
            return 0;
        }
        if (*verify_command) {
            try {
                auto phrase = gramix::reveal_saved_mnemonic(verify_file);
                OPENSSL_cleanse(phrase.data(), phrase.size());
            } catch (const std::exception&) {
                throw std::runtime_error("Файл кошелька не прошёл локальную проверку");
            }
            if (verify_json) {
                std::ifstream input(verify_file);
                std::string line, address, public_key;
                while (std::getline(input, line)) {
                    if (line.starts_with("address=")) address = line.substr(8);
                    if (line.starts_with("public_key=")) public_key = line.substr(11);
                }
                const auto raw = gramix::inspect_address(address).raw;
                std::cout << "{\"source\":\"local\",\"verified\":true,\"address\":"
                          << json_string(address) << ",\"raw\":" << json_string(raw)
                          << ",\"public_key\":" << json_string(public_key) << "}\n";
            }
            else
                std::cout << "Файл проверен: фраза, публичный ключ и адрес совпадают.\n";
            return 0;
        }
        if (*generate_command) {
            if (generate_scheme != "12" && generate_scheme != "24")
                throw std::invalid_argument("--scheme must be 12 or 24");
            if (generate_version != "v5" && generate_version != "v4")
                throw std::invalid_argument("--version must be v5 or v4");
            const auto scheme = generate_scheme == "12"
                ? gramix::MnemonicScheme::multichain12 : gramix::MnemonicScheme::ton24;
            const auto version = generate_version == "v5"
                ? gramix::WalletVersion::v5r1 : gramix::WalletVersion::v4r2;
            const auto wallet = gramix::generate_wallet_and_save(version, scheme, generate_output);
            const auto public_key = hex32(wallet.public_key);
            const auto raw = std::string("0:") + hex32(wallet.address_hash);
            if (generate_json) {
                std::cout << "{\"address\":" << json_string(wallet.address)
                          << ",\"raw\":" << json_string(raw)
                          << ",\"public_key\":" << json_string(public_key)
                          << ",\"wallet\":" << json_string(generate_version)
                          << ",\"scheme\":" << json_string(generate_scheme)
                          << ",\"encrypted_file\":"
                          << json_string(wallet.encrypted_file.string()) << "}\n";
            } else {
                std::cout << "Адрес: " << wallet.address << '\n'
                          << "Raw: " << raw << '\n'
                          << "Публичный ключ: " << public_key << '\n'
                          << "Зашифрованный файл: " << wallet.encrypted_file.string() << '\n';
            }
            return 0;
        }
        if (*inspect_command) {
            const auto address = gramix::inspect_address(address_input);
            if (address_json) {
                std::cout << "{\"source\":\"local\",\"raw\":" << json_string(address.raw)
                          << ",\"workchain\":" << address.workchain
                          << ",\"input_format\":\""
                          << (address.input_was_friendly ? "friendly" : "raw") << '"'
                          << ",\"input_bounceable\":"
                          << (address.input_was_friendly ?
                              (address.input_bounceable ? "true" : "false") : "null")
                          << ",\"input_testnet\":"
                          << (address.input_was_friendly ?
                              (address.input_testnet ? "true" : "false") : "null")
                          << ",\"bounceable\":" << json_string(address.bounceable)
                          << ",\"non_bounceable\":" << json_string(address.non_bounceable)
                          << "}\n";
            } else {
                std::cout << "Источник: локальная проверка, без сетевых данных\n"
                          << "Raw: " << address.raw << '\n'
                          << "Workchain: " << address.workchain << '\n'
                          << "Bounceable: " << address.bounceable << '\n'
                          << "Non-bounceable: " << address.non_bounceable << '\n';
                if (address.input_was_friendly)
                    std::cout << "Вход: " << (address.input_testnet ? "testnet" : "mainnet")
                              << ", " << (address.input_bounceable ? "bounceable" : "non-bounceable")
                              << '\n';
            }
            return 0;
        }
        if (!reveal_path.empty()) {
            auto phrase = gramix::reveal_saved_mnemonic(reveal_path);
            std::cout << phrase << '\n';
            OPENSSL_cleanse(phrase.data(), phrase.size());
            return 0;
        }
        auto config = config_path.empty() ? gramix::AppConfig{} : gramix::load_config(config_path);
        if (wallet_option->count()) {
            if (cli_wallet == "v5") config.wallet = gramix::WalletVersion::v5r1;
            else if (cli_wallet == "v4") config.wallet = gramix::WalletVersion::v4r2;
            else throw std::invalid_argument("--wallet must be v5 or v4");
        }
        if (scheme_option->count()) {
            if (cli_mnemonic_scheme == "12")
                config.mnemonic_scheme = gramix::MnemonicScheme::multichain12;
            else if (cli_mnemonic_scheme == "24")
                config.mnemonic_scheme = gramix::MnemonicScheme::ton24;
            else throw std::invalid_argument("--mnemonic must be 12 or 24");
        }
        if (prefix_option->count()) config.search.pattern.prefix = cli_prefix;
        if (suffix_option->count()) config.search.pattern.suffix = cli_suffix;
        if (contains_option->count()) config.search.pattern.contains = cli_contains;
        if (ignore_case) config.search.pattern.ignore_case = true;
        if (max_option->count()) config.search.max_candidates = cli_max;
        if (batch_option->count()) {
            if (cli_batch == 0 || cli_batch > 1000000)
                throw std::invalid_argument("--batch must be 1..1000000");
            config.search.batch_size = cli_batch;
        }
        if (threads_option->count()) {
            if (cli_threads == 0 || cli_threads > 256)
                throw std::invalid_argument("--threads must be 1..256");
            config.search.cpu_threads = cli_threads;
        }
        if (out_option->count()) config.search.output_directory = cli_out;
        if (cli_gpu_duty < 1 || cli_gpu_duty > 100)
            throw std::invalid_argument("--gpu-duty must be 1..100");
        config.search.gpu_duty_percent = cli_gpu_duty;
        config.search.progress = progress;
        if (control_stdin) {
            config.search.paused = std::make_shared<std::atomic<bool>>(false);
            config.search.stop_requested = std::make_shared<std::atomic<bool>>(false);
            auto pause_state = config.search.paused;
            auto stop_state = config.search.stop_requested;
            std::thread([pause_state, stop_state] {
                std::string command;
                while (std::getline(std::cin, command)) {
                    if (command == "PAUSE") pause_state->store(true, std::memory_order_release);
                    if (command == "RESUME") pause_state->store(false, std::memory_order_release);
                    if (command == "STOP") {
                        stop_state->store(true, std::memory_order_release);
                        pause_state->store(false, std::memory_order_release);
                        break;
                    }
                }
            }).detach();
        }

        const auto devices = gramix::DeviceManager::discover();
        if (!cli_device.empty()) {
            const auto found = std::find_if(devices.begin(), devices.end(),
                [&](const auto& device) { return device.hardware_id == cli_device; });
            if (found == devices.end() ||
                std::find(found->available_apis.begin(), found->available_apis.end(),
                          gramix::ComputeApi::cpu) != found->available_apis.end())
                throw std::invalid_argument("--device must be a GPU hardware ID from --devices");
        }
        if (show_devices_json) {
            std::cout << "{\"devices\":[";
            bool first_device = true;
            for (const auto& device : devices) {
                if (!first_device) std::cout << ',';
                first_device = false;
                std::cout << "{\"id\":" << json_string(device.hardware_id)
                          << ",\"name\":" << json_string(device.name)
                          << ",\"vendor\":" << json_string(device.vendor)
                          << ",\"driver\":" << json_string(device.driver)
                          << ",\"memory_bytes\":" << device.memory_bytes
                          << ",\"apis\":[";
                bool first_api = true;
                for (const auto api : device.available_apis) {
                    if (!first_api) std::cout << ',';
                    first_api = false;
                    std::cout << json_string(gramix::api_name(api));
                }
                std::cout << "]}";
            }
            std::cout << "]}\n";
            return 0;
        }
        if (show_devices) {
            for (const auto& device : devices) {
                std::cout << device.name << " [" << device.hardware_id << "]\n"
                          << "  vendor=" << device.vendor << " driver=" << device.driver
                          << " memory=" << device.memory_bytes << " bytes\n"
                          << "  available APIs=";
                for (const auto api : device.available_apis)
                    std::cout << gramix::api_name(api) << ' ';
                std::cout << " search=" << (device.usable_for_search ? "ready" : "verify-on-use")
                          << '\n';
            }
        }

        gramix::BackendRegistry registry;
        registry.add(std::make_shared<gramix::CpuBackend>(
            config.wallet, config.mnemonic_scheme));
        const bool search = !config.search.pattern.prefix.empty() ||
                            !config.search.pattern.suffix.empty() ||
                            !config.search.pattern.contains.empty();
        if (cli_backend != "auto" && cli_backend != "cpu" &&
            cli_backend != "vulkan" && cli_backend != "cuda" &&
            cli_backend != "hip" && cli_backend != "hybrid")
            throw std::invalid_argument("--backend must be auto, cpu, vulkan, cuda, hip or hybrid");
        if (!cli_device.empty() && cli_backend == "cpu")
            throw std::invalid_argument("--device requires a GPU-capable backend mode");
        if (cli_backend != "cpu" &&
            (self_test || benchmark || benchmark_json || search || show_backends_json)) {
            try {
                for (auto& gpu : gramix::VulkanBackend::create_all(
                         config.wallet, config.mnemonic_scheme)) {
                    if (!cli_device.empty() && gpu->info().hardware_id != cli_device)
                        continue;
                    if (gpu->self_test()) {
                        registry.add(gpu);
                        if (self_test && (cli_backend == "auto" ||
                                          cli_backend == "vulkan" ||
                                          cli_backend == "hybrid"))
                            std::cout << gpu->info().name << " self-test passed\n";
                    } else {
                        std::cerr << gpu->info().name
                                  << " failed reference vector; using CPU\n";
                    }
                }
            } catch (const std::exception& error) {
                std::cerr << "Vulkan unavailable: " << error.what() << '\n';
            }
        }
        if (cli_backend != "cpu" && cli_backend != "vulkan" &&
            (self_test || benchmark || benchmark_json || search || show_backends_json)) {
            for (const auto api : {gramix::ComputeApi::cuda, gramix::ComputeApi::hip}) {
                if ((cli_backend == "cuda" && api != gramix::ComputeApi::cuda) ||
                    (cli_backend == "hip" && api != gramix::ComputeApi::hip)) continue;
                const bool detected = std::any_of(devices.begin(), devices.end(),
                    [api](const auto& device) {
                        return std::find(device.available_apis.begin(),
                                         device.available_apis.end(), api) !=
                               device.available_apis.end();
                    });
                if (!detected) continue;
                try {
                    for (auto& gpu : gramix::load_vendor_backends(
                             api, config.wallet, config.mnemonic_scheme)) {
                        if (!cli_device.empty() && gpu->info().hardware_id != cli_device)
                            continue;
                        if (gpu->self_test()) {
                            registry.add(gpu);
                            if (self_test) std::cout << gpu->info().name << " self-test passed\n";
                        } else {
                            std::cerr << gpu->info().name
                                      << " failed reference vector; using another backend\n";
                        }
                    }
                } catch (const std::exception& error) {
                    std::cerr << gramix::api_name(api) << " unavailable: "
                              << error.what() << '\n';
                }
            }
        }
        auto backend = registry.backends().front();
        if (self_test || benchmark || benchmark_json || search || show_backends_json) {
            if (!backend->self_test()) throw std::runtime_error("CPU TON self-test failed");
            if (self_test) std::cout << "CPU TON self-test passed\n";
        }
        if (cli_backend == "vulkan" || cli_backend == "cuda" || cli_backend == "hip") {
            const auto required = cli_backend == "vulkan" ? gramix::ComputeApi::vulkan
                : cli_backend == "cuda" ? gramix::ComputeApi::cuda : gramix::ComputeApi::hip;
            if ((self_test || benchmark || benchmark_json || search) &&
                std::none_of(registry.backends().begin(), registry.backends().end(),
                    [required](const auto& candidate) {
                        return candidate->info().api == required;
                    }))
                throw std::runtime_error("No validated " + cli_backend + " backend available");
        }
        if (show_backends_json) {
            std::cout << "{\"backends\":[";
            bool first = true;
            for (const auto& candidate : registry.backends()) {
                if (!first) std::cout << ',';
                first = false;
                const auto info = candidate->info();
                std::cout << "{\"api\":" << json_string(gramix::api_name(info.api))
                          << ",\"device_id\":" << json_string(info.hardware_id)
                          << ",\"name\":" << json_string(info.name) << '}';
            }
            std::cout << "]}\n";
            return 0;
        }
        if (benchmark || benchmark_json) {
            const auto results = gramix::AutoTuner::benchmark(registry);
            if (benchmark_json)
                std::cout << "{\"source\":\"local\",\"metric\":\"verified_ton_addresses_per_second\",\"warmup\":true,\"results\":[";
            bool first_result = true;
            for (const auto& result : results) {
                const auto api = gramix::api_name(result.backend->info().api);
                if (cli_backend != "auto" && cli_backend != "hybrid" &&
                    !(cli_backend == "cpu" && api == "CPU") &&
                    !(cli_backend == "vulkan" && api == "Vulkan") &&
                    !(cli_backend == "cuda" && api == "CUDA") &&
                    !(cli_backend == "hip" && api == "HIP")) continue;
                if (benchmark_json) {
                    if (!first_result) std::cout << ',';
                    first_result = false;
                    const auto info = result.backend->info();
                    std::cout << "{\"api\":" << json_string(api)
                              << ",\"device_id\":" << json_string(info.hardware_id)
                              << ",\"name\":" << json_string(info.name)
                              << ",\"addresses_per_second\":"
                              << result.verified_addresses_per_second << '}';
                } else {
                    std::cout << result.backend->info().name << ": "
                              << result.verified_addresses_per_second
                              << " verified TON addresses/s\n";
                }
            }
            if (benchmark_json) std::cout << "]}\n";
        }
        if (search) {
            if (!cli_device.empty() && cli_backend == "vulkan" &&
                registry.backends().size() == 1)
                throw std::runtime_error("Selected GPU has no validated Vulkan backend");
            std::vector<gramix::IComputeBackend*> selected;
            if (cli_backend == "vulkan" || cli_backend == "cuda" || cli_backend == "hip") {
                const auto api = cli_backend == "vulkan" ? gramix::ComputeApi::vulkan
                    : cli_backend == "cuda" ? gramix::ComputeApi::cuda
                    : gramix::ComputeApi::hip;
                for (const auto& candidate : registry.backends())
                    if (candidate->info().api == api)
                        selected.push_back(candidate.get());
                if (selected.empty())
                    throw std::runtime_error("No validated " + cli_backend + " backend available");
            } else if (cli_backend == "hybrid") {
                selected = one_backend_per_device(gramix::AutoTuner::benchmark(registry));
            } else if (cli_backend == "auto" && registry.backends().size() > 1) {
                selected = (retune || !cli_device.empty())
                               ? std::vector<gramix::IComputeBackend*>{}
                                  : gramix::load_tuning_profile(
                                        registry, devices, config.wallet,
                                        config.mnemonic_scheme);
                if (selected.empty()) {
                    const auto results = gramix::AutoTuner::benchmark(registry);
                    backend = gramix::FallbackManager::choose(results);
                    selected.push_back(backend.get());
                    auto combined = one_backend_per_device(results);
                    if (combined.size() > 1) {
                        auto probe = config.search;
                        probe.pattern = gramix::SearchPattern{"Z", "", "", false};
                        probe.max_candidates = 4096;
                        probe.batch_size = 64;
                        probe.progress = false;
                        try {
                            gramix::PerformanceMonitor single_monitor;
                            gramix::ComputeScheduler::search(selected, probe, single_monitor);
                            gramix::PerformanceMonitor combined_monitor;
                            gramix::ComputeScheduler::search(combined, probe, combined_monitor);
                            if (combined_monitor.rate() > single_monitor.rate() * 1.10)
                                selected = std::move(combined);
                        } catch (const std::exception& error) {
                            std::cerr << "Hybrid calibration failed: "
                                      << error.what() << '\n';
                        }
                    }
                    if (cli_device.empty())
                        gramix::save_tuning_profile(
                            registry, selected, devices, config.wallet,
                            config.mnemonic_scheme);
                } else {
                    std::cout << "Using cached compute profile\n";
                }
            }
            if (selected.empty()) selected.push_back(backend.get());
            if (!batch_option->count()) {
                const bool vendor_gpu = std::any_of(selected.begin(), selected.end(),
                    [](const auto* candidate) {
                        const auto api = candidate->info().api;
                        return api == gramix::ComputeApi::cuda ||
                               api == gramix::ComputeApi::hip;
                    });
                const bool any_gpu = vendor_gpu || std::any_of(selected.begin(), selected.end(),
                    [](const auto* candidate) {
                        return candidate->info().api == gramix::ComputeApi::vulkan;
                    });
                if (any_gpu) config.search.batch_size = vendor_gpu ? 128 : 64;
            }
            std::cout << "Using ";
            for (std::size_t i = 0; i < selected.size(); ++i) {
                if (i) std::cout << " + ";
                std::cout << selected[i]->info().name;
            }
            std::cout << '\n';
            gramix::PerformanceMonitor monitor;
            try {
                gramix::ComputeScheduler::search(selected, config.search, monitor);
            } catch (const gramix::WalletPersistenceError&) {
                throw;
            } catch (const std::exception& error) {
                const bool had_gpu = std::any_of(
                    selected.begin(), selected.end(), [](const auto* candidate) {
                        return candidate->info().api != gramix::ComputeApi::cpu;
                    });
                if (!had_gpu) throw;
                std::cerr << "GPU search stopped: " << error.what()
                          << "; trying another validated backend\n";
                auto fallback = config.search;
                if (fallback.max_candidates) {
                    if (monitor.total() >= fallback.max_candidates)
                        fallback.max_candidates = 0;
                    else fallback.max_candidates -= monitor.total();
                }
                if (!config.search.max_candidates ||
                    monitor.total() < config.search.max_candidates) {
                    std::vector<gramix::IComputeBackend*> retry;
                    std::unordered_set<std::string> seen_retry;
                    for (auto* failed : selected) {
                        const auto info = failed->info();
                        if (info.api != gramix::ComputeApi::cuda &&
                            info.api != gramix::ComputeApi::hip) continue;
                        for (const auto& candidate : registry.backends()) {
                            const auto replacement = candidate->info();
                            if (replacement.api == gramix::ComputeApi::vulkan &&
                                replacement.hardware_id == info.hardware_id &&
                                seen_retry.insert(replacement.hardware_id).second)
                                retry.push_back(candidate.get());
                        }
                    }
                    if (!retry.empty()) {
                        try {
                            std::cerr << "Retrying failed vendor GPU via Vulkan\n";
                            gramix::ComputeScheduler::search(retry, fallback, monitor);
                        } catch (const gramix::WalletPersistenceError&) {
                            throw;
                        } catch (const std::exception& fallback_error) {
                            std::cerr << "Vulkan retry stopped: " << fallback_error.what()
                                      << "; continuing on CPU\n";
                            if (config.search.max_candidates)
                                fallback.max_candidates = config.search.max_candidates -
                                    std::min(config.search.max_candidates, monitor.total());
                            retry.clear();
                        }
                    }
                    if (retry.empty() && (!config.search.max_candidates ||
                        monitor.total() < config.search.max_candidates))
                        gramix::ComputeScheduler::search(*registry.backends().front(),
                                                          fallback, monitor);
                }
            }
            const auto total = monitor.total();
            std::cout << "Checked " << total << " addresses at " << monitor.rate() << "/s\n";
        }
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Gramix error: " << error.what() << '\n';
        return 1;
    }
}
