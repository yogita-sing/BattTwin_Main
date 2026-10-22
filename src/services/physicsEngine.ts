import {
  CellDefinition,
  ModuleTopology,
  SimulationConditions,
  CellState,
  TimeSeriesPoint,
  SummaryKPIs,
} from '../types/battery';

export const defaultCell: CellDefinition = {
  name: 'Lithium-Ion 21700-42G',
  nominal_capacity_ah: 4.2,
  nominal_voltage_v: 3.6,
  internal_resistance_mohm: 12.0,
  mass_g: 70.0,
  specific_heat_capacity_j_kg_k: 950.0,
  min_voltage_v: 2.5,
  max_voltage_v: 4.2,
  max_continuous_discharge_c: 2.0,
  max_charge_c: 1.0,
  max_charge_temp_c: 45.0,
  max_discharge_temp_c: 60.0,
  temp_veto_margin_c: 5.0,
};

export const defaultModule: ModuleTopology = {
  series_count: 4,
  parallel_count: 2,
  busbar: {
    material: 'nickel',
    thickness_mm: 0.3,
    width_mm: 8.0,
    length_mm: 25.0,
    resistance_mohm: 0.85,
  },
  thermal: {
    cooling_type: 'baseline_passive',
    cell_spacing_mm: 1.0,
    pcm: {
      enabled: false,
      melt_point_c: 42.0,
      latent_heat_j_per_g: 150.0,
      mass_g: 120.0,
      thermal_conductivity_w_m_k: 0.25,
    },
    active_fan_flow_cfm: 0.0,
    derating_enabled: false,
    derating_temp_threshold_c: 40.0,
  },
  afe_ic_model: 'TI bq76920 (5-Series)',
  passive_balancing_resistor_ohm: 82.0,
};

export class ThermalNetworkSolver {
  c_th: number;

  constructor(cell_mass_kg: number = 0.07, c_p: number = 950.0) {
    this.c_th = cell_mass_kg * c_p; // ~66.5 J/K per cell
  }

  step(
    t_current: number,
    t_ambient: number,
    q_gen_w: number,
    dt_s: number,
    cooling_type: string,
    spacing_mm: number,
    pcm_enabled: boolean,
    pcm_melt_c: number,
    pcm_latent_heat_j: number,
    pcm_current_melt_j: number
  ): [number, number, number] {
    // Thermal resistance to ambient (K/W)
    let r_th_ambient = 11.5;
    if (cooling_type === 'active_cooling') {
      r_th_ambient = 2.8;
    } else if (cooling_type === 'natural_convection') {
      r_th_ambient = Math.max(5.0, 10.0 - spacing_mm * 1.2);
    } else if (cooling_type === 'pcm_matrix') {
      r_th_ambient = 6.5;
    } else {
      r_th_ambient = 11.5;
    }

    const q_dissipated_w = (t_current - t_ambient) / r_th_ambient;
    let net_heat_w = q_gen_w - q_dissipated_w;

    let new_pcm_melt_j = pcm_current_melt_j;
    let melt_fraction = 0.0;

    if (pcm_enabled && pcm_latent_heat_j > 0) {
      melt_fraction = Math.min(1.0, Math.max(0.0, pcm_current_melt_j / pcm_latent_heat_j));
      if (t_current >= pcm_melt_c - 0.5 && pcm_current_melt_j < pcm_latent_heat_j && net_heat_w > 0) {
        const energy_absorbed = net_heat_w * dt_s;
        new_pcm_melt_j = Math.min(pcm_latent_heat_j, pcm_current_melt_j + energy_absorbed);
        net_heat_w = net_heat_w * 0.15; // 85% absorbed into latent buffer
      }
    }

    const delta_t = (net_heat_w * dt_s) / this.c_th;
    const new_t = t_current + delta_t;

    return [new_t, new_pcm_melt_j, melt_fraction];
  }
}

export function getOpenCircuitVoltage(soc: number): number {
  soc = Math.min(Math.max(soc, 0.0), 1.0);
  return 3.0 + 0.9 * soc + 0.3 * Math.pow(soc, 2) - 0.1 * Math.exp(-30.0 * soc) + 0.1 * Math.sqrt(soc);
}

