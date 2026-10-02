# NetWeave

### Less Cable. Less Cost. Zero Cycles.

**What if connecting an entire network didn't have to cost a fortune?**

CableCraft brings network optimization to life using **Kruskal's Algorithm**, finding the cheapest way to connect every location without creating unnecessary loops.

No redundant connections. No wasted budget. Just smart networking.

---

## The Big Idea

Imagine a bunch of cities that need to be connected. Every possible cable route comes with a different installation cost.

The challenge? Connect every city while spending as little as possible.

That's where Kruskal's Algorithm steps in. It picks the cheapest available connection, checks whether it creates a cycle, and keeps building until the entire network is connected.

**Simple strategy. Surprisingly powerful results.**

## What Makes It Interesting?

* **Smart edge selection:** Always considers the cheapest available connection first.
* **No unnecessary loops:** Uses Union-Find to detect cycles before adding an edge.
* **Interactive visualization:** Watch the algorithm make decisions, one edge at a time.
* **Real-world application:** Explore how graph algorithms can optimize network infrastructure.
* **C-powered logic:** The core algorithm is implemented in C, with a web interface for visualization.

## Under the Hood

| Component         | Technology                      |
| ----------------- | ------------------------------- |
| Core algorithm    | C                               |
| Interface         | HTML, CSS                       |
| Interactive logic | JavaScript                      |
| Algorithm         | Kruskal's Algorithm             |
| Cycle detection   | Disjoint Set Union (Union-Find) |

## The Algorithm at Work

Here's the game plan:

1. Sort every edge from the lowest cost to the highest.
2. Pick the cheapest edge.
3. Check whether its endpoints are already connected.
4. If they aren't, add the edge and merge their sets.
5. If they are, skip it. Nobody needs another cycle.
6. Repeat until the network has exactly \(V-1\) selected edges.

And just like that, you have a Minimum Spanning Tree.

## Performance Check

Because even smart algorithms need to be efficient.

* **Time complexity:** \(O(E \log E)\)
* **Space complexity:** \(O(V+E)\), including graph storage.

Here, \(V\) represents the number of vertices and \(E\) represents the number of edges.

## A Quick Look

**Input:** A weighted network graph.

**Process:** Sort, select, check, and connect.

**Output:** A minimum-cost network connecting all vertices.

Every edge has a purpose. Every decision counts.

## Run It Locally

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/CableCraft.git
cd CableCraft
```

Open the project's `index.html` file in your browser to explore the visualization.

For the C implementation, compile and run the source using GCC:

```bash
gcc kruskal.c -o kruskal
./kruskal
```

Adjust the source filename if your C file uses a different name.

## Why CableCraft?

Because network optimization isn't just about connecting points. It's about making every connection count.

Built as a **Design and Analysis of Algorithms (DAA) project**, CableCraft demonstrates how a classic greedy algorithm can solve a practical optimization problem.

---

**Made with logic, graphs, and a little bit of greed.**
