/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useState } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { isTauri } from "@tauri-apps/api/core";

const commands = [
  { id: "devices", label: "Устройства", args: ["--devices-json"],
    description: "Обнаружение CPU и GPU без утверждения об их готовности к поиску." },
  { id: "backends", label: "Проверенные backend-ы", args: ["--backends-json"],
    description: "Криптографическая самопроверка доступных движков." },
  { id: "selftest", label: "Самотест CPU", args: ["--self-test", "--backend", "cpu"],
    description: "Эталонные векторы TON на CPU." },
  { id: "benchmark", label: "Бенчмарк CPU", args: ["--benchmark-json", "--backend", "cpu"],
    description: "Реальная скорость полной генерации адресов." },
] as const;

export default function DeveloperCli() {
  const [selected, setSelected] = useState<(typeof commands)[number]["id"]>("devices");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = commands.find((item) => item.id === selected) ?? commands[0];
  const args: string[] = [...current.args];

  async function run() {
    setOutput(""); setError("");
    if (!isTauri()) { setError("CLI доступен в установленном приложении VANTIX."); return; }
    setBusy(true);
    try {
      const result = await Command.sidecar("binaries/vantix", args).execute();
      if (result.code !== 0) throw new Error(result.stderr || `Код выхода ${result.code}`);
      setOutput(result.stdout);
    } catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }

  return <section className="panel developer-cli" id="developer-cli" aria-labelledby="developer-cli-title">
    <div className="panel-heading"><div>
      <h2 id="developer-cli-title">TON Developer CLI</h2>
      <p>Запуск разрешённых локальных команд того же нативного ядра, которое использует Desktop</p>
    </div></div>
    <div className="boc-actions">
      <select aria-label="Команда CLI" value={selected}
        onChange={(event) => setSelected(event.target.value as typeof selected)}>
        {commands.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
      </select>
      <button type="button" onClick={() => void run()} disabled={busy}>{busy ? "Выполняю…" : "Выполнить"}</button>
    </div>
    <p>{current.description}</p>
    <p><code>vantix {args.join(" ")}</code></p>
    {error && <p className="error-box" role="alert">{error}</p>}
    {output && <pre className="cli-output">{output}</pre>}
    <p>Полный список параметров: <code>vantix --help</code>. Команды, работающие с мнемоникой, не запускаются в этой панели.</p>
  </section>;
}
