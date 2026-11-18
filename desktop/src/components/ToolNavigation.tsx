/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ArrowLeftRight, Binary, Bookmark, ChevronDown, ChevronRight, FileCode,
  FlaskConical, Gauge, Hammer, ScanSearch, Search, Settings, ShieldCheck, Sparkles,
  SquareTerminal, Star, Wallet, WandSparkles, Zap, type LucideProps } from "lucide-react";
import { SiGithub } from "react-icons/si";
import vantixIcon from "../assets/icons/vantix-app.svg";

type ToolMeta = { id: string; label: string; description: string;
  icon: ComponentType<LucideProps>; color: string };

export const toolGroups = [
  { title: "Кошельки", items: [
    { id: "generator", label: "Поиск адреса", description: "TON-адрес с вашим словом на CPU и GPU", icon: WandSparkles, color: "#5856d6" },
    { id: "wallet-generator", label: "Новый кошелёк", description: "Wallet V5R1 или V4R2 с фразой восстановления", icon: Wallet, color: "#007aff" },
    { id: "wallet-security", label: "Проверка кошелька", description: "Фраза, файл и сравнение адресов офлайн", icon: ShieldCheck, color: "#34c759" },
    { id: "address-inspector", label: "Проверка адреса", description: "Форматы, флаги и состояние в сети", icon: ScanSearch, color: "#30b0c7" },
  ] },
  { title: "Блокчейн", items: [
    { id: "transaction-decoder", label: "Транзакции", description: "Разбор транзакции по хэшу или BOC", icon: ArrowLeftRight, color: "#ff9500" },
    { id: "boc-explorer", label: "BOC Explorer", description: "Дерево ячеек, срезы и сравнение BOC", icon: Binary, color: "#af52de" },
    { id: "contract-inspector", label: "Контракты", description: "Состояние, get-методы и код контракта", icon: FileCode, color: "#5e5ce6" },
    { id: "contract-vanity", label: "Contract Vanity", description: "Адрес контракта с нужным фрагментом", icon: Sparkles, color: "#ff2d55" },
  ] },
  { title: "Разработка", items: [
    { id: "contract-sandbox", label: "Sandbox", description: "Сценарии транзакций в локальном блокчейне", icon: FlaskConical, color: "#32ade6" },
    { id: "contract-builder", label: "Builder", description: "Редактор и сборка контрактов Tolk", icon: Hammer, color: "#ff9f0a" },
    { id: "gpu-benchmark", label: "GPU Benchmark", description: "Замер скорости полного TON-пайплайна", icon: Gauge, color: "#ff3b30" },
    { id: "developer-cli", label: "Developer CLI", description: "Разрешённые команды ядра VANTIX", icon: SquareTerminal, color: "#8e8e93" },
  ] },
] as const satisfies readonly { title: string; items: readonly ToolMeta[] }[];

export type ToolId = (typeof toolGroups)[number]["items"][number]["id"];
export type WorkspaceId = ToolId | "overview" | "settings";
type ToolItem = { id: ToolId; label: string; description: string;
  icon: ComponentType<LucideProps>; color: string };
export const allTools: ToolItem[] = toolGroups.flatMap((group) => [...group.items]);
export const toolTitles = Object.fromEntries(allTools.map((item) =>
  [item.id, item.label])) as Record<ToolId, string>;
const toolById = Object.fromEntries(allTools.map((item) => [item.id, item])) as Record<ToolId, ToolItem>;

export function isToolId(value: string): value is ToolId {
  return Object.hasOwn(toolTitles, value);
}
export function isWorkspaceId(value: string): value is WorkspaceId {
  return value === "overview" || value === "settings" || isToolId(value);
}

/** Цветная плитка инструмента в стиле системных иконок. */
export function ToolIcon({ tool, className = "", size = 36 }: { tool: ToolId; className?: string; size?: number }) {
  const item = toolById[tool];
  const Icon = item.icon;
  return <span className={`tile ${className}`} aria-hidden="true"
    style={{ width: size, height: size, backgroundColor: item.color }}>
    <Icon size={Math.round(size * .56)} strokeWidth={2.1} /></span>;
}

const searchAliases: Record<ToolId, string> = {
  generator: "vanity generator search address поиск красивый",
  "wallet-generator": "new wallet создать мнемоника",
  "wallet-security": "wallet security фраза проверить",
  "address-inspector": "address check inspector адрес",
  "transaction-decoder": "transactions decoder tx хэш",
  "boc-explorer": "boc explorer cell ячейки",
  "contract-inspector": "contracts inspector get методы",
  "contract-vanity": "contract vanity адрес контракта",
  "contract-sandbox": "smart contract sandbox сценарий",
  "contract-builder": "builder compiler tolk компилятор",
  "gpu-benchmark": "gpu benchmark скорость",
  "developer-cli": "developer cli terminal терминал",
};
export function matchesTool(item: { id: ToolId; label: string; description: string }, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || `${item.label} ${item.id} ${item.description} ${searchAliases[item.id]}`
    .toLocaleLowerCase().includes(needle);
}

