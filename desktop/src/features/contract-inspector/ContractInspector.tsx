/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { exactGram, formatGram } from "../../lib/format";
import { Buffer } from "buffer";
import * as Tabs from "@radix-ui/react-tabs";
import { Download, FileCode2, RefreshCw, SearchCheck } from "lucide-react";
import { platform } from "@platform";
import { telemetry } from "@telemetry";
import { decodeBocText, parseBocBytes } from "../boc-explorer/bocService";
import Checkbox from "../../components/ui/Checkbox";
import CopyButton from "../../components/ui/CopyButton";

type ContractAccount = {
  source: "OpenTonAPI";
  network: "mainnet" | "testnet";
  raw: string;
  status: string;
  balance_nanoton: string;
  code_hex: string | null;
  data_hex: string | null;
  last_transaction_lt: string | null;
  last_transaction_hash: string | null;
  received_at: number;
};
type CodeInspection = {
  code_hex: string;
  code_hash: string;
  compiler: string | null;
  methods: string[];
  received_at: number;
};
type MethodResult = {
  method: string;
  args: string[];
  success: boolean;
  exit_code: number;
  stack: unknown[];
  decoded: unknown;
  received_at: number;
};

async function localHash(bocHex: string): Promise<string> {
  const document = await parseBocBytes(decodeBocText(bocHex, "hex"));
  if (document.roots.length !== 1) throw new Error("Ожидалась одна корневая ячейка кода.");
  return document.roots[0];
}

