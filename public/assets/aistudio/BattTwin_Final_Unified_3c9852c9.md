# BattTwin: A Reusable Digital Platform for Designing Battery Energy Systems

**Idea and Architecture Submission | Case Study 2 | Cell-to-System Design, Trade-off and Compliance Platform**

> **Evidence labels used throughout**
> **[Datasheet]** value taken from a manufacturer datasheet (verify before use) | **[Calculated]** derived here from stated inputs | **[Assumption]** engineering assumption, stored in the Assumption Registry | **[Target]** requirement we set ourselves | **[Estimate]** order-of-magnitude screening value, to be replaced by platform results

---

## 1. The Idea in One Page

**The problem.** Battery design is a coupled problem. Raising charge speed raises heat, heat shortens life and threatens safety, and the fixes (spacing, cooling, thicker busbars) add mass, size and cost. The knowledge sits in separate silos: cell datasheets, circuit models, thermal tools, BMS firmware and standards documents. Nobody sees the whole chain at once.

**The idea.** BattTwin explains why a battery design fails and how to fix it by physics: a deterministic **Safety Veto** with counterfactual fixes, a **cross-domain conflict detector**, and a **Variation Sensitivity Index (VSI)** that ranks which cell-to-cell spread consumes the most safety margin. Version-controlled history makes every finding reproducible. BattTwin treats a battery design like **version-controlled engineering software**:

- Every design is a **branch**, every accepted change is a **commit**, and every commit carries its requirements, assumptions, model results and evidence.
- A deterministic **Safety Veto** blocks any commit that breaks a safety limit, and explains why in plain engineering terms with a counterfactual fix ("reduce charge current to 0.7C, or switch to a PCM matrix with melt point above ambient").
- One **Unified Design Graph (UDG)** holds the whole system across four levels, **Cell → Module → Pack → System**, and links electrical, thermal, mechanical, sensing, protection, control and energy-management models through typed interfaces.
- **Cell-to-cell variation and ageing** are propagated explicitly through the chain: spread → parallel current imbalance → hot spots → ageing divergence → pack-level energy loss and risk.

**What the user gets.** In minutes, an engineer or student can configure a design, see the trade-offs across energy, temperature, charging time, safety, size and cost, find interface conflicts early, and receive a recommended design with its risks, limitations and a complete evidence trail.

**Hackathon scope (manageable by design).** A 4S2P lithium-ion module (14.4 V nominal, 120.96 Wh [Calculated]), analysed fully at module level, with the pack and system levels analysed through fast parametric roll-up. The same architecture scales without redesign.

---

## 2. Problem Understanding and Application Framing

### 2.1 What makes the challenge hard

| Challenge in the brief | How it appears in practice | BattTwin response |
|---|---|---|
| Data spread across disciplines | Cell data in datasheets, circuits in one tool, heat in another, rules in spreadsheets | One graph (UDG) with typed, unit-checked interfaces |
| Energy vs temperature vs charge time vs safety vs size vs cost | Improving one worsens another | Multi-objective comparison with hard safety constraints |
| Cell variation and ageing propagate unpredictably | A small resistance or capacity spread makes one cell work harder, run hotter and age faster | Explicit variation-propagation loop (Section 7) |
| Limited data, software and compute | No test lab, no licences | Datasheet-first, open-source, offline-capable, parameter fitting from user data |
| Full pack too large for a short hackathon | Hundreds of cells | Module-level depth with Cell → System roll-up |

### 2.2 Application and operating conditions

- **Application (primary):** 14.4 V nominal auxiliary and backup power module for light electric mobility and small stationary backup (UPS, telecom, e-2W auxiliary loads).
- **Scale-up path (shown through roll-up):** three 4S2P modules in series form a 12S2P pack (43.2 V, 8.4 Ah, 362.9 Wh [Calculated]) for light e-mobility.
- **Operating envelope [Target / Assumption]:**
  - Discharge and standby ambient: up to 45 °C (Indian summer conditions).
  - Charging ambient: design point 35 °C; charging is derated above 40 °C cell temperature and inhibited above the cell charge limit (see 2.3).
  - Charge rate up to 1C, discharge up to 2C continuous.

### 2.3 A showcase conflict the platform catches on day one

The cell datasheet limits **charging to a cell temperature of 45 °C** [Datasheet, verify]. If a user sets "charge at 45 °C ambient", then even with zero self-heating the cell is already at the limit. BattTwin flags this as a **requirement-versus-physics conflict**, not a cooling problem, and offers resolutions:

1. Lower the charging ambient design point (for example 35 °C).
2. Add a temperature-aware charge derating and inhibit rule.
3. Add pre-cooling before charging (active option).

This is exactly the kind of "interface conflict and incompatible assumption" the brief asks the platform to surface.

---

## 3. Users, Desirability and Value

| User | Need | What BattTwin gives them |
|---|---|---|
| Student / junior engineer | Understand why trade-offs happen | **Student Mode:** every veto shows the equation, the contour or chart, the limit and the counterfactual fix |
| Battery pack engineer | Compare options quickly, avoid late surprises | **Engineer Mode:** what-if branches, Pareto comparison, conflict list, evidence file |
| Safety / compliance engineer | Show requirements were checked | Rule pack results and traceable evidence per commit |
| Educators / labs with no licences | Teach battery design without costly software | Open-source, offline-capable, datasheet-driven |

**Value hypotheses [Assumption, to validate with users]:** fewer late design changes, earlier detection of safety conflicts, faster comparison of design options, and reusable evidence for reviews.

