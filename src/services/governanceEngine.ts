import {
  CellDefinition,
  ModuleTopology,
  SimulationConditions,
  SafetyVetoResult,
  CounterfactualFix,
  SummaryKPIs,
} from '../types/battery';
import { defaultCell } from './physicsEngine';

export function evaluateSafetyVeto(
  cell: CellDefinition = defaultCell,
  module: ModuleTopology,
  sim: SimulationConditions,
  kpis: SummaryKPIs
): SafetyVetoResult {
  let is_vetoed = false;
  let violated_req: string | undefined = undefined;
  let violated_param: string | undefined = undefined;
  let computed_val: number | undefined = undefined;
  let limit_val: number | undefined = undefined;
  let unit: string | undefined = undefined;
  let equation: string | undefined = undefined;
  let explanation: string | undefined = undefined;
  const counterfactuals: CounterfactualFix[] = [];

  // Check 1: Charging Temperature Invariant (REQ-003)
  if (sim.operation_mode === 'charge') {
    if (kpis.peak_temperature_c >= cell.max_charge_temp_c) {
      is_vetoed = true;
      violated_req = 'REQ-003';
      violated_param = 'Peak Cell Charge Temperature';
      computed_val = kpis.peak_temperature_c;
      limit_val = cell.max_charge_temp_c;
      unit = '°C';
      equation = 'T_cell = T_amb + ΔT(I²R, R_th, PCM) ≤ 45.0 °C';
      explanation = `Peak cell temperature during charging reached ${kpis.peak_temperature_c.toFixed(
        1
      )} °C, which breaches the immutable cell datasheet limit of ${cell.max_charge_temp_c.toFixed(
        1
      )} °C. Lithium plating and accelerated degradation risk.`;

      // Counterfactual Fix 1: Reduce Ambient Temperature
      const needed_ambient = Math.max(
        20.0,
        sim.ambient_temp_c - (kpis.peak_temperature_c - cell.max_charge_temp_c + 2.0)
      );
      counterfactuals.push({
        description: 'Lower charging ambient design point',
        parameter_name: 'ambient_temp_c',
        current_value: sim.ambient_temp_c,
        recommended_value: Math.round(needed_ambient * 10) / 10,
        unit: '°C',
        physics_rationale: `Directly lowers baseline thermal reservoir so peak stays under ${cell.max_charge_temp_c} °C.`,
      });

      // Counterfactual Fix 2: Reduce Charge C-rate
      const excess_t = kpis.peak_temperature_c - cell.max_charge_temp_c + 1.0;
      const fraction_reduction = Math.min(0.6, excess_t / 15.0);
      const recommended_c_rate = Math.max(0.4, Math.round(sim.c_rate * (1.0 - fraction_reduction) * 100) / 100);
      counterfactuals.push({
        description: 'Derate charge C-rate',
        parameter_name: 'c_rate',
        current_value: sim.c_rate,
        recommended_value: recommended_c_rate,
        unit: 'C',
        physics_rationale: `Joule heating scales with I². Reducing C-rate to ${recommended_c_rate}C drops heat generation by ~${Math.round(
          (1 - Math.pow(recommended_c_rate / sim.c_rate, 2)) * 100
        )}%.`,
      });

      // Counterfactual Fix 3: Enable temperature derating
      if (!module.thermal.derating_enabled) {
        counterfactuals.push({
          description: 'Enable firmware temperature-aware charge derating',
          parameter_name: 'derating_enabled',
          current_value: 0.0,
          recommended_value: 1.0,
          unit: 'bool',
          physics_rationale: 'BMS automatically tapers current above 40 °C, preventing thermal overshoot.',
        });
      }

      // Counterfactual Fix 4: Thermal management upgrade
      if (module.thermal.cooling_type === 'baseline_passive') {
        counterfactuals.push({
          description: 'Upgrade to PCM matrix or active cooling',
          parameter_name: 'cooling_type',
          current_value: 0.0,
          recommended_value: 1.0,
          unit: 'enum',
          physics_rationale: 'PCM latent heat absorbs heat during CC-CV charging phase, keeping temperature clamped.',
        });
      }
    }
  } else if (sim.operation_mode === 'discharge') {
    // Check 2: Discharge Temperature Invariant (REQ-003)
    if (kpis.peak_temperature_c >= cell.max_discharge_temp_c) {
      is_vetoed = true;
      violated_req = 'REQ-003';
      violated_param = 'Peak Cell Discharge Temperature';
      computed_val = kpis.peak_temperature_c;
      limit_val = cell.max_discharge_temp_c;
      unit = '°C';
      equation = 'T_cell ≤ 60.0 °C (Discharge Limit)';
      explanation = `Peak cell temperature during discharge reached ${kpis.peak_temperature_c.toFixed(
        1
      )} °C, violating the 60.0 °C continuous safety threshold.`;
      counterfactuals.push({
        description: 'Reduce continuous discharge C-rate',
        parameter_name: 'c_rate',
        current_value: sim.c_rate,
        recommended_value: Math.round(sim.c_rate * 0.75 * 100) / 100,
        unit: 'C',
        physics_rationale: 'Reduces I²R heat dissipation across cell and busbar resistance.',
      });
    }
  }

  return {
    is_vetoed,
    violated_requirement_id: violated_req,
    violated_parameter: violated_param,
    computed_value: computed_val,
    limit_value: limit_val,
    unit,
    governing_equation: equation,
    plain_explanation: explanation,
    counterfactuals,
  };
}
