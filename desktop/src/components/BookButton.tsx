/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Кнопка «В адресную книгу» / «В книге» для публичного адреса.
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { addressBook, useAddressBook } from "../lib/addressBook";
import { errorText } from "../lib/errors";
import { notify } from "../lib/notify";

export default function BookButton({ raw, address, testnet }: { raw: string; address: string; testnet: boolean }) {
  const book = useAddressBook();
  const saved = book.some((item) => item.raw === raw.toLowerCase() && item.testnet === testnet);
  return <button type="button" className={`book-button ${saved ? "on" : ""}`} aria-pressed={saved} onClick={() => {
    try {
      if (saved) { addressBook.remove(raw.toLowerCase(), testnet); notify({ kind: "info", text: "Адрес удалён из адресной книги." }); }
      else {
        addressBook.add({ raw, address, label: "", testnet });
        notify({ kind: "ok", text: "Адрес добавлен в адресную книгу на «Обзоре».",
          actions: [{ label: "Открыть книгу", run: () => { window.location.hash = "overview"; } }] });
      }
    } catch (error) { notify({ kind: "error", text: errorText(error) }); }
  }}>{saved ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}{saved ? "В адресной книге" : "В адресную книгу"}</button>;
}
