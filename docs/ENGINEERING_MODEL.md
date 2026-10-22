# BattTwin — Engineering Model & Mathematical Specification

**Document ID:** DOC-MODEL-001  
**Project:** BattTwin — Reusable Digital Platform for Designing Battery Energy Systems  
**Specification:** `BattTwin_Final_Unified.md` | Case Study 2  
**Date:** October 2026  
**Status:** VALIDATED & TESTED  

---

## 1. Governing Mathematical & Physical Formulations

### 1.1 Electrical Sizing & Hierarchy Roll-Up

For a series-parallel topology with $N_s$ series groups and $N_p$ parallel cells per group:

1. **Module Nominal Voltage:**
   $$V_{nom,module} = N_s \times V_{nom,cell} = 4 \times 3.6\text{ V} = 14.4\text{ V} \quad \text{[Calculated]}$$

2. **Module Nominal Capacity:**
   $$Q_{nom,module} = N_p \times Q_{nom,cell} = 2 \times 4.2\text{ Ah} = 8.4\text{ Ah} \quad \text{[Calculated]}$$

3. **Module Nominal Energy:**
   $$E_{nom,module} = V_{nom,module} \times Q_{nom,module} = 14.4\text{ V} \times 8.4\text{ Ah} = 120.96\text{ Wh} \quad \text{[Calculated]}$$

4. **12S2P Pack Scale-Up Roll-Up ($M_s = 3$ modules in series):**
   $$V_{nom,pack} = M_s \times V_{nom,module} = 3 \times 14.4\text{ V} = 43.2\text{ V} \quad \text{[Calculated]}$$
   $$Q_{nom,pack} = Q_{nom,module} = 8.4\text{ Ah} \quad \text{[Calculated]}$$
   $$E_{nom,pack} = 43.2\text{ V} \times 8.4\text{ Ah} = 362.88\text{ Wh} \quad \text{[Calculated]}$$

---

### 1.2 Parallel Current Sharing & Joule Heat Imbalance

Within each parallel group (2P), cells share identical terminal voltage but split current inversely proportional to effective path resistance:

$$I_1 = I_{group} \cdot \frac{R_2 + R_{bus}}{R_1 + R_2 + 2R_{bus}}, \quad I_2 = I_{group} \cdot \frac{R_1 + R_{bus}}{R_1 + R_2 + 2R_{bus}}$$

Because Joule heating scales quadratically with current:
$$\dot{Q}_1 = I_1^2 R_1, \quad \dot{Q}_2 = I_2^2 R_2$$
$$\frac{\dot{Q}_1}{\dot{Q}_2} \approx \frac{R_2}{R_1}$$

**Physical Insight:** The lower-resistance cell carries more current and generates proportionally higher heat.

---

### 1.3 Arrhenius Resistance Feedback Kinetics

Internal charge-transfer resistance decreases exponentially with local cell temperature:

$$R(T) = R_{ref} \cdot \exp\left[ \frac{E_a}{k_B} \left(\frac{1}{T} - \frac{1}{T_{ref}}\right) \right]$$

- $T_{ref} = 298.15\text{ K}$ ($25^\circ\text{C}$)
- $E_a / k_B \approx 1850\text{ K}$ ($\sim 0.16\text{ eV}$)

**Positive Feedback Mechanism:** As a lower-resistance cell heats up, its resistance drops further, causing it to draw even more current from its parallel twin.

---

### 1.4 Lumped Capacitance Thermal Network & Phase Change Material (PCM)

The transient thermal response of each cell is governed by the energy balance:

$$C_{th} \frac{dT}{dt} = \dot{Q}_{gen} - \dot{Q}_{diss} - \dot{Q}_{pcm}$$

Where:
- $C_{th} = m_{cell} \cdot c_p = 0.070\text{ kg} \times 950\text{ J/(kg}\cdot\text{K)} = 66.5\text{ J/K}$ $\text{[Calculated]}$
- $\dot{Q}_{diss} = \frac{T - T_{amb}}{R_{th,ambient}}$
- For active cooling: $R_{th} \approx 2.8\text{ K/W}$
- For natural convection: $R_{th} = \max(5.0, 10.0 - 1.2 \cdot s_{spacing})\text{ K/W}$
- For baseline tight packing: $R_{th} \approx 11.5\text{ K/W}$

When a Phase Change Material (PCM) matrix is present, latent heat absorption activates when $T \ge T_{melt} - 0.5^\circ\text{C}$:
$$\dot{Q}_{pcm} = \begin{cases} 0.85 \cdot \dot{Q}_{net} & \text{if } Q_{melt} < m_{pcm} \cdot L_f \\ 0 & \text{if saturated} \end{cases}$$
- $L_f = 150\text{ J/g}$ (paraffin latent heat) $\text{[Assumption]}$
- $T_{melt} = 42.0^\circ\text{C}$ $\text{[Assumption]}$

---

### 1.5 Variation Sensitivity Index (VSI)

The margin-normalized sensitivity index for variation source $k$ is defined as:

$$VSI_k = \frac{|\Delta KPI_k|}{KPI_{limit} - KPI_{nominal}}$$