---

## 4. System Architecture

### 4.1 Layered view

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. EXPERIENCE LAYER                                                       │
│    Requirements form | 3D exploded view | Trade-off dashboard             │
│    Veto and conflict panel | Student Mode explainer | Evidence export     │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. WORKFLOW AND ORCHESTRATION LAYER                                       │
│    Phase-gated state machine: Requirements → Configure → Select →         │
│    Analyse → Comply → Veto Gate → Compare → Commit                        │
│    Change-impact router (re-runs only what a change invalidates)          │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. GOVERNANCE LAYER (cannot be bypassed)                                  │
│    Compliance-as-Code rule engine | Safety Veto | Conflict detector       │
│    Assumption Registry | FMEA generator | Counterfactual explainer        │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. MULTI-DOMAIN MODEL LAYER (adjustable fidelity)                         │
│    Electrical | Thermal | Mechanical | Sensing | Protection |             │
│    Control and Energy Management | Variation and Ageing                   │
│    Co-simulation bus with unit-checked parameter exchange                 │
├──────────────────────────────────────────────────────────────────────────┤
│ 5. UNIFIED DESIGN GRAPH (single source of truth)                          │
│    Cell → Module → Pack → System | Requirements | Components | Models |   │
│    Results | Standards | Evidence | Versioned, hash-chained commits       │
├──────────────────────────────────────────────────────────────────────────┤
│ 6. KNOWLEDGE BASES                                                        │
│    Cell and component catalogue | Rule packs | Material and PCM data      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 End-to-end data flow

1. The user defines the application, requirements and operating conditions.
2. The Topology Synthesiser creates the Cell → Module → Pack → System structure and component choices.
3. The change-impact router decides which models must re-run (a cosmetic edit skips them, a cell or insulation change forces full re-analysis).
4. Models exchange parameters through the co-simulation bus (units and ranges checked on every exchange).
5. The Compliance engine evaluates rules on the results, and the Conflict detector scans interfaces and assumptions.
6. The **Safety Veto** blocks any state that breaks a hard limit; the explainer returns the cause and a counterfactual.
7. Passing designs enter the Pareto comparison, then are committed with their evidence.

### 4.3 Design principles

- **Deterministic and explainable:** every verdict is reproducible and traceable to an equation, a limit and a source.
- **Single writer:** only the commit gate writes to the UDG, so results cannot silently drift.
- **Fidelity matches maturity:** fast screening early, deeper models only when a decision needs them.
- **Honest uncertainty:** results carry confidence, and limits of validity are stated, not hidden.

---

## 5. Gap Closure 1: Explicit Cell → Module → Pack → System Hierarchy

The UDG ontology is extended with four **levels**, so "cell to system" is explicit even though depth of analysis starts at the module.

### 5.1 Ontology

| Level | Node types | Key attributes | Edges to other levels |
|---|---|---|---|
| **Cell** | Cell_Model, Cell_Instance | Capacity, internal resistance, voltage limits, temperature limits, mass, geometry, ageing parameters | `member_of` → Module |
| **Module** | Module, Busbar, Holder, Cooling_Element, Sensor_Set, AFE_BMS_Slave | S/P topology, spacing, busbar section, PCM or plate, sensor locations | `member_of` → Pack |
| **Pack** | Pack, Enclosure, Contactor_Fuse_Set, BMS_Master, Isolation_Monitor | Series/parallel module arrangement, protection chain, ingress and isolation features, pack thermal path | `member_of` → System |
| **System** | System, Charger, Load_Profile, Thermal_Environment, EMS_Controller | Duty cycle, ambient profile, charging rules, power limits, application requirements | `interfaces_with` → Pack |

Cross-cutting nodes (Requirement, Standard_Clause, Assumption, Model_Run, Evidence) attach at **any** level through `applies_to`, `satisfies`, `violates` and `evidenced_by` edges.

### 5.2 Roll-up rules (how a cell change reaches system KPIs)

| Quantity | Cell → Module | Module → Pack | Pack → System |
|---|---|---|---|
| Voltage | V_module = S × V_cell | V_pack = M_s × V_module | Compared with charger and load window |
| Capacity | Q_group = P × Q_cell; **Q_module = min over series groups** | Q_pack = M_p × Q_string; weakest string governs | Usable energy after reserve and derating |
| Resistance | R_module = S × (R_cell ÷ P) + R_interconnect | Sum in series, parallel combination for strings | Voltage sag and power limit at the load |
| Heat | Q_cell = I²R + entropic term | Sum of modules plus busbar, fuse and contactor heat | Pack thermal path to environment |
| Mass and volume | Cells + holders + busbars + thermal elements | + enclosure, contactors, wiring | + charger and mounting if in scope |
| Cost | Cell BOM | Module BOM + assembly | System BOM |

### 5.3 Worked scale-up (module → pack) [Calculated]

- Module: 4S2P → 14.4 V, 8.4 Ah, **120.96 Wh**.
- Pack: 3 modules in series → 12S2P → 43.2 V, 8.4 Ah, **362.9 Wh**.
- The roll-up immediately raises a **hierarchy conflict**: a single 5-series-cell AFE (such as the bq76920 class [Datasheet]) cannot monitor 12 series cells, so the platform proposes a **distributed BMS**: one AFE per module (valid at 4S) plus a pack master. This is a design decision the hierarchy makes visible.

### 5.4 Depth of analysis per level (honest scoping)

