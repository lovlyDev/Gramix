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
import { decodeBocText, parseBocBytes } from "../boc-explorer/bocService";

const starter = "fun onInternalMessage(_: InMessage) {}\n";
type BuildSuccess = { status: "ok"; language: "Tolk"; compilerVersion: string;
  codeBocBase64: string; codeHashHex: string; fiftCode: string; abi: unknown; diagnostics: string };
type BuildFailure = { status: "error"; message: string };

export default function ContractBuilder() {
  const [source, setSource] = useState(starter);
  const [fileName, setFileName] = useState("main.tolk");
  const [result, setResult] = useState<BuildSuccess | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 128 * 1024 || !file.name.endsWith(".tolk")) {
      setError("Выберите .tolk файл размером не больше 128 КиБ."); return;
    }
    setSource(await file.text()); setFileName(file.name); setResult(null); setError("");
    event.target.value = "";
  }

  async function build() {
    setResult(null); setError("");
    if (!isTauri()) { setError("Компилятор доступен в установленном приложении VANTIX."); return; }
    setBusy(true);
    try {
      const compiled = await invoke<BuildSuccess | BuildFailure>("compile_tolk", { source });
      if (compiled.status === "error") throw new Error(compiled.message);
      const document = await parseBocBytes(decodeBocText(compiled.codeBocBase64, "base64"));
      if (document.roots.length !== 1 || document.roots[0].toLowerCase() !== compiled.codeHashHex.toLowerCase())
        throw new Error("Хеш скомпилированного BOC не прошёл независимую проверку.");
      setResult(compiled);
    } catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }

  function exportJson() {
    if (!result) return;
    const report = { source: "local Tolk compiler", filename: fileName,
      compilerVersion: result.compilerVersion, codeHashHex: result.codeHashHex,
      codeBocBase64: result.codeBocBase64, abi: result.abi, fiftCode: result.fiftCode };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `${fileName}.compiled.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="panel contract-builder" id="contract-builder" aria-labelledby="builder-title">
    <div className="panel-heading"><div>
      <h2 id="builder-title">Contract Builder</h2>
      <p>Локальная компиляция Tolk 1.4.2 в отдельном Node-процессе</p>
    </div></div>
    <div className="boc-actions"><span>Файл: {fileName}</span>
      <label className="boc-file-button">Открыть .tolk
        <input type="file" accept=".tolk" onChange={(event) => void chooseFile(event)} /></label>
      <button type="button" onClick={() => void build()} disabled={busy || !source.trim()}>
        {busy ? "Компилирую…" : "Собрать контракт"}</button>
      <span>Windows Preview: встроенный Node.js. Linux: нужен Node.js 22+. Сетевые транзакции не выполняются.</span>
    </div>
    <label>Исходный код Tolk
      <textarea className="contract-source" value={source} onChange={(event) => {
        setSource(event.target.value); setResult(null);
      }} maxLength={128 * 1024} spellCheck={false} />
    </label>
    {error && <pre className="error-box" role="alert">{error}</pre>}
    {result && <div className="tx-result">
      <div className="tx-facts">
        <strong>Компиляция успешна · Tolk {result.compilerVersion}</strong>
        <span>Code hash: <code>{result.codeHashHex}</code> · совпадает с локально разобранным BOC</span>
        {result.diagnostics && <pre>{result.diagnostics}</pre>}
      </div>
      <div className="boc-actions"><button type="button" onClick={exportJson}>Экспорт артефакта JSON</button>
        <a href="#boc-explorer">Открыть BOC Explorer</a></div>
      <details><summary>Fift-код</summary><pre>{result.fiftCode}</pre></details>
      <details><summary>ABI</summary><pre>{JSON.stringify(result.abi, null, 2)}</pre></details>
    </div>}
    <p>Сейчас поддерживается одиночный Tolk-файл и встроенная stdlib. Проекты Acton/Blueprint с несколькими файлами открываются в их собственных инструментах.</p>
  </section>;
}