export type SmartTarget = { tool: ToolId; event: string; value: string; label: string };
/** Распознаёт адрес, хэш транзакции или BOC во вставленной строке. */
export function detectQuery(raw: string): SmartTarget | null {
  const value = raw.trim();
  if (/^[EUk0][Qf][A-Za-z0-9_-]{46}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value))
    return { tool: "address-inspector", event: "vantix:inspect-address", value, label: "Проверить адрес" };
  if (/^[0-9a-fA-F]{64}$/.test(value))
    return { tool: "transaction-decoder", event: "vantix:transaction-id", value, label: "Разобрать транзакцию" };
  if (/^te6cc[A-Za-z0-9+/=]+$/.test(value))
    return { tool: "boc-explorer", event: "vantix:open-boc", value, label: "Открыть BOC" };
  return null;
}
export function openSmart(target: SmartTarget, onSelect: (tool: WorkspaceId) => void) {
  onSelect(target.tool);
  window.setTimeout(() => window.dispatchEvent(new CustomEvent(target.event, { detail: target.value })), 0);
}

export function readFavorites(): ToolId[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem("vantix.ui.favorites") || "[]");
    return Array.isArray(stored) ? stored.filter((id): id is ToolId =>
      typeof id === "string" && isToolId(id)) : [];
  } catch { return []; }
}

function MenuItem({ item, active, favorite, onSelect, onFavorite }: {
  item: ToolItem; active: boolean; favorite: boolean;
  onSelect: () => void; onFavorite: () => void;
}) {
  return <div className={`menu-row ${active ? "on" : ""}`}>
    <button type="button" className="menu-item" title={item.label} role="menuitem"
      aria-current={active ? "page" : undefined} onClick={onSelect}>
      <ToolIcon tool={item.id} size={32} />
      <span><b>{item.label}</b><small>{item.description}</small></span>
    </button>
    <button type="button" className={`menu-star ${favorite ? "on" : ""}`}
      title={favorite ? "Убрать из избранного" : "В избранное"}
      aria-label={`${favorite ? "Убрать из избранного" : "В избранное"}: ${item.label}`}
      aria-pressed={favorite} onClick={onFavorite}>
      <Star size={15} fill={favorite ? "currentColor" : "none"} /></button>
  </div>;
}

