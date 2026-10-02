/*
 * kruskal.c - Kruskal's Minimum Spanning Tree algorithm in C.
 *
 * Two ways to use this one file:
 *   1. Browser: compile to WebAssembly with Emscripten. JavaScript calls
 *      kruskal_run() and animates the steps it returns.
 *   2. Terminal: compile with gcc. main() reads a graph from stdin and
 *      prints every step (handy for testing and for your viva).
 *
 * Phases of the algorithm (all implemented below, none in JavaScript):
 *   1. Sort edges by weight ........ qsort() with cmp_edge()        O(E log E)
 *   2. Scan edges in sorted order ... loop in kruskal_run()
 *   3. Cycle check .................. ds_find() on both endpoints   ~O(alpha(V))
 *   4. Accept edge .................. ds_union() merges two sets
 */
#include <stdio.h>
#include <stdlib.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

#define MAX_V 26   /* cities A..Z */
#define MAX_E 400

/* Step outcome codes written to the output buffer */
#define REJECTED 0 /* endpoints already in the same set -> cycle   */
#define SELECTED 1 /* endpoints in different sets -> joins them    */
#define SKIPPED  2 /* MST already has V-1 edges, edge not needed   */

typedef struct { int u, v, w, id; } Edge;

/* ---------- Disjoint Set Union (Union-Find) ---------- */
static int parent[MAX_V];
static int rnk[MAX_V];

static void ds_init(int n) {
    for (int i = 0; i < n; i++) { parent[i] = i; rnk[i] = 0; }
}

/* Find the representative (root) of x, with path compression. */
static int ds_find(int x) {
    if (parent[x] != x) parent[x] = ds_find(parent[x]);
    return parent[x];
}

/* Union by rank. Returns 1 if two different sets were merged, 0 if same set. */
static int ds_union(int a, int b) {
    int ra = ds_find(a), rb = ds_find(b);
    if (ra == rb) return 0;
    if (rnk[ra] < rnk[rb])      parent[ra] = rb;
    else if (rnk[ra] > rnk[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rnk[ra]++; }
    return 1;
}

/* ---------- Sorting ---------- */
/* Ascending weight; ties broken by input order so results are deterministic. */
static int cmp_edge(const void *a, const void *b) {
    const Edge *x = a, *y = b;
    if (x->w != y->w) return (x->w > y->w) - (x->w < y->w);
    return x->id - y->id;
}

/*
 * kruskal_run - run Kruskal on a graph.
 *   n            number of vertices (0..n-1)
 *   m            number of edges
 *   us, vs, ws   edge arrays: endpoint, endpoint, weight (input order = edge id)
 *   out          int buffer of at least 3 + 5*m ints
 *
 * Output layout:
 *   out[0] = number of steps (always m, one per edge in sorted order)
 *   out[1] = number of edges selected for the MST
 *   out[2] = total cost of selected edges
 *   then, for each step k (0-based) starting at out[3 + 5*k]:
 *     [edge id, outcome, find(u), find(v), running total cost]
 *   find(u)/find(v) are the roots BEFORE the union, so the UI can show
 *   why an edge was selected (roots differ) or rejected (roots equal).
 *
 * Returns 0 on success, -1 on invalid input.
 * The graph has a spanning tree only if out[1] == n - 1.
 */
EXPORT int kruskal_run(int n, int m, const int *us, const int *vs,
                       const int *ws, int *out) {
    if (n < 1 || n > MAX_V || m < 0 || m > MAX_E) return -1;

    Edge edges[MAX_E];
    for (int i = 0; i < m; i++) {
        if (us[i] < 0 || us[i] >= n || vs[i] < 0 || vs[i] >= n) return -1;
        edges[i] = (Edge){ us[i], vs[i], ws[i], i };
    }

    qsort(edges, m, sizeof(Edge), cmp_edge);   /* step 1: sort */
    ds_init(n);

    int chosen = 0, total = 0;
    for (int k = 0; k < m; k++) {              /* step 2: scan in order */
        Edge e = edges[k];
        int ru = ds_find(e.u), rv = ds_find(e.v);   /* step 3: cycle check */
        int outcome;

        if (chosen == n - 1) {
            outcome = SKIPPED;
        } else if (ds_union(e.u, e.v)) {            /* step 4: accept */
            outcome = SELECTED;
            chosen++;
            total += e.w;
        } else {
            outcome = REJECTED;
        }

        int *p = &out[3 + 5 * k];
        p[0] = e.id; p[1] = outcome; p[2] = ru; p[3] = rv; p[4] = total;
    }
    out[0] = m; out[1] = chosen; out[2] = total;
    return 0;
}

#ifndef __EMSCRIPTEN__
/*
 * CLI input format (stdin):
 *   n m
 *   A B 4      (m lines: two city letters and a weight)
 */
int main(void) {
    int n, m;
    int us[MAX_E], vs[MAX_E], ws[MAX_E];
    static int out[3 + 5 * MAX_E];

    if (scanf("%d %d", &n, &m) != 2 || m > MAX_E) {
        fprintf(stderr, "Invalid input: expected 'n m' first.\n");
        return 1;
    }
    for (int i = 0; i < m; i++) {
        char a, b;
        if (scanf(" %c %c %d", &a, &b, &ws[i]) != 3) {
            fprintf(stderr, "Invalid edge on line %d.\n", i + 2);
            return 1;
        }
        us[i] = a - 'A'; vs[i] = b - 'A';
    }
    if (kruskal_run(n, m, us, vs, ws, out) != 0) {
        fprintf(stderr, "Invalid graph (vertex out of range or too large).\n");
        return 1;
    }

    const char *label[] = { "REJECTED (cycle)", "SELECTED", "SKIPPED (MST complete)" };
    printf("Step  Edge   Weight  Find(u) Find(v)  Outcome\n");
    for (int k = 0; k < out[0]; k++) {
        int *p = &out[3 + 5 * k];
        printf("%3d   %c-%c   %6d     %c       %c     %s\n", k + 1,
               'A' + us[p[0]], 'A' + vs[p[0]], ws[p[0]],
               'A' + p[2], 'A' + p[3], label[p[1]]);
    }
    if (out[1] == n - 1)
        printf("\nMST found. Edges: %d, total cost: %d\n", out[1], out[2]);
    else
        printf("\nGraph is disconnected: no spanning tree. "
               "Selected %d of %d needed edges (forest cost %d).\n",
               out[1], n - 1, out[2]);
    return 0;
}
#endif
