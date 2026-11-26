/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import type { Point } from "./graphLayout";

export type Box = { left: number; top: number; right: number; bottom: number };
export type Edge = Box & { a: Point; b: Point; path: string };
export type Cluster = Box & { count: number; x: number; y: number; point?: Point };
type Branch<T> = Cluster & { children?: Branch<T>[]; entries?: T[] };

export function intersects(a: Box, b: Box) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function index<T>(items: T[], area: (value: T) => Box): Branch<T> | undefined {
  if (!items.length) return;
  const box: Cluster = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, count: items.length, x: 0, y: 0 };
  for (const item of items) {
    const b = area(item);
    box.left = Math.min(box.left, b.left);
    box.top = Math.min(box.top, b.top);
    box.right = Math.max(box.right, b.right);
    box.bottom = Math.max(box.bottom, b.bottom);
    box.x += (b.left + b.right) / 2;
    box.y += (b.top + b.bottom) / 2;
  }
  box.x /= items.length;
  box.y /= items.length;
  if (items.length <= 12) return { ...box, entries: items };
  const horizontal = box.right - box.left >= box.bottom - box.top;
  const middle = horizontal ? box.x : box.y;
  const left: T[] = [], right: T[] = [];
  for (const item of items) {
    const b = area(item);
    const center = horizontal ? (b.left + b.right) / 2 : (b.top + b.bottom) / 2;
    (center < middle ? left : right).push(item);
  }
  // A hub or coincident nodes can put every entry on the same side.
  const parts = left.length < items.length / 8 || right.length < items.length / 8
    ? [items.slice(0, Math.floor(items.length / 2)), items.slice(Math.floor(items.length / 2))]
    : [left, right];
  return { ...box, children: parts.map(part => index(part, area)!) };
}

export function pointBox(x: number, y: number): Box {
  return { left: x, top: y, right: x, bottom: y };
}

export function pointIndex(points: Point[]) {
  const root = index(points, p => pointBox(p.x, p.y));
  function visible(view: Box, cell: number) {
    const points: Point[] = [], groups: Cluster[] = [];
    const buckets = new Map<string, Cluster>();
    function walk(node: Branch<Point>) {
      if (!intersects(node, view)) return;
      if (node.count > 1 && node.right - node.left <= cell && node.bottom - node.top <= cell &&
          intersects(pointBox(node.x, node.y), view)) {
        add(node);
        return;
      }
      node.children?.forEach(walk);
      for (const p of node.entries ?? []) {
        if (!intersects(pointBox(p.x, p.y), view)) continue;
        if (!cell) points.push(p);
        else add({ ...pointBox(p.x, p.y), x: p.x, y: p.y, count: 1, point: p });
      }
    }
    function add(group: Cluster) {
      const key = Math.floor(group.x / cell) + ":" + Math.floor(group.y / cell);
      const prev = buckets.get(key);
      if (!prev) {
        buckets.set(key, { ...group });
        return;
      }
      const count = prev.count + group.count;
      prev.x = (prev.x * prev.count + group.x * group.count) / count;
      prev.y = (prev.y * prev.count + group.y * group.count) / count;
      prev.left = Math.min(prev.left, group.left);
      prev.top = Math.min(prev.top, group.top);
      prev.right = Math.max(prev.right, group.right);
      prev.bottom = Math.max(prev.bottom, group.bottom);
      prev.count = count;
      prev.point = undefined;
    }
    if (root) walk(root);
    for (const group of buckets.values()) {
      if (group.point) points.push(group.point); else groups.push(group);
    }
    return { points, groups };
  }
  return visible;
}

function segmentHits(a: Point, b: Point, view: Box) {
  let from = 0, to = 1;
  for (const [x, delta, lo, hi] of [[a.x, b.x - a.x, view.left, view.right], [a.y, b.y - a.y, view.top, view.bottom]]) {
    if (delta === 0) {
      if (x < lo || x > hi) return false;
      continue;
    }
    const t = (lo - x) / delta, u = (hi - x) / delta;
    from = Math.max(from, Math.min(t, u));
    to = Math.min(to, Math.max(t, u));
    if (from > to) return false;
  }
  return true;
}

export function edgeIndex(edges: Edge[], straight: boolean) {
  const root = index(edges, edge => edge);
  return (view: Box, limit: number) => {
    const result: Edge[] = [];
    let inspected = 0;
    function walk(node: Branch<Edge>) {
      if (result.length >= limit || inspected >= limit * 5 || !intersects(node, view)) return;
      node.children?.forEach(walk);
      for (const edge of node.entries ?? []) {
        if (result.length >= limit || inspected++ >= limit * 5) break;
        if (intersects(edge, view) && (!straight || segmentHits(edge.a, edge.b, view))) result.push(edge);
      }
    }
    if (root) walk(root);
    return result;
  };
}
