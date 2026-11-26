/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

export type Point = { raw: string; x: number; y: number };

type Endpoints={from:string;to:string};
export type LayoutRequest={id:number;root:string;edges:Endpoints[];radial:boolean};

export function positionNetwork(root: string, items: Endpoints[], radial: boolean) {
  const adjacent = new Map<string, Set<string>>();
  for (const {from, to} of items) {
    for (const [a,b] of [[from,to],[to,from]]) {
      if (!adjacent.has(a)) adjacent.set(a,new Set());
      adjacent.get(a)!.add(b);
    }
  }
  const order = [root], parent = new Map([[root,root]]);
  const children = new Map<string,string[]>();
  const remaining=adjacent.keys();
  for (let i=0;i<order.length;i++) {
    const raw=order[i];
    const list: string[] = [];
    for (const peer of adjacent.get(raw) ?? []) {
      if (parent.has(peer)) continue;
      parent.set(peer, raw); list.push(peer); order.push(peer);
    }
    children.set(raw,list);
    if(i===order.length-1){
      for(const peer of remaining){
        if(parent.has(peer))continue;
        parent.set(peer,root);children.get(root)!.push(peer);order.push(peer);break;
      }
    }
  }
  const size = new Map<string,number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const raw = order[i];
    size.set(raw, Math.max(1, children.get(raw)!.reduce((n,c) => n + size.get(c)!,0)));
  }
  const points: Point[] = [];
  const coords = new Map([[root,{x:0,y:0}]]), start = new Map([[root,0]]);
  for (const raw of order) {
    const pos = coords.get(raw)!;
    points.push({raw,...pos});
    let leaf = start.get(raw)!;
    const branch = children.get(raw)!;
    branch.forEach((peer,i) => {
      const count = size.get(peer)!;
      start.set(peer,leaf);
      if (radial) {
        // Spread each hub's neighbours across a disc, oriented away from its parent.
        const prev = coords.get(parent.get(raw)!)!;
        const heading = Math.atan2(pos.y-prev.y,pos.x-prev.x);
        const angle = heading + i * Math.PI * (3-Math.sqrt(5));
        const radius = (95 + Math.sqrt(branch.length)*8) * Math.sqrt(i+1);
        const offset = raw===root ? 0 : radius*1.25;
        coords.set(peer,{x:pos.x+Math.cos(heading)*offset+Math.cos(angle)*radius,
          y:pos.y+Math.sin(heading)*offset+Math.sin(angle)*radius});
      } else {
        coords.set(peer,{x:pos.x+275,y:(leaf + count/2-size.get(root)!/2)*36});
      }
      leaf += count;
    });
  }
  const edges: [string,string][] = [];
  for (const [raw,peers] of adjacent) for(const peer of peers) {
    if(raw > peer || !parent.has(raw) || !parent.has(peer)) continue;
    if(radial || raw===peer || parent.get(raw)===peer || parent.get(peer)===raw) edges.push([raw,peer]);
  }
  return {points, parent, edges, radial};
}