| Level | Hackathon depth | Later depth |
|---|---|---|
| Cell | Datasheet model, thermal and ageing parameters | Fitted from user data |
| Module | **Full analysis** (electrical, thermal, control, variation) | Higher-fidelity 3D thermal |
| Pack | Parametric roll-up, protection chain and conflict checks | Coupled pack-level thermal and propagation screening |
| System | Duty-cycle and ambient scenarios, charger and EMS rules | Fleet data and digital-twin feedback |

---

## 6. Gap Closure 2: Control and Energy Management (BMS / EMS) Block

Control is a first-class domain in the model layer, with its own functions, interface contracts and metrics, and it runs **in the loop** with the physical models.

### 6.1 Functional blocks

| Block | Function | Inputs | Outputs |
|---|---|---|---|
| **Measurement chain** | Cell voltage, pack current, temperature sensing with stated accuracy | True states + sensor error model | Measured V, I, T (with noise, offset, drift) |
| **State of Charge (SoC)** | Coulomb counting with open-circuit-voltage correction at rest; upgrade path to Kalman filtering | Measured I, V, T | SoC estimate and uncertainty |
| **State of Health (SoH)** | Tracks capacity and resistance fade from charge/discharge events | SoC history, V, I | Capacity SoH, resistance SoH, remaining-life estimate |
| **Cell balancing** | Passive (resistor) balancing with threshold and time limits | Per-group voltage, SoC | Balance on/off per group, heat from balancing resistors |
| **Charge-profile controller** | CC-CV profile with **temperature- and SoH-aware current derating map** | SoC, T, SoH, limits | Charge current command |
| **Protection state machine** | Over/under-voltage, discharge over-current, short-circuit, over/under-temperature with thresholds and delays; hardware (AFE) layer and firmware layer | Measured V, I, T | Contactor/FET state, fault flags |
| **Thermal controller** | Passive (PCM) or active (fan or pump hysteresis control) | Measured T | Cooling command |
| **EMS / power-limit manager** | Computes **state of power** and sends current and power limits to charger and load; supports simple dispatch rules (priority loads, reserve SoC, peak shaving for backup use) | SoC, SoH, T, load request | Allowed charge/discharge power, derate and warning flags |

### 6.2 Interface contracts (what the co-simulation bus enforces)

| Signal | From → To | Unit | Rate | Check on every exchange |
|---|---|---|---|---|
| Cell voltage, current, temperature (true) | Physics → Sensor model | V, A, °C | 1–10 Hz | Within physical range |
| Measured V, I, T | Sensor model → BMS | V, A, °C | 1–10 Hz | Accuracy class and latency declared |
| SoC, SoH, SoP | BMS → EMS | %, %, W | 1 Hz | SoC in [0, 100], uncertainty attached |
| Charge/discharge current limit | EMS → Charger / Load model | A | 1 Hz | ≤ min(cell limit, thermal limit, protection limit) |
| Balance command, heat | BMS → Thermal model | on/off, W | 1 Hz | Heat added to the correct cell location |
| Protection trip | BMS/AFE → Electrical model | state | Event | Reaction time ≤ allowed fault-tolerant time interval [Target] |
| Cooling command | Thermal controller → Thermal model | on/off, W | 0.1–1 Hz | Parasitic power counted in energy KPI |

### 6.3 Worked control example: passive balancing is slow [Calculated]

- Series group capacity: 2P × 4.2 Ah = 8.4 Ah. A 2 % capacity mismatch between groups is 0.168 Ah.
- Typical passive balancing: 4.1 V across an 82 Ω resistor gives about 50 mA [Assumption, verify against the AFE datasheet].
- Balancing time = 0.168 Ah ÷ 0.05 A ≈ **3.4 hours**. Heat in the resistor = 4.1 V × 0.05 A ≈ **0.2 W** per group, which the thermal model must receive.
- **Design insight the platform surfaces:** balancing is too slow to rescue poorly matched cells, so cell matching and charge strategy matter more than the balancing circuit. The platform tests this by simulation, not opinion.

### 6.4 Control metrics added to the KPI set

SoC estimation error, time to balance, balancing heat, protection reaction time versus allowed time, charge-time penalty from derating, parasitic cooling power, and usable energy after reserve and derating.

### 6.5 Control-in-the-loop simulation

The controller runs as a model in the co-simulation loop: *plant (cells + thermal) → sensors (with error) → BMS → EMS → charger/load → plant*. Sensor drift, a stuck temperature sensor or a late trip can therefore be injected to see their system-level effect. This is also how the FMEA generator (Section 9.3) tests protection behaviour.

---

## 7. Gap Closure 3: Explicit Variation and Ageing Propagation

This section turns "cell variation and ageing propagate unpredictably" into a defined, testable chain.

### 7.1 The propagation chain

```
 Manufacturing spread          Operating differences
 (capacity, resistance,        (cell position, thermal contact,
  weld/contact resistance)      local airflow or PCM contact)
            │                              │
            └──────────────┬───────────────┘
                           ▼
     Parallel current imbalance   (cells in a P-group share voltage, not current)
                           ▼
     Unequal heat generation      (I²R differs per cell)
                           ▼
     Temperature spread, hot spots (thermal network incl. neighbours, PCM, busbars)
                           ▼
     Temperature feedback on resistance (R falls as T rises → more current to hot cell)
                           ▼
     Unequal ageing               (fade rate rises with temperature, C-rate, SoC)
                           ▼
     Capacity and resistance drift per cell (SoH divergence over cycles)
                           ▼
     Pack-level effects: weakest-group limit, derating, balancing burden,
     usable energy loss, probability of limit violation
```

