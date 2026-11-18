/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Web Worker и библиотеки сети ожидают глобальный Buffer, как в Node.
import { Buffer } from "buffer";

const scope = globalThis as unknown as { Buffer?: typeof Buffer; window?: unknown };
if (!scope.Buffer) scope.Buffer = Buffer;
// В Web Worker нет window, а браузерная сборка @ton/crypto берёт window.crypto.
if (typeof scope.window === "undefined") scope.window = globalThis;
