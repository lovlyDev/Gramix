/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// NFT в истории адреса: миниатюра в переливающейся рамке и «коллекционная карточка»
// с 3D-наклоном и голографическим бликом за курсором.
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BadgeCheck, Copy, ExternalLink, Gem, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { getNft, type NftInfo } from "../lib/nft";
import { copyText } from "../lib/clipboard";
import { notify } from "../lib/notify";
import { openExternal } from "../lib/external";
import { errorText } from "../lib/errors";

function useNft(raw: string, testnet: boolean, enabled: boolean) {
  const [nft, setNft] = useState<NftInfo | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    getNft(raw, testnet).then((value) => { if (alive) setNft(value); }, () => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [raw, testnet, enabled]);
  return { nft, failed };
}

// Загружаем сведения, только когда строка истории видна на экране.
function useVisible<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);
  return { ref, visible };
}

function TrustBadge({ nft }: { nft: NftInfo }) {
  if (nft.trust === "whitelist") return <span className="nft-trust ok"><BadgeCheck size={13} /> проверенная коллекция</span>;
  if (nft.trust === "blacklist") return <span className="nft-trust bad"><ShieldAlert size={13} /> отмечена как спам</span>;
  return <span className="nft-trust warn"><ShieldAlert size={13} /> коллекция не проверена</span>;
}

function HoloCard({ nft }: { nft: NftInfo }) {
  const card = useRef<HTMLDivElement>(null);
  const [broken, setBroken] = useState(false);
  function move(event: PointerEvent<HTMLDivElement>) {
    const node = card.current; if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
    node.style.setProperty("--ry", `${(x - 0.5) * 20}deg`);
    node.style.setProperty("--mx", `${x * 100}%`);
    node.style.setProperty("--my", `${y * 100}%`);
    node.classList.add("tilting");
  }
  function leave() {
    const node = card.current; if (!node) return;
    node.classList.remove("tilting");
    for (const name of ["--rx", "--ry"]) node.style.setProperty(name, "0deg");
    node.style.setProperty("--mx", "50%"); node.style.setProperty("--my", "50%");
  }
  return <div className="nft-stage" onPointerMove={move} onPointerLeave={leave}>
    <div ref={card} className={`nft-holo ${nft.trust === "blacklist" ? "spam" : ""} ${nft.telegram ? "clean" : ""}`}>
      {nft.image && !broken ? <img src={nft.image} alt={nft.name} draggable={false} onError={() => setBroken(true)} />
        : <div className="nft-noimage"><Gem size={46} /><small>{nft.image ? "Картинка недоступна" : "Без картинки"}</small></div>}
      <span className="nft-glare" aria-hidden="true" />
      {!nft.telegram && <span className="nft-foil" aria-hidden="true" />}
      {!nft.telegram && <div className="nft-plate"><b>{nft.name}</b>{nft.index && <small>#{nft.index}</small>}</div>}
    </div>
  </div>;
}

function inspect(raw: string) {
  window.location.hash = "address-inspector";
  window.setTimeout(() => window.dispatchEvent(new CustomEvent("gramix:inspect-address", { detail: raw })), 0);
}

export function NftDialog({ raw, testnet, trigger }: { raw: string; testnet: boolean; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { nft, failed } = useNft(raw, testnet, open);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content nft-dialog" aria-describedby={undefined}>
        <Dialog.Close className="nft-close" aria-label="Закрыть"><X size={16} /></Dialog.Close>
        {!nft ? <div className="nft-loading">{failed ? "Не удалось загрузить NFT." : <><span className="nft-skeleton big" />Загружаю NFT…</>}</div> : <>
          <HoloCard nft={nft} />
          <div className="nft-info">
            <Dialog.Title>{nft.name}</Dialog.Title>
            {nft.collection && <button type="button" className="nft-collection" disabled={!nft.collectionRaw}
              onClick={() => { if (nft.collectionRaw) { setOpen(false); inspect(nft.collectionRaw); } }}>
              <Sparkles size={14} /> {nft.collection}</button>}
            <TrustBadge nft={nft} />
            {nft.description && nft.trust !== "blacklist" && <p className="nft-description">{nft.description}</p>}
            {nft.attributes.length > 0 && <ul className="nft-attributes">{nft.attributes.map((item, index) =>
              <li key={index}><small>{item.trait}</small><b>{item.value}</b></li>)}</ul>}
            {nft.trust !== "whitelist" && <p className="nft-warning">Не переходите по ссылкам из описания и не подключайте кошелёк к незнакомым сайтам: так часто крадут средства.</p>}
            <div className="nft-actions">
              <button type="button" onClick={() => { setOpen(false); inspect(nft.raw); }}><Search size={15} /> Проверить адрес NFT</button>
              <button type="button" onClick={() => void copyText(nft.raw).then(() => notify({ kind: "ok", text: "Адрес NFT скопирован." }),
                (error) => notify({ kind: "error", text: errorText(error) }))}><Copy size={15} /> Копировать адрес</button>
              {!testnet && <button type="button" onClick={() => openExternal(`https://tonviewer.com/${nft.raw}`)}><ExternalLink size={15} /> Tonviewer</button>}
            </div>
          </div>
        </>}
      </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}

/** Миниатюра NFT для строки истории: картинка в радужной рамке, по клику — карточка. */
export function NftThumb({ raw, testnet }: { raw: string; testnet: boolean }) {
  const { ref, visible } = useVisible<HTMLButtonElement>();
  const { nft, failed } = useNft(raw, testnet, visible);
  const [broken, setBroken] = useState(false);
  return <NftDialog raw={raw} testnet={testnet} trigger={
    <button ref={ref} type="button" className={`nft-thumb ${nft ? "ready" : ""} ${nft?.trust === "blacklist" ? "spam" : ""}`}
      title={nft ? `${nft.name}${nft.collection ? ` · ${nft.collection}` : ""}` : "NFT"}>
      {nft?.thumb && !broken ? <img src={nft.thumb} alt="" draggable={false} onError={() => setBroken(true)} />
        : failed || nft ? <Gem size={16} /> : <span className="nft-skeleton" />}
    </button>} />;
}

/** Название и коллекция NFT под заголовком строки истории. */
export function NftCaption({ raw, testnet }: { raw: string; testnet: boolean }) {
  const { ref, visible } = useVisible<HTMLSpanElement>();
  const { nft } = useNft(raw, testnet, visible);
  return <span ref={ref} className="nft-caption">{nft ? <><b>{nft.name}</b>{nft.collection && <> · {nft.collection}</>}
    {nft.trust === "blacklist" && <span className="badge fail">спам</span>}</> : "…"}</span>;
}
