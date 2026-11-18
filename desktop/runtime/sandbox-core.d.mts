/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import type { Scenario, Simulation } from "../src/platform/types";
export function validateScenario(value: unknown): Scenario;
export function runScenario(value: unknown): Promise<Simulation>;
