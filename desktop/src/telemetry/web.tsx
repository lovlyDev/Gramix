/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Телеметрия сайта gram.lovlydev.ru. Этот модуль подключается только в сборке сайта.
// Ничего не отправляется до согласия посетителя. На экранах с фразами восстановления
// (элементы с атрибутом data-telemetry-off) события не отправляются совсем.
import { useEffect, useState } from "react";
import type { Telemetry, TrackEvent } from "./types";

const CONSENT_KEY = "gramix.telemetry.consent";
const DEVICE_KEY = "gramix.telemetry.device";
const endpoint = import.meta.env.VITE_TELEMETRY_URL || "";
const website = import.meta.env.VITE_TELEMETRY_SITE_ID || "";
let sessionId = "";

function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string | null) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* приватный режим */ }
}
function deviceId() {
  let id = read(DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); write(DEVICE_KEY, id); }
  return id;
}
const secretOnScreen = () => document.querySelector("[data-telemetry-off]:not([hidden])") !== null;

function send(event: TrackEvent) {
  if (!endpoint || !website || telemetry.consent() !== "granted" || secretOnScreen()) return;
  if (!sessionId) sessionId = crypto.randomUUID();
  const { name, ...data } = event;
  const body = JSON.stringify({ type: "event", payload: {
    website, hostname: location.hostname, url: location.pathname, title: document.title,
    language: navigator.language, screen: `${screen.width}x${screen.height}`,
    referrer: document.referrer ? new URL(document.referrer).origin : "",
    // Просмотр страницы Umami принимает без имени события, остальное — как именованные события.
    ...(name === "page_view" ? { url: (data as { path?: string }).path ?? location.pathname } : { name }),
    data: { ...data, device: deviceId(), session: sessionId },
  } });
  void fetch(endpoint, { method: "POST", body, keepalive: true, credentials: "omit",
    headers: { "Content-Type": "application/json" } }).catch(() => undefined);
}

// Клики: только описание элемента интерфейса (data-track, aria-label, роль), без текста и значений полей.
function describe(target: Element) {
  const element = target.closest("[data-track], button, a, [role='tab'], [role='menuitem'], [role='option']");
  if (!element || element.closest("input, textarea, [contenteditable='true']")) return null;
  const tracked = element.getAttribute("data-track");
  if (tracked) return tracked;
  const label = element.getAttribute("aria-label") || element.getAttribute("title");
  const kind = element.tagName.toLowerCase();
  if (label) return `${kind}:${label.slice(0, 80)}`;
  const className = (element.getAttribute("class") || "").split(/\s+/).filter(Boolean)[0];
  return className ? `${kind}.${className}` : kind;
}
let clicksInstalled = false;
function installClicks() {
  if (clicksInstalled) return;
  clicksInstalled = true;
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = describe(event.target);
    if (!target) return;
    send({ name: "click", target, tool: location.pathname.split("/")[1] || "overview",
      x: Math.round(event.clientX / innerWidth * 1000) / 1000, y: Math.round(event.clientY / innerHeight * 1000) / 1000 });
  }, { capture: true, passive: true });
}

export const telemetry: Telemetry = {
  enabled: Boolean(endpoint && website),
  track: send,
  consent() {
    const value = read(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unknown";
  },
  setConsent(value) {
    write(CONSENT_KEY, value ? "granted" : "denied");
    if (value) { installClicks(); send({ name: "page_view", path: location.pathname, tool: location.pathname.split("/")[1] || "overview" }); }
    else write(DEVICE_KEY, null);
  },
};
if (telemetry.consent() === "granted") installClicks();

export function ConsentBanner({ onPrivacy }: { onPrivacy?: () => void }) {
  const [state, setState] = useState(telemetry.consent());
  useEffect(() => { if (state === "granted") installClicks(); }, [state]);
  if (!telemetry.enabled || state !== "unknown") return null;
  return <div className="consent" role="dialog" aria-label="Сбор статистики">
    <div className="consent-copy"><b>Статистика сайта</b>
      <span>С вашего согласия сайт собирает обезличенный идентификатор устройства, просмотры страниц, нажатия
        и проверенные публичные адреса, чтобы улучшать инструменты. Фразы восстановления и ключи не собираются.{" "}
        {onPrivacy && <button type="button" className="consent-link" onClick={onPrivacy}>Подробнее</button>}</span></div>
    <div className="consent-actions">
      <button type="button" className="btn" onClick={() => { telemetry.setConsent(false); setState("denied"); }}>Отказаться</button>
      <button type="button" className="btn solid" onClick={() => { telemetry.setConsent(true); setState("granted"); }}>Принять</button>
    </div>
  </div>;
}
