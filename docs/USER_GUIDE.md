# BattTwin — User Guide & Workflow Walkthrough

**Document ID:** DOC-GUIDE-001  
**Project:** BattTwin — Reusable Digital Platform for Designing Battery Energy Systems  
**Specification:** `BattTwin_Final_Unified.md` | Case Study 2  
**Target Audience:** Battery Systems Engineers, Thermal Architects, Compliance Engineers, Educators & Students  
**Date:** October 2026  

---

## 1. Application Overview & Navigation

BattTwin offers a unified, dual-experience web interface designed to teach core battery electro-thermal physics and support rigorous production-grade pack design.

### 1.1 Header Controls & Global State
- **Problem & Prototype vs Interactive Studio Switcher:** Located on the left side of the header. Allows instant toggling between the executive problem-statement landing page and the live simulation workbench.
- **Role Switcher (Student Mode vs Engineer Mode):** Located in the center-right of the header:
  - **Student Mode:** Educational journey with guided physics challenges, plain-language causal explanations, governing equations, and auto-apply counterfactual fix buttons.
  - **Engineer Mode:** Professional systems workbench featuring multi-objective trade-offs, non-dominated Pareto frontier, VSI margin consumption ranking, cross-domain conflict auditor, interactive FMEA matrix, assumption registry, and empirical bench calibration.
- **Safety Veto Status Badge:** Displays green `[VERIFIED COMPLIANT]` or animated red `[SAFETY VETO: REQ-003 VIOLATED]`.
- **SHA-256 Commit Identity:** Shows the current 8-character commit hash prefix.

---

## 2. Core Workflows Walkthrough

### Workflow 1: Triggering the Showcase 45 °C Charging Veto (Section 2.3)
1. In the **Simulation Workbench**, locate the **Parameter Controls** strip.
2. Set **Ambient Temperature** to `45.0 °C` (Indian summer ambient design point).
3. Set **Operation Mode** to `Charge` at `1.0C`.
4. Click **Run Multi-Domain Simulation**.
5. **Immediate Result:**
   - The top banner flashes red: **SAFETY VETO TRIGGERED: REQ-003 Peak Cell Charge Temperature Exceeded**.
   - The 3D canvas and 2D ladder visualize overheated red cell states ($T \ge 45^\circ\text{C}$).
   - In **Student Mode**, the Causal Explainer explains:
     > *"Charging ambient is set to 45 °C, while the cell manufacturer datasheet limits charging to 45 °C. Even with zero Joule heating, the cell is already at the limit. This is a requirements conflict, not a cooling problem."*
   - Review the **Counterfactual Physical Solutions**:
     - *Solution 1:* Lower ambient design point to $\le 35.0^\circ\text{C}$ (leaves room for self-heating).
     - *Solution 2:* Derate charge current to $0.70\text{C}$ (reduces heat by ~51%).
     - *Solution 3:* Enable firmware temperature-aware charge derating.
     - *Solution 4:* Upgrade thermal management to PCM matrix.
   - Click **Auto-Apply Fix** to instantly adjust the slider and resolve the veto.

---

### Workflow 2: Ranking Variations with the Variation Sensitivity Index (VSI)
1. Switch to **Engineer Mode** in the header.
2. Click the **VSI Tornado Ranking** tab.
3. Observe the sorted list of variation sources:
   - **Spot Weld Resistance (+10 mΩ):** Consumes up to $60\text{--}80\%$ of remaining thermal margin.
   - **Cell Resistance Spread (±15%):** Induces parallel current imbalance ($I_1 / I_2 = R_2 / R_1$).
   - **Ambient Temperature Swing (+5 °C):** Shifts baseline reservoir.
   - **Airflow Restriction / Position Shadow (Inner S2/S3):** Traps localized heat.
4. **Engineering Action:** The tornado chart identifies exactly where engineering budget should be spent: improving weld quality and cell binning yields higher safety margin recovery than adding heavy active cooling.

---

