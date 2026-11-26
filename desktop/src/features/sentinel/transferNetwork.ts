/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { Address } from "@ton/core";
import type { HistoryEvent } from "../../lib/market";

export type Transfer = { asset:string; units:string; decimals:number; symbol:string; id: string; from: string; to: string; time: number; amount: string; type: string; comment: string; ok: boolean; pending: boolean; scam: boolean; nft: string | null };

export function friendly(raw: string) {
  return Address.parse(raw).toString();
}
export function transfers(owner: string, events: HistoryEvent[]) {
  const result: Transfer[] = [];
  for (const event of events) event.actions.forEach((action, index) => {
    if (!["TonTransfer", "JettonTransfer", "NftItemTransfer"].includes(action.type) || action.direction === "other") return;
    const peer = action.direction === "self" ? owner : action.counterparty?.raw.toLowerCase();
    if (!peer || !Address.isRaw(peer)) return;
    const incoming = action.direction === "in";
    result.push({ asset:action.jetton?.raw ?? (action.type==="TonTransfer"?"GRAM":action.type==="NftItemTransfer"?"NFT":"unknown"),
      units: action.jetton?.amount ?? action.amountNano ?? "", decimals:action.jetton?.decimals ?? 9,
      symbol:action.jetton?.symbol || (action.type==="TonTransfer"?"GRAM":action.type==="NftItemTransfer"?"NFT":"Jetton"), id: event.id + "/" + index, from: incoming ? peer : owner, to: incoming ? owner : peer,
      amount: action.amountNano ?? action.value, type: action.type, time: event.time, ok: action.ok,
      pending: event.pending, scam: event.scam, comment: action.comment, nft: action.nft });
  });
  return result;
}
