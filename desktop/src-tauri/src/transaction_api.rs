/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

use serde_json::{json, Value};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const MAX_RESPONSE_BYTES: usize = 256 * 1024;

fn valid_hash(hash: &str) -> bool {
    hash.len() == 64 && hash.bytes().all(|byte| byte.is_ascii_hexdigit())
}

#[tauri::command]
pub async fn fetch_transaction(hash: String, testnet: bool) -> Result<Value, String> {
    if !valid_hash(&hash) {
        return Err("ID транзакции должен содержать 64 hex-символа".into());
    }
    let host = if testnet { "https://testnet.tonapi.io" } else { "https://tonapi.io" };
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent(concat!("Gramix/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "Не удалось настроить сетевой клиент")?;
    let mut response = client
        .get(format!("{host}/v2/blockchain/transactions/{hash}"))
        .send()
        .await
        .map_err(|error| if error.is_timeout() {
            "Время ожидания OpenTonAPI истекло".to_string()
        } else {
            "OpenTonAPI недоступен: проверьте подключение".to_string()
        })?;
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
    let data: Value = serde_json::from_slice(&body)
        .map_err(|_| "OpenTonAPI вернул некорректный JSON")?;
    let returned_hash = data.get("hash").and_then(Value::as_str)
        .ok_or("В ответе OpenTonAPI нет хеша транзакции")?;
    if !returned_hash.eq_ignore_ascii_case(&hash) {
        return Err("OpenTonAPI вернул другую транзакцию".into());
    }
    let raw = data.get("raw").and_then(Value::as_str)
        .filter(|value| !value.is_empty() && value.len() <= 128 * 1024 &&
            value.len() % 2 == 0 && value.bytes().all(|byte| byte.is_ascii_hexdigit()))
        .ok_or("OpenTonAPI не вернул корректный raw BOC")?;
    let received_at = SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(|_| "Не удалось определить время ответа")?.as_secs();
    Ok(json!({
        "source": "OpenTonAPI",
        "network": if testnet { "testnet" } else { "mainnet" },
        "hash": returned_hash,
        "raw_boc_hex": raw,
        "received_at": received_at,
    }))
}

#[cfg(test)]
mod tests {
    use super::valid_hash;

    #[test]
    fn transaction_hash_must_be_exact_hex() {
        assert!(valid_hash(&"f".repeat(64)));
        assert!(!valid_hash(&"f".repeat(63)));
        assert!(!valid_hash(&format!("{}g", "f".repeat(63))));
        assert!(!valid_hash("../accounts"));
    }
}
