/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { copyText } from "../../lib/clipboard";
import { Check, Copy } from "lucide-react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onClick" | "children"> & {
  value: string;
  label?: string;
  onCopyError?: () => void;
};

export default function CopyButton({ value, label = "Копировать", onCopyError,
  className = "", ...props }: Props) {
  const [copiedValue, setCopiedValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copied = copiedValue !== "" && copiedValue === value;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await copyText(value);
      setCopiedValue(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedValue(""), 4_000);
    } catch {
      onCopyError?.();
    }
  }

  return <button {...props} type="button"
    className={`copy-button ${copied ? "copy-button-done" : ""} ${className}`.trim()}
    onClick={() => void copy()} aria-label={copied ? "Скопировано" : label}>
    {copied ? <><Check size={15} aria-hidden="true" /> Скопировано</>
      : <><Copy size={15} aria-hidden="true" /> {label}</>}
  </button>;
}
