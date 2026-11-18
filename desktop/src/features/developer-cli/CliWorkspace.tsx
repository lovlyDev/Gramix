/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useRef, useState } from "react";
import { errorText } from "../../lib/errors";
import { copyText } from "../../lib/clipboard";
import { Command, type Child } from "@tauri-apps/plugin-shell";
import { isTauri } from "@tauri-apps/api/core";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Check, Copy, Download, Play, Search, Square, Trash2 } from "lucide-react";
import { useApp } from "../../store";
import Select from "../../components/ui/Select";

const commands = [
  { id: "devices", label: "Устройства", group: "Диагностика", args: ["--devices-json"],
    description: "Обнаружение CPU и GPU. Само обнаружение не подтверждает готовность к вычислениям." },
  { id: "backends", label: "Проверенные движки", group: "Диагностика", args: ["--backends-json"],
    description: "Список движков, прошедших криптографическую самопроверку." },
  { id: "selftest", label: "Самопроверка", group: "Тесты", args: ["--self-test"],
    description: "Проверка выбранного движка по эталонным векторам GRAM." },
  { id: "benchmark", label: "Полный Benchmark", group: "Тесты", args: ["--benchmark-json"],
    description: "Измерение полного GRAM-пайплайна выбранного проверенного движка." },
  { id: "address", label: "Проверка адреса", group: "Блокчейн", args: ["address", "inspect", "--json"],
    description: "Локальная проверка raw или friendly GRAM-адреса, без сети." },
  { id: "autotune", label: "Повторная настройка", group: "Тесты", args: ["--retune", "--benchmark-json", "--backend", "auto"],
    description: "Повторная калибровка и измерение проверенных движков ядра." },
] as const;
type CommandId = (typeof commands)[number]["id"];

