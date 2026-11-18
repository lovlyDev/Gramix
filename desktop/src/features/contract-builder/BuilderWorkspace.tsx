/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { errorText } from "../../lib/errors";
import { platform } from "@platform";
import { telemetry } from "@telemetry";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "../../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker";
import { Group, Panel, Separator } from "react-resizable-panels";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileCode2, FilePlus2, FolderOpen, Pencil, Play, Trash2, Upload } from "lucide-react";
import { decodeBocText, parseBocBytes } from "../boc-explorer/bocService";
import { parseTolkProject, validTolkPath } from "./builderProject";

(self as typeof self & { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};
loader.config({ monaco });

type BuildSuccess = { status: "ok"; language: "Tolk"; compilerVersion: string;
  codeBocBase64: string; codeHashHex: string; fiftCode: string; abi: unknown; diagnostics: string };
type Project = Record<string, string>;
const starter = "fun onInternalMessage(_: InMessage) {}\n";

function saveDownload(name: string, data: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function registerTolk(editor: typeof monaco) {
  if (!editor.languages.getLanguages().some((language) => language.id === "tolk")) {
    editor.languages.register({ id: "tolk" });
    editor.languages.setMonarchTokensProvider("tolk", {
      keywords: ["fun", "get", "let", "var", "const", "return", "if", "else", "while", "repeat",
        "import", "struct", "enum", "throw", "true", "false", "null", "asm", "inline"],
      tokenizer: { root: [
        [/\/\/.*$/, "comment"], [/\/\*/, "comment", "@comment"],
        [/"([^"\\]|\\.)*"/, "string"], [/\b\d+(?:\.\d+)?\b/, "number"],
        [/[a-zA-Z_][\w]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
      ], comment: [[/[^*]+/, "comment"], [/\*\//, "comment", "@pop"], [/./, "comment"]] },
    });
  }
  editor.editor.defineTheme("gramix-tolk", { base: "vs-dark", inherit: true,
    rules: [{ token: "keyword", foreground: "a594f0" }, { token: "string", foreground: "7ee2a0" },
      { token: "comment", foreground: "858585" }, { token: "number", foreground: "ffb340" }],
    colors: { "editor.background": "#212121", "editor.foreground": "#FFFFFF",
      "editorLineNumber.foreground": "#6E6E6E", "editor.lineHighlightBackground": "#2A2A2A",
      "editorGutter.background": "#212121", "editor.selectionBackground": "#8774E155" } });
}

export default function BuilderWorkspace() {
  const [files, setFiles] = useState<Project>({ "main.tolk": starter });
  const [active, setActive] = useState("main.tolk");
  const [entrypoint, setEntrypoint] = useState("main.tolk");
  const [newName, setNewName] = useState("");
  const [result, setResult] = useState<BuildSuccess | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outputTab, setOutputTab] = useState<"output" | "abi" | "fift">("output");
  const [dirty, setDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const projectPicker = useRef<HTMLInputElement>(null);
  const sourcePicker = useRef<HTMLInputElement>(null);
  const pendingAction = useRef<(() => void) | null>(null);

  function requestReplace(action: () => void) {
    if (!dirty) { action(); return; }
    pendingAction.current = action;
    setDiscardOpen(true);
  }

  function newProject() {
    requestReplace(() => { setFiles({ "main.tolk": starter }); setActive("main.tolk");
      setEntrypoint("main.tolk"); setResult(null); setError(""); setDirty(false); });
  }

  function saveProject() {
    try { saveDownload("gramix-tolk-project.json", JSON.stringify(
      parseTolkProject({ entrypoint, files }), null, 2)); setDirty(false); setError(""); }
    catch (cause) { setError(errorText(cause)); }
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (file.size > 128 * 1024) { setError("Проект превышает лимит 128 КиБ."); return; }
    try {
      const project = parseTolkProject(JSON.parse(await file.text()));
      requestReplace(() => { setFiles(project.files); setEntrypoint(project.entrypoint);
        setActive(project.entrypoint); setDirty(false); setResult(null); setError(""); });
    } catch (cause) { setError(`Не удалось открыть проект: ${errorText(cause)}`); }
  }

  function addFile() {
    const name = newName.trim().replaceAll("\\", "/");
    if (!validTolkPath(name)) {
      setError("Имя файла должно быть относительным путём с расширением .tolk."); return;
    }
    if (Object.keys(files).some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      setError("Файл с таким именем уже есть."); return; }
    if (Object.keys(files).length >= 24) { setError("В проекте может быть не больше 24 файлов."); return; }
    setFiles((current) => ({ ...current, [name]: "" })); setDirty(true);
    setActive(name); setNewName(""); setResult(null); setError("");
  }

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!picked.length) return;
    if (picked.some((file) => !validTolkPath(file.name) || file.size > 120 * 1024 ||
        Object.keys(files).some((name) => name.toLowerCase() === file.name.toLowerCase())) ||
        Object.keys(files).length + picked.length > 24) {
      setError("Можно добавить до 24 новых файлов .tolk, каждый не больше 120 КиБ. Повторяющиеся имена не перезаписываются."); return;
    }
    const additions = Object.fromEntries(await Promise.all(picked.map(async (file) => [file.name, await file.text()])));
    setFiles((current) => ({ ...current, ...additions })); setDirty(true);
    setActive(picked[0].name); setResult(null); setError("");
  }

  async function build() {
    setError(""); setResult(null); setOutputTab("output");
    const project = JSON.stringify({ __gramixProject: 1, entrypoint, files });
    if (new TextEncoder().encode(project).length > 128 * 1024) {
      setError("Проект превышает лимит 128 КиБ."); return;
    }
    setBusy(true);
    try {
      const compiled = await platform.compileTolk(project);
      telemetry.track({ name: "tool_action", tool: "contract-builder", action: compiled.status === "ok" ? "build_ok" : "build_error" });
      if (compiled.status === "error") throw new Error(compiled.message);
      const document = await parseBocBytes(decodeBocText(compiled.codeBocBase64, "base64"));
      if (document.roots.length !== 1 || document.roots[0].toLowerCase() !== compiled.codeHashHex.toLowerCase())
        throw new Error("Хеш скомпилированного BOC не прошёл локальную проверку.");
      setResult(compiled);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  function removeActive() {
    if (Object.keys(files).length <= 1) return;
    const next = Object.fromEntries(Object.entries(files).filter(([name]) => name !== active));
    const first = Object.keys(next)[0]; setDirty(true);
    setFiles(next); setActive(first); setResult(null);
    if (entrypoint === active) setEntrypoint(first);
  }

  function renameActive() {
    const name = renameName.trim().replaceAll("\\", "/");
    if (!validTolkPath(name)) { setError("Введите относительный путь с расширением .tolk."); return; }
    if (Object.keys(files).some((existing) => existing !== active &&
        existing.toLowerCase() === name.toLowerCase())) {
      setError("Файл с таким именем уже есть."); return;
    }
    const next = Object.fromEntries(Object.entries(files).map(([path, content]) =>
      [path === active ? name : path, content]));
    setFiles(next); setActive(name);
    if (entrypoint === active) setEntrypoint(name);
    setResult(null); setDirty(true); setRenameOpen(false); setError("");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (document.getElementById("contract-builder")?.closest<HTMLElement>(".tool-screen")?.hidden) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "s") { event.preventDefault(); saveProject(); }
      else if (event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault(); if (!busy) void build();
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault(); fileInput.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return <section className="builder-workspace" id="contract-builder" aria-label="Contract Builder">
    <div className="builder-toolbar"><span className="builder-caption">Локальный проект Tolk</span>
      <button type="button" onClick={newProject}><FilePlus2 size={16} /> Новый проект</button>
      <button type="button" onClick={() => projectPicker.current?.click()}>
        <FolderOpen size={16} /> Открыть проект</button>
      <input ref={projectPicker} className="builder-hidden-input" type="file"
        accept=".json,application/json" onChange={(event) => void importProject(event)} />
      <button type="button" onClick={() => sourcePicker.current?.click()}>
        <Upload size={16} /> Импорт .tolk</button>
      <input ref={sourcePicker} className="builder-hidden-input" type="file"
        accept=".tolk" multiple onChange={(event) => void importFiles(event)} />
      <button type="button" onClick={saveProject} title="Сохранить проект · Ctrl+S">
        <Download size={16} /> Сохранить{dirty ? " *" : ""}</button>
      <button type="button" className="builder-build" disabled={busy || !files[entrypoint]?.trim()}
        onClick={() => void build()}><Play size={16} /> {busy ? "Собираю…" : "Собрать"}</button>
    </div>
    <Group orientation="horizontal" className="builder-main" id="builder-main">
      <Panel defaultSize="24" minSize={200} maxSize="40" className="builder-files">
        <div className="builder-pane-heading">Файлы <span>{Object.keys(files).length}</span></div>
        <div className="builder-file-list">{Object.keys(files).map((name) =>
          <button type="button" key={name} className={active === name ? "active" : ""}
            onClick={() => setActive(name)} title={name}><FileCode2 size={16} />
            <span>{name}</span>{entrypoint === name && <small>entry</small>}</button>)}</div>
        <div className="builder-file-tools"><input ref={fileInput} value={newName} maxLength={80}
          onChange={(event) => setNewName(event.target.value)} placeholder="имя.tolk"
          aria-label="Имя нового файла" onKeyDown={(event) => { if (event.key === "Enter") addFile(); }} />
          <button type="button" title="Добавить файл" aria-label="Добавить файл" onClick={addFile}><FilePlus2 size={17} /></button></div>
        <div className="builder-file-tools"><button type="button" onClick={() => { setEntrypoint(active); setDirty(true); }}
          disabled={entrypoint === active}>Сделать входным</button>
          <button type="button" title="Переименовать файл" aria-label="Переименовать файл"
            onClick={() => { setRenameName(active); setError(""); setRenameOpen(true); }}><Pencil size={16} /></button>
          <button type="button" title="Удалить файл" aria-label="Удалить файл" disabled={Object.keys(files).length === 1}
            onClick={() => setDeleteOpen(true)}><Trash2 size={16} /></button></div>
      </Panel>
      <Separator className="builder-separator" />
      <Panel defaultSize="76" minSize={360} className="builder-editor-side">
        <Group orientation="vertical" id="builder-editor-output">
          <Panel defaultSize="70" minSize={230} className="builder-editor-pane">
            <div className="builder-editor-tab"><FileCode2 size={15} /> {active}{dirty ? " *" : ""}</div>
            <Editor path={`file:///gramix/${active}`} language="tolk" theme="gramix-tolk"
              value={files[active] ?? ""} beforeMount={registerTolk}
              onChange={(value) => { setFiles((current) => ({ ...current, [active]: value ?? "" }));
                setDirty(true); setResult(null); }}
              options={{ minimap: { enabled: false }, fontFamily: "JetBrains Mono Variable, Consolas, monospace",
                fontSize: 13, lineHeight: 21, automaticLayout: true, scrollBeyondLastLine: false,
                padding: { top: 14 }, tabSize: 4 }} />
          </Panel>
          <Separator className="builder-separator horizontal" />
          <Panel defaultSize="30" minSize={120} className="builder-output-pane">
            <div className="builder-output-tabs">
              {(["output", "abi", "fift"] as const).map((tab) => <button type="button" key={tab}
                aria-pressed={outputTab === tab} onClick={() => setOutputTab(tab)}>
                {tab === "output" ? "Сборка" : tab.toUpperCase()}</button>)}
              {result && <button type="button" className="builder-export" onClick={() => saveDownload(
                `${entrypoint}.compiled.json`, JSON.stringify(result, null, 2))}><Download size={15} /> Артефакт</button>}
              {result && <button type="button" className="builder-export" onClick={() => {
                window.dispatchEvent(new CustomEvent("gramix:open-boc", { detail: result.codeBocBase64 }));
                window.location.hash = "boc-explorer";
              }}>Открыть BOC</button>}
            </div>
            <div className="builder-output-text" role="status">{outputTab === "output"
              ? error ? <pre className="builder-error">{error}</pre>
                : result ? <pre>Сборка успешна · Tolk {result.compilerVersion}{"\n"}Code hash: {result.codeHashHex}{"\n"}{result.diagnostics}</pre>
                  : <span>Запустите сборку, чтобы получить диагностику и BOC кода.</span>
              : result ? <pre>{outputTab === "abi" ? JSON.stringify(result.abi, null, 2) : result.fiftCode}</pre>
                : <span>Артефакты появятся после успешной сборки.</span>}</div>
          </Panel>
        </Group>
      </Panel>
    </Group>
    <Dialog.Root open={discardOpen} onOpenChange={setDiscardOpen}><Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content">
        <Dialog.Title>Заменить несохранённый проект?</Dialog.Title>
        <Dialog.Description>Изменения текущего проекта не сохранены. Сохраните его перед открытием другого проекта или созданием нового.</Dialog.Description>
        <div className="builder-dialog-actions"><Dialog.Close className="dialog-close">Остаться</Dialog.Close>
          <button type="button" className="dialog-close builder-dialog-danger" onClick={() => {
            pendingAction.current?.(); pendingAction.current = null; setDiscardOpen(false);
          }}>Заменить проект</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}><Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content">
        <Dialog.Title>Удалить {active}?</Dialog.Title>
        <Dialog.Description>Файл будет удалён из текущего проекта. Сохранённая копия проекта останется на диске.</Dialog.Description>
        <div className="builder-dialog-actions"><Dialog.Close className="dialog-close">Отмена</Dialog.Close>
          <button type="button" className="dialog-close builder-dialog-danger" onClick={() => {
            removeActive(); setDeleteOpen(false);
          }}>Удалить файл</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={renameOpen} onOpenChange={setRenameOpen}><Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content">
        <Dialog.Title>Переименовать файл</Dialog.Title>
        <Dialog.Description>Укажите относительный путь в проекте. Расширение .tolk обязательно.</Dialog.Description>
        <input className="builder-rename-input" aria-label="Новое имя файла" value={renameName}
          maxLength={80} onChange={(event) => setRenameName(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") renameActive(); }} />
        <div className="builder-dialog-actions"><Dialog.Close className="dialog-close">Отмена</Dialog.Close>
          <button type="button" className="dialog-close" onClick={renameActive}>Переименовать</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