### 7.2 Governing relations

| Step | Relation | Note |
|---|---|---|
| Parallel split (resistive, equal open-circuit voltage) | I₁ = I · R₂ ÷ (R₁ + R₂) | Lower-resistance cell takes more current |
| Heat per cell | Q = I²R(T) + I·T·(dU/dT) | Entropic term is small relative to Joule heating in this regime [Assumption] |
| Heat imbalance | Q₁ ÷ Q₂ = R₂ ÷ R₁ | The **lower-R** cell runs hotter |
| Resistance vs temperature | R(T) = R_ref · exp[ (E_a ÷ k)(1/T − 1/T_ref) ] | Hot cell gets lower R → more current: positive thermal feedback |
| Capacity mismatch | C-rate_i = I_i ÷ Q_i | Smaller cell sees higher C-rate and cycles deeper |
| Ageing rate | k_fade = A · exp(−E_a ÷ RT) · f(C-rate, SoC) | Roughly doubles per 10 °C as a rule of thumb [Assumption, fitted from data when available] |
| Pack capacity | Q_pack = min over series groups of Σ(parallel Q_i) | Weakest group sets usable energy |
| Resistance ageing feedback | Higher R shifts current away from the aged cell | Partly self-correcting for resistance, but not for capacity fade |

### 7.3 Worked example: 25 % resistance spread in a 2P group [Calculated]

Pack current 8.4 A (1C), cell resistances 12 mΩ and 15 mΩ [Assumption]:

- Current split: I₁ = 8.4 × 15 ÷ 27 = **4.67 A**, I₂ = **3.73 A** (56 % / 44 %).
- Heat: Q₁ = 4.67² × 0.012 = **0.261 W**, Q₂ = 3.73² × 0.015 = **0.209 W**, ratio = **1.25**.
- Reading: the "better" cell works and heats about 25 % more. For this spread the **steady temperature difference alone is small** (a fraction of a degree to a few degrees depending on thermal resistance), so the platform ranks it against other drivers such as weld or busbar resistance, position in the module and cooling contact, using a **sensitivity ranking** instead of assuming the answer.

### 7.4 Coupled cell-array model (L2) and ageing loop

State per cell *i*: capacity Q_i, resistance R_i, temperature T_i, SoC_i, SoH_i.

```
for each cycle block k:
    1. Sample or assign cell parameters (spread from datasheet tolerance or user data)
    2. Solve parallel/series electrical network for cell currents
    3. Compute heat per cell (+ busbar and balancing resistor heat)
    4. Solve thermal network (cell-to-cell, to PCM/plate, to ambient)
    5. Update R_i(T_i) and repeat 2–4 until currents and temperatures converge
    6. Update ageing: ΔQ_i, ΔR_i from temperature, C-rate and SoC history
    7. Update SoH, derating map and balancing need; log KPIs
```

### 7.5 Uncertainty quantification (L4) wired to the chain

Latin-hypercube sampling over capacity, resistance, contact resistance, ambient temperature and thermal-contact quality. Outputs per design:

- Distribution of peak cell temperature and cell-to-cell temperature spread.
- **Probability of any limit violation** (for example P(T_max > limit)).
- Worst-cell current share and SoC divergence.
- Usable-energy loss at end of life (weakest-group effect) and ranked drivers (tornado chart).

The recommendation is then **probabilistic** ("2 % chance of violating the temperature limit under assumed tolerances"), not a single pass/fail number.

### 7.6 What the user sees

A **Variation panel** with the chain above as a clickable diagram: select a spread, see the resulting current split, heat map, temperature feedback and ageing divergence, with the equation shown at each step. Beside it sits the **VSI table and tornado chart** (Section 12.2), showing how much of the safety margin each variation source consumes.

---

## 8. Requirements and Compliance Posture

### 8.1 Structured requirements (consistent with the application above)

| ID | Requirement | Type |
|---|---|---|
| REQ-001 | Nominal pack energy ≥ 115 Wh | [Target] |
| REQ-002 | Cell voltage window 2.5 V to 4.2 V (module 10.0 V to 16.8 V) | [Datasheet] |
| REQ-003 | Cell temperature ≤ 60 °C in discharge; **≤ 45 °C during charge**; platform veto margin set 5 °C below each limit [Assumption]; cell-to-cell spread ≤ 5 °C [Target] | [Datasheet / Target] |
| REQ-004 | Charge 10 → 80 % SoC in ≤ 45 min at ≤ 1C (nominal 42 min) | [Target] |
| REQ-005 | Mass ≤ 806 g (≥ 150 Wh/kg at module level) | [Target] |
| REQ-006 | BMS protection for OV, UV, discharge over-current, short-circuit, over-temperature | [Target] |
| REQ-007 | Balancing: bring groups within 10 mV at end of charge within a stated time | [Target] |
| REQ-008 | SoC estimate error ≤ 5 % over the duty cycle | [Target] |
| REQ-009 | Protection reaction time ≤ allowed fault-tolerant interval | [Target] |
| REQ-010 | Probability of any thermal-limit violation ≤ 5 % under stated tolerances | [Target] |
| REQ-011 | Compliance readiness against the selected rule packs (Section 8.2) | [Target] |

### 8.2 Right-sized compliance-as-code

Rule packs are selected by application tier, so the platform never applies a standard that does not fit.