export default function CliWorkspace() {
  const backends = useApp((state) => state.validatedBackends);
  const [selected, setSelected] = useState<CommandId>("devices");
  const [backend, setBackend] = useState("cpu");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Команда ещё не выполнялась");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const terminalNode = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const output = useRef("");
  const child = useRef<Child | null>(null);
  const current = commands.find((command) => command.id === selected) ?? commands[0];
  const backendOptions = [{ value: "cpu", label: "CPU" },
    ...(["vulkan", "cuda", "hip"] as const).filter((api) =>
      backends.some((item) => item.api.toLowerCase() === api))
      .map((api) => ({ value: api, label: api.toUpperCase() }))];
  const effectiveBackend = backendOptions.some((option) => option.value === backend) ? backend : "cpu";
  const validAddress = /^(?:-?\d+:[a-fA-F0-9]{64}|[a-zA-Z0-9_-]{48})$/.test(address.trim());
  const args = selected === "address" ? [...current.args, address.trim()] :
    selected === "selftest" || selected === "benchmark"
      ? [...current.args, "--backend", effectiveBackend] : [...current.args];
  const cliEquivalent = `gramix ${args.join(" ")}`;

  useEffect(() => {
    if (!terminalNode.current) return;
    const instance = new Terminal({ convertEol: true, disableStdin: true, cursorBlink: false,
      fontFamily: "Cascadia Mono, JetBrains Mono Variable, Consolas, monospace", fontSize: 13, lineHeight: 1.45,
      theme: { background: "#212121", foreground: "#FFFFFF", cursor: "#8774E1",
        selectionBackground: "#8774E155", black: "#212121", red: "#FF6B66",
        green: "#3DDC6A", yellow: "#FFB340", blue: "#8774E1" },
      scrollback: 2000 });
    const fit = new FitAddon();
    instance.loadAddon(fit);
    instance.open(terminalNode.current);
    instance.writeln("Gramix Developer CLI\r\nВыберите разрешённую команду и нажмите «Выполнить».");
    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(terminalNode.current);
    requestAnimationFrame(() => fit.fit());
    terminal.current = instance;
    return () => { observer.disconnect(); instance.dispose(); terminal.current = null;
      void child.current?.kill(); };
  }, []);

  function write(value: string) {
    if (output.current.length < 1024 * 1024) output.current += value;
    terminal.current?.write(value.replaceAll("\n", "\r\n"));
  }

  async function run() {
    if (busy) return;
    if (selected === "address" && !validAddress) {
      setStatus("Введите raw или friendly GRAM-адрес."); return;
    }
    terminal.current?.clear();
    output.current = "";
    setExitCode(null); setDuration(null);
    if (!isTauri()) { setStatus("Команды доступны в установленном приложении Gramix.");
      write("Команды доступны в установленном приложении Gramix.\n"); return; }
    const commandArgs = [...args];
    const cli = `gramix ${commandArgs.join(" ")}`;
    write(`> ${cli}\n\n`);
    setStatus("Выполняется"); setBusy(true);
    const started = performance.now();
    try {
      const command = Command.sidecar("binaries/gramix", commandArgs);
      command.stdout.on("data", (value) => write(value + "\n"));
      command.stderr.on("data", (value) => write(`\x1b[31m${value}\x1b[0m\n`));
      command.on("close", ({ code }) => {
        child.current = null;
        setBusy(false); setExitCode(code);
        setDuration(Math.round(performance.now() - started));
        setStatus(code === 0 ? "Завершено" : "Ошибка");
        write(`\nПроцесс завершён · код ${code}\n`);
      });
      command.on("error", (cause) => {
        child.current = null; setBusy(false); setStatus("Ошибка");
        write(`\nОшибка запуска: ${errorText(cause)}\n`);
      });
      child.current = await command.spawn();
    } catch (cause) { child.current = null; setBusy(false); setStatus("Ошибка");
      write(`Ошибка запуска: ${errorText(cause)}\n`); }
  }


  async function stop() {
    if (!child.current) return;
    try { await child.current.kill(); setStatus("Остановлено"); }
    catch (cause) { setStatus(`Не удалось остановить: ${errorText(cause)}`); }
  }

  function download() {
    if (!output.current) return;
    const url = URL.createObjectURL(new Blob([output.current], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `gramix-cli-${selected}.txt`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="cli-workspace" id="developer-cli" aria-label="Developer CLI">
    <aside className="cli-command-list"><label className="cli-search"><Search size={16} />
      <input value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск команды" aria-label="Поиск команды" /></label>
      {["Диагностика", "Блокчейн", "Тесты"].map((group) => <div className="cli-command-group" key={group}>
        <h2>{group}</h2>{commands.filter((item) => item.group === group &&
          `${item.label} ${item.description} ${item.args.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
          .map((item) => <button type="button" key={item.id}
            className={selected === item.id ? "active" : ""} onClick={() => setSelected(item.id)}>
            <span>{item.label}</span>{selected === item.id && <Check size={15} />}
            <small>{item.description}</small></button>)}</div>)}
    </aside>
    <div className="cli-main"><div className="cli-command-header">
      <div><strong>{current.label}</strong><p>{current.description}</p>
        {(selected === "selftest" || selected === "benchmark") && <label className="cli-arg-field">Движок
          <Select label="Движок CLI" value={effectiveBackend} disabled={busy}
            onValueChange={setBackend} options={backendOptions} /></label>}
        {selected === "address" && <label className="cli-arg-field">GRAM-адрес
          <input value={address} disabled={busy} spellCheck={false}
            onChange={(event) => setAddress(event.target.value)} placeholder="EQ… или 0:…" />
          {address.trim() && !validAddress && <small>Нужны 48 символов friendly или raw-адрес.</small>}</label>}
        <code>{selected === "address" && !address.trim()
          ? "gramix address inspect --json <адрес>" : cliEquivalent}</code></div>
      <div className="cli-command-actions"><button type="button" title="Копировать эквивалентную CLI-команду"
        disabled={selected === "address" && !validAddress}
        onClick={() => void copyText(cliEquivalent)}>
        <Copy size={16} /> Команда</button>
        {busy ? <button type="button" onClick={() => void stop()}><Square size={15} /> Стоп</button>
          : <button type="button" className="cli-run" disabled={selected === "address" && !validAddress}
            onClick={() => void run()}><Play size={16} /> Выполнить</button>}</div>
    </div>
    <div className="cli-terminal-header"><span>Вывод терминала</span>
      <span role="status">{status}{exitCode !== null && ` · код ${exitCode}`}{duration !== null && ` · ${duration} мс`}</span>
      <button type="button" title="Копировать вывод" aria-label="Копировать вывод"
        onClick={() => void copyText(output.current)}><Copy size={15} /></button>
      <button type="button" title="Сохранить вывод" aria-label="Сохранить вывод" onClick={download}>
        <Download size={15} /></button>
      <button type="button" title="Очистить вывод" aria-label="Очистить вывод"
        onClick={() => { terminal.current?.clear(); output.current = ""; }}><Trash2 size={15} /></button></div>
    <div ref={terminalNode} className="cli-terminal" aria-label="Терминальный вывод" />
    <p className="cli-safety">В этой панели выполняются только перечисленные команды Gramix. Фразы восстановления и приватные ключи не принимаются.</p>
    </div>
  </section>;
}
