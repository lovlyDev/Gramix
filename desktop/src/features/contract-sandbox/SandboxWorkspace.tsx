/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useState, type ChangeEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { Download, FilePlus2, Play, RotateCcw, Square, Upload } from "lucide-react";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";

type Step = { from: string; to: string; amountTon: string };
type Scenario = { title: string; accounts: string[]; steps: Step[] };
type Transaction = { step: number; from: string; to: string; amountNanoton: string;
  hash: string; logicalTime: string; feesNanoton: string; oldStatus: string;
  endStatus: string; aborted: boolean | null };
type Simulation = { source: string; network: "simulation"; scenario: string;
  accounts: Record<string, string>; steps: Step[];
  balancesBefore: Record<string, string>; balancesAfter: Record<string, string>;
  balancesRestored: Record<string, string>; snapshotsRestored: boolean;
  transactions: Transaction[] };
const example: Scenario = { title: "Перевод и восстановление snapshot", accounts: ["alice", "bob"],
  steps: [{ from: "alice", to: "bob", amountTon: "0.1" }] };

function download(name: string, content: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validate(scenario: Scenario) {
  if (!scenario.title.trim() || scenario.title.length > 80) return "Название должно содержать от 1 до 80 символов.";
  if (scenario.accounts.length < 2 || scenario.accounts.length > 8 ||
      new Set(scenario.accounts).size !== scenario.accounts.length ||
      scenario.accounts.some((name) => !/^[a-z][a-z0-9_-]{1,23}$/.test(name)))
    return "Укажите 2–8 уникальных имён аккаунтов латиницей.";
  if (scenario.steps.length < 1 || scenario.steps.length > 20) return "Укажите от 1 до 20 шагов.";
  for (const step of scenario.steps) {
    if (!scenario.accounts.includes(step.from) || !scenario.accounts.includes(step.to) || step.from === step.to)
      return "Укажите разных существующих отправителя и получателя.";
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(step.amountTon) ||
        Number(step.amountTon) <= 0 || Number(step.amountTon) > 10)
      return "Сумма должна быть больше нуля и не превышать 10 TON (до 9 знаков после точки).";
  }
  return "";
}