- $KPI_{limit} = 45.0^\circ\text{C}$ (charge mode) or $60.0^\circ\text{C}$ (discharge mode)
- $VSI = 1.0$ indicates that source $k$ alone consumes 100% of the available safety margin.

---

## 2. Component Catalogue & Parameter Provenance

| Component | Parameter | Nominal Value | Provenance | Source Document / Datasheet |
|---|---|---|---|---|
| **Cell** | Model | 21700-42G Cylindrical | `[Datasheet]` | Manufacturer Specification Sheet (LG/Molicel class) |
| | Nominal Capacity | 4.2 Ah | `[Datasheet]` | Tested at 0.2C rate, 25 °C |
| | Nominal Voltage | 3.6 V | `[Datasheet]` | OCV mid-point |
| | AC IR (1 kHz) | 12.0 mΩ | `[Datasheet]` | 25 °C nominal state of health |
| | Cell Mass | 70.0 g | `[Datasheet]` | Calibrated electronic scale balance |
| | Specific Heat ($c_p$) | 950 J/(kg·K) | `[Assumption]` | Literature benchmark for 21700 cylindrical cells |
| | Voltage Window | [2.5 V, 4.2 V] | `[Datasheet]` | Absolute safety cutoff thresholds |
| | Max Charge Temp | 45.0 °C | `[Datasheet]` | Plating inhibition ceiling |
| | Max Discharge Temp | 60.0 °C | `[Datasheet]` | Thermal runaway risk threshold |
| | Veto Safety Margin | 5.0 °C | `[Target]` | Platform engineering margin (target $\le 40^\circ\text{C}$) |
| **Busbar** | Nickel Strip | 0.3 mm × 8.0 mm | `[Datasheet]` | $R = 0.85\text{ m}\Omega$ per interconnect |
| | Copper Strip | 0.3 mm × 8.0 mm | `[Datasheet]` | $R = 0.25\text{ m}\Omega$ per interconnect |
| **PCM** | Paraffin Matrix | $T_m = 42.0^\circ\text{C}$, $150\text{ J/g}$ | `[Assumption]` | Rubitherm RT42 / PCM composite |
| **AFE IC** | TI bq76920 | 5-Series Analog Front End | `[Datasheet]` | Texas Instruments bq76920 Technical Reference |
| **Balancing** | Passive Shunt | 82 Ω ($I_{bal} \approx 50\text{ mA}$) | `[Calculated]` | Dissipates $\sim 0.205\text{ W}$ per series group |

---

## 3. Requirements Traceability Matrix (RTM)

| Req ID | Description | Threshold / Constraint | Provenance | Enforcing Code Symbol | Verification Test |
|---|---|---|---|---|---|
| **REQ-001** | Nominal Energy | $E_{nom} \ge 115.0\text{ Wh}$ | `[Target]` | `runL0Screening`, `runL2Simulation` | `physics_and_rollup.test.ts` |
| **REQ-002** | Voltage Range | Cell: $[2.5\text{ V}, 4.2\text{ V}]$, Mod: $[10.0\text{ V}, 16.8\text{ V}]$ | `[Datasheet]` | `getOpenCircuitVoltage`, `CellState` | `physics_and_rollup.test.ts` |
| **REQ-003** | Thermal Invariants | Charge $\le 45^\circ\text{C}$, Disch $\le 60^\circ\text{C}$, Spread $\le 5^\circ\text{C}$ | `[Datasheet / Target]` | `evaluateSafetyVeto`, `detectCrossDomainConflicts` | `governance_and_veto.test.ts` |
| **REQ-004** | Fast Charging | $10\% \to 80\%$ SoC in $\le 45\text{ min}$ at $1\text{C}$ | `[Target]` | `runL2Simulation` | `physics_and_rollup.test.ts` |
| **REQ-005** | Module Mass | Total mass $\le 806\text{ g}$ ($\ge 150\text{ Wh/kg}$) | `[Target]` | `SummaryKPIs.total_mass_g` | `physics_and_rollup.test.ts` |
| **REQ-006** | BMS Protection | Hardware OV, UV, OC, OT trip detection | `[Target]` | `FmeaPanel`, `computePackRollup` | `commit_and_compliance.test.ts` |
| **REQ-007** | Cell Balancing | Delta $V \le 10\text{ mV}$ within cycle window | `[Target]` | `SummaryKPIs.balancing_time_hours` | `physics_and_rollup.test.ts` |
| **REQ-008** | SoC Accuracy | Estimation error $\le 5\%$ over drive cycle | `[Target]` | `TimeSeriesPoint.soc_pct` | `physics_and_rollup.test.ts` |
| **REQ-009** | Fault Reaction | Protection reaction time $\le \text{FTTI}$ ($100\text{ ms}$) | `[Target]` | `fmeaEngine.ts` | `commit_and_compliance.test.ts` |
| **REQ-010** | Thermal Violation | Probability of violation $\le 5.0\%$ | `[Target]` | `SummaryKPIs.probability_limit_violation_pct` | `physics_and_rollup.test.ts` |
| **REQ-011** | Compliance-as-Code | IEC 62133-2, AIS-156 Amd 3, IEC 62619, UN 38.3 | `[Target]` | `FullSimulationOutput.compliance_summary` | `commit_and_compliance.test.ts` |
