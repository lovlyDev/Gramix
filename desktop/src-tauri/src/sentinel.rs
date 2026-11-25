/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

use serde_json::{json, Value};
use std::{
    fs::{self, File},
    time::Duration,
};
use windows_registry::{Key, CURRENT_USER};
use windows_sys::Win32::Security::Credentials::*;
type Result<T> = std::result::Result<T, String>;
const SETTINGS: &str = r"Software\Gramix\Sentinel";
const RUN: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const ENTRY: &str = "Gramix Sentinel";
fn settings() -> Result<Key> {
    CURRENT_USER
        .create(SETTINGS)
        .map_err(|_| "Настройки Windows недоступны".into())
}
fn field(k: &Key, n: &str) -> String {
    k.get_string(n).unwrap_or_default()
}
fn save(k: &Key, n: &str, v: &str) -> Result<()> {
    k.set_string(n, v)
        .map_err(|_| "Не удалось сохранить настройки".into())
}
fn credential(token: Option<&str>) -> Result<String> {
    let target: Vec<u16> = "Gramix/Sentinel/Telegram\0".encode_utf16().collect();
    unsafe {
        if let Some(s) = token {
            let mut c: CREDENTIALW = std::mem::zeroed();
            c.Type = CRED_TYPE_GENERIC;
            c.TargetName = target.as_ptr() as _;
            c.Persist = CRED_PERSIST_LOCAL_MACHINE;
            c.CredentialBlob = s.as_ptr() as _;
            c.CredentialBlobSize = s.len() as u32;
            if CredWriteW(&c, 0) == 0 {
                return Err("Windows не сохранила токен".into());
            }
            Ok(String::new())
        } else {
            let mut p = std::ptr::null_mut();
            if CredReadW(target.as_ptr(), CRED_TYPE_GENERIC, 0, &mut p) == 0 {
                return Err("Сохраните токен бота".into());
            }
            let s = String::from_utf8(
                std::slice::from_raw_parts((*p).CredentialBlob, (*p).CredentialBlobSize as usize)
                    .to_vec(),
            );
            CredFree(p as _);
            s.map_err(|_| "Не удалось прочитать токен".into())
        }
    }
}
fn lock_file() -> Result<File> {
    let dir = std::path::PathBuf::from(std::env::var_os("LOCALAPPDATA").ok_or("Нет LOCALAPPDATA")?)
        .join("Gramix/Sentinel");
    fs::create_dir_all(&dir).map_err(|_| "Каталог Sentinel недоступен")?;
    File::options()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(dir.join("worker.lock"))
        .map_err(|_| "Не удалось открыть файл процесса".into())
}
fn running() -> Result<bool> {
    Ok(lock_file()?.try_lock().is_err())
}
fn client() -> Result<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Ошибка HTTPS".into())
}
async fn api(c: &reqwest::Client, t: &str, method: &str, data: Value) -> Result<Value> {
    let res = c
        .post(format!("https://api.telegram.org/bot{t}/{method}"))
        .header("Content-Type", "application/json")
        .body(data.to_string())
        .send()
        .await
        .map_err(|_| "Нет связи с Telegram")?;
    if !res.status().is_success() {
        return Err(format!("Telegram · HTTP {}", res.status().as_u16()));
    }
    let reply: Value =
        serde_json::from_slice(&res.bytes().await.map_err(|_| "Ошибка чтения Telegram")?)
            .map_err(|_| "Некорректный ответ Telegram")?;
    if reply["ok"] != true {
        return Err("Telegram отклонил запрос".into());
    }
    Ok(reply["result"].clone())
}
fn raw_ok(s: &str) -> bool {
    s.split_once(':').is_some_and(|(wc, h)| {
        wc.parse::<i8>().is_ok() && h.len() == 64 && h.bytes().all(|b| b.is_ascii_hexdigit())
    })
}
#[tauri::command]
pub async fn sentinel_bot(action: String, value: Option<Value>) -> Result<Value> {
    tauri::async_runtime::spawn_blocking(move || {
        tauri::async_runtime::block_on(bot_action(action, value))
    })
    .await
    .map_err(|_| "Ошибка настройки бота".to_string())?
}
async fn bot_action(action: String, value: Option<Value>) -> Result<Value> {
    let k = settings()?;
    let v = value.unwrap_or(Value::Null);
    match action.as_str() {
        "status" => {}
        "token" => {
            let token = v
                .as_str()
                .filter(|t| {
                    t.len() < 160
                        && t.split_once(':').is_some_and(|(id, s)| {
                            !id.is_empty()
                                && id.bytes().all(|b| b.is_ascii_digit())
                                && s.len() >= 30
                                && s.bytes()
                                    .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
                        })
                })
                .ok_or("Проверьте токен BotFather")?;
            let bot = api(&client()?, token, "getMe", json!({})).await?;
            if running()? {
                return Err("Сначала остановите процесс бота".into());
            }
            let id = bot["id"].as_i64().ok_or("Нет ID бота")?.to_string();
            if field(&k, "botId") != id {
                let mut buf = [0u8; 16];
                getrandom::fill(&mut buf).map_err(|_| "Ошибка генерации кода")?;
                save(
                    &k,
                    "pair",
                    &buf.iter().map(|v| format!("{v:02x}")).collect::<String>(),
                )?;
                for (key, val) in [("chat", ""), ("offset", "0"), ("cursors", "{}")] {
                    save(&k, key, val)?
                }
            }
            credential(Some(token))?;
            save(&k, "botId", &id)?;
            save(
                &k,
                "username",
                bot["username"].as_str().ok_or("Нет имени бота")?,
            )?;
        }
        "test" => {
            let chat = field(&k, "chat");
            if chat.is_empty() {
                return Err("Сначала привяжите чат".into());
            }
            api(&client()?,&credential(None)?,"sendRichMessage",json!({"chat_id":chat,"rich_message":{"html":"<h2>Gramix Sentinel</h2><p>Проверочное уведомление. Доставка в привязанный чат работает.</p>"}})).await?;
        }
        "rules" => {
            let list = v["addresses"]
                .as_array()
                .filter(|a| a.len() <= 200)
                .ok_or("Некорректный список")?;
            if list.iter().any(|a| !raw_ok(a.as_str().unwrap_or("")))
                || v["minimum"]
                    .as_u64()
                    .filter(|n| *n <= 1_000_000_000)
                    .is_none()
            {
                return Err("Проверьте адреса и порог".into());
            }
            save(&k, "rules", &v.to_string())?;
        }
        "autostart" => {
            let run = CURRENT_USER
                .create(RUN)
                .map_err(|_| "Автозапуск недоступен")?;
            if v.as_bool().ok_or("Нужен переключатель")? {
                credential(None)?;
                let exe = std::env::current_exe().map_err(|_| "Не найден Gramix")?;
                save(
                    &run,
                    ENTRY,
                    &format!("\"{}\" --sentinel-bot", exe.display()),
                )?;
            } else if run.get_string(ENTRY).is_ok() {
                run.remove_value(ENTRY)
                    .map_err(|_| "Не удалось отключить автозапуск")?
            }
        }
        "start" => {
            credential(None)?;
            if !running()? {
                std::process::Command::new(
                    std::env::current_exe().map_err(|_| "Не найден Gramix")?,
                )
                .arg("--sentinel-bot")
                .spawn()
                .map_err(|_| "Не удалось запустить бота")?;
            }
        }
        "stop" => save(&k, "stop", "1")?,
        _ => return Err("Неизвестная команда".into()),
    }
    Ok(
        json!({"running":running()?,"username":field(&k,"username"),"paired":!field(&k,"chat").is_empty(),"pair":field(&k,"pair"),
        "autostart":CURRENT_USER.open(RUN).and_then(|r|r.get_string(ENTRY)).is_ok(),
        "rules":serde_json::from_str::<Value>(&field(&k,"rules")).unwrap_or(json!({"addresses":[],"minimum":0})), "message":field(&k,"message")}),
    )
}

mod worker;
pub use worker::worker;
