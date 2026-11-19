/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Вкладки под проверенным адресом: история, токены, NFT. Сеть запрашивается только
// после открытия вкладки или нажатия кнопки.
import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Coins, Gem, History } from "lucide-react";
import AddressHistory from "./AddressHistory";
import AddressTokens from "./AddressTokens";
import AddressNfts from "./AddressNfts";

type Tab = "history" | "tokens" | "nfts";

export default function AddressTabs({ raw, testnet }: { raw: string; testnet: boolean }) {
  const [tab, setTab] = useState<Tab>("history");
  const [opened, setOpened] = useState<Set<Tab>>(() => new Set(["history"]));
  useEffect(() => { setTab("history"); setOpened(new Set(["history"])); }, [raw, testnet]);
  return <Tabs.Root className="address-tabs" value={tab} onValueChange={(value) => {
    setTab(value as Tab); setOpened((current) => new Set(current).add(value as Tab));
  }}>
    <Tabs.List className="address-tab-list" aria-label="Данные адреса">
      <Tabs.Trigger value="history"><History size={15} /> История</Tabs.Trigger>
      <Tabs.Trigger value="tokens"><Coins size={15} /> Токены</Tabs.Trigger>
      <Tabs.Trigger value="nfts"><Gem size={15} /> NFT</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="history" forceMount hidden={tab !== "history"}><AddressHistory raw={raw} testnet={testnet} /></Tabs.Content>
    <Tabs.Content value="tokens" forceMount hidden={tab !== "tokens"}>{opened.has("tokens") && <AddressTokens raw={raw} testnet={testnet} />}</Tabs.Content>
    <Tabs.Content value="nfts" forceMount hidden={tab !== "nfts"}>{opened.has("nfts") && <AddressNfts raw={raw} testnet={testnet} />}</Tabs.Content>
  </Tabs.Root>;
}
