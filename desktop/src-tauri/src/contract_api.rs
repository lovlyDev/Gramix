/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

use serde_json::{json, Value};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const MAX_RESPONSE_BYTES: usize = 256 * 1024;

fn valid_address(raw: &str) -> bool {
    let Some((chain, hash)) = raw.split_once(':') else { return false; };
    chain.parse::<i8>().is_ok() && hash.len() == 64 && hash.bytes().all(|ch| ch.is_ascii_hexdigit())
}

fn valid_method(method: &str) -> bool {
    let mut chars = method.bytes();
    matches!(chars.next(), Some(b'a'..=b'z' | b'A'..=b'Z' | b'_'))
        && method.len() <= 64
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == b'_')
}

fn valid_cell_hex(value: &str) -> bool {
    value.len() <= 128 * 1024 && value.len() % 2 == 0
        && value.bytes().all(|ch| ch.is_ascii_hexdigit())
}

async fn get_json(client: &reqwest::Client, url: String) -> Result<Value, String> {
    let mut response = client.get(url).send().await.map_err(|error| if error.is_timeout() {
        "Время ожидания OpenTonAPI истекло".to_string()
    } else { "OpenTonAPI недоступен: проверьте подключение".to_string() })?;
    if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return Err("OpenTonAPI ограничил частоту запросов".into());
    }
    if !response.status().is_success() {
        return Err(format!("OpenTonAPI вернул HTTP {}", response.status().as_u16()));
    }
    if response.content_length().is_some_and(|size| size > MAX_RESPONSE_BYTES as u64) {
        return Err("Ответ OpenTonAPI слишком велик".into());
    }
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "Не удалось прочитать ответ OpenTonAPI")? {
        if body.len().saturating_add(chunk.len()) > MAX_RESPONSE_BYTES {
            return Err("Ответ OpenTonAPI слишком велик".into());
        }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|_| "OpenTonAPI вернул некорректный JSON".into())
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent("Gramix/0.1.0")
        .build().map_err(|_| "Не удалось настроить сетевой клиент".into())
}

fn host(testnet: bool) -> &'static str {
    if testnet { "https://testnet.tonapi.io" } else { "https://tonapi.io" }
}

fn received_at() -> Result<u64, String> {
    Ok(SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(|_| "Не удалось определить время ответа")?.as_secs())
}

#[tauri::command]
pub async fn fetch_contract(raw: String, testnet: bool) -> Result<Value, String> {
    if !valid_address(&raw) { return Err("Некорректный raw TON-адрес".into()); }
    let data = get_json(&client()?, format!("{}/v2/blockchain/accounts/{raw}", host(testnet))).await?;
    if data.get("address").and_then(Value::as_str) != Some(raw.as_str()) {
        return Err("OpenTonAPI вернул данные другого аккаунта".into());
    }
    let status = data.get("status").and_then(Value::as_str)
        .filter(|value| matches!(*value, "nonexist" | "uninit" | "active" | "frozen"))
        .ok_or("Неизвестный статус аккаунта")?;
    let code = data.get("code").and_then(Value::as_str).filter(|value| valid_cell_hex(value));
    let state = data.get("data").and_then(Value::as_str).filter(|value| valid_cell_hex(value));
    if data.get("code").is_some() && code.is_none() || data.get("data").is_some() && state.is_none() {
        return Err("OpenTonAPI вернул некорректный BOC контракта".into());
    }
    let balance = data.get("balance").and_then(Value::as_i64)
        .ok_or("Некорректный баланс аккаунта")?;
    Ok(json!({
        "source": "OpenTonAPI", "network": if testnet { "testnet" } else { "mainnet" },
        "raw": raw, "status": status, "balance_nanoton": balance.to_string(),
        "code_hex": code, "data_hex": state,
        "last_transaction_lt": data.get("last_transaction_lt").map(Value::to_string),
        "last_transaction_hash": data.get("last_transaction_hash").and_then(Value::as_str),
        "received_at": received_at()?,
    }))
}

#[tauri::command]
pub async fn inspect_contract_code(raw: String, testnet: bool) -> Result<Value, String> {
    if !valid_address(&raw) { return Err("Некорректный raw TON-адрес".into()); }
    let data = get_json(&client()?, format!("{}/v2/blockchain/accounts/{raw}/inspect", host(testnet))).await?;
    let code = data.get("code").and_then(Value::as_str)
        .filter(|value| valid_cell_hex(value)).ok_or("OpenTonAPI не вернул корректный код")?;
    let code_hash = data.get("code_hash").and_then(Value::as_str)
        .filter(|value| value.len() == 64 && value.bytes().all(|ch| ch.is_ascii_hexdigit()))
        .ok_or("OpenTonAPI не вернул хеш кода")?;
    let methods = data.get("methods").and_then(Value::as_array)
        .ok_or("OpenTonAPI не вернул список методов")?;
    let names: Vec<&str> = methods.iter().filter_map(|item| item.get("method").and_then(Value::as_str))
        .filter(|name| valid_method(name)).take(128).collect();
    Ok(json!({
        "source": "OpenTonAPI", "network": if testnet { "testnet" } else { "mainnet" },
        "raw": raw, "code_hex": code, "code_hash": code_hash,
        "compiler": data.get("compiler").and_then(Value::as_str),
        "methods": names, "received_at": received_at()?,
    }))
}

#[tauri::command]
pub async fn run_get_method(raw: String, testnet: bool, method: String, args: Vec<String>) -> Result<Value, String> {
    if !valid_address(&raw) { return Err("Некорректный raw TON-адрес".into()); }
    if !valid_method(&method) { return Err("Некорректное имя get-метода".into()); }
    if args.len() > 16 || args.iter().any(|arg| arg.len() > 4096 || arg.contains(['\r', '\n'])) {
        return Err("Слишком много аргументов или аргумент слишком длинный".into());
    }
    let mut url = reqwest::Url::parse(&format!("{}/v2/blockchain/accounts/{raw}/methods/{method}", host(testnet)))
        .map_err(|_| "Некорректный адрес get-метода")?;
    let client = client()?;
    if !args.is_empty() {
        let mut query = url.query_pairs_mut();
        for arg in &args { query.append_pair("args", arg); }
    }
    let data = get_json(&client, url.to_string()).await?;
    let success = data.get("success").and_then(Value::as_bool).ok_or("В ответе нет результата метода")?;
    let exit_code = data.get("exit_code").and_then(Value::as_i64).ok_or("В ответе нет кода выхода")?;
    let stack = data.get("stack").and_then(Value::as_array).ok_or("В ответе нет стека")?;
    Ok(json!({
        "source": "OpenTonAPI", "network": if testnet { "testnet" } else { "mainnet" },
        "raw": raw, "method": method, "args": args,
        "success": success, "exit_code": exit_code, "stack": stack,
        "decoded": data.get("decoded"), "received_at": received_at()?,
    }))
}

#[cfg(test)]
mod tests {
    use super::{valid_address, valid_cell_hex, valid_method};

    #[test]
    fn rejects_untrusted_paths_and_method_names() {
        assert!(valid_address(&format!("0:{}", "a".repeat(64))));
        assert!(!valid_address("../config"));
        assert!(valid_method("get_wallet_data"));
        assert!(!valid_method("send/message"));
        assert!(!valid_method("123"));
        assert!(valid_cell_hex("b5ee9c72"));
        assert!(!valid_cell_hex("b5eeZZ"));
    }
}