export function runL2Simulation(
  cell: CellDefinition = defaultCell,
  module: ModuleTopology = defaultModule,
  sim: SimulationConditions
): [CellState[], TimeSeriesPoint[], SummaryKPIs] {
  const n_series = module.series_count; // 4
  const n_parallel = module.parallel_count; // 2
  const n_total_cells = n_series * n_parallel; // 8

  const pack_nominal_capacity_ah = n_parallel * cell.nominal_capacity_ah; // 8.4 Ah
  let i_pack_command = pack_nominal_capacity_ah * sim.c_rate;
  if (sim.operation_mode === 'discharge') {
    i_pack_command = -Math.abs(i_pack_command);
  } else {
    i_pack_command = Math.abs(i_pack_command);
  }

  const r_ref_ohm = cell.internal_resistance_mohm / 1000.0; // 0.012 Ohm
  const t_ref_k = 298.15; // 25 °C
  const arrhenius_ea_k = 1850.0; // Ea / R in Kelvin (~0.16 eV)

  const r_spread_ratio = sim.resistance_spread_pct / 100.0;
  const q_spread_ratio = sim.capacity_spread_pct / 100.0;

  const cells_data: Array<{
    cell_id: string;
    s: number;
    p: number;
    r_0: number;
    q_cap_ah: number;
    soc: number;
    soh: number;
    temp_c: number;
    v: number;
    i: number;
    r_curr: number;
    q_heat_w: number;
    pcm_melt_j: number;
    melt_fraction?: number;
  }> = [];

  for (let s = 0; s < n_series; s++) {
    for (let p = 0; p < n_parallel; p++) {
      const cid = `Cell_S${s + 1}_P${p + 1}`;
      const factor = p === 0 ? 1.0 - r_spread_ratio * 0.5 : 1.0 + r_spread_ratio * 0.5;
      const weld_extra = s === 0 && p === 1 ? sim.weld_resistance_mohm / 1000.0 : 0.0;
      const r_0 = r_ref_ohm * factor + weld_extra;

      const q_factor = p === 0 ? 1.0 + q_spread_ratio * 0.5 : 1.0 - q_spread_ratio * 0.5;
      const q_cap_ah = cell.nominal_capacity_ah * q_factor;

      const initial_soc = sim.operation_mode === 'charge' ? 0.1 : 0.95;

      cells_data.push({
        cell_id: cid,
        s,
        p,
        r_0,
        q_cap_ah,
        soc: initial_soc,
        soh: 1.0,
        temp_c: sim.ambient_temp_c,
        v: getOpenCircuitVoltage(initial_soc),
        i: 0.0,
        r_curr: r_0,
        q_heat_w: 0.0,
        pcm_melt_j: 0.0,
      });
    }
  }

  const dt_s = 20.0;
  const sim_time_s = Math.min(sim.duration_minutes * 60.0, 3600.0 / Math.max(sim.c_rate, 0.1));
  const n_steps = Math.max(Math.floor(sim_time_s / dt_s), 10);

  const thermal_solvers = Array.from({ length: n_total_cells }, () =>
    new ThermalNetworkSolver(cell.mass_g / 1000.0, cell.specific_heat_capacity_j_kg_k)
  );

  let pcm_total_latent_j_per_cell = 0.0;
  if (module.thermal.cooling_type === 'pcm_matrix' && module.thermal.pcm.enabled) {
    pcm_total_latent_j_per_cell = (module.thermal.pcm.mass_g / n_total_cells) * module.thermal.pcm.latent_heat_j_per_g;
  }

  const time_series: TimeSeriesPoint[] = [];
  const r_busbar = module.busbar.resistance_mohm / 1000.0;

  for (let step = 0; step < n_steps; step++) {
    const t_sec = step * dt_s;

    // 1. Temperature-aware charge derating check
    const current_max_t = Math.max(...cells_data.map((c) => c.temp_c));
    let current_i_pack = i_pack_command;

    if (sim.operation_mode === 'charge' && module.thermal.derating_enabled) {
      if (current_max_t >= 45.0) {
        current_i_pack = 0.0;
      } else if (current_max_t > module.thermal.derating_temp_threshold_c) {
        const excess = current_max_t - module.thermal.derating_temp_threshold_c;
        const derate_factor = Math.max(0.1, 1.0 - excess * 0.2);
        current_i_pack = i_pack_command * derate_factor;
      }
    }

    // 2. Parallel Current Split per series group
    for (let s = 0; s < n_series; s++) {
      const c1 = cells_data[s * 2];
      const c2 = cells_data[s * 2 + 1];

      const t1_k = c1.temp_c + 273.15;
      const t2_k = c2.temp_c + 273.15;

      const r1_t = c1.r_0 * Math.exp(arrhenius_ea_k * (1.0 / t1_k - 1.0 / t_ref_k));
      const r2_t = c2.r_0 * Math.exp(arrhenius_ea_k * (1.0 / t2_k - 1.0 / t_ref_k));

      const r1_eff = r1_t + r_busbar;
      const r2_eff = r2_t + r_busbar;

      const r_sum = r1_eff + r2_eff;
      const i1 = current_i_pack * (r2_eff / r_sum);
      const i2 = current_i_pack * (r1_eff / r_sum);

      c1.i = i1;
      c2.i = i2;
      c1.r_curr = r1_eff;
      c2.r_curr = r2_eff;

      c1.q_heat_w = Math.pow(i1, 2) * r1_eff;
      c2.q_heat_w = Math.pow(i2, 2) * r2_eff;

      // Position penalty: inner cells (series 1 and 2, 0-indexed) receive slight neighbor heat
      if (s === 1 || s === 2) {
        c1.q_heat_w *= 1.08;
        c2.q_heat_w *= 1.08;
      }
    }

    // 3. Thermal update per cell
    for (let idx = 0; idx < cells_data.length; idx++) {
      const c = cells_data[idx];
      const solver = thermal_solvers[idx];
      const [new_t, new_pcm_melt_j, melt_fraction] = solver.step(
        c.temp_c,
        sim.ambient_temp_c,
        c.q_heat_w,
        dt_s,
        module.thermal.cooling_type,
        module.thermal.cell_spacing_mm,
        module.thermal.pcm.enabled,
        module.thermal.pcm.melt_point_c,
        pcm_total_latent_j_per_cell,
        c.pcm_melt_j
      );
      c.temp_c = new_t;
      c.pcm_melt_j = new_pcm_melt_j;
      c.melt_fraction = melt_fraction;

      // 4. Coulomb counting for SoC
      const delta_ah = (c.i * dt_s) / 3600.0;
      c.soc = Math.min(1.0, Math.max(0.0, c.soc + delta_ah / c.q_cap_ah));
      c.v = getOpenCircuitVoltage(c.soc) + c.i * c.r_curr;
    }

    // Log time series point every few steps
    if (step % Math.max(1, Math.floor(n_steps / 30)) === 0 || step === n_steps - 1) {
      const all_temps = cells_data.map((c) => c.temp_c);
      const all_socs = cells_data.map((c) => c.soc);

      const group_vs: number[] = [];
      for (let s = 0; s < n_series; s++) {
        const v_avg_group = (cells_data[s * 2].v + cells_data[s * 2 + 1].v) / 2.0;
        group_vs.push(v_avg_group);
      }
      const pack_v = group_vs.reduce((acc, v) => acc + v, 0);

      const avg_melt = cells_data.reduce((acc, c) => acc + (c.melt_fraction || 0), 0) / cells_data.length;

      time_series.push({
        time_s: Math.round(t_sec * 10) / 10,
        pack_voltage_v: Math.round(pack_v * 100) / 100,
        pack_current_a: Math.round(current_i_pack * 100) / 100,
        t_max_c: Math.round(Math.max(...all_temps) * 100) / 100,
        t_min_c: Math.round(Math.min(...all_temps) * 100) / 100,
        soc_pct: Math.round((all_socs.reduce((a, b) => a + b, 0) / all_socs.length) * 1000) / 10,
        pcm_melt_fraction_pct: Math.round(avg_melt * 1000) / 10,
      });
    }
  }

  // Assemble CellState list
  const cell_states: CellState[] = cells_data.map((c) => {
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    const limit = sim.operation_mode === 'charge' ? 45.0 : 60.0;
    if (c.temp_c >= limit) {
      status = 'critical';
    } else if (c.temp_c >= 40.0) {
      status = 'warning';
    }

    return {
      cell_id: c.cell_id,
      series_index: c.s,
      parallel_index: c.p,
      voltage_v: Math.round(c.v * 1000) / 1000,
      current_a: Math.round(c.i * 100) / 100,
      temperature_c: Math.round(c.temp_c * 100) / 100,
      soc_pct: Math.round(c.soc * 1000) / 10,
      soh_pct: Math.round(c.soh * 1000) / 10,
      resistance_mohm: Math.round(c.r_curr * 100000) / 100,
      heat_generation_w: Math.round(c.q_heat_w * 1000) / 1000,
      status,
    };
  });

  // Summary KPIs
  const all_temps = cell_states.map((c) => c.temperature_c);
  const peak_t = Math.max(...all_temps);
  const min_t = Math.min(...all_temps);
  const delta_t = peak_t - min_t;

  const v_nom = n_series * cell.nominal_voltage_v;
  const q_nom = n_parallel * cell.nominal_capacity_ah;
  const nominal_energy_wh = v_nom * q_nom;
  const usable_energy_wh = Math.round(nominal_energy_wh * 0.94 * 100) / 100;

  const balancing_resistor = module.passive_balancing_resistor_ohm; // 82 Ohm
  const balance_v = 4.1;
  const i_balance = balance_v / balancing_resistor; // ~0.05 A
  const balancing_heat_w = Math.pow(i_balance, 2) * balancing_resistor; // ~0.205 W
  const balancing_time_hours = Math.round((0.168 / Math.max(i_balance, 0.001)) * 100) / 100;

  const pcm_mass =
    module.thermal.cooling_type === 'pcm_matrix' && module.thermal.pcm.enabled ? module.thermal.pcm.mass_g : 0.0;
  const busbar_mass = module.busbar.material === 'copper' ? 25.0 : 15.0;
  const total_mass_g = 8 * cell.mass_g + 60.0 + module.thermal.cell_spacing_mm * 12.0 + busbar_mass + pcm_mass;

  const cell_cost = 8 * 4.5;
  const busbar_cost = module.busbar.material === 'copper' ? 4.0 : 2.5;
  const thermal_cost =
    module.thermal.cooling_type === 'pcm_matrix'
      ? 8.0
      : module.thermal.cooling_type === 'active_cooling'
      ? 15.0
      : 2.0;
  const bom_cost = cell_cost + busbar_cost + thermal_cost + 18.0;

  const limit = sim.operation_mode === 'charge' ? cell.max_charge_temp_c : cell.max_discharge_temp_c;
  const margin = limit - peak_t;
  let prob_violation = 0.5;
  if (margin <= 0) {
    prob_violation = 100.0;
  } else if (margin < 3.0) {
    prob_violation = Math.round(Math.max(5.0, 85.0 - margin * 25.0) * 10) / 10;
  } else if (margin < 6.0) {
    prob_violation = Math.round(Math.max(1.0, 20.0 - margin * 3.0) * 10) / 10;
  } else {
    prob_violation = 0.5;
  }

  const kpis: SummaryKPIs = {
    nominal_voltage_v: Math.round(v_nom * 100) / 100,
    pack_capacity_ah: Math.round(q_nom * 100) / 100,
    nominal_energy_wh: Math.round(nominal_energy_wh * 100) / 100,
    usable_energy_wh,
    peak_temperature_c: Math.round(peak_t * 100) / 100,
    min_temperature_c: Math.round(min_t * 100) / 100,
    temp_spread_delta_t_c: Math.round(delta_t * 100) / 100,
    charge_or_discharge_time_min: Math.round((sim_time_s / 60.0) * 10) / 10,
    total_mass_g: Math.round(total_mass_g * 10) / 10,
    gravimetric_energy_density_wh_kg: Math.round((usable_energy_wh / (total_mass_g / 1000.0)) * 10) / 10,
    estimated_bom_cost_usd: Math.round(bom_cost * 100) / 100,
    probability_limit_violation_pct: prob_violation,
    balancing_heat_w: Math.round(balancing_heat_w * 1000) / 1000,
    balancing_time_hours,
  };

  return [cell_states, time_series, kpis];
}
