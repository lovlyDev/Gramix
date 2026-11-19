/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Smoke-тест сайта gram.lovlydev.ru по сборке dist-web. Сетевые запросы к tonapi не нужны.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";
import { preview } from "vite";

const browserCandidates = [process.env.GRAMIX_E2E_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/chromium", "/usr/bin/google-chrome"].filter(Boolean);
const executablePath = browserCandidates.find((path) => existsSync(path));
if (!executablePath) throw new Error("Укажите GRAMIX_E2E_BROWSER: браузер для smoke-теста не найден.");
assert.ok(existsSync("dist-web/404.html") && existsSync("dist-web/CNAME"), "Нет 404.html или CNAME в dist-web");

const base = "http://127.0.0.1:1427";
const server = await preview({ mode: "web", preview: { host: "127.0.0.1", port: 1427, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 850 }, locale: "ru-RU" });
  const pageErrors = [];
  const external = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if (url.hostname !== "127.0.0.1") external.push(url.hostname); });
  const heading = () => page.evaluate(() => document.querySelector(".screen-heading strong")?.textContent ?? "overview");

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  assert.equal(await page.title(), "Gramix — инструменты GRAM");
  assert.equal(await page.locator("a", { hasText: "Исходный код" }).count(), 1, "Нет ссылки на исходники (AGPL §13)");
  assert.equal(external.length, 0, `Внешние запросы до действий пользователя: ${external.join(", ")}`);

  const raw = `0:${"1".repeat(64)}`;
  await page.goto(`${base}/address/${raw}`, { waitUntil: "networkidle" });
  await page.locator(".address-result").waitFor();
  assert.equal(await heading(), "Проверка адреса");

  await page.goto(`${base}/developer-cli`, { waitUntil: "networkidle" });
  assert.equal(await heading(), "overview", "Developer CLI не должен открываться на сайте");

  await page.goto(`${base}/generator`, { waitUntil: "networkidle" });
  await page.locator("#pattern").fill("a");
  await page.getByRole("button", { name: /Начать поиск/ }).click();
  await page.locator(".reveal-button").waitFor({ timeout: 60_000 });
  await page.locator(".reveal-button").click();
  assert.equal(await page.locator(".phrase-word").count(), 12, "Фраза найденного адреса не показана");
  await page.keyboard.press("Escape");

  await page.goto(`${base}/wallet-generator`, { waitUntil: "networkidle" });
  await page.getByRole("checkbox").first().click();
  await page.getByRole("button", { name: "Сгенерировать", exact: true }).click();
  await page.locator(".wallet-data-row code").first().waitFor();
  await page.getByRole("button", { name: "Раскрыть фразу" }).click();
  await page.getByRole("button", { name: "Я понимаю, показать фразу" }).click();
  await page.locator(".phrase-word").first().waitFor();
  assert.equal(await page.locator(".phrase-word").count(), 12, "Фраза нового кошелька не показана");
  await page.keyboard.press("Escape");

  await page.goto(`${base}/wallet-security`, { waitUntil: "networkidle" });
  assert.equal(await page.getByRole("tab", { name: /Recovery phrase/ }).count(), 0, "Ввод фразы на сайте запрещён");

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Поиск по Gramix", exact: true })
    .fill("https://tonviewer.com/EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/address\/EQBvW8Z5/);
  assert.equal(await heading(), "Проверка адреса");

  // Английский интерфейс: браузер с английским языком получает перевод без русских строк.
  const english = await browser.newPage({ viewport: { width: 1360, height: 850 }, locale: "en-US" });
  english.on("pageerror", (error) => pageErrors.push(error.message));
  await english.goto(`${base}/wallet-generator`, { waitUntil: "networkidle" });
  assert.equal(await english.evaluate(() => document.documentElement.lang), "en");
  await english.getByRole("button", { name: "Generate", exact: true }).waitFor();
  const russian = await english.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const found = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if (/[А-Яа-яЁё]/.test(node.nodeValue) && !node.parentElement.closest("[hidden],code,pre")) found.push(node.nodeValue.trim());
    return found;
  });
  assert.deepEqual(russian, [], "Русский текст в английском интерфейсе");
  await english.close();

  assert.deepEqual(pageErrors, [], "Ошибки JavaScript на сайте");
  console.log("Site smoke: ссылки, поиск адреса, кошелёк, ограничения сайта — OK");
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
