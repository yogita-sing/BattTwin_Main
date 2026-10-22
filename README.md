# BattTwin: Digital Battery Twin Platform

> **A High-Performance Digital Platform for Designing, Testing, Comparing, and Learning Battery Energy Systems**
> Integrated Cell-to-System Multi-Physics Simulation, Deterministic Safety Veto, Cross-Domain Conflict Detection, and Interactive 3D/2D Visualizations — built as a pure, responsive React application.

---

## 🚀 Key Features

1. **Deterministic Safety Veto Gate:**
   - Evaluates immutable safety limits from manufacturer datasheets (e.g., $T_{\text{charge}} \le 45^\circ\text{C}$, $V \in [2.5, 4.2]\text{V}$).
   - Generates plain-English explanations with physics-based **Counterfactual Fixes** (smallest parameter change that makes the design pass).

2. **Cross-Domain Conflict Detector:**
   - Automatically catches contradictions that sit *between* engineering disciplines:
     - **Requirement vs Physics:** Charging ambient 45 °C vs cell limit 45 °C (zero margin).
     - **Material vs Environment:** PCM melt point below ambient temperature (already liquid at start).
     - **IC Limit vs Topology:** 5-Series AFE on a 12-Series scaled pack (flags distributed BMS requirement).
     - **Heat vs Budget:** Passive balancing resistor heat dissipation in unventilated enclosures.
     - **Cell Spread:** Temperature spread exceeding the 5 °C target (AIS-156 standard).

3. **Variation Sensitivity Index (VSI):**
   - Margin-normalized sensitivity ranking: $VSI_k = |\Delta KPI_k| / (KPI_{\text{limit}} - KPI_{\text{nominal}})$.
   - Interactive Tornado chart showing how much safety margin is consumed by spot weld resistance, cell resistance spread, position, and ambient swings.

4. **Interactive 3D & 2D Visualizer:**
   - **3D 4S2P Exploded View:** Real-time Three.js renderer with dynamic cell surface thermal heatmaps (Cyan $\to$ Green $\to$ Amber $\to$ Red), draggable exploded view slider, busbars, and translucent PCM matrix.
   - **2D Circuit Ladder:** Live parallel current split ($I_1 = I_{\text{tot}} \frac{R_2}{R_1+R_2}$), Arrhenius resistance feedback ($R(T)$), and balancing bleeding resistors (82 $\Omega$).

5. **Pedagogical Dual-Mode UI:**
   - **Student Mode (Discovery Lab):** 4 Guided interactive challenges (Indian Summer Trap, Parallel Mismatch Paradox, PCM Meltdown, Slow Balancing) with live formula cards and "What-If" fix sliders.
   - **Engineer Mode (Design Studio):** Multi-objective trade-offs (Baseline vs Option A vs Option B vs Option C), TOPSIS ranking with adjustable user priorities, compliance checklists (IEC 62133-2, AIS-156, IEC 62619, UN 38.3), and SHA-256 hash-chained design commits with downloadable signed evidence dossiers.

6. **Client-Side Physics & Hash Chaining Engine:**
   - Zero-latency multi-physics simulation running directly in TypeScript.
   - Real-time Arrhenius electro-thermal coupled equations, Phase Change Material latent heat buffering, and Coulomb counting.
   - Cryptographic SHA-256 commit chain tracking design evolution with certified Markdown dossier export.

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Build production bundle
npm run build
```