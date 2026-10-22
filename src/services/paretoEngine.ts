import { ParetoCandidate } from '../types/battery';

export function generateParetoCandidates(): ParetoCandidate[] {
  const candidates: ParetoCandidate[] = [
    {
      id: 'PAR-001',
      name: 'Ultralight Minimalist',
      cooling_type: 'baseline_passive',
      spacing_mm: 1.0,
      busbar_material: 'nickel',
      derating_enabled: false,
      usable_energy_wh: 118.5,
      peak_temperature_c: 44.8,
      charge_time_min: 42.0,
      mass_g: 632,
      cost_usd: 56.5,
      is_pareto_optimal: true, // Lowest mass & lowest cost
      trade_off_summary: 'Lowest mass & cost, but narrowest thermal safety margin (44.8 °C peak).',
    },
    {
      id: 'PAR-002',
      name: 'Spaced Convection Balanced',
      cooling_type: 'natural_convection',
      spacing_mm: 3.5,
      busbar_material: 'nickel',
      derating_enabled: false,
      usable_energy_wh: 119.8,
      peak_temperature_c: 41.2,
      charge_time_min: 42.0,
      mass_g: 662,
      cost_usd: 58.5,
      is_pareto_optimal: true, // Best passive cooling compromise
      trade_off_summary: 'Excellent passive compromise: +30g mass drops temperature by 3.6 °C.',
    },
    {
      id: 'PAR-003',
      name: 'PCM Thermal Shield Pro',
      cooling_type: 'pcm_matrix',
      spacing_mm: 2.5,
      busbar_material: 'copper',
      derating_enabled: false,
      usable_energy_wh: 121.2,
      peak_temperature_c: 38.6,
      charge_time_min: 42.0,
      mass_g: 785,
      cost_usd: 68.0,
      is_pareto_optimal: true, // Optimal passive thermal absorption
      trade_off_summary: 'Zero parasite power, clamps temp at 38.6 °C via latent heat, +153g mass penalty.',
    },
    {
      id: 'PAR-004',
      name: 'Active Cold Plate Fast Charge',
      cooling_type: 'active_cooling',
      spacing_mm: 2.0,
      busbar_material: 'copper',
      derating_enabled: true,
      usable_energy_wh: 122.4,
      peak_temperature_c: 33.5,
      charge_time_min: 38.0,
      mass_g: 820,
      cost_usd: 81.0,
      is_pareto_optimal: true, // Lowest peak temp & fastest charge
      trade_off_summary: 'Coldest operating point (33.5 °C) and highest energy yield, but highest BOM cost.',
    },
    {
      id: 'PAR-005',
      name: 'Sub-Optimal Thick Nickel (Dominated)',
      cooling_type: 'baseline_passive',
      spacing_mm: 2.0,
      busbar_material: 'nickel',
      derating_enabled: false,
      usable_energy_wh: 117.8,
      peak_temperature_c: 44.1,
      charge_time_min: 44.0,
      mass_g: 674,
      cost_usd: 62.0,
      is_pareto_optimal: false, // Dominated by PAR-002
      trade_off_summary: 'Strictly dominated by PAR-002 on energy, temperature, and cost.',
    },
    {
      id: 'PAR-006',
      name: 'Sub-Optimal Heavy Active (Dominated)',
      cooling_type: 'active_cooling',
      spacing_mm: 4.0,
      busbar_material: 'nickel',
      derating_enabled: false,
      usable_energy_wh: 119.0,
      peak_temperature_c: 35.8,
      charge_time_min: 41.0,
      mass_g: 865,
      cost_usd: 84.0,
      is_pareto_optimal: false, // Dominated by PAR-004
      trade_off_summary: 'Excessive spacing adds mass without thermal benefit over PAR-004.',
    },
  ];

  return candidates;
}
