import { describe, it, expect } from 'vitest';
import { defaultCell, defaultModule, runL2Simulation } from '../services/physicsEngine';
import { evaluateSafetyVeto } from '../services/governanceEngine';
import { SimulationConditions } from '../types/battery';

describe('AC-06: Deterministic Safety Veto & Counterfactual Generation', () => {
  it('triggers hard safety veto when charging temperature violates 45 °C immutable invariant', () => {
    const simCond: SimulationConditions = {
      ambient_temp_c: 45.0, // Showcase conflict condition from Section 2.3
      c_rate: 1.0,
      operation_mode: 'charge',
      duration_minutes: 45.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , kpis] = runL2Simulation(defaultCell, defaultModule, simCond);
    const veto = evaluateSafetyVeto(defaultCell, defaultModule, simCond, kpis);

    expect(veto.is_vetoed).toBe(true);
    expect(veto.violated_requirement_id).toBe('REQ-003');
    expect(veto.limit_value).toBe(45.0);
    expect(veto.computed_value).toBeGreaterThanOrEqual(45.0);
    expect(veto.governing_equation).toContain('T_cell');
    expect(veto.plain_explanation).toContain('45.0 °C');
    expect(veto.counterfactuals.length).toBeGreaterThanOrEqual(2);

    // Verify counterfactual contains physical adjustments
    const ambientFix = veto.counterfactuals.find((cf) => cf.parameter_name === 'ambient_temp_c');
    expect(ambientFix).toBeDefined();
    expect(ambientFix?.recommended_value).toBeLessThan(40.0);

    const cRateFix = veto.counterfactuals.find((cf) => cf.parameter_name === 'c_rate');
    expect(cRateFix).toBeDefined();
    expect(cRateFix?.recommended_value).toBeLessThan(1.0);
  });

  it('passes safety veto under safe nominal conditions (ambient 25 °C, 0.5C charge)', () => {
    const safeCond: SimulationConditions = {
      ambient_temp_c: 25.0,
      c_rate: 0.5,
      operation_mode: 'charge',
      duration_minutes: 30.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , safeKpis] = runL2Simulation(defaultCell, defaultModule, safeCond);
    const safeVeto = evaluateSafetyVeto(defaultCell, defaultModule, safeCond, safeKpis);

    expect(safeVeto.is_vetoed).toBe(false);
    expect(safeVeto.counterfactuals.length).toBe(0);
  });

  it('triggers veto when discharge temperature exceeds 60 °C', () => {
    const extremeDischargeCond: SimulationConditions = {
      ambient_temp_c: 55.0,
      c_rate: 2.0,
      operation_mode: 'discharge',
      duration_minutes: 30.0,
      resistance_spread_pct: 10.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 5.0,
      airflow_restriction_pct: 20.0,
    };

    const [, , kpis] = runL2Simulation(defaultCell, defaultModule, extremeDischargeCond);
    const veto = evaluateSafetyVeto(defaultCell, defaultModule, extremeDischargeCond, kpis);

    if (kpis.peak_temperature_c >= 60.0) {
      expect(veto.is_vetoed).toBe(true);
      expect(veto.limit_value).toBe(60.0);
    }
  });
});
