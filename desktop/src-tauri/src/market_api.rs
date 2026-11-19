/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Курс GRAM, история адреса и балансы адресной книги через OpenTonAPI.
// Запросы идут только к фиксированным путям tonapi.io; ответ разбирает интерфейс.
use serde_json::{json, Value};
use std::sync::Mutex;
use std::time::{Duration, Instant};

static LAST_REQUEST: Mutex<Option<Instant>> = Mutex::new(None);
const SMALL_RESPONSE: usize = 128 * 1024;
const LARGE_RESPONSE: usize = 1024 * 1024;

fn host(testnet: bool) -> &'static str {
    if testnet { "https://testnet.tonapi.io" } else { "https://tonapi.io" }
}

fn valid_raw_address(raw: &str) -> bool {
    let Some((chain, hash)) = raw.split_once(':') else { return false };
    chain.parse::<i8>().is_ok() && hash.len() == 64 && hash.bytes().all(|ch| ch.is_ascii_hexdigit())
}

// Не чаще одного запроса в 1,1 с: у анонимного доступа к tonapi строгий лимит.
async fn throttle() {
    loop {
        let wait = {
            let mut last = match LAST_REQUEST.lock() { Ok(value) => value, Err(poisoned) => poisoned.into_inner() };
            let gap = Duration::from_millis(1100);
            match *last {
                Some(time) if time.elapsed() < gap => Some(gap - time.elapsed()),
                _ => { *last = Some(Instant::now()); None }
            }
        };
        match wait { Some(delay) => { let _ = tauri::async_runtime::spawn_blocking(move || std::thread::sleep(delay)).await; } None => return }
    }
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(12))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent(concat!("Gramix/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "Не удалось настроить сетевой клиент".to_string())
}

async fn read_json(request: reqwest::RequestBuilder, limit: usize) -> Result<Value, String> {
    throttle().await;
    let mut response = request.send().await.map_err(|error| {
        if error.is_timeout() { "Время ожидания OpenTonAPI истекло".to_string() }
        else { "OpenTonAPI недоступен: проверьте подключение".to_string() }
    })?;
    if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return Err("OpenTonAPI ограничил частоту запросов. Повторите через несколько секунд.".into());
    }
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err("OpenTonAPI не нашёл данные по этому запросу.".into());
    }
    if !response.status().is_success() {
        return Err(format!("OpenTonAPI вернул HTTP {}", response.status().as_u16()));
    }
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "Не удалось прочитать ответ OpenTonAPI")? {
        if body.len().saturating_add(chunk.len()) > limit { return Err("Ответ OpenTonAPI слишком велик".into()); }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|_| "OpenTonAPI вернул некорректный JSON".to_string())
}

#[tauri::command]
pub async fn fetch_rates() -> Result<Value, String> {
    let url = format!("{}/v2/rates?tokens=ton&currencies=usd,rub", host(false));
    read_json(client()?.get(url), SMALL_RESPONSE).await
}

#[tauri::command]
pub async fn fetch_rates_chart(currency: String, days: u32) -> Result<Value, String> {
    let currency = match currency.as_str() { "usd" | "rub" => currency, _ => return Err("Неизвестная валюта".into()) };
    let days = days.clamp(1, 365) as u64;
    let end = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|error| error.to_string())?.as_secs();
    let url = format!("{}/v2/rates/chart?token=ton&currency={currency}&start_date={}&end_date={end}&points_count=120",
        host(false), end - days * 86_400);
    read_json(client()?.get(url), SMALL_RESPONSE).await
}

#[tauri::command]
pub async fn fetch_account_events(raw: String, testnet: bool, before_lt: Option<String>, limit: Option<u32>) -> Result<Value, String> {
    if !valid_raw_address(&raw) { return Err("Некорректный raw-адрес".into()); }
    let limit = limit.unwrap_or(20).clamp(1, 50);
    let mut url = format!("{}/v2/accounts/{raw}/events?limit={limit}", host(testnet));
    if let Some(lt) = before_lt.filter(|value| !value.is_empty()) {
        if !lt.bytes().all(|ch| ch.is_ascii_digit()) || lt.len() > 20 { return Err("Некорректный LT".into()); }
        url.push_str(&format!("&before_lt={lt}"));
    }
    read_json(client()?.get(url), LARGE_RESPONSE).await
}

#[tauri::command]
pub async fn fetch_accounts_bulk(raws: Vec<String>, testnet: bool) -> Result<Value, String> {
    if raws.is_empty() { return Ok(json!({ "accounts": [] })); }
    if raws.len() > 100 { return Err("Не больше 100 адресов за раз".into()); }
    if raws.iter().any(|raw| !valid_raw_address(raw)) { return Err("Некорректный raw-адрес".into()); }
    let url = format!("{}/v2/accounts/_bulk", host(testnet));
    read_json(client()?.post(url).header("content-type", "application/json").body(json!({ "account_ids": raws }).to_string()), LARGE_RESPONSE).await
}
