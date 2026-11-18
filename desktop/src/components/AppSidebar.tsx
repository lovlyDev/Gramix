/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Боковая панель приложения. Сайт использует верхнюю шапку (ToolNavigation).
import { useEffect, useRef, useState } from "react";
import { Download, LayoutGrid, PanelLeftClose, PanelLeftOpen, Search, Settings, Star } from "lucide-react";
import gramixIcon from "../assets/icons/gramix-app.svg";
import { ToolIcon, allTools, detectQuery, matchesTool, openSmart, readFavorites, toolAvailable,
  toolGroups, type ToolId, type WorkspaceId } from "./ToolNavigation";

export default function AppSidebar({ active, onSelect, live, update }: {
  active: WorkspaceId; onSelect: (tool: WorkspaceId) => void;
  live?: { label: string; value: string } | null;
  update?: { version: string; busy: boolean; onUpdate: () => void } | null;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("gramix.ui.sidebarCollapsed") === "true"; } catch { return false; }
  });
  const [favorites, setFavorites] = useState<ToolId[]>(readFavorites);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try { localStorage.setItem("gramix.ui.sidebarCollapsed", String(collapsed)); } catch { /* приватный режим */ }
  }, [collapsed]);
  useEffect(() => {
    try { localStorage.setItem("gramix.ui.favorites", JSON.stringify(favorites)); } catch { /* приватный режим */ }
  }, [favorites]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement &&
        (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" || event.key === "/" && !typing) {
        event.preventDefault(); setCollapsed(false);
        window.setTimeout(() => { search.current?.focus(); search.current?.select(); }, 0);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault(); setCollapsed((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const smart = detectQuery(query);
  const matches = query.trim() ? allTools.filter((item) => matchesTool(item, query)) : null;
  function select(tool: WorkspaceId) { onSelect(tool); setQuery(""); search.current?.blur(); }
  function submit() {
    if (smart) { openSmart(smart, select); return; }
    if (matches?.[0]) select(matches[0].id);
  }
  const toggleFavorite = (tool: ToolId) => setFavorites((current) =>
    current.includes(tool) ? current.filter((id) => id !== tool) : [...current, tool]);

  const row = (id: ToolId, label: string) => <div className={`side-row ${active === id ? "on" : ""}`} key={id}>
    <button type="button" className="side-item" title={label} aria-current={active === id ? "page" : undefined}
      onClick={() => select(id)}><ToolIcon tool={id} size={26} />{!collapsed && <span>{label}</span>}</button>
    {!collapsed && <button type="button" className={`side-star ${favorites.includes(id) ? "on" : ""}`}
      aria-label={`${favorites.includes(id) ? "Убрать из избранного" : "В избранное"}: ${label}`}
      aria-pressed={favorites.includes(id)} onClick={() => toggleFavorite(id)}>
      <Star size={13} fill={favorites.includes(id) ? "currentColor" : "none"} /></button>}
  </div>;

  return <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`} aria-label="Навигация Gramix">
    <div className="side-head">
      <button type="button" className="side-brand" title="Обзор" onClick={() => select("overview")}>
        <span className="logo-tile"><img src={gramixIcon} alt="" /></span>
        {!collapsed && <span><b>Gramix</b><small>Инструменты GRAM</small></span>}
      </button>
      <button type="button" className="side-toggle" title={collapsed ? "Развернуть (Ctrl+B)" : "Свернуть (Ctrl+B)"}
        aria-label={collapsed ? "Развернуть панель" : "Свернуть панель"} onClick={() => setCollapsed((value) => !value)}>
        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
    </div>
    {!collapsed && <label className="side-search">
      <Search size={15} aria-hidden="true" />
      <input ref={search} value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false}
        onKeyDown={(event) => { if (event.key === "Enter") submit(); if (event.key === "Escape") setQuery(""); }}
        placeholder="Адрес, хэш или инструмент" aria-label="Поиск по Gramix" autoComplete="off" />
      <kbd>Ctrl K</kbd>
    </label>}
    <nav className="side-nav">
      {smart && <button type="button" className="side-smart" onClick={() => submit()}>
        <ToolIcon tool={smart.tool} size={26} /><span><b>{smart.label}</b><small>Enter</small></span></button>}
      {matches ? <div className="side-group">
        <div className="side-heading">Найдено</div>
        {matches.length ? matches.map((item) => row(item.id, item.label)) : <p className="side-empty">Ничего не найдено</p>}
      </div> : <>
        <button type="button" className={`side-item side-overview ${active === "overview" ? "on" : ""}`} title="Обзор"
          aria-current={active === "overview" ? "page" : undefined} onClick={() => select("overview")}>
          <span className="tile side-system"><LayoutGrid size={15} /></span>{!collapsed && <span>Обзор</span>}</button>
        {favorites.filter(toolAvailable).length > 0 && <div className="side-group">
          {!collapsed && <div className="side-heading">Избранное</div>}
          {favorites.filter(toolAvailable).map((id) => row(id, allTools.find((item) => item.id === id)!.label))}
        </div>}
        {toolGroups.map((group) => <div className="side-group" key={group.title}>
          {!collapsed && <div className="side-heading">{group.title}</div>}
          {group.items.filter((item) => toolAvailable(item.id)).map((item) => row(item.id, item.label))}
        </div>)}
      </>}
    </nav>
    <div className="side-foot">
      {update && <button type="button" className="side-update" disabled={update.busy} onClick={update.onUpdate}
        title={`Скачать и установить Gramix ${update.version}`}>
        <Download size={16} />{!collapsed && <span><b>{update.busy ? "Обновление…" : "Обновить"}</b><small>Вышла версия {update.version}</small></span>}</button>}
      {live && <button type="button" className="side-live" onClick={() => select("generator")} title="Открыть поиск адреса">
        <span className="pulse" />{!collapsed && <span><b>{live.label}</b><small>{live.value}</small></span>}</button>}
      <button type="button" className={`side-item ${active === "settings" ? "on" : ""}`} title="Настройки"
        aria-current={active === "settings" ? "page" : undefined} onClick={() => select("settings")}>
        <span className="tile side-system"><Settings size={15} /></span>{!collapsed && <span>Настройки</span>}</button>
    </div>
  </aside>;
}
