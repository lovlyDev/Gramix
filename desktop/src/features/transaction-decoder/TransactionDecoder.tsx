/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { errorText } from "../../lib/errors";
import { formatGram } from "../../lib/format";
import { openExternal } from "../../lib/external";
import { platform } from "@platform";
import { telemetry } from "@telemetry";
import * as Tabs from "@radix-ui/react-tabs";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ArrowDownLeft, ArrowUpRight, Download, ExternalLink,
  FileCode2, Network, Trash2 } from "lucide-react";
import { decodeBocText, MAX_BOC_BYTES } from "../boc-explorer/bocService";
import { NotTransactionError, decodeTransactionBoc, type DecodedMessage,
  type DecodedTransaction } from "./transactionService";
import Checkbox from "../../components/ui/Checkbox";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";
import { saveFile } from "../../lib/save";
import { locale } from "../../lib/i18n";

type RemoteTransaction = {
  source: "OpenTonAPI";
  network: "mainnet" | "testnet";
  hash: string;
  raw_boc_hex: string;
  received_at: number;
};

const formatTon = (nano: string) => formatGram(nano, 9).replace(/ GRAM$/, "");

type SelectedNode = "transaction" | "incoming" | `outgoing-${number}`;

export default function TransactionDecoder() {
  const [autoRun, setAutoRun] = useState("");
  const [bocText, setBocText] = useState("");
  const [format, setFormat] = useState<"base64" | "hex">("base64");
  const [hash, setHash] = useState("");
  const [inputMode, setInputMode] = useState<"id" | "boc">("id");
  const [testnet, setTestnet] = useState(() => localStorage.getItem("gramix.network.default") === "testnet");
  const [selected, setSelected] = useState<SelectedNode>("transaction");
  const [detailTab, setDetailTab] = useState<"overview" | "body" | "raw" | "json">("overview");
  const [transaction, setTransaction] = useState<DecodedTransaction | null>(null);
  const [remote, setRemote] = useState<RemoteTransaction | null>(null);
  const [error, setError] = useState("");
  const [foreign, setForeign] = useState<NotTransactionError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const receive = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value !== "string") return;
      setHash(value); setInputMode("id"); setError(""); setAutoRun(value);
    };
    window.addEventListener("gramix:transaction-id", receive);
    return () => window.removeEventListener("gramix:transaction-id", receive);
  }, []);
  useEffect(() => {
    const receive = (event: Event) => {
      const network = (event as CustomEvent<"mainnet" | "testnet">).detail;
      if (network === "mainnet" || network === "testnet") setTestnet(network === "testnet");
    };
    window.addEventListener("gramix:default-network", receive);
    return () => window.removeEventListener("gramix:default-network", receive);
  }, []);

  async function load(bytes: Uint8Array, source: RemoteTransaction | null = null) {
    setError("");
    setForeign(null);
    setTransaction(null);
    setRemote(null);
    setBusy(true);
    try {
      const decoded = await decodeTransactionBoc(bytes);
      if (source && decoded.hash.toLowerCase() !== source.hash.toLowerCase())
        throw new Error("Хеш BOC не совпал с ID из OpenTonAPI.");
      setTransaction(decoded);
      setRemote(source);
      setSelected("transaction");
      setDetailTab("overview");
    } catch (cause) {
      if (cause instanceof NotTransactionError) setForeign(cause);
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }

  function openInExplorer() {
    if (!foreign) return;
    const value = foreign.base64;
    window.location.hash = "boc-explorer";
    window.setTimeout(() => window.dispatchEvent(new CustomEvent("gramix:open-boc", { detail: value })), 0);
  }
  function findByMessage() {
    if (!foreign?.messageHash) return;
    const value = foreign.messageHash;
    setForeign(null); setError(""); setInputMode("id"); setHash(value); setAutoRun(value);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BOC_BYTES) {
      setError("BOC превышает лимит 64 КиБ.");
      setTransaction(null);
      return;
    }
    await load(new Uint8Array(await file.arrayBuffer()));
    event.target.value = "";
  }

  async function loadText() {
    try {
      await load(decodeBocText(bocText, format));
    } catch (cause) {
      setError(errorText(cause));
      setTransaction(null);
    }
  }

  useEffect(() => {
    if (autoRun && hash === autoRun) { setAutoRun(""); void fetchById(); }
  }, [autoRun, hash]);

  async function fetchById() {
    if (!/^[a-fA-F0-9]{64}$/.test(hash.trim())) {
      setError("ID транзакции должен содержать ровно 64 hex-символа.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await platform.fetchTransaction(hash.trim(), testnet);
      telemetry.track({ name: "transaction_opened", hash: data.hash, network: data.network });
      await load(decodeBocText(data.raw_boc_hex, "hex"), data);
    } catch (cause) {
      setError(errorText(cause));
      setBusy(false);
    }
  }

  function exportJson() {
    if (!transaction) return;
    void saveFile(`gramix-transaction-${transaction.hash}.json`, JSON.stringify({ transaction, remote }, null, 2), "application/json");
  }

  function clearInput() {
    if (inputMode === "id") setHash(""); else setBocText("");
    setError(""); setTransaction(null); setRemote(null); setSelected("transaction");
  }

  const selectedMessage: DecodedMessage | null = !transaction ? null
    : selected === "incoming" ? transaction.inMessage
    : selected.startsWith("outgoing-") ? transaction.outMessages[Number(selected.slice(9))] ?? null
    : null;
  const selectedJson = selectedMessage ?? transaction;
  const explorerUrl = transaction ? `${remote?.network === "testnet" ? "https://testnet.tonviewer.com" : "https://tonviewer.com"}/transaction/${transaction.hash}` : "";

  return <section className="transaction-decoder" id="transaction-decoder" aria-labelledby="transaction-title">
    <div className="panel-heading"><div><h2 id="transaction-title">Транзакции</h2>
      <p>Загрузка по ID через OpenTonAPI или локальный разбор BOC без сети</p></div></div>
    <Tabs.Root value={inputMode} onValueChange={(value) => setInputMode(value as "id" | "boc")}
      className="tx-source-tabs">
      <Tabs.List className="security-tabs" aria-label="Источник транзакции">
        <Tabs.Trigger value="id"><Network size={16}/> По ID</Tabs.Trigger>
        <Tabs.Trigger value="boc"><FileCode2 size={16}/> По BOC</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="id" className="tx-source-content"><label>ID транзакции · 64 hex-символа
        <input className="address-input" value={hash} maxLength={64}
          onChange={(event) => setHash(event.target.value)} spellCheck={false} placeholder="Введите hash транзакции" />
        </label><div className="tx-input-actions">
          <Checkbox checked={testnet} onCheckedChange={setTestnet}>Testnet</Checkbox>
          <button className="primary-button" type="button" onClick={() => void fetchById()}
            disabled={!/^[a-fA-F0-9]{64}$/.test(hash.trim()) || busy}>
            {busy ? "Загружаю…" : "Загрузить транзакцию"}</button>
          <button type="button" onClick={clearInput}><Trash2 size={16}/> Очистить</button>
        </div></Tabs.Content>
      <Tabs.Content value="boc" className="tx-source-content"><div className="tx-boc-heading">
        <label>Формат текста<Select label="Формат BOC" value={format}
          onValueChange={(value) => setFormat(value as "base64" | "hex")}
          options={[{ value: "base64", label: "Base64" }, { value: "hex", label: "Hex" }]} /></label>
        <span>Максимум 64 КиБ после декодирования</span></div>
        <label>BOC транзакции<textarea value={bocText} onChange={(event) => setBocText(event.target.value)}
          maxLength={MAX_BOC_BYTES * 2} placeholder="Вставьте Base64 или hex" spellCheck={false} /></label>
        <div className="tx-input-actions">
          <button className="primary-button" type="button" onClick={() => void loadText()}
            disabled={!bocText.trim() || busy}>Декодировать</button>
          <label className="tx-file-button">Открыть .boc<input type="file"
            accept=".boc,application/octet-stream" onChange={(event) => void chooseFile(event)}/></label>
          <button type="button" onClick={clearInput}><Trash2 size={16}/> Очистить</button>
        </div></Tabs.Content>
    </Tabs.Root>
    {error && (foreign ? <div className="error-box foreign-boc" role="alert"><p>{error}</p>
      <div className="foreign-boc-actions">
        <button type="button" onClick={openInExplorer}><FileCode2 size={15}/> Открыть в BOC Explorer</button>
        {foreign.messageHash && <button type="button" onClick={findByMessage}>Найти транзакцию по сообщению</button>}
      </div></div> : <p className="error-box" role="alert">{error}</p>)}
    {transaction ? <div className="tx-workspace">
      <div className="tx-summary"><div><span>ТРАНЗАКЦИЯ</span>
        <strong>{transaction.aborted === true || transaction.computeSuccess === false ? "Ошибка исполнения" : "Транзакция декодирована"}</strong>
        <small>{remote ? `OpenTonAPI · ${remote.network} · ${new Date(remote.received_at * 1000).toLocaleString(locale)}`
          : "Локальный BOC · без запроса к сети"}</small></div>
        <div><span>КОМИССИЯ</span><strong>{formatTon(transaction.totalFeesNanoton)} GRAM</strong>
          <small>{transaction.totalFeesNanoton} nano</small></div>
        <div><span>СООБЩЕНИЯ</span><strong>{Number(Boolean(transaction.inMessage)) + transaction.outMessages.length}</strong>
          <small>{transaction.inMessage ? "1 входящее · " : ""}{transaction.outMessages.length} исходящих</small></div>
      </div>
      <div className="tx-toolbar">
        <span>LT {transaction.logicalTime}</span>
        <CopyButton value={transaction.hash} label="Копировать хеш" />
        <CopyButton value={JSON.stringify(transaction, null, 2)} label="Копировать JSON" />
        <button onClick={exportJson}><Download size={15}/> Экспорт</button>
        <button onClick={() => { window.dispatchEvent(new CustomEvent("gramix:open-boc", { detail: transaction.rawBocBase64 }));
          window.location.hash = "boc-explorer"; }}><FileCode2 size={15}/> BOC Explorer</button>
        <a href={explorerUrl} onClick={(event) => { event.preventDefault(); openExternal(explorerUrl); }}><ExternalLink size={15}/> Tonviewer</a>
      </div>
      <Group orientation="horizontal" className="tx-split" id="tx-split">
        <Panel defaultSize="38" minSize={250} className="tx-timeline">
          <div className="tx-pane-title">Трасса сообщений</div>
          <button className={selected === "transaction" ? "selected" : ""}
            onClick={() => { setSelected("transaction"); setDetailTab("overview"); }}>
            <span className="tx-node-icon"><Network size={18}/></span><span><strong>Транзакция</strong>
              <small>{transaction.type} · {transaction.hash.slice(0, 12)}…</small></span></button>
          {transaction.inMessage && <button className={selected === "incoming" ? "selected" : ""}
            onClick={() => { setSelected("incoming"); setDetailTab("overview"); }}>
            <span className="tx-node-icon incoming"><ArrowDownLeft size={18}/></span><span><strong>Входящее сообщение</strong>
              <small>{transaction.inMessage.knownOperation ?? transaction.inMessage.opcode ?? transaction.inMessage.type}</small></span></button>}
          {transaction.outMessages.map((message, index) => <button key={index}
            className={selected === `outgoing-${index}` ? "selected" : ""}
            onClick={() => { setSelected(`outgoing-${index}`); setDetailTab("overview"); }}>
            <span className="tx-node-icon outgoing"><ArrowUpRight size={18}/></span><span>
              <strong>Исходящее сообщение {index + 1}</strong>
              <small>{message.knownOperation ?? message.opcode ?? message.type}</small></span></button>)}
        </Panel><Separator className="tx-separator" />
        <Panel defaultSize="62" minSize={330} className="tx-inspector">
          <div className="tx-pane-title">{selectedMessage ? selected === "incoming" ? "Входящее сообщение" : "Исходящее сообщение" : "Транзакция"}</div>
          <Tabs.Root value={detailTab} onValueChange={(value) => setDetailTab(value as typeof detailTab)}>
            <Tabs.List className="security-tabs" aria-label="Детали выбранного узла">
              <Tabs.Trigger value="overview">Обзор</Tabs.Trigger><Tabs.Trigger value="body" disabled={!selectedMessage}>Body</Tabs.Trigger>
              <Tabs.Trigger value="raw">Raw</Tabs.Trigger><Tabs.Trigger value="json">JSON</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview" className="tx-detail-content">
              {selectedMessage ? <dl className="tx-detail-list">
                <dt>Тип</dt><dd>{selectedMessage.type}</dd>
                <dt>От</dt><dd><code>{selectedMessage.source ?? "адрес отсутствует"}</code></dd>
                <dt>Кому</dt><dd><code>{selectedMessage.destination ?? "адрес отсутствует"}</code></dd>
                <dt>Сумма</dt><dd>{selectedMessage.valueNanoton === null ? "не указана" : `${formatTon(selectedMessage.valueNanoton)} GRAM · ${selectedMessage.valueNanoton} nano`}</dd>
                <dt>Opcode</dt><dd>{selectedMessage.opcode ?? "нет"}{selectedMessage.knownOperation ? ` · ${selectedMessage.knownOperation}` : ""}</dd>
                {selectedMessage.comment !== null && <><dt>Комментарий</dt><dd>{selectedMessage.comment}</dd></>}
                {selectedMessage.jettonAmount !== null && <><dt>Jetton</dt><dd>{selectedMessage.jettonAmount} базовых единиц</dd></>}
                {selectedMessage.jettonDestination && <><dt>Адрес Jetton</dt><dd><code>{selectedMessage.jettonDestination}</code></dd></>}
              </dl> : <dl className="tx-detail-list">
                <dt>Hash</dt><dd><code>{transaction.hash}</code></dd>
                <dt>Account hash</dt><dd><code>{transaction.accountHash}</code></dd>
                <dt>Logical time</dt><dd>{transaction.logicalTime}</dd>
                <dt>Время</dt><dd>{new Date(transaction.unixTime * 1000).toLocaleString(locale)}</dd>
                <dt>Статус аккаунта</dt><dd>{transaction.oldStatus} → {transaction.endStatus}</dd>
                <dt>Прервана</dt><dd>{transaction.aborted === null ? "нет данных" : transaction.aborted ? "да" : "нет"}</dd>
                <dt>Compute</dt><dd>{transaction.computeSuccess === null ? "нет данных" : transaction.computeSuccess ? "успех" : "ошибка"}</dd>
                <dt>Exit code</dt><dd>{transaction.computeExitCode ?? "нет данных"}</dd>
                <dt>Action result</dt><dd>{transaction.actionResultCode ?? "нет данных"}</dd>
                <dt>Gas used</dt><dd>{transaction.gasUsed ?? "нет данных"}</dd>
                <dt>Gas fee</dt><dd>{transaction.gasFeesNanoton === null ? "нет данных" : `${formatTon(transaction.gasFeesNanoton)} GRAM`}</dd>
                <dt>Total fee</dt><dd>{formatTon(transaction.totalFeesNanoton)} GRAM · {transaction.totalFeesNanoton} nano</dd>
              </dl>}
            </Tabs.Content>
            <Tabs.Content value="body" className="tx-detail-content"><pre>{selectedMessage?.bodyBocBase64}</pre></Tabs.Content>
            <Tabs.Content value="raw" className="tx-detail-content"><pre>{selectedMessage?.bodyBocBase64 ?? transaction.rawBocBase64}</pre></Tabs.Content>
            <Tabs.Content value="json" className="tx-detail-content"><pre>{JSON.stringify(selectedJson, null, 2)}</pre></Tabs.Content>
          </Tabs.Root>
        </Panel>
      </Group>
    </div> : <div className="tx-empty"><FileCode2 size={33}/><strong>Транзакция ещё не открыта</strong>
      <p>Введите hash для загрузки из сети или декодируйте локальный BOC.</p></div>}
  </section>;
}