| Tier | Rule pack | Use |
|---|---|---|
| Cell and small module | IEC 62133-2 safety checks (for example short-circuit current versus protection capability) | Hackathon scope |
| Industrial / stationary backup | IEC 62619 checks (for example over-temperature control) | Backup/UPS applications |
| Scaled light-EV pack | AIS-156 Amendment 3 for L-category vehicles (including thermal-event warning logic) | Pack and system roll-up |
| Larger EV batteries | UL 2580-type mechanical and abuse checks | Roadmap |
| Functional safety hooks | Safety-goal and diagnostic-coverage fields, with the target safety level set by the application (not claimed for the demo) | Roadmap |
| Sustainability | Carbon-footprint and recycled-content fields per kWh | Roadmap |

> **Note on rules:** each rule is an executable assertion with an internal ID. Clause references are filled in from the licensed standard text and flagged "to verify" until mapped, so the platform never cites a clause it has not checked. The platform is a **decision-support screening tool, not a certification authority**.

### 8.3 Immutable safety invariants (from the cell datasheet) [Datasheet, verify before use]

Voltage 2.5 V to 4.2 V; maximum continuous discharge current per datasheet; **charge temperature ≤ 45 °C**; discharge temperature ≤ 60 °C. Optimisation can never relax these.

---

## 9. Model Layer, Fidelity Levels and Governance Engines

### 9.1 Fidelity levels (aligned with the hierarchy and the new blocks)

| Level | What it does | Typical run time | Used for |
|---|---|---|---|
| **L0 Analytical screening** | Energy, voltage, mass, volume, adiabatic temperature rise, busbar heating, roll-up | < 1 s | Instant feedback while configuring |
| **L1 Module model with controller in the loop** | Equivalent-circuit cell model, lumped thermal network, sensor model, BMS and EMS logic | seconds | Charge/discharge scenarios, veto checks, control metrics |
| **L2 Coupled cell-array model** | Per-cell states in the S/P network, temperature feedback, ageing loop (Section 7.4) | seconds to minutes | Variation propagation and ageing divergence |
| **L3 High-fidelity checks (optional, asynchronous)** | Electrochemical reduced-order model and 3D conjugate heat transfer for design freeze | minutes to hours | Validating limits and hot-spot location |
| **L4 Uncertainty quantification** | Latin-hypercube sampling wrapped around L1/L2 | minutes | Probability of violation, ranked drivers |

Models exchange data through the co-simulation bus using an iterative (Gauss-Seidel style) scheme with an **energy-balance check** at each exchange. Each result carries a **validity flag** (for example, a reduced-order model flags confidence loss above its validated C-rate).

### 9.2 L0 screening example that drives the design options [Calculated]

Cell assumptions [Assumption, verify from datasheet]: R ≈ 12 mΩ, mass ≈ 70 g, specific heat ≈ 950 J/kg·K.

- Heat per cell at 1C (4.2 A): 4.2² × 0.012 = **0.21 W**; over 1 h = **762 J**.
- Cell heat capacity: 0.07 × 950 = 66.5 J/K, so the **adiabatic (no cooling) upper bound** on temperature rise is about **11.5 K** (conservative, because CC-CV current tapers).
- Total module heat over 1 h: 8 × 762 J ≈ **6.1 kJ**.
- A paraffin-class PCM with about 150 kJ/kg effective latent heat [Assumption] needs only about **41 g** to absorb that heat, so a design allowance of about 3× (about 120 g) is a sensible starting point, as long as the **PCM melt point sits above the charging ambient and below the cell limit** (for example about 42 °C).
- **Conflict the platform detects:** if the ambient is already above the PCM melt point, the PCM is molten before charging starts and gives no buffer. This is a model-versus-environment incompatibility the platform reports automatically.

### 9.3 Governance engines

- **Safety Veto.** Any state that violates an immutable invariant is blocked from commit. Output: the violated limit, the equation or rule, the computed value, and at least one counterfactual fix.
- **Conflict detector.** Checks interface and assumption compatibility. Examples it handles:
  1. Charge-temperature limit versus charging ambient (Section 2.3).
  2. PCM melt point versus ambient (Section 9.2).
  3. AFE series-cell limit versus topology (Section 5.3).
  4. Busbar current density and temperature rise versus fuse rating.
  5. Balancing resistor heat versus the thermal budget of the PCM/cell location.
  6. Sensor accuracy versus the SoC and protection accuracy targets.
- **Assumption Registry.** Every assumption has an owner, source label, valid range and the results that depend on it, so changing one assumption invalidates exactly the results that used it.
- **FMEA generator.** Injects faults into the controller-in-the-loop model (sensor drift, stuck sensor, weld resistance increase, failed fan, late trip) and reports whether protection reaches a safe state within the allowed time.
- **Counterfactual explainer (Student Mode).** For each veto it shows the equation, the data, the limit and the smallest parameter change that would pass.

---

## 10. Design Options and Trade-off Logic

### 10.1 Baseline and options (module level, same cells, same topology)

| | Baseline | Option A | Option B | Option C |
|---|---|---|---|---|
| Idea | Tight cell holders, nickel strip busbars, no thermal management | Wider cell spacing, natural convection, better sensor placement | PCM matrix around cells plus lower-resistance (copper) busbars | Cold-plate or forced-air cooling plus temperature-aware charge derating |
| Expected effect on peak temperature | Highest | Lower | Lower again, limited by PCM capacity | Lowest, depends on coolant temperature |
| Expected effect on cell-to-cell spread | Highest | Lower | Low | Lowest |
| Mass, size, cost | Lowest | Slightly higher | Moderate (PCM mass) | Highest (plate, pump or fan, parasitic power) |
| Main risk | Limit violation in hot ambient | Marginal in enclosed use | PCM saturation or ambient above melt point | Complexity, parasitic power, charge-time penalty |

