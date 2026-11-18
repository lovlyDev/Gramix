/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { QRCodeSVG } from "qrcode.react";

export default function PublicAddressQr({ address, label = "Показать QR" }: {
  address: string; label?: string;
}) {
  const qr = useRef<HTMLDivElement>(null);
  function download() {
    const svg = qr.current?.querySelector("svg");
    if (!svg) return;
    const content = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([content], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "gramix-public-address.svg";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Dialog.Root><Dialog.Trigger type="button" className="qr-trigger">{label}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content public-qr-dialog">
        <Dialog.Title>QR публичного адреса</Dialog.Title>
        <Dialog.Description>QR содержит только адрес. Сверьте его с текстом перед использованием.</Dialog.Description>
        <div className="public-qr-canvas" ref={qr}><QRCodeSVG value={address} size={240}
          level="M" bgColor="#ffffff" fgColor="#111827" title="Публичный GRAM-адрес" /></div>
        <code>{address}</code>
        <div className="public-qr-actions"><button type="button" onClick={download}>Скачать SVG</button>
          <Dialog.Close type="button">Закрыть</Dialog.Close></div>
      </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
