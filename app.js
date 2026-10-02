"use strict";
/*
 * app.js – Graph editing UI + step replay.
 * The algorithm (sort, Find/Union, MST) lives entirely in kruskal.js.
 */

// ── Constants ──────────────────────────────────────────────────────────────
const NS      = "http://www.w3.org/2000/svg";
const MAX_V   = 26;
const nm      = i => String.fromCharCode(65 + i);   // 0→"A"
const $       = id => document.getElementById(id);

const OUTCOME = ["rejected", "accepted", "skipped"];

const SAMPLE = {
  cities: [[90,200],[220,70],[220,330],[410,200],[540,90],[550,320]],
  edges:  [[0,1,4],[0,2,2],[1,2,5],[1,3,10],[2,3,3],[2,4,8],[3,4,6],[3,5,7],[4,5,9]],
};

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  cities: [], edges: [],
  run: null, step: 0, timer: null,
  nodeEls: [], edgeEls: [],
};
let wasm = null;
const svg = $("graph");

// ── WASM Bridge ────────────────────────────────────────────────────────────
function runC() {
  const { cities, edges } = state;
  state.run = null;
  if (!wasm || !cities.length || !edges.length) return;

  const n = cities.length, m = edges.length, b = 4;
  const us  = wasm._malloc(m * b);
  const vs  = wasm._malloc(m * b);
  const ws  = wasm._malloc(m * b);
  const out = wasm._malloc((3 + 5 * m) * b);

  edges.forEach(({ u, v, w }, i) => {
    wasm.setValue(us + i * b, u, "i32");
    wasm.setValue(vs + i * b, v, "i32");
    wasm.setValue(ws + i * b, w, "i32");
  });

  if (wasm._kruskal_run(n, m, us, vs, ws, out) === 0) {
    const g = i => wasm.getValue(out + i * b, "i32");
    const steps = Array.from({ length: g(0) }, (_, k) => {
      const o = 3 + 5 * k;
      return { id: g(o), acc: g(o+1), ru: g(o+2), rv: g(o+3), total: g(o+4) };
    });
    state.run = { steps, mst: g(1), total: g(2) };
  }

  [us, vs, ws, out].forEach(p => wasm._free(p));
}

// ── Graph editing ──────────────────────────────────────────────────────────
function showMsg(text, ok = false) {
  const el = $("msg");
  el.textContent = text;
  el.className   = "msg" + (ok ? " ok" : "");
}

function addCity(x, y) {
  const i = state.cities.length;
  if (i >= MAX_V) return showMsg("Maximum 26 cities.");
  if (x === undefined) {
    const a = i * 2.399;
    x = 320 + 230 * Math.cos(a) * (0.6 + 0.4 * ((i % 3) / 2));
    y = 210 + 150 * Math.sin(a);
  }
  state.cities.push({ x: clamp(x, 25, 615), y: clamp(y, 25, 395) });
  fillSelects();
  changed();
  showMsg(`Added city ${nm(i)}.`, true);
}

function addEdge(u, v, w) {
  if (!Number.isInteger(u) || !Number.isInteger(v))
    return showMsg("Add at least two cities first.");
  if (u === v)
    return showMsg("A connection needs two different cities.");
  if (!Number.isInteger(w) || w < 1 || w > 999)
    return showMsg("Cost must be a whole number from 1 to 999.");
  if (state.edges.some(e => (e.u === u && e.v === v) || (e.u === v && e.v === u)))
    return showMsg(`Connection ${nm(u)}-${nm(v)} already exists.`);
  state.edges.push({ u, v, w });
  changed();
  showMsg(`Added ${nm(u)}-${nm(v)} (${w}).`, true);
}

function loadGraph({ cities, edges }) {
  state.cities = cities.map(([x, y]) => ({ x, y }));
  state.edges  = edges.map(([u, v, w]) => ({ u, v, w }));
  fillSelects();
  changed();
  showMsg("");
}

function fillSelects() {
  const opts = state.cities.map((_, i) =>
    `<option value="${i}">${nm(i)}</option>`).join("");
  const su = $("selU"), sv = $("selV");
  const pu = su.value, pv = sv.value;
  su.innerHTML = sv.innerHTML = opts;
  if (pu) su.value = pu;
  sv.value = pv || (state.cities.length > 1 ? 1 : 0);
}