> The platform fills this comparison with its own L0 to L2 results: usable energy, peak temperature, spread, charging time, mass, volume, estimated cost, plus probability of violation and control metrics. Direction and trade-off are shown here, and **numbers are generated by the platform, not asserted in this document.**

### 10.2 Optimisation that is meaningful (not just four options)

- **Continuous and discrete design variables:** cell spacing, PCM thickness and melt point, busbar section and material, balancing current, charge-derating map, cooling on/off thresholds, topology choices.
- **Objectives:** maximise usable energy; minimise charge time, peak temperature, spread, mass, volume, cost and probability of violation.
- **Hard constraints:** safety invariants and rules are **feasibility barriers**, not penalties.
- **Method:** multi-objective evolutionary search (NSGA-II class) to produce the Pareto front, then a transparent weighted ranking (TOPSIS-style) with user-adjustable weights, so a cost-sensitive user and a fast-charge user get different, explained recommendations.

### 10.3 Recommendation output

A recommended design plus: why it was chosen (trade-off explanation), what it beats the baseline on, **what it costs**, the top risks, the assumptions it depends on, its validity limits and the **next step** (for example, bench validation of the thermal model and confirmation of the PCM melt point). It also lists the **top three VSI drivers** for the recommended design and the margin each one consumes.

---

## 11. Traceability, Versioning and Evidence

- **Design branches and commits.** Each what-if is a branch. Accepting a design creates a commit holding requirements, component selections, assumptions, model versions, inputs, results and verdicts.
- **Tamper-evident history.** Each commit stores a hash chained to its parent (chain hash = SHA-256 of parent hash and content hash), giving every design state a reproducible identity.
- **Bidirectional traceability.** Example: REQ-003 → rule (charge-temperature) → thermal model version → ambient assumption → result → pass/fail → evidence record, traversable in either direction.
- **Change impact.** A change to any node marks every dependent result and verdict stale, so the platform never shows a verdict that no longer matches the design.
- **Evidence file (auto-generated).** BOM, requirements and compliance matrix, assumptions, results per option, risks and limitations, and the commit chain, exportable as a single readable document.

---

## 12. Innovation

### 12.1 The signature idea: a design review that explains itself and fixes itself by physics

Most tools tell an engineer *what* a design produces. BattTwin tells the engineer *why the design is not allowed, where the conflict sits, and the smallest physical change that makes it legal.* Two linked capabilities make this work.

**A. Safety Veto with counterfactual fixes.** Every blocked design returns four things: the violated limit, the governing equation, the computed value, and the **smallest parameter change that passes**, found by a bounded search over the design variables.

**B. Cross-domain conflict detector.** It finds mistakes that live *between* disciplines, where no single tool looks:

| Conflict found | What it connects | Counterfactual offered |
|---|---|---|
| Requirement already breaks the datasheet | Charge ambient 45 °C vs cell charge limit 45 °C (Section 2.3) | Lower charge ambient to 35 °C, add derating, or add pre-cooling |
| Material vs environment | PCM melt point below ambient, so the PCM is molten before charging starts (Section 9.2) | Choose a melt point between ambient and the cell limit |
| IC limit vs topology | 5-series-cell AFE on a 12S pack (Section 5.3) | Distributed BMS: one AFE per module plus a pack master |
| Heat source vs thermal budget | Balancing-resistor heat vs the PCM/cell location it sits in | Move resistor or reduce balance current |

**Worked example [Calculated, from Section 2.3]:**
> BLOCKED: REQ-003. Charge at 45 °C ambient. Cell charge limit is 45 °C [Datasheet, verify]. Zero self-heating already reaches the limit, and the veto margin is 5 °C. Cause: requirement versus physics, not a cooling shortfall. Smallest passing change: charge ambient design point ≤ 35 °C, or enable derating above 40 °C cell temperature.

**What existing tools typically do not do** *(verify this row against the specific tools you name before presenting)*:

| Tool class | Strong at | Typically does not provide |
|---|---|---|
| High-fidelity multiphysics suites | Accurate single-domain or coupled simulation | A governed check of requirements, assumptions and interfaces across domains, with a plain-language fix |
| Open-source battery libraries | Cell-level electrochemical and equivalent-circuit models | System-level conflict detection, safety gating of commits, traceable evidence |
| Spreadsheets | Fast, flexible sizing | Unit-checked exchange, stale-result invalidation, reproducible history |

### 12.2 Second pillar: Variation Sensitivity Index (VSI)

The brief says cell variation "propagates unpredictably". BattTwin makes it **ranked and comparable** with one number per source.

**Definition.** For each variation source *k* (cell resistance spread, capacity spread, weld/contact resistance, cell position in the module, cooling-contact quality, ambient):

```
VSI_k = |ΔKPI_k| / (KPI_limit − KPI_nominal)
```

- ΔKPI_k is the change in the chosen KPI (for example peak cell temperature, cell-to-cell spread or weakest-group capacity) when only source *k* is moved across its tolerance band (±1σ or datasheet tolerance), all others held nominal.
- The denominator is the **safety margin** left at the nominal design, so VSI = 1 means that source alone can consume the whole margin.
- Computed at L1/L2 by one-at-a-time sweeps, then confirmed with the Latin-hypercube run (L4) using variance-based indices.

