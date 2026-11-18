/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, ChevronRight, FileCode2 } from "lucide-react";
import { decodeBocText, MAX_BOC_BYTES, parseBocBytes,
  type BocDocument } from "./bocService";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";

const ROW_HEIGHT = 54;
const VIEW_HEIGHT = 330;

function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)],
    { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadBoc(value: string) {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url; link.download = "gramix.boc"; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BocExplorer() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"base64" | "hex">("base64");
  const [document, setDocument] = useState<BocDocument | null>(null);
  const [error, setError] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [comparison, setComparison] = useState("");
  const [comparisonResult, setComparisonResult] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "bits" | "hex" | "refs" | "hashes" | "raw">("overview");
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set());
  const treeRef = useRef<HTMLDivElement>(null);

  function resetTreeScroll() {
    setScrollTop(0);
    if (treeRef.current) treeRef.current.scrollTop = 0;
  }

  function clear() {
    setText(""); setDocument(null); setError(""); setSearch("");
    setComparison(""); setComparisonResult(""); setSelectedPath(""); resetTreeScroll();
    setCollapsedPaths(new Set());
  }

  async function load(bytes: Uint8Array) {
    setDocument(null);
    setError("");
    setComparisonResult("");
    try {
      const parsed = await parseBocBytes(bytes);
      setDocument(parsed);
      setSelectedPath(parsed.nodes[0]?.path ?? "");
      setDetailTab("overview");
      resetTreeScroll();
      setCollapsedPaths(new Set());
    } catch (cause) {
      setError(String(cause));
    }
  }

  useEffect(() => {
    const receive = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value !== "string") return;
      setText(value);
      setFormat("base64");
      try { void load(decodeBocText(value, "base64")); }
      catch (cause) { setError(String(cause)); }
    };
    window.addEventListener("gramix:open-boc", receive);
    return () => window.removeEventListener("gramix:open-boc", receive);
  }, []);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BOC_BYTES) {
      setDocument(null);
      setError("BOC превышает лимит 64 КиБ.");
      return;
    }
    await load(new Uint8Array(await file.arrayBuffer()));
    event.target.value = "";
  }

  async function parseText() {
    try {
      await load(decodeBocText(text, format));
    } catch (cause) {
      setDocument(null);
      setError(String(cause));
    }
  }

  async function compare() {
    if (!document) return;
    setComparisonResult("");
    try {
      const other = await parseBocBytes(decodeBocText(comparison, format));
      setComparisonResult(document.roots.join(",") === other.roots.join(",")
        ? "Корневые хеши совпадают." : "Корневые хеши различаются.");
    } catch (cause) {
      setComparisonResult(String(cause));
    }
  }

  const searchTerm = search.trim().toLowerCase();
  const rows = document?.nodes.filter((node) => {
    if (searchTerm) return node.path.includes(searchTerm) || node.hash.includes(searchTerm);
    const segments = node.path.split(".");
    for (let index = 1; index < segments.length; index++) {
      if (collapsedPaths.has(segments.slice(0, index).join("."))) return false;
    }
    return true;
  }) ?? [];
  const start = Math.min(Math.floor(scrollTop / ROW_HEIGHT), Math.max(0, rows.length - 1));
  const visible = rows.slice(start, start + Math.ceil(VIEW_HEIGHT / ROW_HEIGHT) + 3);
  const selected = document?.nodes.find((node) => node.path === selectedPath);

  return <section className="panel boc-explorer" id="boc-explorer" aria-labelledby="boc-title">
    <div className="panel-heading"><div>
      <h2 id="boc-title">BOC Explorer</h2>
      <p>Локальный разбор GRAM Bag of Cells. Лимит входа — 64 КиБ.</p>
    </div></div>
    <div className="boc-import">
      <label>Формат текста
        <Select label="Формат текста" value={format}
          onValueChange={(value) => setFormat(value as "base64" | "hex")}
          options={[{ value: "base64", label: "Base64" }, { value: "hex", label: "Hex" }]}/>
      </label>
      <label>BOC
        <textarea value={text} onChange={(event) => setText(event.target.value)}
          maxLength={MAX_BOC_BYTES * 2} spellCheck={false} placeholder="Вставьте BOC" />
      </label>
      <div className="boc-actions">
        <button type="button" onClick={() => void parseText()} disabled={!text.trim()}>Разобрать текст</button>
        <label className="boc-file-button">Открыть .boc
          <input type="file" accept=".boc,application/octet-stream" onChange={(event) => void chooseFile(event)} />
        </label>
        <button type="button" onClick={clear} disabled={!text && !document && !error}>Очистить</button>
      </div>
    </div>
    {error && <p className="error-box" role="alert">{error}</p>}
    {!document && !error && <div className="boc-empty"><FileCode2 size={34}/>
      <strong>BOC ещё не открыт</strong>
      <p>Вставьте текст или откройте .boc файл. Дерево ячеек и инспектор появятся после локального разбора.</p></div>}
    {document && <div className="boc-result">
      <div className="boc-summary">
        <span>Размер: {document.byteLength} байт</span>
        <span>Корней: {document.roots.length}</span>
        <span>Узлов: {document.nodes.length}</span>
        <button type="button" onClick={() => downloadBoc(document.bocBase64)}>Сохранить BOC</button>
        <button type="button" onClick={() => downloadJson("gramix-boc.json", document)}>Экспорт JSON</button>
      </div>
      <label>Поиск по пути или хешу
        <input className="address-input" value={search} onChange={(event) => {
          setSearch(event.target.value); resetTreeScroll();
        }} placeholder="0.1 или хеш" />
      </label>
      <div className="boc-tree-actions">
        <button type="button" disabled={!document.nodes.some((node) => node.refCount > 0)}
          onClick={() => { setCollapsedPaths(new Set()); resetTreeScroll(); }}>Развернуть всё</button>
        <button type="button" disabled={!document.nodes.some((node) => node.refCount > 0)}
          onClick={() => { setCollapsedPaths(new Set(document.nodes.filter((node) =>
            node.refCount > 0).map((node) => node.path))); resetTreeScroll(); }}>Свернуть всё</button>
        <span>{rows.length} из {document.nodes.length} ячеек</span>
      </div>
      <div className="boc-columns">
        <div className="boc-tree" ref={treeRef}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
          <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
            {visible.map((node, index) => <div className="boc-tree-row" key={node.path}
              style={{ top: (start + index) * ROW_HEIGHT }}>
              {node.refCount > 0 && <button type="button" className="boc-expand"
                style={{ left: Math.min(6 + node.path.split(".").length * 12, 114) }}
                aria-label={`${collapsedPaths.has(node.path) ? "Развернуть" : "Свернуть"} ячейку ${node.path}`}
                aria-expanded={!collapsedPaths.has(node.path)}
                onClick={() => { setCollapsedPaths((current) => {
                  const next = new Set(current);
                  if (next.has(node.path)) next.delete(node.path); else next.add(node.path);
                  return next;
                }); setSelectedPath(node.path); resetTreeScroll(); }}>
                {collapsedPaths.has(node.path) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>}
              <button type="button" className={node.path === selectedPath ? "boc-node selected" : "boc-node"}
                style={{ paddingLeft: Math.min(34 + node.path.split(".").length * 12, 142) }}
                onClick={() => setSelectedPath(node.path)}>
                <strong>{node.path} · {node.bitLength} бит · {node.refCount} refs</strong>
                <span>{node.hash.slice(0, 24)}…</span>
              </button>
            </div>)}
          </div>
        </div>
        <div className="boc-detail">
          {selected ? <>
            <strong>Ячейка {selected.path}</strong>
            <div className="boc-detail-tabs" role="tablist" aria-label="Данные ячейки">
              {(["overview", "bits", "hex", "refs", "hashes", "raw"] as const).map((tab) =>
                <button type="button" role="tab" key={tab} aria-selected={detailTab === tab}
                  onClick={() => setDetailTab(tab)}>{({ overview: "Обзор", bits: "Биты", hex: "Hex",
                    refs: "Ссылки", hashes: "Хеши", raw: "Raw" })[tab]}</button>)}</div>
            {detailTab === "overview" && <div className="boc-detail-content">
              <span>Depth: {selected.depth} · Level: {selected.level}</span>
              <span>{selected.exotic ? "Exotic" : "Обычная"} · {selected.refCount} ссылок</span>
              <span>Длина: {selected.bitLength} бит</span></div>}
            {detailTab === "bits" && <div className="boc-detail-content"><span>{selected.bitLength} значащих бит</span>
              <code>{selected.bits || "Пустая ячейка"}</code></div>}
            {detailTab === "hex" && <div className="boc-detail-content"><span>Последний байт дополнен нулями; значащих бит: {selected.bitLength}</span>
              <pre>{selected.hex.match(/.{1,32}/g)?.map((line, index) =>
                `${(index * 16).toString(16).padStart(4, "0")}: ${line.match(/.{1,2}/g)?.join(" ")}`).join("\n") || "Пустая ячейка"}</pre></div>}
            {detailTab === "refs" && <div className="boc-detail-content">{selected.refs.length
              ? selected.refs.map((path) => <button type="button" key={path} onClick={() => {
                setSelectedPath(path); setDetailTab("overview");
              }}>Перейти к ячейке {path} <ChevronRight size={15} aria-hidden="true" /></button>) : <span>Ссылок нет.</span>}</div>}
            {detailTab === "hashes" && <div className="boc-detail-content"><code>{selected.hash}</code>
              <CopyButton value={selected.hash} label="Копировать хеш"
                onCopyError={() => setError("Не удалось скопировать хеш.")} /></div>}
            {detailTab === "raw" && <div className="boc-detail-content"><pre>{JSON.stringify(selected, null, 2)}</pre>
              <button type="button" onClick={() => downloadJson("gramix-cell.json", selected)}>Экспорт JSON</button></div>}
          </> : <span>Выберите ячейку.</span>}
        </div>
      </div>
      <div className="boc-compare">
        <label>Сравнить со вторым BOC ({format})
          <textarea value={comparison} onChange={(event) => setComparison(event.target.value)}
            maxLength={MAX_BOC_BYTES * 2} spellCheck={false} />
        </label>
        <button type="button" onClick={() => void compare()} disabled={!comparison.trim()}>Сравнить хеши</button>
        {comparisonResult && <span role="status">{comparisonResult}</span>}
      </div>
    </div>}
  </section>;
}