function changed() {
  stopPlay();
  state.step = 0;
  buildGraph();
  runC();
  render();
}

// ── Utilities ──────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.appendChild(el);
  return el;
}

// ── Drawing ────────────────────────────────────────────────────────────────
function buildGraph() {
  svg.innerHTML = "";
  const eg = svgEl("g", {}, svg);
  const ng = svgEl("g", {}, svg);

  state.edgeEls = state.edges.map(() => {
    const g = svgEl("g", { class: "edge pending" }, eg);
    return {
      g,
      line: svgEl("line", {}, g),
      rect: svgEl("rect", { width: 32, height: 20, rx: 8 }, g),
      text: svgEl("text", {}, g),
    };
  });

  state.nodeEls = state.cities.map((_, i) => {
    const g = svgEl("g", { class: "node", "data-i": i }, ng);
    const c = svgEl("circle", { r: 20 }, g);
    const t = svgEl("text", {}, g);
    t.textContent = nm(i);
    return { g, c, t };
  });

  position();
}

function position() {
  state.edges.forEach(({ u, v, w }, i) => {
    const a = state.cities[u], b = state.cities[v], d = state.edgeEls[i];
    d.line.setAttribute("x1", a.x); d.line.setAttribute("y1", a.y);
    d.line.setAttribute("x2", b.x); d.line.setAttribute("y2", b.y);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    d.rect.setAttribute("x", mx - 16); d.rect.setAttribute("y", my - 10);
    d.text.setAttribute("x", mx);      d.text.setAttribute("y", my);
    d.text.textContent = w;
  });

  state.cities.forEach(({ x, y }, i) => {
    const d = state.nodeEls[i];
    d.c.setAttribute("cx", x); d.c.setAttribute("cy", y);
    d.t.setAttribute("x", x);  d.t.setAttribute("y", y);
  });
}

function edgeStatuses() {
  const st = state.edges.map(() => "pending");
  if (!state.run) return st;
  for (let k = 0; k < state.step; k++)
    st[state.run.steps[k].id] = OUTCOME[state.run.steps[k].acc];
  if (state.step > 0)
    st[state.run.steps[state.step - 1].id] += " current";
  return st;
}

// ── Render ─────────────────────────────────────────────────────────────────
function explanation(k) {
  const s = state.run.steps[k];
  const e = state.edges[s.id];
  const label = `${nm(e.u)}-${nm(e.v)} (weight ${e.w})`;
  const fu = `Find(${nm(e.u)}) = ${nm(s.ru)}`;
  const fv = `Find(${nm(e.v)}) = ${nm(s.rv)}`;
  if (s.acc === 1)
    return `<b class="ok">✓ Selected.</b> Edge ${label}: ${fu}, ${fv}. Roots differ → cities are in separate sets → no cycle. Union merges the sets.`;
  if (s.acc === 0)
    return `<b class="bad">✗ Rejected.</b> Edge ${label}: ${fu}, ${fv}. Same root → already connected → adding this edge would form a cycle.`;
  return `<b>↷ Skipped.</b> Edge ${label}: the tree already has ${state.cities.length - 1} edges (V-1), so no more are needed.`;
}

