/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { positionNetwork, type LayoutRequest } from "./graphLayout";

self.onmessage=(event:MessageEvent<LayoutRequest>)=>{
  const {id,root,edges,radial}=event.data;
  self.postMessage({id,graph:positionNetwork(root,edges,radial)});
};