export default function ToolNavigation({ active, onSelect, live }: {
  active: WorkspaceId; onSelect: (tool: WorkspaceId) => void;
  live?: { label: string; value: string } | null;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [favorites, setFavorites] = useState<ToolId[]>(readFavorites);
  const root = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    localStorage.setItem("vantix.ui.favorites", JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent("vantix:favorites", { detail: favorites }));
  }, [favorites]);
  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-menu-root]")) setMenu(null);
    }
    function onKey(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement &&
        (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" ||
        event.key === "/" && !typing) {
        event.preventDefault(); search.current?.focus(); search.current?.select();
      }
      if (event.key === "Escape") setMenu(null);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, []);

  function select(tool: WorkspaceId) {
    onSelect(tool); setMenu(null); setQuery(""); search.current?.blur();
  }
  function toggleFavorite(tool: ToolId) {
    setFavorites((current) => current.includes(tool)
      ? current.filter((value) => value !== tool) : [...current, tool]);
  }
  const smart = detectQuery(query);
  const results = query.trim() ? allTools.filter((item) => matchesTool(item, query)) : allTools.slice(0, 6);
  const choices = (smart ? 1 : 0) + results.length;
  function choose(index: number) {
    if (smart && index === 0) { openSmart(smart, select); return; }
    const item = results[index - (smart ? 1 : 0)];
    if (item) select(item.id);
  }
  const groupActive = (title: string) => toolGroups.some((group) =>
    group.title === title && group.items.some((item) => item.id === active));

  return <header className="top" ref={root}>
    <div className="bar wrap">
      <button type="button" className="brand" title="Обзор" onClick={() => select("overview")}>
        <span className="logo-tile"><img src={vantixIcon} alt="" /></span>
        <span className="word">VANTIX</span>
      </button>
      <nav className="nav" aria-label="Навигация VANTIX">
        <button type="button" className={`nav-link ${active === "overview" ? "on" : ""}`}
          aria-current={active === "overview" ? "page" : undefined}
          onClick={() => select("overview")}>Обзор</button>
        {toolGroups.map((group) => <div className="nav-group" data-menu-root key={group.title}>
          <button type="button" className={`nav-link ${groupActive(group.title) ? "on" : ""}`}
            aria-haspopup="menu" aria-expanded={menu === group.title}
            onClick={() => setMenu((current) => current === group.title ? null : group.title)}>
            {group.title}<ChevronDown size={15} className={`caret ${menu === group.title ? "up" : ""}`} /></button>
          {menu === group.title && <div className="menu" role="menu" aria-label={group.title}>
            {group.items.map((item) => <MenuItem key={item.id} item={item} active={active === item.id}
              favorite={favorites.includes(item.id)} onSelect={() => select(item.id)}
              onFavorite={() => toggleFavorite(item.id)} />)}
          </div>}
        </div>)}
      </nav>
      <span className="spacer" />
      {live && <button type="button" className="live-chip" onClick={() => select("generator")}
        title="Открыть поиск адреса"><span className="pulse" />{live.label}<b>{live.value}</b></button>}
      <div className="top-search search" data-menu-root>
        <Search size={17} className="glass" aria-hidden="true" />
        <input ref={search} value={query} placeholder="Адрес, хэш, BOC или инструмент"
          aria-label="Поиск по VANTIX" spellCheck={false} autoComplete="off"
          onFocus={() => { setSearchFocus(true); setHighlight(0); }}
          onBlur={() => window.setTimeout(() => setSearchFocus(false), 120)}
          onChange={(event) => { setQuery(event.target.value); setHighlight(0); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((value) => Math.min(choices - 1, value + 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((value) => Math.max(0, value - 1)); }
            if (event.key === "Enter") choose(highlight);
            if (event.key === "Escape") { setQuery(""); search.current?.blur(); }
          }} />
        <kbd>/</kbd>
        {searchFocus && <div className="menu search-menu" role="listbox" aria-label="Результаты поиска">
          {smart && <button type="button" role="option" aria-selected={highlight === 0}
            className={`menu-item ${highlight === 0 ? "hl" : ""}`}
            onMouseDown={(event) => event.preventDefault()} onClick={() => choose(0)}>
            <ToolIcon tool={smart.tool} size={32} />
            <span><b>{smart.label}</b><small className="mono">{smart.value}</small></span>
            <ChevronRight size={16} className="chev" /></button>}
          {!query.trim() && <div className="menu-caption">Инструменты</div>}
          {results.map((item, index) => {
            const position = index + (smart ? 1 : 0);
            return <button type="button" role="option" key={item.id} aria-selected={highlight === position}
              className={`menu-item ${highlight === position ? "hl" : ""}`}
              onMouseEnter={() => setHighlight(position)}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(position)}>
              <ToolIcon tool={item.id} size={32} />
              <span><b>{item.label}</b><small>{item.description}</small></span></button>;
          })}
          {choices === 0 && <p className="menu-empty">Ничего не найдено. Вставьте TON-адрес, хэш транзакции или BOC.</p>}
        </div>}
      </div>
      <div className="nav-group" data-menu-root>
        <button type="button" className={`icon-btn ${menu === "favorites" ? "on" : ""}`}
          title="Избранное" aria-label="Избранное" aria-haspopup="menu" aria-expanded={menu === "favorites"}
          onClick={() => setMenu((current) => current === "favorites" ? null : "favorites")}>
          <Bookmark size={19} />{favorites.length > 0 && <span className="count">{favorites.length}</span>}</button>
        {menu === "favorites" && <div className="menu menu-end" role="menu" aria-label="Избранное">
          <div className="menu-caption">Избранное</div>
          {favorites.length ? favorites.map((id) => <MenuItem key={id} item={toolById[id]}
            active={active === id} favorite onSelect={() => select(id)} onFavorite={() => toggleFavorite(id)} />)
            : <p className="menu-empty">Отметьте инструменты звёздочкой в меню разделов.</p>}
        </div>}
      </div>
      <a className="icon-btn" href="https://github.com/lovlyDev/VANTIX" target="_blank"
        rel="noreferrer" title="GitHub VANTIX" aria-label="GitHub VANTIX"><SiGithub size={18} /></a>
      <button type="button" className={`icon-btn ${active === "settings" ? "on" : ""}`} title="Настройки"
        aria-label="Настройки" onClick={() => select("settings")}><Settings size={19} /></button>
      <button type="button" className="cta" onClick={() => select("generator")}>
        <Zap size={17} /><span className="cta-label">Поиск адреса</span></button>
    </div>
  </header>;
}