export default function ContractInspector() {
  const [autoRun, setAutoRun] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState("");
  const [testnet, setTestnet] = useState(() => localStorage.getItem("gramix.network.default") === "testnet");
  const [account, setAccount] = useState<ContractAccount | null>(null);
  const [codeHash, setCodeHash] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [offlineCode, setOfflineCode] = useState("");
  const [offlineData, setOfflineData] = useState("");
  const [offlineCodeHash, setOfflineCodeHash] = useState("");
  const [offlineDataHash, setOfflineDataHash] = useState("");
  const [offlineError, setOfflineError] = useState("");
  const [inspection, setInspection] = useState<CodeInspection | null>(null);
  const [method, setMethod] = useState("");
  const [argsText, setArgsText] = useState("");
  const [result, setResult] = useState<MethodResult | null>(null);
  const [error, setError] = useState("");
  const [inspectionError, setInspectionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [methodBusy, setMethodBusy] = useState(false);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<{ address: string; testnet: boolean }>).detail;
      if (!detail || typeof detail.address !== "string") return;
      setInput(detail.address); setTestnet(Boolean(detail.testnet)); setAutoRun(detail.address);
      setAccount(null); setInspection(null); setResult(null); setError("");
    };
    window.addEventListener("gramix:contract-address", receive);
    return () => window.removeEventListener("gramix:contract-address", receive);
  }, []);
  useEffect(() => {
    const receive = (event: Event) => {
      const network = (event as CustomEvent<"mainnet" | "testnet">).detail;
      if (network !== "mainnet" && network !== "testnet") return;
      setTestnet(network === "testnet"); setAccount(null); setInspection(null); setResult(null);
    };
    window.addEventListener("gramix:default-network", receive);
    return () => window.removeEventListener("gramix:default-network", receive);
  }, []);

  useEffect(() => {
    if (autoRun && input === autoRun) { setAutoRun(""); formRef.current?.requestSubmit(); }
  }, [autoRun, input]);

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccount(null);
    setInspection(null);
    setResult(null);
    setCodeHash("");
    setDataHash("");
    setError("");
    setBusy(true);
    try {
      const { raw } = await platform.inspectAddress(input.trim());
      const loaded = await platform.fetchContract(raw, testnet);
      telemetry.track({ name: "contract_opened", address: raw, network: loaded.network });
      if (loaded.code_hex) setCodeHash(await localHash(loaded.code_hex));
      if (loaded.data_hex) setDataHash(await localHash(loaded.data_hex));
      setAccount(loaded);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function inspectCode() {
    if (!account || busy) return;
    setInspection(null);
    setInspectionError("");
    setBusy(true);
    try {
      const data = await platform.inspectContractCode(account.raw, testnet);
      const actual = await localHash(data.code_hex);
      if (actual.toLowerCase() !== data.code_hash.toLowerCase() ||
          (codeHash && actual.toLowerCase() !== codeHash.toLowerCase())) {
        throw new Error("Хеш кода не совпадает с локально вычисленным хешем BOC.");
      }
      setInspection(data);
    } catch (cause) {
      setInspectionError(String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function runMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setResult(null);
    setError("");
    const args = argsText.trim() ? argsText.split(/\r?\n/).map((value) => value.trim()) : [];
    setMethodBusy(true);
    try {
      setResult(await platform.runGetMethod(account.raw, testnet, method.trim(), args));
      telemetry.track({ name: "get_method", address: account.raw, method: method.trim() });
    } catch (cause) {
      setError(String(cause));
    } finally {
      setMethodBusy(false);
    }
  }

  async function chooseOffline(event: ChangeEvent<HTMLInputElement>, type: "code" | "data") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 65536) { setOfflineError("BOC превышает лимит 64 КиБ."); return; }
    try {
      const hex = Buffer.from(await file.arrayBuffer()).toString("hex");
      const hash = await localHash(hex);
      if (type === "code") { setOfflineCode(hex); setOfflineCodeHash(hash); }
      else { setOfflineData(hex); setOfflineDataHash(hash); }
      setOfflineError("");
    } catch (cause) { setOfflineError(String(cause)); }
  }

  function openBoc(hex: string) {
    window.dispatchEvent(new CustomEvent("gramix:open-boc", {
      detail: Buffer.from(hex, "hex").toString("base64"),
    }));
    window.location.hash = "boc-explorer";
  }

  function downloadPublic() {
    if (!account) return;
    const report = { source: account.source, network: account.network, raw: account.raw,
      status: account.status, balance_nanoton: account.balance_nanoton,
      code_hash: codeHash || null, data_hash: dataHash || null,
      last_transaction_lt: account.last_transaction_lt,
      last_transaction_hash: account.last_transaction_hash, received_at: account.received_at };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `gramix-contract-${Date.now()}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="contract-inspector" id="contract-inspector" aria-labelledby="contract-title">
    <div className="panel-heading"><div><h2 id="contract-title">Контракты</h2>
      <p>Состояние и код из OpenTonAPI, локальная проверка BOC и read-only get-методы</p></div></div>
    <form ref={formRef} onSubmit={(event) => void load(event)} className="contract-address-bar">
      <label>GRAM-адрес контракта<input className="address-input" value={input}
        onChange={(event) => setInput(event.target.value)} maxLength={80}
        autoComplete="off" spellCheck={false} placeholder="EQ… или 0:…" /></label>
      <Checkbox checked={testnet} onCheckedChange={(value) => {
        setTestnet(value); setAccount(null); setInspection(null); setResult(null);
      }}>Testnet</Checkbox>
      <button className="primary-button" type="submit" disabled={!input.trim() || busy}>
        <RefreshCw size={16}/>{busy ? "Загружаю…" : account ? "Обновить" : "Загрузить"}</button>
    </form>
    <p className="contract-source-note">Сетевой запрос выполняется только после нажатия. Проверка локального BOC доступна во вкладке «Код и данные».</p>
    {error && <p className="error-box" role="alert">{error}</p>}
    {account && <><div className="contract-summary">
      <div><span>СОСТОЯНИЕ</span><strong>{account.status}</strong></div>
      <div><span>БАЛАНС</span><strong title={exactGram(account.balance_nanoton)}>{formatGram(account.balance_nanoton)}</strong></div>
      <div><span>ХЕШ КОДА</span><code>{codeHash || "код не опубликован"}</code></div>
      <div><span>ХЕШ ДАННЫХ</span><code>{dataHash || "данные не опубликованы"}</code></div>
    </div><div className="contract-source-line"><span>OpenTonAPI · {account.network} · {new Date(account.received_at * 1000).toLocaleString("ru-RU")}</span>
      <button onClick={downloadPublic}><Download size={15}/> Экспорт состояния</button></div></>}
    <Tabs.Root defaultValue="state" className="contract-tabs">
      <Tabs.List className="security-tabs" aria-label="Разделы контракта">
        <Tabs.Trigger value="state">Состояние</Tabs.Trigger>
        <Tabs.Trigger value="methods">Методы</Tabs.Trigger>
        <Tabs.Trigger value="code">Код и данные</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="state" className="contract-tab-content">
        {account ? <><dl className="tx-detail-list">
          <dt>Адрес</dt><dd><code>{account.raw}</code></dd>
          <dt>Сеть</dt><dd>{account.network}</dd>
          <dt>Статус</dt><dd>{account.status}</dd>
          <dt>Баланс</dt><dd>{formatGram(account.balance_nanoton)} · {account.balance_nanoton} nano</dd>
          <dt>LT последней транзакции</dt><dd>{account.last_transaction_lt ?? "нет данных"}</dd>
          <dt>Хеш последней транзакции</dt><dd><code>{account.last_transaction_hash ?? "нет данных"}</code></dd>
          <dt>Интерфейс</dt><dd>Не определён без подтверждённых метаданных</dd>
        </dl><div className="contract-actions">
          <CopyButton value={account.raw} label="Копировать адрес" />
          {account.last_transaction_hash && <button onClick={() => {
            window.dispatchEvent(new CustomEvent("gramix:transaction-id", { detail: account.last_transaction_hash }));
            window.location.hash = "transaction-decoder";
          }}>Открыть транзакцию</button>}
        </div></> : <div className="contract-empty"><SearchCheck size={31}/><strong>Контракт ещё не загружен</strong>
          <p>Введите публичный адрес и выберите сеть. Локальный импорт BOC доступен без загрузки контракта.</p></div>}
      </Tabs.Content>
      <Tabs.Content value="methods" className="contract-tab-content">
        {account ? <><div className="contract-method-heading"><div><h3>Read-only get-методы</h3>
          <p>Исполняются через OpenTonAPI по явному запросу.</p></div>
          <button disabled={!account.code_hex || busy} onClick={() => void inspectCode()}>
            <RefreshCw size={15}/> Получить список методов</button></div>
          {inspectionError && <p className="error-box" role="alert">{inspectionError}</p>}
          {inspection && <div className="contract-method-meta"><span>Компилятор по метаданным: {inspection.compiler ?? "неизвестен"}</span>
            <span>Хеш кода проверен локально</span></div>}
          {inspection && <div className="contract-method-list">{inspection.methods.length ? inspection.methods.map((name) =>
            <button key={name} onClick={() => setMethod(name)} className={method === name ? "selected" : ""}>{name}</button>)
            : <span>Известные методы не определены. Можно ввести имя вручную.</span>}</div>}
          <form onSubmit={(event) => void runMethod(event)} className="contract-method-form">
            <label>Имя get-метода<input className="address-input" value={method}
              onChange={(event) => setMethod(event.target.value)} maxLength={64}
              placeholder="get_wallet_data" spellCheck={false}/></label>
            <label>Аргументы · по одному в строке<textarea value={argsText}
              onChange={(event) => setArgsText(event.target.value)} maxLength={8192}
              spellCheck={false} placeholder="Число, адрес или BOC в формате OpenTonAPI" /></label>
            <button className="primary-button" type="submit" disabled={!method.trim() || methodBusy}>
              {methodBusy ? "Выполняю…" : "Выполнить read-only"}</button>
          </form>
          {result && <div className="contract-method-result" aria-live="polite"><strong>
            {result.method}: {result.success ? "успех" : "ошибка"} · exit code {result.exit_code}</strong>
            <span>OpenTonAPI · {new Date(result.received_at * 1000).toLocaleString("ru-RU")}</span>
            <pre>{JSON.stringify({ stack: result.stack, decoded: result.decoded }, null, 2)}</pre></div>}
        </> : <div className="contract-empty"><SearchCheck size={31}/><strong>Для методов нужен загруженный контракт</strong></div>}
      </Tabs.Content>
      <Tabs.Content value="code" className="contract-tab-content">
        <div className="contract-code-heading"><div><h3>Код и данные</h3>
          <p>Проверка BOC и сравнение хешей выполняются локально.</p></div></div>
        {offlineError && <p className="error-box" role="alert">{offlineError}</p>}
        <div className="contract-code-grid">
          <div><div className="contract-code-title"><strong>Код</strong><span>{codeHash || "нет сетевого BOC"}</span></div>
            <textarea readOnly value={account?.code_hex ?? ""} placeholder="Код контракта не загружен"/>
            <div className="contract-actions">{account?.code_hex && <button onClick={() => openBoc(account.code_hex!)}><FileCode2 size={15}/> В BOC Explorer</button>}
              <label className="contract-file-button">Открыть code.boc<input type="file"
                accept=".boc,application/octet-stream" onChange={(event) => void chooseOffline(event, "code")}/></label></div>
            {offlineCodeHash && <p className="contract-hash-check">Файл: <code>{offlineCodeHash}</code><br/>
              {codeHash ? offlineCodeHash === codeHash ? "Хеши совпадают" : "Хеши различаются" : "Сетевого хеша для сравнения нет"}</p>}
            {offlineCode && <button onClick={() => openBoc(offlineCode)}>Открыть локальный BOC</button>}
          </div>
          <div><div className="contract-code-title"><strong>Данные</strong><span>{dataHash || "нет сетевого BOC"}</span></div>
            <textarea readOnly value={account?.data_hex ?? ""} placeholder="Данные контракта не загружены"/>
            <div className="contract-actions">{account?.data_hex && <button onClick={() => openBoc(account.data_hex!)}><FileCode2 size={15}/> В BOC Explorer</button>}
              <label className="contract-file-button">Открыть data.boc<input type="file"
                accept=".boc,application/octet-stream" onChange={(event) => void chooseOffline(event, "data")}/></label></div>
            {offlineDataHash && <p className="contract-hash-check">Файл: <code>{offlineDataHash}</code><br/>
              {dataHash ? offlineDataHash === dataHash ? "Хеши совпадают" : "Хеши различаются" : "Сетевого хеша для сравнения нет"}</p>}
            {offlineData && <button onClick={() => openBoc(offlineData)}>Открыть локальный BOC</button>}
          </div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </section>;
}
