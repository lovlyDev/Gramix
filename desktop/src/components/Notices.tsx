/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Стек уведомлений сверху по центру. Таймер останавливается, пока курсор или фокус на уведомлении.
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { NOTICE_EVENT, noticeDuration, type Notice } from "../lib/notify";

type Item = Notice & { id: number };
const MAX_VISIBLE = 4;

function NoticeCard({ item, onClose }: { item: Item; onClose: (id: number) => void }) {
  const total = noticeDuration(item);
  const left = useRef(total);
  const started = useRef(Date.now());
  const timer = useRef(0);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const close = () => { setLeaving(true); window.setTimeout(() => onClose(item.id), 160); };
  useEffect(() => {
    if (paused) return;
    started.current = Date.now();
    timer.current = window.setTimeout(close, left.current);
    return () => { window.clearTimeout(timer.current); left.current -= Date.now() - started.current; };
  }, [paused]);
  const Icon = item.kind === "ok" ? CheckCircle2 : item.kind === "error" ? XCircle : Info;
  return <div className={`notice ${item.kind} ${leaving ? "leaving" : ""} ${paused ? "paused" : ""}`}
    role={item.kind === "error" ? "alert" : "status"}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <Icon size={18} className="notice-icon" aria-hidden="true" />
    <div className="notice-body">
      {item.title && <b>{item.title}</b>}
      <span title={item.text}>{item.text}</span>
      {item.actions?.length ? <div className="notice-actions">{item.actions.map((action) =>
        <button type="button" key={action.label} onClick={() => { action.run(); close(); }}>{action.label}</button>)}</div> : null}
    </div>
    <button type="button" className="notice-close" aria-label="Закрыть уведомление" onClick={close}><X size={14} /></button>
    <span className="notice-timer" style={{ animationDuration: `${total}ms` }} aria-hidden="true" />
  </div>;
}

export default function Notices() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let next = 1;
    function show(event: Event) {
      const detail = (event as CustomEvent<Notice>).detail;
      setItems((current) => [...current.filter((item) => item.text !== detail.text), { ...detail, id: next++ }].slice(-MAX_VISIBLE));
    }
    window.addEventListener(NOTICE_EVENT, show);
    return () => window.removeEventListener(NOTICE_EVENT, show);
  }, []);
  const remove = (id: number) => setItems((current) => current.filter((item) => item.id !== id));
  return <div className="notice-stack" aria-live="polite">
    {items.map((item) => <NoticeCard key={item.id} item={item} onClose={remove} />)}
  </div>;
}
