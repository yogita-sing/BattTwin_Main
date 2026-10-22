# BattTwin — Safety Governance, Invariants & Compliance-as-Code

**Document ID:** DOC-SAFE-001  
**Project:** BattTwin — Reusable Digital Platform for Designing Battery Energy Systems  
**Specification:** `BattTwin_Final_Unified.md` | Case Study 2  
**Date:** October 2026  
**Status:** ENFORCED & VERIFIED  

---

## 1. Safety Veto Architecture: The Inviolable Feasibility Barrier

In conventional battery sizing software, safety limits are often treated as penalty functions in numerical optimization, allowing an algorithm to propose an unsafe design if performance gains are sufficiently large. 

**BattTwin rejects this paradigm.** The **Safety Veto Engine** (`src/services/governanceEngine.ts`) acts as an absolute feasibility barrier:
- A design that breaches an immutable invariant is immediately vetoed.
- A vetoed design **cannot be committed to the audit trail**.
- The explainer provides plain-language causal analysis, the exact governing equation, and calculated counterfactual adjustments.

```
                  ┌───────────────────────────────┐
                  │    Proposed Design State      │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │  Deterministic Safety Veto    │
                  │  - Charge Temp ≤ 45.0 °C      │
                  │  - Discharge Temp ≤ 60.0 °C   │
                  │  - Cell Volt ∈ [2.5 V, 4.2 V] │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           [Violated]                        [Passed]
                 │                               │
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │   SAFETY VETO TRIGGERED      │ │   COMPLIANCE ASSERTIONS      │
  │   - Block commit             │ │   - IEC 62133-2 / AIS-156    │
  │   - Display governing formula│ │   - Calculate Pareto/TOPSIS  │
  │   - Generate counterfactuals │ │   - SHA-256 Chained Commit   │
  └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Immutable Invariants Catalog

| Invariant ID | Physical Parameter | Immutable Ceiling | Operating Mode | Physical Risk / Failure Mode |
|---|---|---|---|---|
| **INV-001** | Peak Cell Charge Temperature | $\le 45.0^\circ\text{C}$ | Charge | Metallic lithium plating on anode, dendrite formation, separator piercing. |
| **INV-002** | Peak Cell Discharge Temperature | $\le 60.0^\circ\text{C}$ | Discharge | SEI layer decomposition, accelerated electrolyte gassing, thermal runaway risk. |
| **INV-003** | Individual Cell Voltage Ceiling | $\le 4.20\text{ V}$ ($+0.05\text{ V}$ margin) | Charge / Rest | Cathode transition metal dissolution, electrolyte oxidation. |
| **INV-004** | Individual Cell Voltage Floor | $\ge 2.50\text{ V}$ | Discharge | Copper current collector dissolution, permanent internal micro-shorts. |
| **INV-005** | Maximum Continuous Current | $\le 2.0\text{C}$ ($16.8\text{ A}$ module) | Discharge | Excessive busbar Joule heating and localized thermal hot spots. |

---

## 3. Cross-Domain Conflict Detector

Mistakes often reside *between* disciplines (e.g., requirement engineers vs thermal architects vs firmware programmers). The **Cross-Domain Conflict Detector** (`src/services/conflictEngine.ts`) audits interfaces across 5 demonstrated failure modes:

### Conflict 1: Requirement vs Physics (CONF-001)
- **Manifestation:** User sets "Charge at 45 °C ambient".
- **Physical Root Cause:** The cell manufacturer limits charging to 45 °C. Even with zero Joule heating, the cell is already at its safety limit.
- **Resolution:** Lower ambient design point to $\le 35^\circ\text{C}$, enable temperature-aware charge derating, or enforce pre-cooling.

### Conflict 2: Material vs Environment (CONF-002)
- **Manifestation:** Ambient temperature $\ge$ PCM Melting Point ($42.0^\circ\text{C}$).
- **Physical Root Cause:** The PCM is completely liquid during standby, exhausting its latent heat buffer ($150\text{ J/g}$) before current flows.
- **Resolution:** Select a higher melt point PCM or lower ambient thermal envelope.

### Conflict 3: IC Monitoring Limits vs Topology (CONF-003)
- **Manifestation:** Scaled 12S2P light-EV pack paired with 5-series AFE (TI bq76920).
- **Physical Root Cause:** A single 5-series AFE cannot span 12 series groups.
- **Resolution:** Deploy distributed BMS architecture: 3x module slave AFEs + 1x central pack master.

### Conflict 4: Heat Source vs Thermal Budget (CONF-004)
- **Manifestation:** Passive balancing resistors ($82\ \Omega$, $0.205\text{ W}$ heat per group) in an unventilated baseline module.
- **Physical Root Cause:** Continuous dissipation in a 1 mm gap raises local cell temperatures by $1.5\text{--}3.0^\circ\text{C}$.
- **Resolution:** Increase cell spacing to $\ge 3\text{ mm}$, relocate balancing shunts to external heatsink, or lower balance current.

### Conflict 5: Cell-to-Cell Temperature Spread (CONF-005)
- **Manifestation:** Maximum $\Delta T$ across cells exceeds $5.0^\circ\text{C}$.
- **Physical Root Cause:** Breaches Indian Light-EV Standard AIS-156 Amendment 3 Annex 8. Promotes accelerated SoH divergence.
- **Resolution:** Integrate thermal gap pads, upgrade to PCM matrix, or balance airflow.

---

## 4. Compliance-as-Code Assertions

| Standard | Clause | Assertion Type | Implementation Rule | Verdict Logic |
|---|---|---|---|---|
| **IEC 62133-2** | Cl. 7.3.8 | Charge Thermal Inhibit | `T_charge_max <= 45.0 C` | Blocks charging if cell $T \ge 45^\circ\text{C}$ |
| **AIS-156 Amd 3** | Annex 8 | Temperature Homogeneity | `(T_max - T_min) <= 5.0 C` | Warns if cell-to-cell spread $> 5.0^\circ\text{C}$ |
| **IEC 62619** | Cl. 8.2.4 | Protection Timing (FTTI) | `t_reaction <= 100 ms` | Hardware comparator disconnects FET in $< 100\text{ ms}$ |
| **UN 38.3** | T.1 – T.5 | Voltage Stability Window | `V_cell in [2.5 V, 4.25 V]` | Enforces hardware cut-off window |
| **ISO 26262** | Part 5 | Diagnostic Coverage | `DC_ov >= 99%` | Redundant primary/secondary voltage sensing |

---

## 5. Counterfactual Physical Resolution Engine

When a veto occurs, the platform executes a bounded parameter search across the underlying physical model to return the **smallest passing change**:

```
For a 45 °C charging violation:
  1. Ambient: ΔT_amb = Target(40 °C) - PeakTemp → Recommend Tamb ≤ 35.0 °C
  2. C-Rate:  P = I²R → Derate C-rate to 0.70C (-51% Joule heating)
  3. Control: Enable firmware derating map above 40 °C
  4. Passive: Upgrade baseline tight holder to PCM matrix (120 g latent buffer)
```
Each counterfactual can be reviewed in Student Mode or auto-applied directly into the live design simulation.
