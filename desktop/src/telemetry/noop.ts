/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// Приложение: телеметрии нет. Этот файл подставляется вместо telemetry/web.ts при сборке.
import type { Telemetry } from "./types";

export const telemetry: Telemetry = {
  enabled: false,
  track() {},
  consent: () => "denied",
  setConsent() {},
};
export function ConsentBanner(_props: { onPrivacy?: () => void }) { return null; }
