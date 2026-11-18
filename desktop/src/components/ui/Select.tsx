/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };
type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  disabled?: boolean;
  className?: string;
};

export default function Select({ value, onValueChange, options, label, disabled,
  className = "" }: SelectProps) {
  return <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <RadixSelect.Trigger className={`ui-select ${className}`} aria-label={label}>
      <RadixSelect.Value />
      <RadixSelect.Icon className="ui-select-chevron"><ChevronDown size={17} /></RadixSelect.Icon>
    </RadixSelect.Trigger>
    <RadixSelect.Portal>
      <RadixSelect.Content className="ui-select-content" position="popper"
        sideOffset={5} collisionPadding={12}>
        <RadixSelect.ScrollUpButton className="ui-select-scroll"><ChevronUp size={16} /></RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className="ui-select-viewport">
          {options.map((option) => <RadixSelect.Item className="ui-select-item" key={option.value}
            value={option.value} disabled={option.disabled}>
            <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
            <RadixSelect.ItemIndicator className="ui-select-check"><Check size={16} /></RadixSelect.ItemIndicator>
          </RadixSelect.Item>)}
        </RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="ui-select-scroll"><ChevronDown size={16} /></RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  </RadixSelect.Root>;
}
