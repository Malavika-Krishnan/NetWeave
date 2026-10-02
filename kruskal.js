"use strict";
/*
 * kruskal.js – Pure-JS drop-in emulating the Emscripten/WASM API.
 *
 * Exports: KruskalModule() → Promise<{ _malloc, _free, setValue, getValue, _kruskal_run }>
 *
 * Memory is a flat Int32Array. All addresses are byte-offsets (word-aligned,
 * 4 bytes each — identical to how app.js uses them with b = 4).
 */

function KruskalModule() {
  // ── Simulated heap (1 MB) ─────────────────────────────────────────────────
  const heap = new Int32Array(1 << 18);   // 256 k words = 1 MB
  let   bump = 4;                          // skip address 0 (null sentinel)

  const _malloc = bytes => {
    const addr = bump;
    bump += Math.ceil(bytes / 4) * 4;    // keep 4-byte alignment
    return addr;
  };
  const _free = () => {};                 // no-op; GC reclaims

  const setValue = (ptr, val)  => { heap[ptr >> 2] = val | 0; };
  const getValue = ptr         => heap[ptr >> 2];

  // ── Disjoint Set Union ────────────────────────────────────────────────────
  const parent = new Int32Array(26);
  const rank   = new Int32Array(26);

  const init = n => {
    for (let i = 0; i < n; i++) { parent[i] = i; rank[i] = 0; }
  };

  const find = x => {
    // Iterative path-halving (avoids stack overflow on large n)
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return 0;
    if      (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else   { parent[rb] = ra; rank[ra]++; }
    return 1;
  };

  // ── kruskal_run ───────────────────────────────────────────────────────────
  // Signature + output layout mirrors the C function exactly.
  const _kruskal_run = (n, m, us_ptr, vs_ptr, ws_ptr, out_ptr) => {
    if (n < 1 || n > 26 || m < 0 || m > 400) return -1;

    // Read edges from heap
    const edges = Array.from({ length: m }, (_, i) => ({
      u:  heap[(us_ptr >> 2) + i],
      v:  heap[(vs_ptr >> 2) + i],
      w:  heap[(ws_ptr >> 2) + i],
      id: i,
    }));

    // Validate vertices
    if (edges.some(({ u, v }) => u < 0 || u >= n || v < 0 || v >= n)) return -1;

    // Sort ascending by weight; ties keep input order
    edges.sort((a, b) => a.w !== b.w ? a.w - b.w : a.id - b.id);

    // Kruskal
    init(n);
    let chosen = 0, total = 0;

    edges.forEach(({ u, v, w, id }, k) => {
      const ru = find(u), rv = find(v);
      let acc;

      if (chosen === n - 1) {
        acc = 2; // SKIPPED
      } else if (union(u, v)) {
        acc = 1; // SELECTED
        chosen++;
        total += w;
      } else {
        acc = 0; // REJECTED
      }

      // Write step: [edge_id, outcome, find(u)_before, find(v)_before, running_total]
      const base = (out_ptr >> 2) + 3 + 5 * k;
      heap[base]     = id;
      heap[base + 1] = acc;
      heap[base + 2] = ru;
      heap[base + 3] = rv;
      heap[base + 4] = total;
    });

    heap[(out_ptr >> 2)]     = m;       // total steps
    heap[(out_ptr >> 2) + 1] = chosen;  // edges in MST
    heap[(out_ptr >> 2) + 2] = total;   // MST cost
    return 0;
  };

  return Promise.resolve({ _malloc, _free, setValue, getValue, _kruskal_run });
}
