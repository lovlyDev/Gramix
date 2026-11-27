/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import Select from "../../components/ui/Select";
import Checkbox from "../../components/ui/Checkbox";
import type { BookEntry } from "../../lib/addressBook";

export const alertKinds = [
  ["TonTransfer", "GRAM"], ["JettonTransfer", "Jetton"], ["NftItemTransfer", "NFT"],
  ["SmartContractExec", "Вызовы контрактов"],
] as const;
export type WalletAlertRule = { minimum: number; direction: "all" | "in" | "out"; kinds: string[] };
export type WalletAlertDraft = Omit<WalletAlertRule, "minimum"> & { minimum: string };
export const validThreshold = (value: string) => /^\d+$/.test(value) && Number(value) <= 1_000_000_000;

export function WalletAlertRules({ wallets, rules, selected, onSelect, onChange, defaults }: {
  wallets: BookEntry[]; rules: Record<string, WalletAlertDraft>; selected: string;
  onSelect: (raw: string) => void; onChange: (raw: string, rule: WalletAlertDraft | null) => void;
  defaults: WalletAlertDraft;
}) {
  if (!wallets.length) return <p className="muted">Добавьте адреса в Watchtower, чтобы настроить уведомления.</p>;
  const rule = rules[selected];
  return <div className="wallet-form">
    <strong>Правила для отдельных адресов</strong>
    <p className="field-help">Адреса без своего правила получают общие уведомления.</p>
    <Select label="Кошелёк для правила" value={selected} onValueChange={onSelect}
      options={wallets.map(w => ({ value: w.raw, label: w.label || w.address }))} />
    <Checkbox checked={!!rule} onCheckedChange={checked => onChange(selected, checked ? defaults : null)}>Своё правило для этого адреса</Checkbox>
    {rule && <>
      <div className="workspace-actions" style={{ alignItems: "center" }}>
        <Select label="Направление" value={rule.direction} onValueChange={direction => onChange(selected, { ...rule, direction: direction as WalletAlertRule["direction"] })}
          options={[{value:"all",label:"Оба направления"},{value:"in",label:"Входящие"},{value:"out",label:"Исходящие"}]} />
        <input className="settings-number" aria-label="Минимальный перевод GRAM" title="Минимальный перевод GRAM"
          type="number" min="0" max="1000000000" step="1" value={rule.minimum} disabled={!rule.kinds.includes("TonTransfer")}
          onChange={e => onChange(selected, { ...rule, minimum: e.target.value })} />
      </div>
      <div className="workspace-actions">{alertKinds.map(([kind, label]) =>
        (kind !== "SmartContractExec" || rule.direction === "all") && <Checkbox key={kind} checked={rule.kinds.includes(kind)}
          onCheckedChange={checked => onChange(selected, { ...rule, kinds: checked ? [...rule.kinds, kind] : rule.kinds.filter(v => v !== kind) })}>{label}</Checkbox>
      )}</div>
    </>}
  </div>;
}