**Honest positioning.** The mathematics (sensitivity analysis) is standard. What is new is a **margin-normalised, per-source index shown on the design itself**, so a student or engineer sees "weld resistance uses 0.6 of your thermal margin, cell spacing uses 0.1" and knows where to spend effort.

**Output:** a tornado chart plus a VSI table per design option, shown on the Variation panel (Section 7.6) and written into the evidence file.

### 12.3 Supporting capabilities (enablers, not headline claims)

| Capability | Role |
|---|---|
| Version-controlled design history (branches, commits, hash-chained evidence) | Makes every veto, conflict and VSI result reproducible and auditable |
| Control-in-the-loop trade-offs (balancing, derating, SoC error, protection timing) | Puts BMS/EMS choices inside the comparison |
| Probabilistic recommendation | States probability of violation under tolerances |
| Fidelity on demand, offline mode, parameter fitting from small datasets | Meets the limited data, software and compute constraint |

### 12.4 Measured evidence plan (one real result beats pages of architecture)

Goal: one bench result that closes the loop between model and hardware.

| Step | Detail |
|---|---|
| Rig | 4S low-voltage module, inline fuse, hardware thermal cut-off, fire-safe enclosure, no abuse testing (Section 14.3) |
| Measurements | Pack current, per-group voltage, 4 to 8 NTC/DS18B20 temperatures, ambient |
| Run | 0.5C and 1C discharge, logged at ≥1 Hz; optionally one charge run within limits |
| Model comparison | L1 prediction vs measured temperature and voltage |
| Metrics | RMSE and MAPE for temperature and voltage; peak temperature error in °C |
| VSI check | Add a deliberate, safe perturbation (for example one extra 10 mΩ resistor in one series path, or one cell moved to a hotter position) and compare the **measured** temperature shift with the VSI-predicted shift |
| Result slot | **[Fill after bench run]** RMSE = __ °C, MAPE = __ %, predicted ΔT = __ °C vs measured ΔT = __ °C |

If the bench run cannot be done in time, state that plainly and show the model checked against a published open cycling dataset instead, labelled as such.

---

## 13. Business Viability and Scalability

### 13.1 Who pays and why (hypotheses to validate)

| Segment | Value | Possible model |
|---|---|---|
| Universities, training institutes | Teach battery design without licences | Free tier plus institutional licence |
| Small and mid-size pack builders and start-ups | Faster option comparison and early conflict detection without expensive suites | Per-team subscription |
| Larger OEM or tier-1 teams | Governance layer, traceability, compliance rule packs | Enterprise licence, rule-pack subscriptions, integration services |
| Test labs and consultants | Reusable evidence structure | Service partnerships |

### 13.2 Positioning

- High-fidelity multiphysics suites are powerful but licence-heavy and expert-oriented.
- Open-source battery libraries are strong at single domains but do not provide a governed, traceable design workflow.
- **BattTwin's position:** the integration and governance layer on top of open models, usable by students and engineers, with explanations and evidence built in. It can also call external solvers later.

### 13.3 Scalability (plugin architecture)

Chemistry, cells, rule packs, cooling concepts and application templates are plugins with defined contracts (parameter schema, model hooks, rule pack). The core (UDG, versioning, veto, dashboards) is chemistry-agnostic, so LFP, sodium-ion and new pack formats are additions, not rewrites. Market-size and willingness-to-pay figures are to be validated through user interviews and are intentionally not asserted here.

---

## 14. Technical Feasibility and Phased Delivery

### 14.1 Why it is achievable

- Built on open-source, datasheet-driven models; no commercial licences needed.
- Hackathon depth is **one module**, with pack and system levels covered by roll-up.
- Heavy models (L3) are optional and asynchronous, never required for the core demonstration.

### 14.2 Phased maturity roadmap

| Phase | Scope | Exit criterion |
|---|---|---|
| **Phase 1: Core (hackathon)** | UDG with 4-level ontology, requirements, L0 and L1 with controller in the loop, Safety Veto, conflict detector, 3 options compared against baseline, evidence export | Veto and conflict findings reproducible; options compared on energy, temperature, charge time, mass, size, cost; one bench or open-dataset model check reported (Section 12.4) |
| **Phase 2: Variation and control depth** | L2 coupled cell-array model, ageing loop, L4 uncertainty, FMEA generator | Variation ranking stable across runs; protection timing verified |
| **Phase 3: Validation and optimisation** | Bench validation on a low-voltage rig, parameter fitting, full Pareto search, optional L3 | Model error against measurements within agreed tolerance |
| **Phase 4: Scale and ecosystem** | More chemistries and rule packs, pack and system depth, optional telemetry link | Plugin contracts proven with a second chemistry |

### 14.3 Safe, low-voltage validation approach (planned, not required for the idea)

Small 4S module at low voltage, inline fuse, hardware thermal cut-off, fire-safe enclosure, no abuse testing. Used only to validate thermal and electrical model predictions.

---

## 15. Known Boundaries and Risks

| Boundary / risk | Treatment |
|---|---|
| Reduced-order electrochemical models lose accuracy at extreme fast-charge | Validity flag lowers confidence and warns the user |
| Thermal runaway is complex and cannot be resolved in a fast design loop | Platform screens and gives conservative mitigation hints; physical abuse testing remains mandatory for approval |
| Ageing prediction depends on usage and data | Reported with confidence ranges from uncertainty analysis, never as guarantees |
| Datasheet values may be optimistic or differ by batch | Every value labelled, replaceable by measured data, and sensitivity-ranked |
| Rule packs need licensed standard text for clause-exact mapping | Rules shipped with "to verify" flags until mapped |
| Scope creep | Phase gates; heavy models optional |
| Clearly stated: platform is decision support, not certification | Stated in every evidence file |

