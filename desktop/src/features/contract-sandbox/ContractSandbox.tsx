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

import { useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

type Simulation = {
  source: string;
  network: "simulation";
  scenario: string;
  alice: string;
  bob: string;
  amountNanoton: string;
  initialBobNanoton: string;
  afterBobNanoton: string;
  restoredBobNanoton: string;
  snapshotsRestored: boolean;
  transactions: Array<{ hash: string; logicalTime: string; feesNanoton: string;
    oldStatus: string; endStatus: string; aborted: boolean | null }>;
};

export default function ContractSandbox() {
  const [result, setResult] = useState<Simulation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setResult(null); setError("");
    if (!isTauri()) { setError("Sandbox доступен в установленном приложении VANTIX."); return; }
    setBusy(true);
    try { setResult(await invoke<Simulation>("run_sandbox_demo")); }
    catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }
  function exportJson() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url;
    link.download = "vantix-sandbox-simulation.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel contract-sandbox" id="contract-sandbox" aria-labelledby="sandbox-title">
    <div className="panel-heading"><div>
      <h2 id="sandbox-title">Smart Contract Sandbox</h2>
      <p>Официальный локальный TON Sandbox в отдельном процессе Node.js</p>
    </div></div>
    <p>Воспроизводимый сценарий: два тестовых аккаунта, перевод 0,1 TON, транзакции и комиссии, затем восстановление snapshot. Только симуляция; реальная сеть не используется.</p>
    <div className="boc-actions"><button type="button" onClick={() => void run()} disabled={busy}>
      {busy ? "Выполняю…" : "Запустить локальный сценарий"}</button>
      <span>Windows Preview: встроенный Node.js. Linux: нужен Node.js 22+. Лимит времени: 15 секунд.</span></div>
    {error && <p className="error-box" role="alert">{error}</p>}
    {result && <div className="tx-facts" aria-live="polite">
      <strong>Локальная симуляция завершена · snapshot {result.snapshotsRestored ? "восстановлен" : "ошибка"}</strong>
      <span>Отправитель: <code>{result.alice}</code></span>
      <span>Получатель: <code>{result.bob}</code></span>
      <span>Перевод: {result.amountNanoton} nanotON</span>
      <span>Баланс получателя: {result.initialBobNanoton} → {result.afterBobNanoton} → {result.restoredBobNanoton} nanotON</span>
      {result.transactions.map((transaction, index) => <div className="tx-message" key={transaction.hash}>
        <strong>Транзакция {index + 1}</strong>
        <span>Хеш: <code>{transaction.hash}</code></span>
        <span>LT: {transaction.logicalTime} · комиссия: {transaction.feesNanoton} nanotON</span>
        <span>Статус: {transaction.oldStatus} → {transaction.endStatus} · прервана: {transaction.aborted ? "да" : "нет"}</span>
      </div>)}
      <button type="button" onClick={exportJson}>Экспорт результата JSON</button>
    </div>}
  </section>;
}
