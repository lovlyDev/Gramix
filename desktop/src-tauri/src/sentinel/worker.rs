/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

use super::{api, client, credential, field, lock_file, raw_ok, save, settings, Result};
use serde_json::{json, Value};
use std::time::Duration;
use windows_registry::Key;

fn display_address(raw: &str) -> Result<String> {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
    if !raw_ok(raw) {
        return Err("Некорректный адрес кошелька".into());
    }
    let (chain, hash) = raw.split_once(':').unwrap();
    let mut bytes = [0u8; 36];
    bytes[0] = 0x11;
    bytes[1] = chain.parse::<i8>().unwrap() as u8;
    for (index, byte) in bytes[2..34].iter_mut().enumerate() {
        *byte = u8::from_str_radix(&hash[index * 2..index * 2 + 2], 16).unwrap();
    }
    // TON friendly address checksum: CRC-16/XMODEM, big endian.
    let mut crc = 0u16;
    for byte in &bytes[..34] {
        crc ^= u16::from(*byte) << 8;
        for _ in 0..8 {
            crc = if crc & 0x8000 != 0 {
                (crc << 1) ^ 0x1021
            } else {
                crc << 1
            };
        }
    }
    bytes[34..].copy_from_slice(&crc.to_be_bytes());
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

fn event_time(seconds: Option<i64>) -> String {
    let Some(time) = seconds.and_then(|s| chrono::DateTime::from_timestamp(s, 0)) else {
        return String::new();
    };
    let local = time.with_timezone(&chrono::Local);
    format!(
        r#" · <tg-time unix="{}">{}</tg-time>"#,
        time.timestamp(),
        local.format("%d.%m.%Y %H:%M:%S %:z")
    )
}

async fn messages(c: &reqwest::Client, k: &Key, t: &str) -> Result<()> {
    let updates=api(c,t,"getUpdates",json!({"offset":field(k,"offset").parse::<i64>().unwrap_or(0),"limit":30,"allowed_updates":["message"]})).await?;
    for update in updates.as_array().ok_or("Некорректный список сообщений")?
    {
        let m = &update["message"];
        let chat = m["chat"]["id"].as_i64().unwrap_or(0).to_string();
        let text = m["text"].as_str().unwrap_or("");
        let code = field(k, "pair");
        if m["chat"]["type"] == "private" && m["from"]["id"] == m["chat"]["id"] {
            let pair =
                field(k, "chat").is_empty() && !code.is_empty() && text == format!("/start {code}");
            if pair || (field(k, "chat") == chat && ["/start", "/status", "/help"].contains(&text))
            {
                api(c,t,"sendRichMessage",json!({"chat_id":chat,"rich_message":{"html":"<h2>Gramix Sentinel</h2><p>Чат подключён. Управление адресами и порогом перевода доступно в настройках Gramix.</p>"}})).await?;
                if pair {
                    save(k, "chat", &chat)?;
                    save(k, "pair", "")?
                }
            }
        }
        if let Some(id) = update["update_id"].as_i64() {
            save(k, "offset", &(id + 1).to_string())?
        }
    }
    Ok(())
}
fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

fn event_graph_link(address: &str, id: &str, timestamp: Option<i64>) -> String {
    let mut link =
        format!("https://gram.lovlydev.ru/transfer-graph/?address={address}&amp;event={id}");
    if let Some(time) = timestamp.filter(|time| *time > 0) {
        link.push_str(&format!(
            "&amp;from={}&amp;until={}",
            time.saturating_sub(3600),
            time.saturating_add(3601)
        ));
    }
    link
}

fn matching_actions(event: &Value, raw: &str, policy: &Value) -> Vec<String> {
    let minimum = policy["minimum"].as_u64().unwrap_or(0).min(1_000_000_000);
    let direction = policy["direction"].as_str().unwrap_or("all");
    let mut lines = Vec::new();
    for action in event["actions"].as_array().into_iter().flatten() {
        if action["status"] != "ok" {
            continue;
        }
        let kind = action["type"].as_str().unwrap_or("");
        if policy["kinds"]
            .as_array()
            .is_some_and(|kinds| !kinds.iter().any(|item| item == kind))
        {
            continue;
        }
        let body = &action[kind];
        let incoming = body["recipient"]["address"] == raw;
        let outgoing = body["sender"]["address"] == raw;
        let side = match (incoming, outgoing) {
            (true, true) => "Перевод себе",
            (true, false) => "Входящий перевод",
            (false, true) => "Исходящий перевод",
            _ => "Перевод",
        };
        if (direction == "in" && (!incoming || outgoing))
            || (direction == "out" && (!outgoing || incoming))
        {
            continue;
        }
        match kind {
            "TonTransfer" if incoming || outgoing => {
                let Some(nano) = body["amount"]
                    .as_u64()
                    .or_else(|| body["amount"].as_str()?.parse().ok())
                else {
                    continue;
                };
                if nano < minimum * 1_000_000_000 {
                    continue;
                }
                lines.push(format!(
                    "{side} · {}.{:09} GRAM",
                    nano / 1_000_000_000,
                    nano % 1_000_000_000
                ));
            }
            "JettonTransfer" => lines.push(format!("{side} · Jetton")),
            "NftItemTransfer" => lines.push(format!("{side} · NFT")),
            "SmartContractExec" if direction == "all" => lines.push("Вызов контракта".into()),
            _ => {}
        }
    }
    lines
}

async fn scan(c: &reqwest::Client, k: &Key, t: &str, raw: &str, rules: &Value) -> Result<()> {
    let wallet = &rules["wallets"][raw];
    let policy = if wallet.is_object() { wallet } else { rules };
    let name = rules["labels"][raw]
        .as_str()
        .filter(|name| !name.trim().is_empty())
        .unwrap_or("Кошелёк");
    let mut cursors: Value = serde_json::from_str(&field(k, "cursors")).unwrap_or(json!({}));
    let stop = cursors[raw].as_str().unwrap_or("");
    let mut before = String::new();
    let mut pending = Vec::new();
    loop {
        if field(k, "stop") == "1" {
            return Ok(());
        }
        let res = c
            .get(format!(
                "https://tonapi.io/v2/accounts/{raw}/events?limit=50{before}"
            ))
            .send()
            .await
            .map_err(|_| "OpenTonAPI недоступен")?
            .error_for_status()
            .map_err(|_| "Ошибка OpenTonAPI")?;
        let page: Value =
            serde_json::from_slice(&res.bytes().await.map_err(|_| "Обрыв загрузки событий")?)
                .map_err(|_| "Некорректная история")?;
        let rows = page["events"].as_array().ok_or("Нет списка событий")?;
        let mut reached = false;
        for e in rows {
            if e["in_progress"] == true {
                continue;
            }
            let id = e["event_id"].as_str().ok_or("Нет ID события")?;
            if id == stop {
                reached = true;
                break;
            }
            if stop.is_empty() {
                cursors[raw] = json!(id);
                return save(k, "cursors", &cursors.to_string());
            }
            pending.push(e.clone());
        }
        if reached || rows.is_empty() {
            break;
        }
        let Some(lt) = page["next_from"].as_u64() else {
            break;
        };
        let next = format!("&before_lt={lt}");
        if next == before {
            return Err("Повтор курсора OpenTonAPI".into());
        }
        before = next;
    }
    if stop.is_empty() {
        cursors[raw] = json!("empty");
        return save(k, "cursors", &cursors.to_string());
    }
    for e in pending.iter().rev() {
        if field(k, "stop") == "1" {
            break;
        }
        let lines = matching_actions(e, raw, policy);
        if !lines.is_empty() {
            let id = e["event_id"].as_str().unwrap_or("");
            if id.len() != 64 || !id.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err("Некорректный ID события".into());
            }
            let timestamp = e["timestamp"].as_i64();
            let time = event_time(timestamp);
            let address = display_address(raw)?;
            let name = escape_html(name);
            let reason = if wallet.is_object() {
                "Правило адреса"
            } else {
                "Общее правило"
            };
            let minimum = policy["minimum"].as_u64().unwrap_or(0);
            let threshold = if minimum > 0 && lines.iter().any(|line| line.ends_with(" GRAM")) {
                format!(" · от {minimum} GRAM")
            } else {
                String::new()
            };
            let graph = event_graph_link(&address, id, timestamp);
            let transaction = e["actions"].as_array().into_iter().flatten()
                .filter_map(|action| action["base_transactions"].as_array())
                .flatten().filter_map(Value::as_str)
                .find(|hash| hash.len() == 64 && hash.bytes().all(|byte| byte.is_ascii_hexdigit()))
                .map(|hash| format!("<tg-button type=\"url\" url=\"https://tonviewer.com/transaction/{hash}\">Открыть транзакцию</tg-button>"))
                .unwrap_or_default();
            let html=format!("<h2>Gramix Watchtower</h2><p><b>{}</b></p><p>{name} · <code>{address}</code></p><p>{reason}{threshold} · Mainnet · подтверждено{time}</p><tg-button-row><tg-button type=\"url\" style=\"primary\" url=\"{graph}\">Открыть на графе</tg-button>{transaction}</tg-button-row>",lines.join(" · "));
            api(c,t,"sendRichMessage",json!({"chat_id":field(k,"chat"),"rich_message":{"html":html,"skip_entity_detection":true}})).await?;
        }
        cursors[raw] = e["event_id"].clone();
        save(k, "cursors", &cursors.to_string())?;
    }
    Ok(())
}
pub fn worker() -> Result<()> {
    let lock = lock_file()?;
    if lock.try_lock().is_err() {
        return Ok(());
    }
    let k = settings()?;
    save(&k, "stop", "0")?;
    let token = credential(None)?;
    let c = client()?;
    loop {
        let result = tauri::async_runtime::block_on(async {
            messages(&c, &k, &token).await?;
            let rules: Value = serde_json::from_str(&field(&k, "rules")).unwrap_or(Value::Null);
            let mut failure = None;
            if !field(&k, "chat").is_empty() {
                for addr in rules["addresses"].as_array().into_iter().flatten() {
                    if field(&k, "stop") == "1" {
                        break;
                    }
                    if let Some(raw) = addr.as_str().filter(|s| raw_ok(s)) {
                        if let Err(e) = scan(&c, &k, &token, raw, &rules).await {
                            failure = Some(e)
                        }
                    }
                    std::thread::sleep(Duration::from_millis(1100));
                }
            }
            failure.map_or(Ok(()), Err)
        });
        save(
            &k,
            "message",
            result
                .as_ref()
                .err()
                .map(String::as_str)
                .unwrap_or("Соединение установлено"),
        )?;
        for _ in 0..if result.is_ok() { 8 } else { 30 } {
            if field(&k, "stop") == "1" {
                return Ok(());
            }
            std::thread::sleep(Duration::from_secs(1))
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn address_rules_filter_direction_asset_threshold_and_status() {
        let transfer = |sender: &str, recipient: &str, amount: &str, status: &str| {
            json!({
                "type": "TonTransfer", "status": status,
                "TonTransfer": { "sender":{"address":sender}, "recipient":{"address":recipient},"amount": amount }
            })
        };
        let event = json!({"actions":[transfer("other","wallet","1000000000000","ok"),
            transfer("other","wallet","999999999999","ok"), transfer("wallet","other","2000000000000","ok"),
            transfer("other","wallet","2000000000000","failed"),transfer("wallet","wallet","2000000000000","ok")]});
        let inbound = json!({"direction":"in","minimum":1000,"kinds":["TonTransfer"]});
        assert_eq!(
            matching_actions(&event, "wallet", &inbound),
            ["Входящий перевод · 1000.000000000 GRAM"]
        );
        assert!(matching_actions(&event, "wallet", &json!({"kinds":[]})).is_empty());
    }

    #[test]
    fn graph_links_include_the_event_and_its_time_window() {
        let url = event_graph_link("EQexample", "abc", Some(10_000));
        assert!(url.ends_with("address=EQexample&amp;event=abc&amp;from=6400&amp;until=13601"));
        assert_eq!(escape_html("<wallet>&"), "&lt;wallet&gt;&amp;");
    }

    use super::*;

    #[test]
    fn formats_telegram_address_and_clickable_time() {
        assert_eq!(
            display_address(&format!("0:{}", "00".repeat(32))).unwrap(),
            "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
        );
        let label = event_time(Some(1_700_000_000));
        assert!(label.contains(r#"unix="1700000000">"#));
        assert!(label.contains("2023"));
        assert!(event_time(None).is_empty());
    }
}
