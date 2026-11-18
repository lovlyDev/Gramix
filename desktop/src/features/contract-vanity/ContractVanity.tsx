/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Buffer } from "buffer";
import { Download, FileCode2, Pause, Play, ShieldCheck, Square, Zap } from "lucide-react";
import { parseContractInput, verifyContractCandidate, type ContractCandidate } from "./contractVanityService";
import Checkbox from "../../components/ui/Checkbox";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";

type Progress = { attempts: number; elapsedMs: number };
type WorkerMessage = Progress & { type: "progress" | "found" | "stopped" | "exhausted" | "error";
  candidate?: ContractCandidate; message?: string };

export default function ContractVanity() {
  const worker = useRef<Worker | null>(null);
  const [codeHex, setCodeHex] = useState("");
  const [dataHex, setDataHex] = useState("");
  const [suffix, setSuffix] = useState("");
  const [inputFormat, setInputFormat] = useState<"hex" | "base64">("hex");
  const [matchMode, setMatchMode] = useState<"prefix" | "suffix">("suffix");
  const [format, setFormat] = useState<"raw" | "bounceable" | "nonBounceable">("raw");
  const [startNonce, setStartNonce] = useState("0");
  const [maxAttempts, setMaxAttempts] = useState("100000");
  const [fieldConfirmed, setFieldConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [validated, setValidated] = useState(false);
  const [progress, setProgress] = useState<Progress>({ attempts: 0, elapsedMs: 0 });
  const [candidate, setCandidate] = useState<ContractCandidate | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => worker.current?.terminate(), []);

  async function chooseBoc(event: ChangeEvent<HTMLInputElement>, field: "code" | "data") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 65536) { setError("BOC превышает лимит 64 КиБ."); return; }
    const text = Buffer.from(await file.arrayBuffer()).toString(inputFormat === "hex" ? "hex" : "base64");
    if (field === "code") setCodeHex(text); else setDataHex(text);
    setValidated(false); setCandidate(null); setError("");
  }

  async function validate() {
    setError(""); setValidated(false);
    try { await parseContractInput(codeHex, dataHex, inputFormat); setValidated(true); }
    catch (cause) { setError(String(cause)); }
  }

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setCandidate(null); setProgress({ attempts: 0, elapsedMs: 0 });
    if (!fieldConfirmed) { setError("Подтвердите наличие свободного uint64 в начале data."); return; }
    if (format === "raw" ? !/^[0-9a-fA-F]{1,8}$/.test(suffix) : !/^[A-Za-z0-9_-]{1,6}$/.test(suffix)) {
      setError("Для raw введите 1–8 hex-символов; для friendly — 1–6 Base64url-символов."); return;
    }
    try {
      if (!/^\d+$/.test(startNonce) || !/^\d+$/.test(maxAttempts))
        throw new Error("Начальный nonce и число попыток должны быть целыми положительными числами.");
      const startValue = BigInt(startNonce);
      const limit = Number(maxAttempts);
      if (startValue > 0xffffffffffffffffn || !Number.isSafeInteger(limit) ||
          limit < 1 || limit > 10_000_000 || startValue + BigInt(limit) > 0x10000000000000000n)
        throw new Error("Начальный nonce или число попыток вне допустимого диапазона.");
      await parseContractInput(codeHex, dataHex, inputFormat);
      setValidated(true);
      const next = new Worker(new URL("./contractVanity.worker.ts", import.meta.url), { type: "module" });
      worker.current?.terminate();
      worker.current = next;
      setRunning(true);
      setPaused(false);
      next.onmessage = (message: MessageEvent<WorkerMessage>) => {
        const data = message.data;
        if (data.type === "progress") { setProgress(data); return; }
        if (data.type === "found" && data.candidate) {
          void (async () => {
            try {
              const input = await parseContractInput(codeHex, dataHex, inputFormat);
              if (!await verifyContractCandidate(input, data.candidate!))
                throw new Error("Независимая проверка результата не прошла.");
              setCandidate(data.candidate!);
              setProgress(data);
            } catch (cause) { setError(String(cause)); }
            finally { setRunning(false); setPaused(false); next.terminate(); }
          })();
        } else {
          setProgress(data);
          if (data.type === "error") setError(data.message ?? "Ошибка поиска.");
          setRunning(false);
          setPaused(false);
          next.terminate();
        }
      };
      next.onerror = () => { setError("Рабочий поток поиска завершился с ошибкой."); setRunning(false); setPaused(false); next.terminate(); };
      next.postMessage({ type: "start", payload: { codeHex, dataHex, suffix, format, matchMode, inputFormat,
        startNonce: startValue.toString(), maxAttempts: limit } });
    } catch (cause) { setError(String(cause)); }
  }

  function stop() {
    worker.current?.postMessage({ type: "stop" });
  }

  function togglePause() {
    worker.current?.postMessage({ type: paused ? "resume" : "pause" });
    setPaused(!paused);
  }

  function openStateInit() {
    if (!candidate) return;
    window.dispatchEvent(new CustomEvent("vantix:open-boc", { detail: candidate.stateInitBocBase64 }));
    window.location.hash = "boc-explorer";
  }

  function exportStateInit() {
    if (!candidate) return;
    const bytes = Buffer.from(candidate.stateInitBocBase64, "base64");
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `vantix-stateinit-${candidate.nonce}.boc`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJson() {
    if (!candidate) return;
    const report = { source: "local", algorithm: "StateInit code/data; reserved first uint64 of data",
      suffix, format, attempts: progress.attempts, elapsedMs: progress.elapsedMs,
      verified: true, candidate };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `vantix-contract-${candidate.raw.split(":")[1]}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="contract-vanity" id="contract-vanity" aria-labelledby="contract-vanity-title">
    <div className="panel-heading"><div><h2 id="contract-vanity-title">Contract Vanity</h2>
      <p>Локальный CPU-поиск адреса для точного StateInit с изменяемым uint64</p></div></div>
    <div className="contract-vanity-workspace">
      <form onSubmit={(event) => void start(event)} className="contract-vanity-config">
        <div className="contract-vanity-section-title"><FileCode2 size={20}/><div>
          <h3>StateInit</h3><span>Код и данные контракта, без секретных ключей</span></div></div>
        <p className="security-note"><ShieldCheck size={17}/> Первые 64 бита корневой ячейки data должны быть зарезервированы контрактом как изменяемый nonce. Проверка формата не доказывает безопасность изменения.</p>
        <label>Формат BOC<Select label="Формат BOC" value={inputFormat} disabled={running}
          onValueChange={(value) => { setInputFormat(value as typeof inputFormat); setValidated(false); }}
          options={[{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }]}/></label>
        <label>BOC кода<textarea value={codeHex} disabled={running}
          onChange={(event) => { setCodeHex(event.target.value); setValidated(false); }}
          maxLength={131072} spellCheck={false} placeholder="Вставьте BOC кода" /></label>
        <label className="contract-file-button">Открыть code.boc<input type="file" accept=".boc,application/octet-stream"
          disabled={running} onChange={(event) => void chooseBoc(event, "code")}/></label>
        <label>BOC данных<textarea value={dataHex} disabled={running}
          onChange={(event) => { setDataHex(event.target.value); setValidated(false); }}
          maxLength={131072} spellCheck={false} placeholder="Вставьте BOC данных" /></label>
        <label className="contract-file-button">Открыть data.boc<input type="file" accept=".boc,application/octet-stream"
          disabled={running} onChange={(event) => void chooseBoc(event, "data")}/></label>
        <button type="button" className="contract-validate" onClick={() => void validate()}
          disabled={running || !codeHex.trim() || !dataHex.trim()}>
          <ShieldCheck size={16}/> Проверить StateInit</button>
        {validated && <span className="security-ok" role="status">Формат кода и данных проверен. Семантику nonce подтвердите самостоятельно.</span>}
        <div className="contract-vanity-section-title target"><Zap size={20}/><div>
          <h3>Целевой адрес</h3><span>Полный StateInit пересчитывается для каждой попытки</span></div></div>
        <div className="contract-target-grid"><label>Формат адреса
          <Select label="Формат адреса" value={format} disabled={running}
            onValueChange={(value) => setFormat(value as typeof format)}
            options={[{ value: "raw", label: "Raw · hex" }, { value: "bounceable", label: "Bounceable · EQ" },
              { value: "nonBounceable", label: "Non-bounceable · UQ" }]}/></label>
          <label>Совпадение<Select label="Совпадение" value={matchMode} disabled={running}
            onValueChange={(value) => setMatchMode(value as typeof matchMode)}
            options={[{ value: "suffix", label: "Окончание" }, { value: "prefix", label: "Начало" }]}/></label></div>
        <label>Искомый фрагмент<input value={suffix} disabled={running}
          onChange={(event) => setSuffix(event.target.value)} maxLength={8}
          autoComplete="off" spellCheck={false} placeholder={format === "raw" ? "например, ab" : "например, EQ"}/></label>
        <div className="contract-target-grid"><label>Начальный nonce<input type="number" min="0"
          value={startNonce} disabled={running} onChange={(event) => setStartNonce(event.target.value)} /></label>
          <label>Максимум попыток<input type="number" min="1" max="10000000"
            value={maxAttempts} disabled={running} onChange={(event) => setMaxAttempts(event.target.value)} /></label></div>
        <Checkbox checked={fieldConfirmed} disabled={running} onCheckedChange={setFieldConfirmed}>
          Я проверил, что выбранное поле uint64 допускает изменение в моём контракте.</Checkbox>
        <div className="contract-run-actions">
          {!running ? <button className="primary-button" type="submit" disabled={!codeHex || !dataHex || !suffix || !fieldConfirmed}>
            <Zap size={17}/> Начать поиск</button> : <><button type="button" onClick={togglePause}>
            {paused ? <Play size={16}/> : <Pause size={16}/>} {paused ? "Продолжить" : "Пауза"}</button>
            <button type="button" onClick={stop}><Square size={16}/> Стоп</button></>}
        </div>
        {error && <p className="error-box" role="alert">{error}</p>}
      </form>
      <div className="contract-vanity-monitor">
        <div className="contract-monitor-heading"><h3>Поиск StateInit</h3>
          <span className={running ? "active" : ""}>{paused ? "Пауза" : running ? "Идёт поиск" : candidate ? "Найдено" : "Ожидание"}</span></div>
        <div className="contract-stats"><div><span>ПОПЫТОК</span><strong>{progress.attempts.toLocaleString("ru-RU")}</strong></div>
          <div><span>СКОРОСТЬ</span><strong>{progress.elapsedMs > 0 ? Math.round(progress.attempts * 1000 / progress.elapsedMs).toLocaleString("ru-RU") : "0"}<small> /с</small></strong></div>
          <div><span>ВРЕМЯ</span><strong>{(progress.elapsedMs / 1000).toFixed(1)}<small> с</small></strong></div></div>
        <div className="contract-progress"><div style={{ width: `${Math.min(100, Number(maxAttempts) > 0 ? progress.attempts / Number(maxAttempts) * 100 : 0)}%` }}/></div>
        <p className="contract-progress-caption">Nonce: {/^\d+$/.test(startNonce) ? (BigInt(startNonce) + BigInt(progress.attempts)).toString() : "—"}
          <span>{maxAttempts} попыток максимум</span></p>
        {candidate ? <div className="contract-result"><div className="contract-result-heading">
          <ShieldCheck size={20}/><div><strong>Адрес найден и независимо проверен</strong>
            <span>Совпадает с экспортируемым StateInit</span></div></div>
          <dl><dt>Nonce</dt><dd>{candidate.nonce}</dd>
            <dt>Raw</dt><dd><code>{candidate.raw}</code></dd>
            <dt>Bounceable</dt><dd><code>{candidate.bounceable}</code></dd>
            <dt>Non-bounceable</dt><dd><code>{candidate.nonBounceable}</code></dd></dl>
          <div className="contract-result-actions">
            <CopyButton value={candidate[format]} label="Копировать адрес" />
            <button onClick={exportStateInit}><Download size={15}/> StateInit .boc</button>
            <button onClick={exportJson}><Download size={15}/> Отчёт JSON</button>
            <button onClick={openStateInit}><FileCode2 size={15}/> BOC Explorer</button>
          </div></div> : <div className="contract-monitor-empty"><FileCode2 size={34}/>
          <strong>Результат появится здесь</strong>
          <p>Укажите BOC кода и данных, подтвердите семантику nonce и запустите поиск.</p></div>}
      </div>
    </div>
  </section>;
}
