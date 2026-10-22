import { LearningChallenge } from '../types/battery';

export const learningChallenges: LearningChallenge[] = [
  {
    id: 'challenge_1',
    title: 'Challenge 1: The Indian Summer Charging Trap',
    concept: 'Requirement vs Physics Conflict',
    story:
      'You are designing a battery pack for an electric 2-wheeler in New Delhi. The requirement states: "Must charge at full 1C rate in peak summer ambient of 45 °C". Can your system pass safety gating?',
    governing_equation: 'T_cell = T_ambient + ΔT(I²R, R_th) ≤ 45.0 °C',
    target_sliders: [
      { name: 'ambient_temp_c', default: 45.0, min: 25.0, max: 50.0, step: 1.0, unit: '°C' },
      { name: 'c_rate', default: 1.0, min: 0.2, max: 2.0, step: 0.1, unit: 'C' },
    ],
    trap_explanation:
      'When ambient temperature is 45 °C, even with zero internal heating, the cell is ALREADY at the manufacturer datasheet maximum charge limit (45 °C). Any charging current produces Joule heating (Q = I²R), immediately pushing the cell into thermal violation! The platform flags this as a Requirement Conflict, not a cooling problem.',
    counterfactual_solution:
      'Lower charge ambient design point to 35 °C, or enable temperature-dependent charge derating above 40 °C.',
  },
  {
    id: 'challenge_2',
    title: 'Challenge 2: The Parallel Mismatch Paradox',
    concept: 'Current Imbalance & Thermal Feedback',
    story:
      'Two cells in a parallel group have slightly different internal resistances: Cell 1 has 12 mΩ, Cell 2 has 15 mΩ. Which cell carries more current and runs hotter? Is the "better" cell at higher risk?',
    governing_equation: 'I₁ = I_total · (R₂ / (R₁ + R₂))  |  Q = I²·R(T)',
    target_sliders: [
      { name: 'resistance_spread_pct', default: 25.0, min: 0.0, max: 40.0, step: 5.0, unit: '%' },
    ],
    trap_explanation:
      'In a parallel group, cells share terminal voltage, so current splits inversely with resistance. Cell 1 (12 mΩ) takes 4.67 A (56%), while Cell 2 (15 mΩ) takes 3.73 A (44%). Because Joule heating scales with I², Cell 1 generates Q₁ = (4.67)² × 0.012 = 0.261 W, which is 25% MORE heat than Cell 2 (0.209 W)! Furthermore, as Cell 1 gets hotter, its resistance drops (Arrhenius effect), attracting even MORE current.',
    counterfactual_solution:
      'Use precision cell binning (spread ≤ 5%) and symmetrical busbar connections to equalize branch impedance.',
  },
  {
    id: 'challenge_3',
    title: 'Challenge 3: The PCM Meltdown Trap',
    concept: 'Material vs Environment Selection',
    story:
      'Phase Change Material (PCM) absorbs huge amounts of heat without temperature rise during melting. If your operating ambient is 43 °C and you choose a paraffin PCM with melting point of 42 °C, what happens before charging even starts?',
    governing_equation: 'Q_latent = m_pcm · L_f  (valid only during solid-liquid transition)',
    target_sliders: [
      { name: 'ambient_temp_c', default: 43.0, min: 25.0, max: 45.0, step: 1.0, unit: '°C' },
      { name: 'pcm_melt_point_c', default: 42.0, min: 35.0, max: 48.0, step: 1.0, unit: '°C' },
    ],
    trap_explanation:
      'Because ambient (43 °C) is higher than the melt point (42 °C), the PCM is ALREADY fully molten during parking/standby! When charging begins, the latent heat buffer is completely saturated, providing zero thermal buffering.',
    counterfactual_solution:
      'Choose a PCM melt point strictly higher than the maximum ambient temperature, but below the cell safety ceiling (e.g. 43.5 °C for 38 °C ambient).',
  },
  {
    id: 'challenge_4',
    title: 'Challenge 4: The Slow Balancing Reality',
    concept: 'BMS Circuit Limitations & Balancing Heat',
    story:
      'Can a typical passive resistor balancing circuit (50 mA) rescue a poorly matched module with a 2% capacity mismatch (0.168 Ah)?',
    governing_equation: 't_balance = ΔQ / I_balance  |  Q_resistor = I_balance² · R_balance',
    target_sliders: [
      { name: 'capacity_spread_pct', default: 2.0, min: 0.5, max: 8.0, step: 0.5, unit: '%' },
    ],
    trap_explanation:
      'Balancing 0.168 Ah at 50 mA requires 3.4 HOURS of continuous bleeding. The 82 Ω resistor dissipates ~0.2 W per group, dumping heat directly into the cell holder. Balancing cannot fix poorly binned cells; cell manufacturing matching matters far more than the BMS balance circuit.',
    counterfactual_solution:
      'Tighten cell capacity grading tolerance during assembly to within ±1%.',
  },
];
