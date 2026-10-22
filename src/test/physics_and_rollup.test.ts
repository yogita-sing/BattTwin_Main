import { describe, it, expect } from 'vitest';
import {
  defaultCell,
  defaultModule,
  runL0Screening,
  runL2Simulation,
  getOpenCircuitVoltage,
} from '../services/physicsEngine';
import { computePackRollup } from '../services/packRollupEngine';
import { SimulationConditions } from '../types/battery';

describe('AC-03: Pack Topology & Electrical Sizing', () => {
  it('correctly calculates 4S2P module nominal values (14.4 V, 8.4 Ah, 120.96 Wh)', () => {
    const l0 = runL0Screening(defaultCell, defaultModule, 1.0);

    expect(l0.nominal_voltage_v).toBe(14.4);
    expect(l0.nominal_capacity_ah).toBe(8.4);
    expect(l0.nominal_energy_wh).toBe(120.96);
  });

  it('correctly calculates 12S2P pack scale-up values (43.2 V, 8.4 Ah, 362.88 Wh)', () => {
    const l0 = runL0Screening(defaultCell, defaultModule, 1.0);
    const rollup = computePackRollup({
      nominal_voltage_v: l0.nominal_voltage_v,
      pack_capacity_ah: l0.nominal_capacity_ah,
      nominal_energy_wh: l0.nominal_energy_wh,
      usable_energy_wh: 120.9,
      peak_temperature_c: 35.0,
      min_temperature_c: 34.0,
      temp_spread_delta_t_c: 1.0,
      charge_or_discharge_time_min: 45.0,
      total_mass_g: 580.0,
      gravimetric_energy_density_wh_kg: 208.5,
      estimated_bom_cost_usd: 62.0,
      probability_limit_violation_pct: 0.0,
      balancing_heat_w: 0.12,
      balancing_time_hours: 1.5,
    });

    expect(rollup.series_modules).toBe(3);
    expect(rollup.total_cells).toBe(24);
    expect(rollup.nominal_voltage_v).toBe(43.2);
    expect(rollup.pack_capacity_ah).toBe(8.4);
    expect(rollup.nominal_energy_wh).toBe(362.88);
    expect(rollup.bms_architecture).toBe('distributed_slave_master');
  });
});

describe('AC-04 & AC-05: Physics & Thermal Screening', () => {
  it('reproduces Section 9.2 L0 adiabatic thermal screening values', () => {
    const l0 = runL0Screening(defaultCell, defaultModule, 1.0);

    // Cell thermal mass: 0.070 kg * 950 J/kg·K = 66.5 J/K
    expect(l0.cell_heat_capacity_j_per_k).toBe(66.5);

    // Joule heat at 1C (4.2 A): 4.2^2 * 0.012 = 0.21168 W ~ 0.212 W
    expect(l0.heat_per_cell_w).toBeCloseTo(0.212, 2);

    // Adiabatic temp rise: 762 J / 66.5 J/K = 11.46 K ~ 11.5 K
    expect(l0.adiabatic_temp_rise_k).toBeCloseTo(11.5, 1);

    // PCM mass required for 150 J/g buffer: ~41 g
    expect(l0.pcm_mass_needed_g).toBeCloseTo(40.6, 0);

    // Run time is well under 1 second (< 100 ms)
    expect(l0.execution_time_ms).toBeLessThan(100);
  });

  it('correctly models parallel current split and Arrhenius thermal feedback in L2 simulation', () => {
    const simCond: SimulationConditions = {
      ambient_temp_c: 25.0,
      c_rate: 1.0,
      operation_mode: 'discharge',
      duration_minutes: 30.0,
      resistance_spread_pct: 25.0, // 25% spread between parallel branches
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [cells, , kpis] = runL2Simulation(defaultCell, defaultModule, simCond);

    expect(cells.length).toBe(8);

    // In each series pair, branch P1 has lower R, so it carries more current
    const cell1 = cells[0]; // P1
    const cell2 = cells[1]; // P2

    expect(cell1.resistance_mohm).toBeLessThan(cell2.resistance_mohm);
    expect(Math.abs(cell1.current_a)).toBeGreaterThan(Math.abs(cell2.current_a));
    expect(cell1.heat_generation_w).toBeGreaterThan(cell2.heat_generation_w);

    // Total group current equals pack current (8.4 A at 1C)
    const totalGroupCurrent = Math.abs(cell1.current_a) + Math.abs(cell2.current_a);
    expect(totalGroupCurrent).toBeCloseTo(8.4, 1);
  });

  it('evaluates OCV curve monotonically between 0 and 100% SoC', () => {
    const ocv0 = getOpenCircuitVoltage(0.0);
    const ocv50 = getOpenCircuitVoltage(0.5);
    const ocv100 = getOpenCircuitVoltage(1.0);

    expect(ocv0).toBeLessThan(ocv50);
    expect(ocv50).toBeLessThan(ocv100);
    expect(ocv100).toBeGreaterThanOrEqual(4.1);
  });
});
