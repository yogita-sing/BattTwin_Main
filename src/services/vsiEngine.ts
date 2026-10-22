import {
  CellDefinition,
  ModuleTopology,
  SimulationConditions,
  VsiEntry,
  SummaryKPIs,
} from '../types/battery';
import { defaultCell, runL2Simulation } from './physicsEngine';

export function computeVsiRanking(
  cell: CellDefinition = defaultCell,
  module: ModuleTopology,
  sim: SimulationConditions,
  nominal_kpis: SummaryKPIs
): VsiEntry[] {
  const limit_t = sim.operation_mode === 'charge' ? cell.max_charge_temp_c : cell.max_discharge_temp_c;
  const margin_available = Math.max(0.5, limit_t - nominal_kpis.peak_temperature_c);

  const variation_sources = [
    {
      name: 'Spot Weld Resistance (+10 mΩ)',
      desc: 'Imperfect weld contact resistance adding 10 mΩ in one parallel branch',
      param_override: { weld_resistance_mohm: 10.0 },
    },
    {
      name: 'Cell Resistance Spread (±15%)',
      desc: 'Manufacturing batch tolerance in internal cell resistance',
      param_override: { resistance_spread_pct: 15.0 },
    },
    {
      name: 'Ambient Temp Swing (+5 °C)',
      desc: 'Summer diurnal temperature rise above design nominal point',
      param_override: { ambient_temp_c: sim.ambient_temp_c + 5.0 },
    },
    {
      name: 'Cell Position / Airflow Shadow',
      desc: 'Restricted natural convection around inner cells S2 and S3',
      param_override: { airflow_restriction_pct: 30.0 },
    },
    {
      name: 'Cell Capacity Spread (±3%)',
      desc: 'Manufacturing variation causing depth-of-discharge divergence',
      param_override: { capacity_spread_pct: 3.0 },
    },
  ];

  const entries: VsiEntry[] = [];

  for (const src of variation_sources) {
    const modified_sim: SimulationConditions = {
      ...sim,
      ...src.param_override,
    };

    const [, , mod_kpis] = runL2Simulation(cell, module, modified_sim);

    const delta_kpi = Math.abs(mod_kpis.peak_temperature_c - nominal_kpis.peak_temperature_c);
    const vsi_score = delta_kpi / margin_available;

    entries.push({
      source_name: src.name,
      description: src.desc,
      delta_kpi_value: Math.round(delta_kpi * 100) / 100,
      safety_margin_available: Math.round(margin_available * 100) / 100,
      vsi_score: Math.round(vsi_score * 1000) / 1000,
      rank: 0,
    });
  }

  // Sort descending by VSI score
  entries.sort((a, b) => b.vsi_score - a.vsi_score);
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return entries;
}
