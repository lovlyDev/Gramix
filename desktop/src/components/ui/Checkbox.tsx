/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export default function Checkbox({ checked, onCheckedChange, disabled, children,
  className = "" }: CheckboxProps) {
  return <label className={`ui-checkbox-label ${className}`}>
    <RadixCheckbox.Root className="ui-checkbox" checked={checked} disabled={disabled}
      onCheckedChange={(value) => onCheckedChange(value === true)}>
      <RadixCheckbox.Indicator className="ui-checkbox-indicator"><Check size={14} strokeWidth={2.8} /></RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
    <span>{children}</span>
  </label>;
}
