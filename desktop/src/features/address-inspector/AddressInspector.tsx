/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useState, type FormEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import PublicAddressQr from "../../components/PublicAddressQr";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";

type AddressResult = {
  source: "local";
  raw: string;
  workchain: number;
  input_format: "raw" | "friendly";
  input_bounceable: boolean | null;
  input_testnet: boolean | null;
  bounceable: string;
  non_bounceable: string;
};

type AccountResult = {
  source: "OpenTonAPI";
  network: "mainnet" | "testnet";
  raw: string;
  status: string;
  balance_nanoton: string;
  last_activity: number | null;
  is_wallet: boolean | null;
  received_at: number;
};

export default function AddressInspector() {
  const [input, setInput] = useState("");
  useEffect(() => {
    const receive = (event: Event) => {
      const address = (event as CustomEvent<string>).detail;
      if (typeof address === "string") setInput(address);
    };
    window.addEventListener("vantix:inspect-address", receive);
    return () => window.removeEventListener("vantix:inspect-address", receive);
  }, []);
  useEffect(() => {
    const receive = (event: Event) => {
      const network = (event as CustomEvent<"mainnet" | "testnet">).detail;
      if (network !== "mainnet" && network !== "testnet") return;
      setNetwork(network); setAccount(null); setNetworkError("");
    };
    window.addEventListener("vantix:default-network", receive);
    return () => window.removeEventListener("vantix:default-network", receive);
  }, []);
  const [result, setResult] = useState<AddressResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<AccountResult | null>(null);
  const [networkError, setNetworkError] = useState("");
  const [networkBusy, setNetworkBusy] = useState(false);
  const [network, setNetwork] = useState<"mainnet" | "testnet">(() =>
    localStorage.getItem("vantix.network.default") === "testnet" ? "testnet" : "mainnet");

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setAccount(null);
    setError("");
    if (!isTauri()) {
      setError("Локальная проверка доступна в установленном приложении VANTIX.");
      return;
    }
    setBusy(true);
    try {
      const output = await Command.sidecar("binaries/vantix",
        ["address", "inspect", input.trim(), "--json"]).execute();
      if (output.code !== 0) throw new Error(output.stderr.trim() || "Адрес не прошёл проверку.");
      const inspected = JSON.parse(output.stdout) as AddressResult;
      setResult(inspected);
      if (inspected.input_testnet !== null)
        setNetwork(inspected.input_testnet ? "testnet" : "mainnet");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function fetchAccount() {
    if (!result || networkBusy) return;
    setAccount(null);
    setNetworkError("");
    setNetworkBusy(true);
    try {
      const data = await invoke<AccountResult>("fetch_account", {
        raw: result.raw, testnet: network === "testnet",
      });
      setAccount(data);
    } catch (cause) {
      setNetworkError(String(cause));
    } finally {
      setNetworkBusy(false);
    }
  }

  async function pasteAddress() {
    try {
      setInput((await navigator.clipboard.readText()).trim());
      setResult(null); setAccount(null); setError(""); setNetworkError("");
    } catch { setError("Не удалось прочитать буфер обмена."); }
  }
  function clear() {
    setInput(""); setResult(null); setAccount(null); setError("");
    setNetworkError("");
  }

  return <section className="panel address-inspector" id="address-inspector" aria-labelledby="address-title">
    <div className="panel-heading"><div>
      <h2 id="address-title">Проверка TON-адреса</h2>
      <p>Локальная проверка raw и friendly форматов, флагов и контрольной суммы</p>
    </div></div>
    <form className="address-workspace-form" onSubmit={(event) => void inspect(event)}>
      <label className="field-label" htmlFor="address-value">Адрес TON</label>
      <input id="address-value" className="address-input" value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setResult(null);
          setAccount(null);
          setError("");
          setNetworkError("");
        }} maxLength={80}
        autoComplete="off" spellCheck={false}
        placeholder="EQ… или 0:…" />
      <div className="address-input-actions"><button className="primary-button" disabled={busy || input.trim().length === 0}>
        {busy ? "Проверяю…" : "Проверить адрес"}</button>
        <button type="button" onClick={() => void pasteAddress()} disabled={busy}>Вставить</button>
        <button type="button" onClick={clear} disabled={busy || (!input && !result)}>Очистить</button></div>
    </form>
    {error && <p className="error-box" role="alert">{error}</p>}
    {!result && !error && <div className="address-empty-grid">
      <div><h3>Локальный анализ</h3><p>Проверяет raw или friendly адрес, флаги и контрольную сумму без подключения к сети.</p></div>
      <div><h3>Публичные данные сети</h3><p>После локальной проверки можно отдельно запросить состояние аккаунта.</p></div>
    </div>}
    {result && <div className="address-result" aria-live="polite">
      <div className="address-properties"><div className="address-result-heading"><h3>Локальная проверка</h3>
        <span className="address-valid-badge">Адрес корректен</span></div>
      <p>Формат и контрольная сумма проверены на этом компьютере.</p>
      <div className="address-meta">
        <span>Workchain: {result.workchain}</span>
        <span>Вход: {result.input_format === "raw" ? "raw" :
          `${result.input_testnet ? "testnet" : "mainnet"}, ${result.input_bounceable ? "bounceable" : "non-bounceable"}`}</span>
      </div>
      {([
        ["Raw", result.raw],
        ["Bounceable", result.bounceable],
        ["Non-bounceable", result.non_bounceable],
      ] as const).map(([label, value]) => <div className="address-row" key={label}>
        <div><strong>{label}</strong><code>{value}</code></div>
        <CopyButton value={value} label={`Копировать ${label}`}
          onCopyError={() => setError("Не удалось скопировать адрес.")} />
      </div>)}
      <PublicAddressQr address={result.bounceable} label="QR адреса" />
      </div>
      <div className="address-network-pane"><h3>Публичные данные сети</h3>
        <p>Сетевой запрос выполняется только после нажатия кнопки.</p>
      <div className="address-network"><label>Сеть
        <Select label="Сеть" value={network} onValueChange={(value) => {
          setNetwork(value as "mainnet" | "testnet"); setAccount(null); setNetworkError("");
        }} options={[{ value: "mainnet", label: "Mainnet" },
          { value: "testnet", label: "Testnet" }]}/>
      </label>
        <button type="button" onClick={() => void fetchAccount()} disabled={networkBusy}>
          {networkBusy ? "Запрашиваю…" : "Запросить состояние аккаунта"}
        </button>
        <span>Публичный адрес будет отправлен в OpenTonAPI.</span>
      </div>
      <button className="address-open-contract" type="button" onClick={() => {
        window.dispatchEvent(new CustomEvent("vantix:contract-address", {
          detail: { address: result.raw, testnet: network === "testnet" },
        }));
        window.location.hash = "contract-inspector";
      }}>Открыть в «Контрактах»</button>
      {networkError && <p className="error-box" role="alert">{networkError}</p>}
      {account && <div className="account-result" aria-live="polite">
        <strong>Ответ OpenTonAPI · {account.network}</strong>
        <span>Получен {new Date(account.received_at * 1000).toLocaleString("ru-RU")}</span>
        <span>Статус: {account.status}</span>
        <span>Баланс: {account.balance_nanoton} nanotON</span>
        <span>Последняя активность: {account.last_activity
          ? new Date(account.last_activity * 1000).toLocaleString("ru-RU") : "нет данных"}</span>
        <span>Определён как кошелёк: {account.is_wallet === null
          ? "нет данных" : account.is_wallet ? "да" : "нет"}</span>
      </div>}
      </div>
    </div>}
  </section>;
}
