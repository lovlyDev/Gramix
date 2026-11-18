/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { errorText } from "../../lib/errors";
import { pasteText } from "../../lib/clipboard";
import { exactGram, formatGram } from "../../lib/format";
import { platform } from "@platform";
import { telemetry } from "@telemetry";
import type { AccountResult, AddressResult } from "../../platform/types";
import PublicAddressQr from "../../components/PublicAddressQr";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";

export default function AddressInspector() {
  const [input, setInput] = useState("");
  const [autoRun, setAutoRun] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (autoRun && input === autoRun) { setAutoRun(""); formRef.current?.requestSubmit(); }
  }, [autoRun, input]);
  useEffect(() => {
    const receive = (event: Event) => {
      const address = (event as CustomEvent<string>).detail;
      if (typeof address === "string") { setInput(address); setAutoRun(address); }
    };
    window.addEventListener("gramix:inspect-address", receive);
    return () => window.removeEventListener("gramix:inspect-address", receive);
  }, []);
  useEffect(() => {
    const receive = (event: Event) => {
      const network = (event as CustomEvent<"mainnet" | "testnet">).detail;
      if (network !== "mainnet" && network !== "testnet") return;
      setNetwork(network); setAccount(null); setNetworkError("");
    };
    window.addEventListener("gramix:default-network", receive);
    return () => window.removeEventListener("gramix:default-network", receive);
  }, []);
  const [result, setResult] = useState<AddressResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<AccountResult | null>(null);
  const [networkError, setNetworkError] = useState("");
  const [networkBusy, setNetworkBusy] = useState(false);
  const [network, setNetwork] = useState<"mainnet" | "testnet">(() =>
    localStorage.getItem("gramix.network.default") === "testnet" ? "testnet" : "mainnet");

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setAccount(null);
    setError("");
    setBusy(true);
    try {
      const inspected = await platform.inspectAddress(input.trim());
      setResult(inspected);
      telemetry.track({ name: "address_checked", address: inspected.raw, network: inspected.input_testnet ? "testnet" : "mainnet" });
      if (inspected.input_testnet !== null)
        setNetwork(inspected.input_testnet ? "testnet" : "mainnet");
    } catch (cause) {
      setError(errorText(cause));
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
      const data = await platform.fetchAccount(result.raw, network === "testnet");
      setAccount(data);
      telemetry.track({ name: "account_loaded", address: data.raw, network: data.network, status: data.status });
    } catch (cause) {
      setNetworkError(errorText(cause));
    } finally {
      setNetworkBusy(false);
    }
  }

  async function pasteAddress() {
    try {
      setInput((await pasteText()).trim());
      setResult(null); setAccount(null); setError(""); setNetworkError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось прочитать буфер обмена."); }
  }
  function clear() {
    setInput(""); setResult(null); setAccount(null); setError("");
    setNetworkError("");
  }

  return <section className="panel address-inspector" id="address-inspector" aria-labelledby="address-title">
    <div className="panel-heading"><div>
      <h2 id="address-title">Проверка GRAM-адреса</h2>
      <p>Локальная проверка raw и friendly форматов, флагов и контрольной суммы</p>
    </div></div>
    <form ref={formRef} className="address-workspace-form" onSubmit={(event) => void inspect(event)}>
      <label className="field-label" htmlFor="address-value">Адрес GRAM</label>
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
        <p>Сетевой запрос выполняется только после нажатия кнопки. Публичный адрес будет отправлен в OpenTonAPI.</p>
      <div className="address-network">
        <Select label="Сеть" value={network} onValueChange={(value) => {
          setNetwork(value as "mainnet" | "testnet"); setAccount(null); setNetworkError("");
        }} options={[{ value: "mainnet", label: "Mainnet" },
          { value: "testnet", label: "Testnet" }]}/>
        <button type="button" onClick={() => void fetchAccount()} disabled={networkBusy}>
          {networkBusy ? "Запрашиваю…" : account ? "Обновить" : "Запросить состояние"}
        </button>
      </div>
      {networkError && <p className="error-box" role="alert">{networkError}</p>}
      {account && <div className="account-card" aria-live="polite">
        <div className="account-balance">
          <span>Баланс</span>
          <strong title={exactGram(account.balance_nanoton)}>{formatGram(account.balance_nanoton)}</strong>
        </div>
        <dl className="account-kv">
          <dt>Статус</dt><dd><span className={`badge ${account.status === "active" ? "ok" : account.status === "frozen" ? "fail" : ""}`}>{account.status}</span></dd>
          <dt>Тип</dt><dd>{account.is_wallet === null ? "нет данных" : account.is_wallet ? "Кошелёк" : "Контракт"}</dd>
          <dt>Последняя активность</dt><dd>{account.last_activity
            ? new Date(account.last_activity * 1000).toLocaleString("ru-RU") : "нет данных"}</dd>
          <dt>Источник</dt><dd>OpenTonAPI · {account.network} · {new Date(account.received_at * 1000).toLocaleTimeString("ru-RU")}</dd>
        </dl>
      </div>}
      <button className="address-open-contract" type="button" onClick={() => {
        window.dispatchEvent(new CustomEvent("gramix:contract-address", {
          detail: { address: result.raw, testnet: network === "testnet" },
        }));
        window.location.hash = "contract-inspector";
      }}>Открыть в «Контрактах»</button>
      </div>
    </div>}
  </section>;
}
