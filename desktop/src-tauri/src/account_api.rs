/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

use serde_json::{json, Value};
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

static LAST_REQUEST: Mutex<Option<Instant>> = Mutex::new(None);
const MAX_RESPONSE_BYTES: usize = 64 * 1024;

fn valid_raw_address(raw: &str) -> bool {
    let Some((chain, hash)) = raw.split_once(':') else {
        return false;
    };
    chain.parse::<i8>().is_ok()
        && hash.len() == 64
        && hash.bytes().all(|ch| ch.is_ascii_hexdigit())
}

#[tauri::command]
pub async fn fetch_account(raw: String, testnet: bool) -> Result<Value, String> {
    if !valid_raw_address(&raw) {
        return Err("Некорректный raw TON-адрес".into());
    }
    {
        let mut last = LAST_REQUEST
            .lock()
            .map_err(|_| "Ошибка ограничения запросов")?;
        if last.is_some_and(|time| time.elapsed() < Duration::from_secs(2)) {
            return Err("Повторите запрос через две секунды".into());
        }
        *last = Some(Instant::now());
    }

    let host = if testnet { "https://testnet.tonapi.io" } else { "https://tonapi.io" };
    let url = format!("{host}/v2/accounts/{raw}");
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent("Gramix/0.2.0")
        .build()
        .map_err(|_| "Не удалось настроить сетевой клиент")?;
    let mut response = client.get(url).send().await.map_err(|error| {
        if error.is_timeout() {
            "Время ожидания OpenTonAPI истекло".to_string()
        } else {
            "OpenTonAPI недоступен: проверьте подключение".to_string()
        }
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
    let address = data.get("address").and_then(Value::as_str)
        .ok_or("В ответе OpenTonAPI нет адреса")?;
    if address != raw {
        return Err("OpenTonAPI вернул данные другого аккаунта".into());
    }
    let status = data.get("status").and_then(Value::as_str)
        .filter(|value| matches!(*value, "nonexist" | "uninit" | "active" | "frozen"))
        .ok_or("Неизвестный статус аккаунта в ответе OpenTonAPI")?;
    let balance = data.get("balance").and_then(Value::as_i64)
        .ok_or("Некорректный баланс в ответе OpenTonAPI")?;
    let received_at = SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(|_| "Не удалось определить время ответа")?.as_secs();
    Ok(json!({
        "source": "OpenTonAPI",
        "network": if testnet { "testnet" } else { "mainnet" },
        "raw": raw,
        "status": status,
        "balance_nanoton": balance.to_string(),
        "last_activity": data.get("last_activity").and_then(Value::as_u64),
        "is_wallet": data.get("is_wallet").and_then(Value::as_bool),
        "received_at": received_at,
    }))
}

#[cfg(test)]
mod tests {
    use super::valid_raw_address;

    #[test]
    fn rejects_untrusted_address_paths() {
        assert!(valid_raw_address(&format!("0:{}", "a".repeat(64))));
        assert!(valid_raw_address(&format!("-1:{}", "F".repeat(64))));
        assert!(!valid_raw_address("0:../secrets"));
        assert!(!valid_raw_address(&format!("128:{}", "a".repeat(64))));
    }
}
