import {
  CellDefinition,
  ModuleTopology,
  SimulationConditions,
  OptionComparisonItem,
} from '../types/battery';
import { defaultCell, runL2Simulation } from './physicsEngine';

export function getPredefinedOptions(): Record<string, ModuleTopology> {
  return {
    Baseline: {
      series_count: 4,
      parallel_count: 2,
      busbar: { material: 'nickel', thickness_mm: 0.3, width_mm: 8.0, length_mm: 25.0, resistance_mohm: 0.85 },
      thermal: {
        cooling_type: 'baseline_passive',
        cell_spacing_mm: 1.0,
        pcm: { enabled: false, melt_point_c: 42.0, latent_heat_j_per_g: 150.0, mass_g: 120.0, thermal_conductivity_w_m_k: 0.25 },
        active_fan_flow_cfm: 0.0,
        derating_enabled: false,
        derating_temp_threshold_c: 40.0,
      },
      afe_ic_model: 'TI bq76920 (5-Series)',
      passive_balancing_resistor_ohm: 82.0,
    },
    'Option A (Natural Convection)': {
      series_count: 4,
      parallel_count: 2,
      busbar: { material: 'nickel', thickness_mm: 0.3, width_mm: 8.0, length_mm: 25.0, resistance_mohm: 0.85 },
      thermal: {
        cooling_type: 'natural_convection',
        cell_spacing_mm: 3.0,
        pcm: { enabled: false, melt_point_c: 42.0, latent_heat_j_per_g: 150.0, mass_g: 120.0, thermal_conductivity_w_m_k: 0.25 },
        active_fan_flow_cfm: 0.0,
        derating_enabled: false,
        derating_temp_threshold_c: 40.0,
      },
      afe_ic_model: 'TI bq76920 (5-Series)',
      passive_balancing_resistor_ohm: 82.0,
    },
    'Option B (PCM Matrix)': {
      series_count: 4,
      parallel_count: 2,
      busbar: { material: 'copper', thickness_mm: 0.3, width_mm: 8.0, length_mm: 25.0, resistance_mohm: 0.25 },
      thermal: {
        cooling_type: 'pcm_matrix',
        cell_spacing_mm: 2.5,
        pcm: { enabled: true, melt_point_c: 42.0, latent_heat_j_per_g: 150.0, mass_g: 120.0, thermal_conductivity_w_m_k: 0.25 },
        active_fan_flow_cfm: 0.0,
        derating_enabled: false,
        derating_temp_threshold_c: 40.0,
      },
      afe_ic_model: 'TI bq76920 (5-Series)',
      passive_balancing_resistor_ohm: 82.0,
    },
    'Option C (Active Cooling + Derate)': {
      series_count: 4,
      parallel_count: 2,
      busbar: { material: 'copper', thickness_mm: 0.3, width_mm: 8.0, length_mm: 25.0, resistance_mohm: 0.25 },
      thermal: {
        cooling_type: 'active_cooling',
        cell_spacing_mm: 2.0,
        pcm: { enabled: false, melt_point_c: 42.0, latent_heat_j_per_g: 150.0, mass_g: 120.0, thermal_conductivity_w_m_k: 0.25 },
        active_fan_flow_cfm: 12.0,
        derating_enabled: true,
        derating_temp_threshold_c: 40.0,
      },
      afe_ic_model: 'TI bq76920 (5-Series)',
      passive_balancing_resistor_ohm: 82.0,
    },
  };
}

export function compareOptions(
  cell: CellDefinition = defaultCell,
  sim: SimulationConditions,
  weights: Record<string, number> = {
    energy: 0.2,
    temp: 0.25,
    charge_time: 0.2,
    mass: 0.15,
    cost: 0.1,
    safety: 0.1,
  }
): OptionComparisonItem[] {
  const optionsDict = getPredefinedOptions();
  const results: OptionComparisonItem[] = [];

  for (const [name, mod] of Object.entries(optionsDict)) {
    const [, , kpis] = runL2Simulation(cell, mod, sim);

    results.push({
      name,
      peak_temperature_c: kpis.peak_temperature_c,
      temp_spread_c: kpis.temp_spread_delta_t_c,
      usable_energy_wh: kpis.usable_energy_wh,
      charge_time_min: kpis.charge_or_discharge_time_min,
      mass_g: kpis.total_mass_g,
      cost_usd: kpis.estimated_bom_cost_usd,
      prob_violation_pct: kpis.probability_limit_violation_pct,
      topsis_score: 0,
    });
  }

  // TOPSIS-style normalization and scoring
  for (const r of results) {
    const s_energy = r.usable_energy_wh / 120.0;
    const s_temp = Math.max(0.0, 1.0 - (r.peak_temperature_c - 30.0) / 25.0);
    const s_time = Math.max(0.0, 1.0 - (r.charge_time_min - 35.0) / 25.0);
    const s_mass = Math.max(0.0, 1.0 - (r.mass_g - 700.0) / 300.0);
    const s_cost = Math.max(0.0, 1.0 - (r.cost_usd - 50.0) / 30.0);
    const s_safety = Math.max(0.0, 1.0 - r.prob_violation_pct / 100.0);

    const topsis_score =
      (weights.energy * s_energy +
        weights.temp * s_temp +
        weights.charge_time * s_time +
        weights.mass * s_mass +
        weights.cost * s_cost +
        weights.safety * s_safety) *
      100.0;

    r.topsis_score = Math.round(topsis_score * 10) / 10;
  }

  results.sort((a, b) => b.topsis_score - a.topsis_score);
  return results;
}