function render() {
  const { run, cities, edges, step } = state;
  const n = cities.length, m = edges.length;
  const total = run ? run.steps.length : 0;
  const st = edgeStatuses();

  state.edgeEls.forEach((d, i) => d.g.setAttribute("class", `edge ${st[i]}`));
  state.nodeEls.forEach(d => d.g.setAttribute("class", "node"));

  const cur = run && step > 0 ? run.steps[step - 1] : null;
  if (cur) {
    const e = edges[cur.id];
    [e.u, e.v].forEach(i => state.nodeEls[i].g.setAttribute("class", "node active"));
  }

  // Dashboard
  const picked = run ? run.steps.slice(0, step).filter(s => s.acc === 1) : [];
  $("sV").textContent    = n;
  $("sE").textContent    = m;
  $("sSel").textContent  = picked.length;
  $("sCost").textContent = cur ? cur.total : 0;

  const done = run && step === total;
  let status = "Add cities and connections";
  if (n >= 1 && m === 0)   status = "Add at least one connection";
  else if (run) {
    if (step === 0)  status = "Sorted by weight — press Next";
    else if (done)   status = run.mst === n - 1 ? "✓ MST complete" : "⚠ Disconnected graph";
    else             status = `Step ${step} of ${total}`;
  }
  $("sStatus").textContent = status;

  // Explanation
  $("explain").innerHTML = !run
    ? "Add a graph (or load the sample), then press <b>Next</b>."
    : cur
      ? explanation(step - 1)
      : `Edges sorted by weight (${total} total). Press <b>Next</b> to examine the cheapest edge.`;

  // Sorted list
  $("sorted").innerHTML = run ? run.steps.map((s, k) => {
    const e = edges[s.id];
    const cls = k < step ? OUTCOME[s.acc] : "";
    const isCur = k === step - 1 ? " current" : "";
    return `<li class="${cls}${isCur}"><span>${nm(e.u)}-${nm(e.v)}</span><span>${e.w}</span></li>`;
  }).join("") : "";

  $("mstList").textContent = picked.length
    ? picked.map(s => `${nm(edges[s.id].u)}-${nm(edges[s.id].v)}:${edges[s.id].w}`).join("  ")
    : "none";

  // Verdict
  const v = $("verdict");
  v.hidden = !done;
  if (done) {
    const ok = run.mst === n - 1;
    v.className = "banner" + (ok ? "" : " error");
    v.style.margin = "12px 0 0";
    v.innerHTML = ok
      ? `<b>Minimum cable cost: ${run.total}</b> using ${run.mst} connections.`
      : `<b>No spanning tree.</b> Graph is disconnected — only ${run.mst} of ${n-1} needed edges selected (forest cost ${run.total}). Add more connections.`;
  }

  // Controls
  $("prev").disabled  = !run || step === 0;
  $("next").disabled  = !run || step === total;
  $("play").disabled  = !run || step === total;
  $("reset").disabled = !run || step === 0;
}

// ── Step controls ──────────────────────────────────────────────────────────
function go(delta) {
  if (!state.run) return;
  state.step = clamp(state.step + delta, 0, state.run.steps.length);
  if (state.step === state.run.steps.length) stopPlay();
  render();
}

function stopPlay() {
  clearInterval(state.timer);
  state.timer = null;
  $("play").textContent = "▶ Auto-play";
}

function togglePlay() {
  if (state.timer) return stopPlay();
  $("play").textContent = "⏸ Pause";
  state.timer = setInterval(() => go(1), 1000);
}

// ── Events ─────────────────────────────────────────────────────────────────
$("addCity").onclick   = () => addCity();
$("addEdge").onclick   = () => addEdge(
  parseInt($("selU").value, 10),
  parseInt($("selV").value, 10),
  parseInt($("weight").value, 10)
);
$("loadSample").onclick = () => loadGraph(SAMPLE);
$("clear").onclick      = () => {
  state.cities = [];
  state.edges  = [];
  fillSelects();
  changed();
  showMsg("");
};
$("next").onclick  = () => go(1);
$("prev").onclick  = () => go(-1);
$("reset").onclick = () => { stopPlay(); state.step = 0; render(); };
$("play").onclick  = togglePlay;

// ── Drag & double-click ────────────────────────────────────────────────────
let drag = null;
const toSvgPt = ev => {
  const p = svg.createSVGPoint();
  p.x = ev.clientX; p.y = ev.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
};

svg.addEventListener("pointerdown", ev => {
  const g = ev.target.closest(".node");
  if (g) { drag = +g.dataset.i; svg.setPointerCapture(ev.pointerId); }
});
svg.addEventListener("pointermove", ev => {
  if (drag === null) return;
  const { x, y } = toSvgPt(ev);
  Object.assign(state.cities[drag], {
    x: clamp(x, 25, 615),
    y: clamp(y, 25, 395),
  });
  position();
});
svg.addEventListener("pointerup",   () => { drag = null; });
svg.addEventListener("dblclick", ev => {
  if (!ev.target.closest(".node")) {
    const { x, y } = toSvgPt(ev);
    addCity(x, y);
  }
});

// ── Boot ───────────────────────────────────────────────────────────────────
if (typeof KruskalModule === "undefined") {
  $("fatal").hidden = false;
} else {
  KruskalModule()
    .then(m => { wasm = m; loadGraph(SAMPLE); })
    .catch(() => { $("fatal").hidden = false; });
}
render();