export default function SandboxWorkspace() {
  const [scenario, setScenario] = useState<Scenario>(example);
  const [result, setResult] = useState<Simulation | null>(null);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [accountName, setAccountName] = useState("");

  function edit(next: Scenario) { setScenario(next); setDirty(true); setResult(null); setError(""); }
  function editStep(index: number, change: Partial<Step>) {
    edit({ ...scenario, steps: scenario.steps.map((step, position) =>
      position === index ? { ...step, ...change } : step) });
  }
  function reset() { setScenario(example); setResult(null); setError(""); setDirty(false); }
  async function open(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (file.size > 32 * 1024) { setError("Сценарий превышает 32 КиБ."); return; }
    try {
      const loaded = JSON.parse(await file.text()) as Scenario;
      const issue = validate(loaded);
      if (issue) throw new Error(issue);
      setScenario(loaded); setResult(null); setDirty(false); setError("");
    } catch (cause) { setError(`Не удалось открыть сценарий: ${String(cause)}`); }
  }
  function addAccount() {
    const name = accountName.trim();
    if (!/^[a-z][a-z0-9_-]{1,23}$/.test(name) || scenario.accounts.includes(name) ||
        scenario.accounts.length >= 8) { setError("Имя аккаунта должно быть уникальным: 2–24 символа латиницей."); return; }
    edit({ ...scenario, accounts: [...scenario.accounts, name] }); setAccountName("");
  }
  async function run() {
    const issue = validate(scenario);
    if (issue) { setError(issue); return; }
    if (!isTauri()) { setError("Симуляция доступна в установленном приложении VANTIX."); return; }
    setBusy(true); setError(""); setResult(null); setSelected(0);
    try { setResult(await invoke<Simulation>("run_sandbox_demo", { scenario })); }
    catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }
  async function stop() {
    try { await invoke("cancel_sandbox"); }
    catch (cause) { setError(String(cause)); }
  }

  const transaction = result?.transactions[selected];
  return <section className="sandbox-workspace" id="contract-sandbox" aria-label="Smart Contract Sandbox">
    <div className="sandbox-toolbar"><span>Только локальная сеть TON Sandbox · snapshot восстанавливается после запуска</span>
      <label className="sandbox-file-action"><Upload size={16} /> Открыть
        <input type="file" accept=".json,application/json" onChange={(event) => void open(event)} /></label>
      <button type="button" onClick={() => download("vantix-sandbox-scenario.json", scenario)}>
        <Download size={16} /> Сохранить{dirty ? " *" : ""}</button>
      <button type="button" onClick={() => edit({ ...scenario, title: scenario.title + " · копия" })}>Дублировать</button>
      <button type="button" onClick={reset}><RotateCcw size={16} /> Сбросить</button>
      {busy ? <button type="button" onClick={() => void stop()}><Square size={16} /> Стоп</button>
        : <button type="button" className="sandbox-run" onClick={() => void run()}>
          <Play size={16} /> Запустить</button>}
    </div>
    {error && <p className="error-box" role="alert">{error}</p>}
    <div className="sandbox-columns"><div className="sandbox-editor">
      <div className="sandbox-editor-heading"><strong>Сценарий</strong>
        <button type="button" onClick={() => edit({ title: "Новый сценарий", accounts: ["alice", "bob"],
          steps: [{ from: "alice", to: "bob", amountTon: "0.1" }] })}><FilePlus2 size={15} /> Новый</button></div>
      <label className="sandbox-field">Название<input value={scenario.title} maxLength={80}
        onChange={(event) => edit({ ...scenario, title: event.target.value })} /></label>
      <div className="sandbox-subheading">Тестовые аккаунты <span>{scenario.accounts.length}/8</span></div>
      <div className="sandbox-accounts">{scenario.accounts.map((name) => <span key={name}>{name}</span>)}</div>
      <div className="sandbox-add-account"><input value={accountName} placeholder="имя аккаунта"
        maxLength={24} onChange={(event) => setAccountName(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") addAccount(); }} />
        <button type="button" onClick={addAccount}>Добавить</button></div>
      <div className="sandbox-subheading">Локальные переводы <span>{scenario.steps.length}/20</span></div>
      <div className="sandbox-step-list">{scenario.steps.map((step, index) => <div className="sandbox-step" key={index}>
        <div><strong>Шаг {index + 1}</strong><button type="button" disabled={scenario.steps.length === 1}
          onClick={() => edit({ ...scenario, steps: scenario.steps.filter((_, position) => position !== index) })}>
          Удалить</button></div>
        <label>От<Select label={`Отправитель шага ${index + 1}`} value={step.from}
          onValueChange={(value) => editStep(index, { from: value })}
          options={scenario.accounts.map((name) => ({ value: name, label: name }))} /></label>
        <label>Кому<Select label={`Получатель шага ${index + 1}`} value={step.to}
          onValueChange={(value) => editStep(index, { to: value })}
          options={scenario.accounts.map((name) => ({ value: name, label: name }))} /></label>
        <label>TON<input value={step.amountTon} inputMode="decimal"
          onChange={(event) => editStep(index, { amountTon: event.target.value })} /></label>
      </div>)}</div>
      <button type="button" className="sandbox-add-step" disabled={scenario.steps.length >= 20}
        onClick={() => edit({ ...scenario, steps: [...scenario.steps,
          { from: scenario.accounts[0], to: scenario.accounts[1], amountTon: "0.1" }] })}>
        <FilePlus2 size={15} /> Добавить перевод</button>
    </div>
    <div className="sandbox-results"><div className="sandbox-results-heading"><strong>Выполнение</strong>
      <span role="status">{busy ? "Симуляция…" : result ? "Snapshot восстановлен" : "Нет запуска"}</span>
      {result && <button type="button" onClick={() => download("vantix-sandbox-trace.json", result)}>
        <Download size={15} /> Trace JSON</button>}</div>
      {result ? <div className="sandbox-result-columns"><div className="sandbox-timeline">
        {result.transactions.map((item, index) => <button type="button" key={item.hash}
          className={selected === index ? "active" : ""} onClick={() => setSelected(index)}>
          <strong>Шаг {item.step} · {item.from} → {item.to}</strong>
          <span>{item.endStatus} · комиссия {item.feesNanoton} nanoTON</span></button>)}
        <div className="sandbox-restore-marker">Snapshot восстановлен</div>
      </div><div className="sandbox-inspector">
        {transaction && <><h3>Транзакция {selected + 1}</h3>
          <div>От: {transaction.from} · Кому: {transaction.to}</div>
          <div>Сумма: {transaction.amountNanoton} nanoTON</div>
          <div>Комиссия: {transaction.feesNanoton} nanoTON</div>
          <div>LT: <code>{transaction.logicalTime}</code></div>
          <div>Статус: {transaction.oldStatus} → {transaction.endStatus}</div>
          <div>Прервана: {transaction.aborted === null ? "нет данных" : transaction.aborted ? "да" : "нет"}</div>
          <div className="sandbox-hash">Хеш: <code>{transaction.hash}</code>
            <CopyButton value={transaction.hash} label="Копировать хеш" /></div></>}
        <h3>Баланс аккаунтов</h3>{Object.keys(result.accounts).map((name) => <div key={name}>
          {name}: {result.balancesBefore[name]} → {result.balancesAfter[name]} → {result.balancesRestored[name]} nanoTON</div>)}
      </div></div> : <div className="sandbox-empty">Настройте локальные переводы и запустите сценарий.
        Здесь появятся транзакции, комиссии и состояние после восстановления snapshot.</div>}
    </div></div>
  </section>;
}
