
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:141E30,50:243B55,100:00C9A7&text=NetWeave&fontColor=ffffff&fontSize=65&fontAlignY=38&desc=Weaving%20Networks%20with%20Minimum%20Cost&descAlignY=60&animation=fadeIn" width="100%" />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=21&duration=2500&pause=900&color=00C9A7&center=true&vCenter=true&width=650&lines=Less+Cable.+Less+Cost.+Zero+Cycles.;Connecting+the+Dots%2C+the+Smart+Way.;Greedy+by+Design.+Efficient+by+Nature.;Building+Minimum-Cost+Networks." alt="Typing SVG" />

<br/>

**What if connecting an entire network didn't have to cost a fortune?**

NetWeave uses **Kruskal's Algorithm** to find the most cost-efficient way to connect every location without creating unnecessary cycles.

<br/>

<img src="https://img.shields.io/badge/Algorithm-Kruskal's%20Algorithm-00C9A7?style=for-the-badge" />
<img src="https://img.shields.io/badge/Language-C-00599C?style=for-the-badge&logo=c&logoColor=white" />
<img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-E34F26?style=for-the-badge&logo=html5&logoColor=white" />

</div>

---

##  The Big Idea

Imagine a network of cities waiting to be connected. Every possible cable route comes with a different installation cost.

The challenge? Connect every city while spending as little as possible.

That's where NetWeave steps in.

Using a greedy approach, it picks the cheapest available connection, checks whether it creates a cycle, and keeps building until every location is connected.

**Smart connections. Minimal costs. No unnecessary loops.**

---

##  What Makes NetWeave Interesting?

<table>
<tr>
<td width="50%">

###  Smart Edge Selection
Always considers the lowest-cost connection first.

</td>
<td width="50%">

### 🔗 Cycle Detection
Uses Union-Find to prevent unnecessary cycles.

</td>
</tr>
<tr>
<td width="50%">

###  Interactive Visualization
Follow the algorithm's decisions step by step.

</td>
<td width="50%">

###  Greedy Optimization
Builds a minimum spanning tree with efficient edge selection.

</td>
</tr>
</table>

---

##  How NetWeave Works

<div align="center">

```mermaid
flowchart TD
    A([Start]) --> B[Represent Network as a Weighted Graph]
    B --> C[Sort Edges by Increasing Cost]
    C --> D[Initialize Disjoint Sets]
    D --> E{More Edges to Check?}
    E -- Yes --> F[Pick Next Cheapest Edge]
    F --> G{Would It Create a Cycle?}
    G -- No --> H[Select Edge and Union Sets]
    G -- Yes --> I[Reject Edge]
    H --> J{Have V-1 Edges?}
    I --> J
    J -- No --> E
    J -- Yes --> K([Minimum Spanning Tree])
    E -- No --> L([No Spanning Tree Exists])
````

</div>

**The game plan:**

1. Sort all edges from lowest cost to highest.
2. Pick the cheapest available edge.
3. Check whether its endpoints are already connected.
4. If they aren't, add the edge and merge their sets.
5. If they are, skip it. Nobody needs another cycle.
6. Stop when the MST contains exactly `V - 1` edges.

---

##  Performance Check

<div align="center">

| ⏱️ Time Complexity | 💾 Space Complexity |
| :----------------: | :-----------------: |
|    `O(E log E)`    |      `O(V + E)`     |

</div>

Sorting dominates the time complexity. Union-Find keeps cycle detection efficient.

---

##  Built With

<div align="center">

<img src="https://skillicons.dev/icons?i=c,html,css,js" alt="Technology icons" />

</div>

---

##  Run It Locally

```bash
git clone https://github.com/YOUR-USERNAME/NetWeave.git
cd NetWeave
```

Open `index.html` in your browser to explore the visualization.

To run the C implementation:

```bash
gcc kruskal.c -o kruskal
./kruskal
```

Change the filename if your source file has a different name.

---

##  The Mission

NetWeave is a **Design and Analysis of Algorithms (DAA) project** demonstrating how a classic greedy algorithm can solve a real-world network optimization problem.

From edge selection to cycle detection, it makes the logic behind minimum spanning trees easier to see and understand.

<div align="center">

###  Weaving smarter connections, one edge at a time.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00C9A7,50:243B55,100:141E30&height=120&section=footer" width="100%" />

</div>

