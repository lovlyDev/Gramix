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

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { resourceDir } from "@tauri-apps/api/path";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { Command } from "@tauri-apps/plugin-shell";
import * as Tabs from "@radix-ui/react-tabs";
import { CheckCircle2, FileCheck2, FileDown, FolderOpen, KeyRound,
  RotateCcw, SearchCheck, ShieldCheck } from "lucide-react";
import Select from "../../components/ui/Select";
import Checkbox from "../../components/ui/Checkbox";
import CopyButton from "../../components/ui/CopyButton";

type Mode = "file" | "phrase" | "compare";
type PublicResult = { source: "local"; verified: boolean; address: string; raw: string;
  public_key: string; matches_expected?: boolean };
const isLinux = typeof navigator !== "undefined" && /Linux/i.test(navigator.userAgent);

export default function WalletSecurity() {
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState("");
  const [password, setPassword] = useState("");
  const [scheme, setScheme] = useState<"12" | "24">("12");
  const [version, setVersion] = useState<"v5" | "v4">("v5");
  const [expected, setExpected] = useState("");
  const [pasteProtected, setPasteProtected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PublicResult | null>(null);
  const [resultMode, setResultMode] = useState<Mode>("file");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const phraseRef = useRef<HTMLTextAreaElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      const address = typeof detail === "string" ? detail :
        typeof detail === "object" && detail !== null && "address" in detail ? detail.address : null;
      if (typeof address !== "string") return;
      if (phraseRef.current) phraseRef.current.value = "";
      if (typeof detail === "object" && detail !== null) {
        if ("scheme" in detail && (detail.scheme === "12" || detail.scheme === "24"))
          setScheme(detail.scheme);
        if ("version" in detail && (detail.version === "v5" || detail.version === "v4"))
          setVersion(detail.version);
      }
      setExpected(address); setMode("phrase"); setResult(null);
      setError(""); setNotice("");
    };
    window.addEventListener("vantix:verify-wallet", receive);
    return () => window.removeEventListener("vantix:verify-wallet", receive);
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    let unlisten: (() => void) | undefined;
    void getCurrentWebview().onDragDropEvent((event) => {
      if (!active || mode !== "file") return;
      const rect = dropRef.current?.getBoundingClientRect();
      const point = "position" in event.payload ? event.payload.position : null;
      const ratio = window.devicePixelRatio || 1;
      const inside = Boolean(rect && point && point.x / ratio >= rect.left &&
        point.x / ratio <= rect.right && point.y / ratio >= rect.top &&
        point.y / ratio <= rect.bottom);
      if (event.payload.type === "enter" || event.payload.type === "over") setDragging(inside);
      if (event.payload.type === "leave" || event.payload.type === "drop") setDragging(false);
      if (event.payload.type === "drop" && inside && event.payload.paths.length === 1) {
        setFile(event.payload.paths[0]); setResult(null); setError("");
      }
    }).then((stop) => { if (active) unlisten = stop; else stop(); });
    return () => { active = false; unlisten?.(); };
  }, [mode]);

  function clear() {
    requestRef.current += 1;
    if (phraseRef.current) phraseRef.current.value = "";
    setFile(""); setPassword(""); setExpected(""); setResult(null);
    setError(""); setNotice(""); setBusy(false);
  }

  async function chooseFile() {
    if (!isTauri()) { setError("Выбор файла доступен в установленном приложении."); return; }
    try {
      const selected = await open({ multiple: false, directory: false,
        filters: [{ name: "Файл кошелька VANTIX", extensions: ["txt"] }] });
      if (typeof selected === "string") { setFile(selected); setResult(null); setError(""); }
    } catch { setError("Не удалось открыть выбор файла."); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null); setError(""); setNotice("");
    if (mode === "compare") return;
    if (!isTauri()) { setError("Локальная проверка доступна в установленном приложении VANTIX."); return; }
    if (mode === "file" && !file.trim()) { setError("Выберите зашифрованный файл."); return; }
    if (mode === "file" && isLinux && password.length < 12) {
      setError("Введите пароль защищённого файла."); return;
    }
    const phrase = mode === "phrase" ? phraseRef.current?.value.trim() ?? "" : "";
    if (mode === "phrase" && phrase.split(/\s+/).length !== Number(scheme)) {
      setError(`Для выбранной схемы требуется ${scheme} слов.`); return;
    }
    if (phraseRef.current) phraseRef.current.value = "";
    const request = ++requestRef.current;
    setBusy(true);
    try {
      const args = mode === "file"
        ? ["wallet", "verify", "--file", file.trim(), "--json"]
        : ["wallet", "verify-phrase", "--scheme", scheme, "--version", version,
          ...(expected.trim() ? ["--expected", expected.trim()] : [])];
      const env = { VANTIX_RESOURCE_DIR: await resourceDir(),
        ...(mode === "file" && isLinux ? { VANTIX_WALLET_PASSWORD: password } : {}) };
      let output: string;
      if (mode === "phrase") {
        output = await new Promise<string>((resolve, reject) => {
          const command = Command.sidecar("binaries/vantix", args, { env });
          let stdout = "";
          command.stdout.on("data", (line) => { stdout += `${line}\n`; });
          command.on("error", () => reject(new Error("Не удалось запустить локальную проверку.")));
          command.on("close", ({ code }) => code === 0 ? resolve(stdout)
            : reject(new Error("Фраза не прошла проверку. Проверьте схему, версию и порядок слов.")));
          void command.spawn().then((child) => child.write(`${phrase}\n`))
            .catch(() => reject(new Error("Не удалось передать фразу локальному процессу.")));
        });
      } else {
        const checked = await Command.sidecar("binaries/vantix", args, { env }).execute();
        if (checked.code !== 0) throw new Error("Файл не прошёл проверку. Убедитесь, что он создан VANTIX и доступен текущему пользователю.");
        output = checked.stdout;
      }
      const checked = JSON.parse(output.trim()) as PublicResult;
      if (checked.source !== "local" || !checked.verified || !checked.address || !checked.raw)
        throw new Error("Локальная проверка вернула неполный результат.");
      if (request === requestRef.current) { setResult(checked); setResultMode(mode); }
    } catch (cause) {
      if (request === requestRef.current) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (request === requestRef.current) { setPassword(""); setBusy(false); }
    }
  }

  async function compare() {
    if (!result || !expected.trim()) { setError("Укажите адрес для сравнения."); return; }
    setError(""); setNotice("");
    if (!isTauri()) { setError("Сравнение адресов доступно в установленном приложении."); return; }
    try {
      const response = await Command.sidecar("binaries/vantix",
        ["address", "inspect", expected.trim(), "--json"]).execute();
      if (response.code !== 0) throw new Error("Ожидаемый адрес имеет неверный формат или checksum.");
      const checked = JSON.parse(response.stdout) as { raw: string };
      setResult({ ...result, matches_expected: checked.raw === result.raw });
      setNotice(checked.raw === result.raw ? "Публичные адреса совпадают." : "Публичные адреса различаются.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  function downloadReport() {
    if (!result) return;
    const report = { product: "VANTIX", source: "local", checked_at: new Date().toISOString(),
      method: resultMode, verified: result.verified, address: result.address, raw: result.raw,
      public_key: result.public_key, ...(expected ? { expected_address: expected,
        matches_expected: result.matches_expected } : {}) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `vantix-wallet-check-${Date.now()}.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function inspectAddress() {
    if (!result) return;
    window.dispatchEvent(new CustomEvent("vantix:inspect-address", { detail: result.address }));
    window.location.hash = "address-inspector";
  }

  return <section className="wallet-security" id="wallet-security" aria-labelledby="security-title">
    <div className="panel-heading"><div><h2 id="security-title">Проверка кошелька</h2>
      <p>Файл и recovery phrase проверяются локально. В отчёт попадают только публичные данные.</p>
    </div></div>
    <div className="security-workspace"><div className="security-input">
      <Tabs.Root value={mode} onValueChange={(value) => {
        if (phraseRef.current) phraseRef.current.value = "";
        setMode(value as Mode); setError(""); setNotice("");
      }}>
        <Tabs.List className="security-tabs" aria-label="Способ проверки">
          <Tabs.Trigger value="file"><FolderOpen size={17}/> Файл VANTIX</Tabs.Trigger>
          <Tabs.Trigger value="phrase"><KeyRound size={17}/> Recovery phrase</Tabs.Trigger>
          <Tabs.Trigger value="compare"><SearchCheck size={17}/> Сверить адрес</Tabs.Trigger>
        </Tabs.List>
        <form onSubmit={(event) => void verify(event)}>
          <Tabs.Content value="file" className="security-form-fields">
            <div ref={dropRef} className={`security-drop ${dragging ? "dragging" : ""}`}>
              <FileCheck2 size={27}/><strong>Зашифрованный файл VANTIX</strong>
              <span>Выберите файл или перетащите его сюда · до 16 КиБ</span>
              <button type="button" onClick={() => void chooseFile()} disabled={busy}>Выбрать файл</button>
            </div>
            <label>Путь к файлу<input className="address-input" value={file} readOnly placeholder="Файл ещё не выбран" /></label>
            {isLinux && <label>Пароль файла<input type="password" value={password}
              onChange={(event) => setPassword(event.target.value)} disabled={busy}
              autoComplete="off" placeholder="Пароль шифрования" /></label>}
          </Tabs.Content>
          <Tabs.Content value="phrase" className="security-form-fields">
            <p className="security-note"><ShieldCheck size={17}/> Фраза передаётся локальному процессу через stdin и очищается из поля после запуска проверки.</p>
            <label>Recovery phrase<textarea ref={phraseRef} className="security-phrase" autoComplete="off"
              spellCheck={false} disabled={busy} placeholder="Введите слова в исходном порядке"
              onPaste={(event) => { if (pasteProtected) event.preventDefault(); }}/></label>
            <Checkbox checked={pasteProtected} onCheckedChange={setPasteProtected} disabled={busy}>
              Запретить вставку из буфера обмена</Checkbox>
            <div className="security-selectors"><label>Схема восстановления
              <Select label="Схема восстановления" value={scheme} onValueChange={(value) => setScheme(value as "12" | "24")}
                options={[{ value: "12", label: "12 слов · BIP39/SLIP-0010" },
                  { value: "24", label: "24 слова · TON Native" }]} disabled={busy}/></label>
              <label>Версия кошелька
                <Select label="Версия кошелька" value={version} onValueChange={(value) => setVersion(value as "v5" | "v4")}
                  options={[{ value: "v5", label: "Wallet V5R1" }, { value: "v4", label: "Wallet V4R2" }]} disabled={busy}/></label></div>
            <label>Ожидаемый адрес · необязательно<input className="address-input" value={expected}
              onChange={(event) => { setExpected(event.target.value);
                setResult((current) => current ? { ...current, matches_expected: undefined } : current); }} disabled={busy}
              placeholder="EQ… / UQ… / 0:…" spellCheck={false}/></label>
          </Tabs.Content>
          <Tabs.Content value="compare" className="security-form-fields">
            <p className="security-note"><SearchCheck size={17}/> Сравнение использует результат проверки файла или фразы и само по себе не подтверждает владение адресом.</p>
            <label>Адрес для сравнения<input className="address-input" value={expected}
              onChange={(event) => { setExpected(event.target.value); setNotice("");
                setResult((current) => current ? { ...current, matches_expected: undefined } : current); }}
              placeholder="EQ… / UQ… / 0:…" spellCheck={false}/></label>
            <button type="button" className="primary-button" onClick={() => void compare()}
              disabled={!result || !expected.trim()}>Сравнить адрес</button>
            <button type="button" className="security-clear" onClick={clear} disabled={busy}>
              <RotateCcw size={16}/> Сбросить</button>
          </Tabs.Content>
          {mode !== "compare" && <div className="security-form-actions">
            <button className="primary-button" disabled={busy || (mode === "file" && !file)}
              type="submit">{busy ? "Проверяю…" : "Проверить локально"}</button>
            <button type="button" onClick={clear} disabled={busy}><RotateCcw size={16}/> Сбросить</button>
          </div>}
        </form>
      </Tabs.Root>
    </div><div className="security-output" aria-live="polite">
      <div className="security-output-title"><ShieldCheck size={21}/><div><h3>Результат проверки</h3>
        <span>Данные не отправляются в сеть</span></div></div>
      {error && <p className="error-box" role="alert">{error}</p>}
      {notice && <p className={result?.matches_expected ? "security-ok" : "validation"} role="status">{notice}</p>}
      {result ? <><ol className="security-steps">
        <li><CheckCircle2 size={17}/><div><strong>Формат и защита</strong>
          <span>{resultMode === "file" ? "Файл расшифрован и проверен" : "Фраза и схема восстановления проверены"}</span></div></li>
        <li><CheckCircle2 size={17}/><div><strong>Публичный ключ</strong><code>{result.public_key}</code></div></li>
        <li><CheckCircle2 size={17}/><div><strong>Адрес TON</strong><code>{result.address}</code></div></li>
      </ol>
        {result.matches_expected !== undefined && <p className={result.matches_expected ? "security-ok" : "validation"}>
          {result.matches_expected ? "Адрес совпадает с ожидаемым." : "Адрес отличается от ожидаемого."}</p>}
        <div className="security-result-actions">
          <CopyButton value={result.address} label="Копировать адрес" />
          <button onClick={downloadReport}><FileDown size={15}/> Отчёт без секретов</button>
          <button onClick={inspectAddress}><SearchCheck size={15}/> Открыть инспектор</button>
        </div></> : <div className="security-empty"><ShieldCheck size={36}/>
          <strong>Результат появится здесь</strong><p>Выберите способ проверки. После него появятся публичный ключ и адрес.</p></div>}
    </div></div>
  </section>;
}
