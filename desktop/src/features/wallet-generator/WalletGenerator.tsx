/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState } from "react";
import { appDataDir, join, resourceDir } from "@tauri-apps/api/path";
import { isTauri } from "@tauri-apps/api/core";
import { Command, type Child } from "@tauri-apps/plugin-shell";
import * as Dialog from "@radix-ui/react-dialog";
import PublicAddressQr from "../../components/PublicAddressQr";
import Checkbox from "../../components/ui/Checkbox";
import Select from "../../components/ui/Select";
import { Check, Copy, Wallet } from "lucide-react";
import { Buffer } from "buffer";
import { platform } from "@platform";

type PublicWallet = {
  address: string;
  raw: string;
  public_key: string;
  wallet: "v5" | "v4";
  scheme: "12" | "24";
  encrypted_file?: string;
};

const web = platform.kind === "web";
const isLinux = !web && typeof navigator !== "undefined" && /Linux/i.test(navigator.userAgent);

export default function WalletGenerator() {
  const [scheme, setScheme] = useState<"12" | "24">("12");
  const [version, setVersion] = useState<"v5" | "v4">("v5");
  const [addressFormat, setAddressFormat] = useState<"bounceable" | "nonBounceable">("bounceable");
  const [network, setNetwork] = useState<"mainnet" | "testnet">(() =>
    localStorage.getItem("gramix.network.default") === "testnet" ? "testnet" : "mainnet");
  const [friendlyAddress, setFriendlyAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const session = useRef<Child | null>(null);
  const generationRef = useRef(0);
  const webPhrase = useRef<string | null>(null);
  const [wallet, setWallet] = useState<PublicWallet | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!wallet) { setFriendlyAddress(""); return; }
    setFriendlyAddress("");
    (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
    void import("@ton/core").then(({ Address }) => {
      if (active) setFriendlyAddress(Address.parseRaw(wallet.raw).toString({
        bounceable: addressFormat === "bounceable", testOnly: network === "testnet", urlSafe: true }));
    }).catch(() => { if (active) setError("Не удалось сформировать публичный адрес."); });
    return () => { active = false; };
  }, [wallet?.raw, addressFormat, network]);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealConfirmed, setRevealConfirmed] = useState(false);
  const phraseGridRef = useRef<HTMLDivElement>(null);
  const pendingPhrase = useRef<string | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealResponseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealRequest = useRef(0);
  const pendingReveal = useRef<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealTick, setRevealTick] = useState(0);
  const [copied, setCopied] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearRevealedPhrase() {
    pendingPhrase.current = null;
    phraseGridRef.current?.replaceChildren();
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
  }
  function clearRevealResponseTimer() {
    if (revealResponseTimer.current) clearTimeout(revealResponseTimer.current);
    revealResponseTimer.current = null;
  }
  useEffect(() => {
    if (revealing || !revealOpen || !pendingPhrase.current || !phraseGridRef.current) return;
    const words = pendingPhrase.current.split(/\s+/).filter(Boolean);
    pendingPhrase.current = null;
    const nodes = words.map((word, index) => {
      const cell = document.createElement("div");
      cell.className = "phrase-word";
      const number = document.createElement("span");
      number.textContent = String(index + 1);
      cell.append(number, document.createTextNode(word));
      return cell;
    });
    phraseGridRef.current.replaceChildren(...nodes);
    revealTimer.current = setTimeout(() => {
      clearRevealedPhrase();
      setRevealOpen(false);
    }, 45_000);
  }, [revealing, revealOpen, revealTick]);
  useEffect(() => () => {
    webPhrase.current = null;
    clearRevealedPhrase();
    clearRevealResponseTimer();
    if (copyTimer.current) clearTimeout(copyTimer.current);
    generationRef.current += 1;
    const child = session.current;
    if (child) void child.write("DISCARD\n").catch(() => child.kill());
  }, []);

  async function sidecarEnv() {
    return {
      GRAMIX_RESOURCE_DIR: await resourceDir(),
      ...(isLinux ? { GRAMIX_WALLET_PASSWORD: password } : {}),
    };
  }

  async function generate() {
    if (!confirmed || busy || (isLinux && password.length < 12)) return;
    if (session.current) {
      const previous = session.current;
      session.current = null;
      await previous.write("DISCARD\n").catch(() => previous.kill());
    }
    const generation = ++generationRef.current;
    setWallet(null);
    setError("");
    if (platform.generateWallet) {
      setBusy(true);
      try {
        const created = await platform.generateWallet(scheme, version);
        if (generationRef.current !== generation) return;
        webPhrase.current = created.phrase;
        setWallet({ address: created.address, raw: created.raw, public_key: created.publicKey,
          wallet: version, scheme });
        setConfirmed(false);
      } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
      finally { setBusy(false); }
      return;
    }
    if (!isTauri()) { setError("Генерация недоступна в этом окружении."); return; }
    setBusy(true);
    try {
      const directory = await join(await appDataDir(), "wallets");
      const command = Command.sidecar("binaries/gramix", [
        "wallet", "session", "--scheme", scheme, "--version", version,
        "--out", directory,
      ], { env: await sidecarEnv() });
      command.stdout.on("data", (line) => {
        if (generationRef.current !== generation) return;
        try {
          const event = JSON.parse(line) as { type: string; message?: string;
            encrypted_file?: string; phrase?: string } & PublicWallet;
          if (event.type === "generated") {
            setWallet({ address: event.address, raw: event.raw, public_key: event.public_key,
              wallet: event.wallet, scheme: event.scheme });
            setConfirmed(false);
            setBusy(false);
          } else if (event.type === "saved" && event.encrypted_file) {
            setWallet((current) => current ? { ...current, encrypted_file: event.encrypted_file } : current);
            setSaving(false);
            session.current = null;
            setPassword("");
          } else if (event.type === "save_error") {
            setError(event.message || "Не удалось сохранить кошелёк.");
            setSaving(false);
          } else if (event.type === "revealed" && pendingReveal.current === revealRequest.current) {
            clearRevealResponseTimer();
            pendingReveal.current = null;
            if (typeof event.phrase === "string" && event.phrase.length > 0) {
              pendingPhrase.current = event.phrase;
              setRevealing(false);
            } else {
              setError("Локальный процесс не вернул фразу восстановления.");
              setRevealOpen(false); setRevealing(false);
            }
          }
        } catch { setError("Некорректный ответ локального процесса кошелька."); setBusy(false); }
      });
      command.stderr.on("data", () => {
        if (generationRef.current !== generation) return;
        setError("Локальный процесс кошелька завершился с ошибкой."); setBusy(false);
      });
      command.on("close", ({ code }) => {
        if (generationRef.current !== generation) return;
        session.current = null;
        setBusy(false);
        setSaving(false);
        if (pendingReveal.current !== null) {
          clearRevealResponseTimer();
          pendingReveal.current = null;
          setRevealing(false);
          setError("Сессия кошелька закрылась до раскрытия фразы.");
          setRevealOpen(false);
        }
        if (code !== 0) setError("Локальный процесс кошелька завершился с ошибкой.");
      });
      command.on("error", () => {
        if (generationRef.current !== generation) return;
        setError("Не удалось запустить локальный процесс кошелька."); setBusy(false);
      });
      session.current = await command.spawn();
    } catch (cause) {
      setError(String(cause));
      setBusy(false);
    }
  }

  function requestGenerate() {
    if (wallet && (web || !wallet.encrypted_file)) {
      setRegenerateOpen(true);
      return;
    }
    void generate();
  }

  async function save() {
    if (!wallet || wallet.encrypted_file || !session.current || saving) return;
    setSaving(true);
    setError("");
    try { await session.current.write("SAVE\n"); }
    catch (cause) { setSaving(false); setError(String(cause)); }
  }

  async function reveal() {
    if (!wallet || revealing) return;
    if (wallet.encrypted_file && isLinux && password.length < 12) {
      setError("Введите пароль файла в форме кошелька, чтобы открыть фразу.");
      setRevealOpen(false);
      return;
    }
    setRevealOpen(true);
    const request = ++revealRequest.current;
    setRevealing(true);
    setError("");
    if (web) {
      pendingPhrase.current = webPhrase.current;
      setRevealing(false);
      setRevealTick((value) => value + 1);
      if (!pendingPhrase.current) { setError("Фраза уже удалена из памяти страницы."); setRevealOpen(false); }
      return;
    }
    try {
      if (!wallet.encrypted_file) {
        if (!session.current) throw new Error("Сессия кошелька уже закрыта.");
        pendingReveal.current = request;
        await session.current.write("REVEAL\n");
        revealResponseTimer.current = setTimeout(() => {
          if (pendingReveal.current !== request) return;
          pendingReveal.current = null;
          setRevealing(false);
          setRevealOpen(false);
          setError("Локальный процесс не ответил на запрос раскрытия фразы.");
        }, 10_000);
        return;
      }
      const output = await Command.sidecar("binaries/gramix",
        ["--reveal", wallet.encrypted_file], { env: await sidecarEnv() }).execute();
      if (output.code !== 0) throw new Error("Не удалось расшифровать или проверить файл кошелька.");
      if (request === revealRequest.current) pendingPhrase.current = output.stdout.trim();
    } catch (cause) {
      if (request === revealRequest.current) {
        setError(String(cause));
        setRevealOpen(false);
        setRevealing(false);
      }
    } finally {
      if (wallet.encrypted_file) {
        setRevealing(false);
        setPassword("");
      }
    }
  }

  async function copyPublic(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 4_000);
    }
    catch { setError("Не удалось скопировать публичные данные."); }
  }

  function exportPublic() {
    if (!wallet || !friendlyAddress) return;
    const report = { source: "local", wallet: wallet.wallet, scheme: wallet.scheme,
      address: friendlyAddress,
      raw: wallet.raw, public_key: wallet.public_key, workchain: 0, network };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)],
      { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `gramix-wallet-public-${Date.now()}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function verifyRecovery() {
    if (!wallet?.encrypted_file) return;
    window.dispatchEvent(new CustomEvent("gramix:verify-wallet", {
      detail: { address: friendlyAddress || wallet.address,
        scheme: wallet.scheme, version: wallet.wallet } }));
    window.location.hash = "wallet-security";
  }

  return <section className="panel wallet-generator" id="wallet-generator" aria-labelledby="wallet-title" data-telemetry-off="">
    <div className="panel-heading"><div>
      <h2 id="wallet-title">Создать обычный GRAM-кошелёк</h2>
      <p>Новый ключ создаётся локально; в обычный вывод попадают только публичные данные</p>
    </div></div>
    <div className="wallet-workspace"><div className="wallet-form">
      <h3>Параметры кошелька</h3>
      <fieldset className="wallet-scheme" aria-describedby="wallet-scheme-note">
        <legend>Схема восстановления</legend>
        <div className="wallet-scheme-options">
          <label className="wallet-scheme-option">
            <input type="radio" name="wallet-scheme" value="12" checked={scheme === "12"}
              disabled={busy} onChange={() => setScheme("12")} />
            <span className="wallet-scheme-dot" aria-hidden="true" />
            <span><strong>12 слов</strong><small>BIP39 / SLIP-0010</small></span>
          </label>
          <label className="wallet-scheme-option">
            <input type="radio" name="wallet-scheme" value="24" checked={scheme === "24"}
              disabled={busy} onChange={() => setScheme("24")} />
            <span className="wallet-scheme-dot" aria-hidden="true" />
            <span><strong>24 слова</strong><small>GRAM Native</small></span>
          </label>
        </div>
        <p id="wallet-scheme-note">Схемы восстанавливаются по разным правилам. При проверке выбирайте ту же схему.</p>
      </fieldset>
      <label>Версия контракта
        <Select label="Версия контракта" value={version} disabled={busy}
          onValueChange={(value) => setVersion(value as "v5" | "v4")}
          options={[{ value: "v5", label: "Wallet W5R1" }, { value: "v4", label: "Wallet V4R2" }]} />
      </label>
      <label>Формат публичного адреса
        <Select label="Формат публичного адреса" value={addressFormat}
          onValueChange={(value) => setAddressFormat(value as typeof addressFormat)}
          options={[{ value: "bounceable", label: "Bounceable · EQ" },
            { value: "nonBounceable", label: "Non-bounceable · UQ" }]}/>
      </label>
      <label>Сеть публичного адреса
        <Select label="Сеть публичного адреса" value={network} disabled={busy}
          onValueChange={(value) => setNetwork(value as typeof network)}
          options={[{ value: "mainnet", label: "Mainnet" },
            { value: "testnet", label: "Testnet" }]} />
      </label>
      {isLinux && <label>Пароль защищённого файла
        <input type="password" value={password} minLength={12} maxLength={1024}
          autoComplete="new-password" disabled={busy}
          onChange={(event) => setPassword(event.target.value)} />
      </label>}
      <Checkbox className="wallet-confirm" checked={confirmed} disabled={busy}
        onCheckedChange={setConfirmed}>Понимаю, что фраза восстановления даёт полный доступ к кошельку.</Checkbox>
      <button className="primary-button" type="button" onClick={requestGenerate}
        disabled={busy || !confirmed || (isLinux && password.length < 12)}>
        {busy ? "Создаю…" : wallet ? "Сгенерировать заново" : "Сгенерировать"}
      </button>
    </div>
    <div className="wallet-result-panel" aria-live="polite"><h3>Результат</h3>
    {error && <p className="error-box" role="alert">{error}</p>}
    {wallet ? <div className="wallet-public">
      <strong>Публичные данные кошелька</strong>
      <div className="wallet-data-row"><span>Адрес · {network}</span>
        <div><code>{friendlyAddress || "Формирую адрес…"}</code>
          <button type="button" disabled={!friendlyAddress} className={copied === "address" ? "copied" : ""}
            title={copied === "address" ? "Скопировано" : "Копировать адрес"}
            aria-label={copied === "address" ? "Адрес скопирован" : "Копировать адрес"}
            onClick={() => void copyPublic(friendlyAddress, "address")}>
            {copied === "address" ? <><Check size={16} /><span>Скопировано</span></> : <Copy size={16} />}</button></div></div>
      <div className="wallet-data-row"><span>Raw</span><div><code>{wallet.raw}</code>
        <button type="button" className={copied === "raw" ? "copied" : ""}
          title={copied === "raw" ? "Скопировано" : "Копировать raw-адрес"}
          aria-label={copied === "raw" ? "Raw-адрес скопирован" : "Копировать raw-адрес"}
          onClick={() => void copyPublic(wallet.raw, "raw")}>
          {copied === "raw" ? <><Check size={16} /><span>Скопировано</span></> : <Copy size={16} />}</button></div></div>
      <div className="wallet-data-row"><span>Публичный ключ</span><div><code>{wallet.public_key}</code>
        <button type="button" className={copied === "public_key" ? "copied" : ""}
          title={copied === "public_key" ? "Скопировано" : "Копировать публичный ключ"}
          aria-label={copied === "public_key" ? "Публичный ключ скопирован" : "Копировать публичный ключ"}
          onClick={() => void copyPublic(wallet.public_key, "public_key")}>
          {copied === "public_key" ? <><Check size={16} /><span>Скопировано</span></> : <Copy size={16} />}</button></div></div>
      <span>Workchain: 0 · {wallet.wallet === "v5" ? "Wallet V5R1" : "Wallet V4R2"} · {network}</span>
      {web ? <span>Фраза создана в вашем браузере и хранится только в памяти этой страницы. Запишите её: после закрытия вкладки восстановить её нельзя. Для больших сумм используйте приложение Gramix без сети.</span>
        : wallet.encrypted_file ? <span>Зашифрованный файл: {wallet.encrypted_file}</span>
        : <span>Фраза хранится только в памяти локального процесса до сохранения или закрытия приложения.</span>}
      <div className="wallet-public-actions">{friendlyAddress && <PublicAddressQr address={friendlyAddress} />}
        <button type="button" disabled={!friendlyAddress} onClick={exportPublic}>Экспорт публичных данных</button></div>
      {!web && !wallet.encrypted_file && <button type="button" className="primary-button"
        disabled={saving || !session.current} onClick={() => void save()}>
        {saving ? "Сохраняю…" : "Сохранить зашифрованно"}</button>}
      <div className="wallet-public-actions">
        {!web && <button type="button" disabled={!friendlyAddress} onClick={verifyRecovery}>Проверить восстановление</button>}
        <button type="button" onClick={() => { setRevealConfirmed(false); setRevealOpen(true); }}>
          Раскрыть фразу</button></div>
    </div> : <div className="wallet-empty"><Wallet size={35} aria-hidden="true" />
      <strong>Кошелёк ещё не создан</strong>
      <p>{web ? "После создания здесь появятся адрес и публичный ключ." : "После создания здесь появятся адрес, публичный ключ и путь к защищённому файлу."}</p></div>}
    </div></div>
    <Dialog.Root open={regenerateOpen} onOpenChange={setRegenerateOpen}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Заменить несохранённый кошелёк?</Dialog.Title>
          <Dialog.Description>Фраза восстановления текущего кошелька исчезнет из памяти при генерации нового. Если вы её не сохранили, доступ к этому кошельку восстановить не получится.</Dialog.Description>
          <div className="wallet-regenerate-actions">
            <Dialog.Close className="dialog-close">Оставить текущий</Dialog.Close>
            <button className="dialog-close wallet-regenerate-confirm" type="button"
              onClick={() => { setRegenerateOpen(false); void generate(); }}>Сгенерировать новый</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <Dialog.Root open={revealOpen} onOpenChange={(open) => {
      setRevealOpen(open);
      if (!open) { revealRequest.current += 1; pendingReveal.current = null;
        clearRevealResponseTimer(); setRevealing(false);
        setRevealConfirmed(false); clearRevealedPhrase(); }
    }}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Фраза восстановления</Dialog.Title>
          <Dialog.Description>Любой, кто увидит эти слова, сможет управлять кошельком. Сохраните их в безопасном месте.</Dialog.Description>
          {revealConfirmed ? <>{revealing ? <p>Расшифровка и проверка…</p> :
            <div className="phrase-grid" ref={phraseGridRef} />}
            <p>Фраза автоматически скроется через 45 секунд.</p></>
            : null}
          <div className="wallet-reveal-actions">
            {!revealConfirmed && <button className="dialog-close" type="button" onClick={() => {
              setRevealConfirmed(true); void reveal();
            }}>Я понимаю, показать фразу</button>}
            <Dialog.Close className="dialog-close">Закрыть</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
