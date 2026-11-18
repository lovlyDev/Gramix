/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { preview } from "vite";
import { beginCell } from "@ton/core";

const browserCandidates = [process.env.VANTIX_E2E_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/chromium", "/usr/bin/google-chrome"].filter(Boolean);
const executablePath = browserCandidates.find((path) => existsSync(path));
if (!executablePath) throw new Error("Укажите VANTIX_E2E_BROWSER: браузер для smoke-теста не найден.");

const server = await preview({ preview: { host: "127.0.0.1", port: 1428, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("http://127.0.0.1:1428/#overview");

  const routes = [
    ["generator", "Поиск адреса"], ["wallet-generator", "Новый кошелёк"],
    ["wallet-security", "Проверка кошелька"], ["address-inspector", "Проверка адреса"],
    ["transaction-decoder", "Транзакции"], ["boc-explorer", "BOC Explorer"],
    ["contract-inspector", "Контракты"], ["contract-vanity", "Contract Vanity"],
    ["contract-sandbox", "Sandbox"], ["contract-builder", "Builder"],
    ["gpu-benchmark", "GPU Benchmark"], ["developer-cli", "Developer CLI"],
  ];
  const screenshotDir = join(process.cwd(), "..", "build", "visual", "e2e");
  if (process.env.VANTIX_E2E_SCREENSHOTS === "1") mkdirSync(screenshotDir, { recursive: true });
  for (const [route, title] of routes) {
    await page.evaluate((value) => { location.hash = value; }, route);
    await page.waitForFunction((value) =>
      document.querySelector(".screen-heading strong")?.textContent === value, title);
    const activeScreen = route === "generator" ? ".vanity-screen:not([hidden])" :
      ".tool-screen:not([hidden])";
    await page.locator(activeScreen).waitFor();
    assert.equal(await page.locator(activeScreen).count(), 1, route);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false,
      `${route}: горизонтальная прокрутка при 1024px`);
    if (process.env.VANTIX_E2E_SCREENSHOTS === "1")
      await page.screenshot({ path: join(screenshotDir, `${route}-1024.png`) });
  }

  await page.evaluate(() => { location.hash = "generator"; });
  await page.getByRole("combobox", { name: "Тип совпадения" }).click();
  const searchDropdown = await page.locator(".ui-select-content").evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    selected: element.querySelectorAll('.ui-select-item[data-state="checked"]').length,
  }));
  assert.match(searchDropdown.animation, /dropdown-in/);
  assert.equal(searchDropdown.selected, 1);
  await page.waitForTimeout(220);
  assert.equal(await page.locator(".ui-select-content").evaluate((element) =>
    getComputedStyle(element).opacity), "1");
  if (process.env.VANTIX_E2E_SCREENSHOTS === "1")
    await page.screenshot({ path: join(screenshotDir, "select-search-open-1024.png") });
  await page.keyboard.press("Escape");
  await page.evaluate(() => { location.hash = "wallet-generator"; });
  await page.getByRole("combobox", { name: "Формат публичного адреса" }).click();
  assert.equal(await page.locator(".ui-select-content .ui-select-item").count(), 2);
  await page.waitForTimeout(220);
  if (process.env.VANTIX_E2E_SCREENSHOTS === "1")
    await page.screenshot({ path: join(screenshotDir, "select-wallet-open-1024.png") });
  await page.keyboard.press("Escape");

  await page.evaluate(() => { location.hash = "wallet-generator"; });
  await page.locator(".top").getByRole("button", { name: "Блокчейн", exact: true }).click();
  const blockchainMenu = page.getByRole("menu", { name: "Блокчейн" });
  await blockchainMenu.waitFor();
  assert.equal(await blockchainMenu.getByRole("menuitem").count(), 4);
  if (process.env.VANTIX_E2E_SCREENSHOTS === "1")
    await page.screenshot({ path: join(screenshotDir, "header-menu-1024.png") });
  await blockchainMenu.getByRole("menuitem", { name: "BOC Explorer" }).click();
  await page.waitForFunction(() =>
    document.querySelector(".screen-heading strong")?.textContent === "BOC Explorer");
  assert.equal(await page.getByRole("menu", { name: "Блокчейн" }).count(), 0, "Меню закрывается после выбора");
  const rawAddress = `0:${"1".repeat(64)}`;
  await page.getByRole("textbox", { name: "Поиск по VANTIX", exact: true }).fill(rawAddress);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document.querySelector(".screen-heading strong")?.textContent === "Проверка адреса");
  assert.equal(await page.locator("#address-value").inputValue(), rawAddress);

  if (process.env.VANTIX_E2E_SCREENSHOTS === "1") {
    for (const [theme, button] of [["light", "Светлая"], ["dark", "Тёмная"]]) {
      await page.evaluate(() => { location.hash = "settings"; });
      await page.getByRole("tab", { name: "Интерфейс" }).click();
      await page.getByRole("button", { name: button, exact: true }).click();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
      await page.screenshot({ path: join(screenshotDir, `settings-${theme}-1024.png`) });
      await page.getByRole("tab", { name: "О программе" }).click();
      await page.locator(".about-markdown h1").first().waitFor();
      await page.getByRole("button", { name: "GNU AGPLv3" }).click();
      await page.locator(".about-document pre").waitFor();
      await page.getByRole("button", { name: "README · Русский" }).click();
      await page.screenshot({ path: join(screenshotDir, `about-${theme}-1024.png`) });
      for (const [route, title] of routes) {
        await page.evaluate((value) => { location.hash = value; }, route);
        await page.waitForFunction((value) =>
          document.querySelector(".screen-heading strong")?.textContent === value, title);
        await page.screenshot({ path: join(screenshotDir, `${route}-${theme}-1024.png`) });
      }
    }
    await page.evaluate(() => { location.hash = "settings"; });
    await page.getByRole("tab", { name: "Интерфейс" }).click();
    await page.getByRole("button", { name: "OLED", exact: true }).click();
  }

  for (const width of [819, 683]) {
    await page.setViewportSize({ width, height: 768 });
    for (const route of ["wallet-generator", "settings", "gpu-benchmark",
      "contract-builder", "boc-explorer"]) {
      await page.evaluate((value) => { location.hash = value; }, route);
      await page.waitForFunction((value) => {
        const active = document.querySelector(".tool-screen:not([hidden])");
        return active?.querySelector(`#${value}`) !== null ||
          value === "settings" && active?.querySelector(".workspace-settings-page") !== null;
      }, route);
      const overflow = await page.evaluate(() => {
        const main = document.querySelector("main");
        return document.documentElement.scrollWidth > innerWidth ||
          Boolean(main && main.scrollWidth > main.clientWidth);
      });
      assert.equal(overflow, false, `${route}: горизонтальная прокрутка при ${width}px`);
      if (width === 683 && route === "wallet-generator" && process.env.VANTIX_E2E_SCREENSHOTS === "1")
        await page.screenshot({ path: join(screenshotDir, "wallet-generator-683.png") });
    }
  }
  for (const width of [1366, 1920]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 768 });
    for (const route of ["generator", "wallet-generator", "settings", "gpu-benchmark",
      "contract-builder", "boc-explorer"]) {
      await page.evaluate((value) => { location.hash = value; }, route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false, `${route}: горизонтальная прокрутка при ${width}px`);
    }
  }
  await page.setViewportSize({ width: 1024, height: 768 });

  await page.evaluate(() => { location.hash = "wallet-generator"; });
  await page.getByRole("radio", { name: /24 слова/ }).check();
  assert.equal(await page.getByRole("radio", { name: /24 слова/ }).isChecked(), true);
  assert.equal(await page.getByRole("button", { name: "Сгенерировать", exact: true }).isDisabled(), true);
  const focus = await page.getByRole("radio", { name: /24 слова/ }).evaluate((element) => {
    element.focus();
    const label = element.closest("label");
    return label ? getComputedStyle(label).outlineStyle : "missing";
  });
  assert.equal(focus, "none", "Вокруг плитки схемы не должно быть отдельного внешнего кольца");

  const publicAddress = `0:${"0".repeat(64)}`;
  await page.evaluate((address) => {
    window.dispatchEvent(new CustomEvent("vantix:verify-wallet", { detail: {
      address, scheme: "24", version: "v4",
    } }));
    location.hash = "wallet-security";
  }, publicAddress);
  await page.getByRole("tab", { name: "Recovery phrase" }).click();
  assert.deepEqual(await page.locator(".security-selectors button").allTextContents(),
    ["24 слова · TON Native", "Wallet V4R2"]);
  assert.equal(await page.locator(".security-form-fields input[placeholder='EQ… / UQ… / 0:…']").first().inputValue(),
    publicAddress);

  await page.evaluate(() => { location.hash = "boc-explorer"; });
  const boc = Buffer.from(beginCell().storeUint(0xabc, 12).endCell().toBoc()).toString("base64");
  await page.locator("#boc-explorer textarea").first().fill(boc);
  await page.getByRole("button", { name: "Разобрать текст" }).click();
  await page.locator(".boc-summary").getByText("Узлов: 1").waitFor();
  await page.getByRole("tab", { name: "Хеши" }).click();
  await page.getByRole("button", { name: "Копировать хеш" }).click();
  await page.getByRole("button", { name: "Скопировано" }).waitFor();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^[0-9a-f]{64}$/i);
  await page.getByRole("button", { name: "Копировать хеш" }).waitFor({ timeout: 5500 });
  await page.locator("#boc-explorer textarea").first().fill("INVALID");
  await page.getByRole("button", { name: "Разобрать текст" }).click();
  await page.locator("#boc-explorer .error-box").waitFor();

  await page.evaluate(() => { location.hash = "settings"; });
  await page.getByRole("tab", { name: "О программе" }).click();
  assert.equal(await page.getByRole("button", { name: "Сторонние компоненты" }).count(), 0);
  await page.getByRole("tab", { name: "Интерфейс" }).click();
  await page.getByRole("button", { name: "Светлая" }).click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  await page.getByRole("button", { name: "OLED" }).click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "oled");
  assert.deepEqual(pageErrors, [], "Ошибки JavaScript в браузере");
  console.log(`UI smoke: ${routes.length} инструментов, кошелёк, BOC и темы — OK`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
