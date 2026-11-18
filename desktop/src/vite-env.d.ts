/// <reference types="vite/client" />
/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

interface ImportMetaEnv {
  /** "web" только в сборке сайта (vite build --mode web). */
  readonly VITE_TARGET?: "web" | "desktop";
  /** Адрес сборщика телеметрии сайта. В сборку приложения не попадает. */
  readonly VITE_TELEMETRY_URL?: string;
  readonly VITE_TELEMETRY_SITE_ID?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }

/** true только в сборке сайта; подставляется Vite как константа. */
declare const __WEB__: boolean;
/** Коммит, из которого собран сайт (для ссылки на исходники по AGPLv3). */
declare const __COMMIT__: string;
