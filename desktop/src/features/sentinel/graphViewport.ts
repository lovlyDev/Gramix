/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { edgeIndex, intersects, pointIndex, type Box, type Cluster, type Edge } from "./graphSpatial";
import type { Point, positionNetwork } from "./graphLayout";

export type Network = ReturnType<typeof positionNetwork> & { labels: Map<string,string> };
type XY = { x: number; y: number };
function bounds(points: Point[]) {
  let left=Infinity, right=-Infinity, top=Infinity, bottom=-Infinity;
  for(const p of points) {
    left=Math.min(left,p.x-24); right=Math.max(right,p.x+112);
    top=Math.min(top,p.y-24); bottom=Math.max(bottom,p.y+24);
  }
  return {left,top,width:right-left,height:bottom-top};
}
export function graphSvg(graph: Network, colors: string[], focus="") {
  const near=new Set([focus,...graph.edges.filter(e=>e.includes(focus)).flat()]);
  const b=bounds(graph.points), positions=new Map(graph.points.map(p=>[p.raw,p]));
  const [bg,ink,line,accent]=colors;
  const shape=graph.edges.map(([a,b])=>{
    const p=positions.get(a)!, q=positions.get(b)!;
    if(a===b) return `<circle cx="${p.x}" cy="${p.y}" r="11"/>`;
    const mid=(p.x+q.x)/2;
    const path=graph.radial ? `L${q.x} ${q.y}` : `C${mid} ${p.y} ${mid} ${q.y} ${q.x} ${q.y}`;
    return `<path opacity="${focus && a!==focus && b!==focus?.15:1}" d="M${p.x} ${p.y} ${path}"/>`;
  });
  const nodes=graph.points.map((p,i)=>`<g opacity="${focus && !near.has(p.raw)?.2:1}"><circle cx="${p.x}" cy="${p.y}" r="${i?5:8}" fill="${i?ink:accent}"/><text x="${p.x+12}" y="${p.y}" dominant-baseline="middle" fill="${ink}">${(graph.labels.get(p.raw)??"").replaceAll("&","&amp;").replaceAll("<","&lt;")}</text></g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.left} ${b.top} ${b.width} ${b.height}" font-family="sans-serif" font-size="12"><rect x="${b.left}" y="${b.top}" width="100%" height="100%" fill="${bg}"/><g fill="none" stroke="${line}">${shape.join("")}</g>${nodes.join("")}</svg>`;
}

export function viewport(svg: SVGSVGElement, select: (raw: string) => void) {
  const ns = "http://www.w3.org/2000/svg";
  const create = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS(ns, tag);
  const edges = create("g"), normal = create("path"), highlighted = create("path");
  const dots = create("g"), labels = create("g");
  edges.setAttribute("fill", "none");
  edges.setAttribute("aria-hidden", "true");
  dots.setAttribute("aria-hidden", "true");
  labels.setAttribute("aria-hidden", "true");
  for (const path of [normal, highlighted]) {
    path.setAttribute("stroke-width", "1");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("stroke-linecap", "round");
  }
  edges.append(normal, highlighted);
  svg.append(edges, dots, labels);

  let large = false;
  let graphBounds: ReturnType<typeof bounds>;
  let pinned = "";
  let queryPoints = pointIndex([]), queryEdges = edgeIndex([], true);
  let priority: Point[] = [], priorityEdges: Edge[] = [];
  let indexedPoints = new Map<string, Point>();
  let adjacentEdges = new Map<string, Edge[]>();
  const visibleGroups: { group: Cluster; x: number; y: number; r: number }[] = [];
  let graph: Network, colors: string[], focus = "", near = new Set<string>();
  let current = new Map<string, XY>(), origins = new Map<string, XY>();
  let rings = new Set<string>(), geometryDirty = true;
  let width = 0, height = 0, frame = 0, started = 0, fitScale = 1, autoFit = true;
  let camera = { x: 0, y: 0, k: 1 }, target = { ...camera }, initialized = false;
  let drag: { x: number; y: number; distance: number } | null = null, keyboard = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const visibleNodes: { raw: string; x: number; y: number }[] = [];
  const dotPool: { dot: SVGCircleElement; ring: SVGCircleElement }[] = [];
  const labelPool: SVGTextElement[] = [];

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function fit() {
    if (!graph || !width || !height) return;
    const b = graphBounds;
    fitScale = Math.max(.000001, Math.min((width - 24) / b.width, (height - 24) / b.height, 2));
    target = { x: b.left + b.width / 2, y: b.top + b.height / 2, k: fitScale };
    if (!initialized) { camera = { ...target }; initialized = true; }
    autoFit = true;
    schedule();
  }
  function preparePriority() {
    if (!large) return;
    const root = graph.points[0].raw;
    const keep = new Set([root, focus, pinned].filter(Boolean));
    const links = (adjacentEdges.get(focus || pinned) ?? []).slice(0, 24);
    for (const edge of links) {
      keep.add(edge.a.raw); keep.add(edge.b.raw);
    }
    priority = Array.from(keep).flatMap(raw => {
      const point = indexedPoints.get(raw);
      return point ? [point] : [];
    });
    priorityEdges = links;
    queryPoints = pointIndex(graph.points.filter(p => !keep.has(p.raw)));
  }
  function prepareIndex() {
    indexedPoints = new Map(graph.points.map(p => [p.raw, p]));
    adjacentEdges = new Map();
    const items: Edge[] = [];
    for (const [from, to] of graph.edges) {
      if (from === to) continue;
      const a = indexedPoints.get(from)!, b = indexedPoints.get(to)!;
      const mid = (a.x + b.x) / 2;
      const end = graph.radial ? `L${b.x} ${b.y}` : `C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
      const edge = { a, b, path: `M${a.x} ${a.y}${end}`, left: Math.min(a.x, b.x), right: Math.max(a.x, b.x),
        top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) };
      items.push(edge);
      for (const raw of [from, to]) {
        const incident = adjacentEdges.get(raw);
        if (incident) incident.push(edge); else adjacentEdges.set(raw, [edge]);
      }
    }
    queryEdges = edgeIndex(items, graph.radial);
    preparePriority();
  }
  function zoomGroup(group: Cluster) {
    const span = Math.max((group.right - group.left) / Math.max(1, width - 140), (group.bottom - group.top) / Math.max(1, height - 140));
    autoFit = false;
    target = {
      x: (group.left + group.right) / 2,
      y: (group.top + group.bottom) / 2,
      k: Math.min(32, Math.max(camera.k * 2.2, Math.min(camera.k * 12, span ? 1 / span : 32))),
    };
    schedule();
  }
  function getDot(i: number) {
    if (dotPool[i]) return dotPool[i];
    const ring = create("circle"), dot = create("circle");
    ring.setAttribute("fill", "none");
    dots.append(ring, dot);
    const marker = { dot, ring };
    dotPool.push(marker);
    return marker;
  }
  const groupPool: { dot: SVGCircleElement; label: SVGTextElement; title: SVGTitleElement }[] = [];
  function drawGroups(groups: Cluster[], k: number, ox: number, oy: number) {
    visibleGroups.length = 0;
    for (const [i, group] of groups.entries()) {
      const x = group.x*k+ox, y = group.y*k+oy;
      const r = Math.min(16, 9 + Math.log2(group.count));
      const marker = groupPool[i] ?? (() => {
        const element = create("g"), dot = create("circle"), label = create("text"), title = create("title");
        element.dataset.graphCluster = String(i);
        element.style.cursor = "zoom-in";
        label.setAttribute("font-size", "10");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("text-anchor", "middle");
        element.append(title, dot, label); labels.prepend(element);
        const marker = {dot, label, title};
        groupPool.push(marker);
        return marker;
      })();
      marker.dot.parentElement!.style.display = "";
      marker.dot.parentElement!.setAttribute("transform", `translate(${x} ${y})`);
      marker.dot.setAttribute("r", String(r));
      marker.dot.setAttribute("fill", colors[0]);
      marker.dot.setAttribute("stroke", colors[3]);
      marker.label.setAttribute("fill", colors[1]);
      const count = String(group.count);
      if (marker.label.textContent !== count) {
        marker.label.textContent = count;
        marker.title.textContent = count;
      }
      visibleGroups.push({ group, x, y, r });
    }
    for (let i=groups.length;i<groupPool.length;i++) groupPool[i].dot.parentElement!.style.display = "none";
  }
  function draw(now: number) {
    frame = 0;
    if (!graph || !width || !height) return;
    const lowMotion = reduced.matches || document.documentElement.dataset.lowMotion === "true";
    const progress = lowMotion || large ? 1 : 1 - (1 - Math.min(1, (now - started) / 440)) ** 3;
    const moving = Math.abs(camera.k - target.k) > target.k * .0004 ||
      (Math.abs(camera.x - target.x) + Math.abs(camera.y - target.y)) * target.k > .12;
    const easing = moving && !lowMotion ? .25 : 1;
    camera.x += (target.x - camera.x) * easing;
    camera.y += (target.y - camera.y) * easing;
    camera.k += (target.k - camera.k) * easing;
    const { k } = camera, ox = width / 2 - camera.x * k, oy = height / 2 - camera.y * k;
    edges.setAttribute("transform", `translate(${ox} ${oy}) scale(${k})`);
    const view: Box = {left: -ox / k, top: -oy / k, right: (width - ox) / k, bottom: (height - oy) / k};
    const padded: Box = {left: view.left - 120/k, top: view.top - 12/k, right: view.right + 12/k, bottom: view.bottom + 12/k};
    const screen = large ? queryPoints(padded, 44 / k) : null;
    const points = screen ? [...priority, ...screen.points] : graph.points;
    if (screen) {
      const individuals = new Set(points.map(p => p.raw));
      // At overview scale show local links. At closer scales include crossings of the viewport.
      const links = new Set(priorityEdges.filter(edge => intersects(edge, view)));
      if (!screen.groups.length) {
        for (const edge of queryEdges(view, 650)) links.add(edge);
      }
      for (const point of points) {
        if (links.size >= 750) break;
        const incident = adjacentEdges.get(point.raw);
        if (!incident || incident.length > 750) continue;
        for (const edge of incident) {
          if (individuals.has(edge.a.raw) && individuals.has(edge.b.raw) && intersects(edge, view)) links.add(edge);
          if (links.size >= 750) break;
        }
      }
      const regular: string[] = [], bright: string[] = [];
      for (const edge of links) ((edge.a.raw === (focus || pinned) || edge.b.raw === (focus || pinned)) ? bright : regular).push(edge.path);
      const base = regular.join(""), emphasis = bright.join("");
      if (normal.getAttribute("d") !== base) normal.setAttribute("d", base);
      if (highlighted.getAttribute("d") !== emphasis) highlighted.setAttribute("d", emphasis);
      geometryDirty = false;
    } else if (geometryDirty) {
      for (const { raw, x, y } of graph.points) {
        const p = current.get(raw)!, old = origins.get(raw)!;
        p.x = old.x + (x - old.x) * progress;
        p.y = old.y + (y - old.y) * progress;
      }
      const regular: string[] = [], bright: string[] = [];
      for (const [from, to] of graph.edges) {
        if (from === to) continue;
        const a = current.get(from)!, b = current.get(to)!;
        const mid = (a.x + b.x) / 2;
        const end = graph.radial ? `L${b.x} ${b.y}` : `C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
        (focus === from || focus === to ? bright : regular).push(`M${a.x} ${a.y}${end}`);
      }
      normal.setAttribute("d", regular.join(""));
      highlighted.setAttribute("d", bright.join(""));
      geometryDirty = progress < 1;
    }
    normal.setAttribute("stroke", colors[2]);
    normal.setAttribute("opacity", focus ? ".16" : ".56");
    highlighted.setAttribute("stroke", colors[3]);
    visibleNodes.length = 0;
    const occupied = new Set<string>();
    let dotCount = 0, labelCount = 0;
    for (const point of points) {
      if (!point.raw) continue;
      const i = point.raw === graph.points[0].raw ? 0 : 1;
      const p = large ? point : current.get(point.raw)!;
      const x = p.x * k + ox, y = p.y * k + oy;
      if (x < -120 || x > width + 12 || y < -12 || y > height + 12) continue;
      visibleNodes.push({ raw: point.raw, x, y });
      const r = i ? Math.max(1.6, Math.min(5, 5 * k)) : 7;
      const opacity = focus && !near.has(point.raw) ? ".24" : "1";
      const outer = rings.has(point.raw) ? r + 3 : r;
      const marker = getDot(dotCount++);
      for (const circle of [marker.dot, marker.ring]) {
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("opacity", opacity);
      }
      marker.dot.setAttribute("r", String(r));
      marker.dot.setAttribute("fill", i ? colors[1] : colors[3]);
      marker.dot.style.display = "";
      marker.ring.setAttribute("r", String(outer));
      marker.ring.setAttribute("stroke", colors[2]);
      marker.ring.style.display = outer > r ? "" : "none";
      const cell = `${Math.floor(x / 105)}:${Math.floor(y / 19)}`;
      if (i && point.raw!==pinned && point.raw!==focus && (k < .2 || occupied.has(cell))) continue;
      occupied.add(cell);
      const label = labelPool[labelCount++] ?? (() => {
        const text = create("text");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("stroke-width", "3");
        text.setAttribute("stroke-linejoin", "round");
        text.setAttribute("paint-order", "stroke");
        text.style.cursor = "pointer";
        labels.append(text);
        labelPool.push(text);
        return text;
      })();
      const name = graph.labels.get(point.raw)!;
      if (label.textContent !== name) label.textContent = name;
      label.dataset.address = point.raw;
      label.setAttribute("x", String(x + outer + 5));
      label.setAttribute("y", String(y));
      label.setAttribute("fill", colors[1]);
      label.setAttribute("stroke", colors[0]);
      label.setAttribute("opacity", opacity);
      label.style.display = "";
    }
    for (let i = dotCount; i < dotPool.length; i++) {
      dotPool[i].dot.style.display = dotPool[i].ring.style.display = "none";
    }
    for (let i = labelCount; i < labelPool.length; i++) labelPool[i].style.display = "none";
    drawGroups(screen?.groups ?? [], k, ox, oy);
    if (geometryDirty || moving && !lowMotion) schedule();
  }
  function resize() {
    width = svg.clientWidth;
    height = svg.clientHeight;
    if (autoFit) fit(); else schedule();
  }
  function zoom(factor: number, x = width / 2, y = height / 2) {
    const k = Math.max(Math.min(fitScale * .1, .1), Math.min(32, target.k * factor));
    target.x += (x - width / 2) * (1 / target.k - 1 / k);
    target.y += (y - height / 2) * (1 / target.k - 1 / k);
    target.k = k;
    autoFit = false;
    schedule();
  }
  function wheel(event: WheelEvent) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const b = svg.getBoundingClientRect();
    zoom(Math.exp(-Math.sign(event.deltaY) * Math.min(.6, Math.abs(event.deltaY) * .003)), event.clientX - b.left, event.clientY - b.top);
  }
  svg.onpointerdown = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    svg.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, distance: 0 };
  };
  svg.onpointermove = event => {
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.distance += Math.hypot(dx, dy);
    drag.x = event.clientX; drag.y = event.clientY;
    if (drag.distance <= 3) return;
    autoFit = false; target.x -= dx / camera.k; target.y -= dy / camera.k; schedule();
  };
  svg.onpointercancel = () => { drag = null; };
  svg.onpointerup = event => {
    if (!drag) return;
    const click = drag.distance < 5;
    drag = null;
    if (!click) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const cluster = hit?.closest<SVGGElement>("[data-graph-cluster]");
    if (cluster && labels.contains(cluster)) {
      const item = visibleGroups[Number(cluster.dataset.graphCluster)];
      if (item) zoomGroup(item.group);
      return;
    }
    const label = hit?.closest("text[data-address]");
    if (label && labels.contains(label)) {
      select(label.getAttribute("data-address")!);
      return;
    }
    const b = svg.getBoundingClientRect();
    let nearest = "", distance = 12;
    for (const p of visibleNodes) {
      const d = Math.hypot(p.x - event.clientX + b.left, p.y - event.clientY + b.top);
      if (d < distance) { nearest = p.raw; distance = d; }
    }
    if (nearest) { select(nearest); return; }
    const group = visibleGroups.find(item => Math.hypot(item.x - event.clientX + b.left, item.y - event.clientY + b.top) <= item.r + 3);
    if (group) zoomGroup(group.group);
  };
  function center(raw: string) {
    const p = large ? indexedPoints.get(raw) : current.get(raw);
    if (!p) return;
    if (large && raw!==pinned) {
      pinned = raw;
      preparePriority();
    }
    autoFit = false;
    target = { ...p, k: Math.max(1, camera.k) };
    schedule();
  }
  function keydown(event: KeyboardEvent) {
    if (!graph) return;
    if (event.key === "Enter") {
      const raw = graph.points[keyboard]?.raw;
      if (raw) { event.preventDefault(); select(raw); }
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    keyboard = (keyboard + (event.key === "ArrowRight" ? 1 : -1) + graph.points.length) % graph.points.length;
    const p = graph.points[keyboard];
    const label = graph.labels.get(p.raw);
    if (label) svg.setAttribute("aria-label", label);
    center(p.raw);
  }
  svg.addEventListener("keydown", keydown);

  svg.addEventListener("wheel", wheel, { passive: false });
  const observer = new ResizeObserver(resize);
  observer.observe(svg);
  return {
    fit, zoom, center,
    update(next: Network, palette: string[], selected = "") {
      const focusChanged = selected !== focus;
      if (next !== graph || focusChanged) {
        geometryDirty = true;
        focus = selected;
        near = new Set([focus, ...next.edges.filter(e => e.includes(focus)).flat()]);
      }
      if (next !== graph) {
        const reset = graph?.points[0]?.raw !== next.points[0].raw || graph?.radial !== next.radial;
        rings = new Set(next.edges.filter(([a, b]) => a === b).map(([a]) => a));
        large = next.points.length >= 1200 || next.edges.length >= 1800;
        graphBounds = bounds(next.points);
        if (reset) pinned = "";
        if (large) {
          graph = next;
          prepareIndex();
        }
        origins = large ? new Map() : new Map(next.points.map(p => [p.raw, { ...(current.get(p.raw) ?? current.get(next.parent.get(p.raw)!) ?? { x: 0, y: 0 }) }]));
        current = large ? new Map() : new Map(next.points.map(p => [p.raw, { ...origins.get(p.raw)! }]));
        graph = next;
        keyboard = Math.min(keyboard, next.points.length - 1);
        started = performance.now();
        if (autoFit || reset) fit();
      } else if (focusChanged) preparePriority();
      colors = palette;
      schedule();
    },
    destroy() {
      observer.disconnect();
      cancelAnimationFrame(frame);
      svg.removeEventListener("wheel", wheel);
      svg.removeEventListener("keydown", keydown);
      svg.onpointerdown = svg.onpointermove = svg.onpointerup = svg.onpointercancel = null;
      edges.remove(); dots.remove(); labels.remove();
    },
  };
}