### Workflow 3: Multi-Objective Trade-Offs & TOPSIS Decision Analysis
1. In **Engineer Mode**, select the **Options & TOPSIS** tab.
2. Compare the four module architectural variants:
   - **Baseline:** 1 mm cell spacing, nickel busbars, unventilated ($14.4\text{ V}$, $120.96\text{ Wh}$, lowest mass, highest peak temperature).
   - **Option A (Natural Convection):** 3 mm cell spacing, natural convection pathways, reduced temperature spread.
   - **Option B (PCM Matrix):** Paraffin matrix ($150\text{ J/g}$, $T_m = 42^\circ\text{C}$), copper busbars ($R = 0.25\text{ m}\Omega$), clamped peak temperature during CC-CV charging.
   - **Option C (Active Cooling):** Integrated 12 CFM blower, lowest peak temperature, highest mass and parasitic power.
3. Review the **TOPSIS Ranking Score** (0–100), balancing usable energy, temperature margin, mass, and BOM cost.

---

### Workflow 4: Exploring the Non-Dominated Pareto Frontier
1. Click the **Pareto Frontier** tab.
2. Inspect the scatter visualization of **Usable Energy (Wh)** vs **Peak Temperature (°C)**.
3. Golden-bordered cards denote **Pareto-Optimal Candidates** where no single metric can be improved without degrading another.
4. Click **Apply Candidate Configuration** on any candidate to automatically reconfigure the physics workbench.

---

### Workflow 5: Cell-to-System Scale-Up (4S2P Module → 12S2P Light-EV Pack)
1. In the main workbench, locate the **Hierarchy Switcher** above the visualizer.
2. Toggle from **4S2P Auxiliary Module** to **12S2P Light-EV Pack**.
3. Observe the parametric roll-up:
   - **Voltage:** $14.4\text{ V} \to 43.2\text{ V}$ ($3\times$ series modules).
   - **Nominal Capacity:** Maintains $8.4\text{ Ah}$ across series string.
   - **Nominal Energy:** Scales from $120.96\text{ Wh} \to 362.88\text{ Wh}$.
   - **Pack Protection Chain:** Pre-charge relay, pyrofuse (100 A), dual bidirectional solid-state contactors, isolation monitoring.
   - **BMS Architecture Note:** Flags requirement for distributed slave-master BMS (3x module slave AFEs + 1x central pack master) because single 5-series AFEs cannot span 12S.

---

### Workflow 6: Visualizing 3D Exploded View vs 2D Circuit Ladder
1. Use the tab toggle above the canvas to switch between:
   - **3D Exploded View:** WebGL rendering powered by Three.js. Hover or click individual cells to inspect real-time voltage, current, resistance, and temperature. Toggle the exploded view slider to separate cells from the busbar carrier frame.
   - **2D Circuit Ladder:** Scalable SVG schematic displaying electrical ladder rungs, series connections, parallel branches, and dynamic current split indicators.

---

### Workflow 7: Assumption Registry & Stale Invalidation
1. In **Engineer Mode**, select the **Assumption Registry** tab.
2. Review all engineering assumptions categorized by source (`[Datasheet]`, `[Calculated]`, `[Assumption]`, `[Target]`).
3. Click **Edit Range** or modify an assumption (e.g. PCM latent heat capacity or cell specific heat).
4. Observe the **Stale Model Invalidation Alert Banner** at the top of the interface: downstream thermal and electrical models are flagged as stale, preventing outdated results from being cited.

---

### Workflow 8: Empirical Bench Calibration
1. Select the **Bench Validation** tab in **Engineer Mode**.
2. Compare the simulated L1/L2 thermal and voltage curves against published open cycling data (NASA Ames PCoE 18650 & Oxford Battery degradation curves).
3. Inspect the calibration metrics:
   - **Voltage RMSE:** $\approx 0.042\text{ V}$ (MAPE: $0.78\%$).
   - **Temperature RMSE:** $\approx 0.48^\circ\text{C}$ (MAPE: $1.34\%$).
   - **Concordance Status:** Verified concordant.

---

### Workflow 9: Exporting the Certified Engineering Evidence Dossier
1. Ensure the current design state satisfies all safety invariants.
2. Click the **Export Signed Evidence File** button in the Engineer top bar.
3. The platform compiles a downloadable Markdown dossier (`BattTwin_Evidence_Commit_<hash>.md`):
   - Cryptographic SHA-256 commit hash and parent hash.
   - Safety status and compliance assertion matrix.
   - Full summary KPIs (Energy, Peak Temp, Spread, Mass, Cost, Violation Probability).
   - Ranked VSI table.
   - Complete Bill of Materials (BOM).