---

## 16. End-to-End Coverage Against the Problem Statement

| Problem statement requirement | Covered by | Section | Status |
|---|---|---|---|
| Virtually configure, visualise, analyse and compare designs from cell to system level | UDG with Cell → Module → Pack → System hierarchy, 3D view, Pareto comparison | 4, 5, 10 | ✅ |
| Integrate electrical, thermal, mechanical | Multi-fidelity model layer L0–L4 | 9.1 | ✅ |
| Integrate sensing and protection | Measurement chain, protection state machine, FMEA | 6.1, 9.3 | ✅ |
| Integrate control and energy management | BMS/EMS block: SoC, SoH, balancing, charge controller, thermal control, state-of-power and dispatch rules | 6 | ✅ (gap closed) |
| Consistent exchange of parameters and results between subsystem models | Co-simulation bus with interface contracts and unit checks | 6.2, 9.1 | ✅ |
| Evaluate system-level impact of design changes | Change-impact router, roll-up rules, stale-result invalidation | 4.2, 5.2, 11 | ✅ |
| Identify interface conflicts and incompatible assumptions | Conflict detector and Assumption Registry (6 worked conflict types) | 9.3 | ✅ |
| Identify safety-limit violations | Safety Veto, immutable invariants, rule packs | 8, 9.3 | ✅ |
| Identify performance trade-offs | KPI roll-up and Pareto/weighted ranking | 10 | ✅ |
| Traceability: requirements → components → assumptions → models → results → evidence | Hash-chained commits, graph edges, evidence file | 11 | ✅ |
| Recommend a balanced design with stated risks and limitations | Recommendation output, boundaries and risks | 10.3, 15 | ✅ |
| Cell variation, ageing and operating conditions propagating from cell to pack | Variation-propagation chain, coupled cell-array model, ageing loop, uncertainty analysis | 7 | ✅ (gap closed) |
| Limited data, software and compute | Open-source, offline mode, parameter fitting from small datasets | 12, 14 | ✅ |
| Manageable scope | 4S2P module with roll-up and phased roadmap | 2.2, 5.4, 14 | ✅ |
| Explain safety-limit violations and how to resolve them | Counterfactual Safety Veto and conflict detector | 12.1 | ✅ |
| Rank which variation sources matter most | Variation Sensitivity Index and tornado chart | 12.2 | ✅ |
| Measurable, repeatable evidence | Bench or open-dataset model comparison with RMSE/MAPE and VSI check | 12.4 | ✅ (result slots to be filled after the run) |
| *Key points:* scope; application and conditions; cells, connections, temperature control, sensing, protection, controls; datasheets and calculations; at least two options versus a baseline; indicators (energy, temperature, charge time, mass, size, cost); assumptions, sources, safety, limits; next step | Sections 2, 5, 6, 8, 9.2, 10, 15, 14.2 | | ✅ |

### Fixes included in this version

1. **Hierarchy gap closed:** four-level ontology, roll-up rules and a worked module → pack scale-up (Section 5).
2. **Control and energy-management gap closed:** BMS/EMS functional blocks, interface contracts, balancing example and control metrics (Section 6).
3. **Variation and ageing gap closed:** explicit propagation chain, governing relations, worked parallel-imbalance example, coupled model and uncertainty outputs (Section 7).
4. **"Reference platform" framing removed:** innovation is presented on its own merits (Section 12).
5. **Internal consistency corrected:** charging limit versus ambient conflict is now a showcased finding, not a hidden contradiction; thermal numbers are derived from stated inputs; option results are generated by the platform rather than asserted.
6. **Application and standards right-sized:** a 14.4 V module framed honestly, with rule packs matched to application tier instead of applying automotive-grade standards to a small module.
7. **Unverifiable items removed or labelled:** market-size claims, clause numbers and cost figures are no longer asserted without a source or label.
8. **Innovation sharpened:** one signature idea (counterfactual veto plus conflict detector), one named analysis (VSI) and one measured-evidence plan replace a nine-item list (Section 12).
9. **Honest positioning:** VSI is presented as a margin-normalised application of standard sensitivity analysis, and bench results stay blank until measured.

---

## 17. Data Sources to Use (no unverified citations)

- Cell manufacturer datasheet for the selected cell (capacity, resistance, voltage and temperature limits, mass, dimensions).
- BMS analogue front-end datasheet for the selected protection IC (series-cell range, protection thresholds, balancing capability).
- Open-source battery modelling documentation for model equations and parameters.
- Published, openly available battery cycling datasets for model checks.
- Licensed text of the selected standards for clause mapping (kept as "to verify" until mapped).
- Supplier datasheets for PCM, busbar and enclosure materials.

---

## 18. Suggested Pitch Flow

1. **Problem:** coupled trade-offs in silos (Section 1, 2).
2. **Live demo, blocked design:** the 45 °C charging requirement blocked, with its cause and counterfactual fix (Section 12.1).
3. **VSI tornado chart:** which variation source eats the most safety margin (Section 12.2).
4. **Bench comparison:** model vs measured temperature and voltage, with the VSI-predicted shift checked against measurement (Section 12.4).
5. **Options vs baseline:** usable energy, temperature, charge time, mass, size, cost, probability of violation (Section 10).
6. **Traceability and versioning:** commit history and evidence file (Section 11).
7. **Roadmap and business:** phases, plugins, segments (Sections 13, 14).
