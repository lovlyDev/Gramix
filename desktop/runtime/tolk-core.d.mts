/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import type { BuildFailure, BuildSuccess } from "../src/platform/types";
export function projectFromInput(input: string): { entrypoint: string; files: Record<string, string> };
export function compileProject(input: string): Promise<BuildSuccess | BuildFailure>;
