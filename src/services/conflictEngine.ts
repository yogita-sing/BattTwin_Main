import {
  CellDefinition,
  ModuleTopology,
  SimulationConditions,
  CrossDomainConflict,
  SummaryKPIs,
} from '../types/battery';
import { defaultCell } from './physicsEngine';

export function detectCrossDomainConflicts(
  cell: CellDefinition = defaultCell,
  module: ModuleTopology,
  sim: SimulationConditions,
  kpis: SummaryKPIs
): CrossDomainConflict[] {
  const conflicts: CrossDomainConflict[] = [];

  // Conflict 1: Requirement vs Physics (Charging Ambient >= Cell Charge Limit)
  if (sim.operation_mode === 'charge' && sim.ambient_temp_c >= cell.max_charge_temp_c) {
    conflicts.push({
      conflict_id: 'CONF-001',
      category: 'requirement_vs_physics',
      severity: 'blocking',
      title: 'Charge Ambient Reaches or Exceeds Cell Charge Limit',
      explanation: `Charging ambient condition is set to ${sim.ambient_temp_c.toFixed(
        1
      )} °C, while the cell manufacturer datasheet limits charging to ${cell.max_charge_temp_c.toFixed(
        1
      )} °C. Even with zero Joule heating (adiabatic), the cell is already at or above its absolute safety ceiling! This is a requirements conflict, not a cooling shortfall.`,
      connected_domains: ['Operating Requirements', 'Electrochemistry Datasheet', 'Thermal Environment'],
      suggested_resolution: 'Lower ambient charging design point to ≤ 35 °C, or add mandatory pre-cooling.',
    });
  }

  // Conflict 2: Material vs Environment (PCM melt point <= Ambient)
  if (module.thermal.cooling_type === 'pcm_matrix' && module.thermal.pcm.enabled) {
    if (sim.ambient_temp_c >= module.thermal.pcm.melt_point_c) {
      conflicts.push({
        conflict_id: 'CONF-002',
        category: 'material_vs_environment',
        severity: 'blocking',
        title: 'PCM Material Saturated / Molten Before Charging Starts',
        explanation: `Selected PCM has a melting point of ${module.thermal.pcm.melt_point_c.toFixed(
          1
        )} °C, but ambient temperature is ${sim.ambient_temp_c.toFixed(
          1
        )} °C. The PCM is already completely liquid in standby and cannot absorb latent heat!`,
        connected_domains: ['Materials Science (PCM)', 'Environmental Specifications'],
        suggested_resolution: `Select a PCM with melting point between ambient (${sim.ambient_temp_c.toFixed(
          1
        )} °C) and cell limit (${cell.max_charge_temp_c.toFixed(1)} °C), or lower the ambient spec.`,
      });
    }
  }

  // Conflict 3: IC Limit vs Topology (AFE series cell monitoring mismatch)
  if (module.afe_ic_model.includes('5-Series') && module.series_count * 3 === 12) {
    conflicts.push({
      conflict_id: 'CONF-003',
      category: 'ic_vs_topology',
      severity: 'warning',
      title: 'AFE Channel Limit vs Scaled 12S Pack Topology',
      explanation:
        'Selected BMS Analogue Front-End IC (TI bq76920 class) supports up to 5 series cells. While fully compatible with this 4S module, the scaled 12S2P pack requires a distributed BMS architecture (3x module slave AFEs + 1x pack master controller) rather than a single centralized AFE.',
      connected_domains: ['Electronics / BMS Hardware', 'System Packaging Architecture'],
      suggested_resolution: 'Confirm distributed BMS slave-master topology in system architectural documentation.',
    });
  }

  // Conflict 4: Heat Source vs Thermal Budget (Passive balancing in sealed baseline pack)
  if (module.thermal.cooling_type === 'baseline_passive' && kpis.balancing_heat_w > 0.18) {
    conflicts.push({
      conflict_id: 'CONF-004',
      category: 'heat_vs_budget',
      severity: 'warning',
      title: 'Balancing Resistor Heat Dissipation in Unventilated Module',
      explanation: `Passive balancing generates ~${(kpis.balancing_heat_w * 4).toFixed(
        2
      )} W continuous heat across 4 groups. In a tightly packed passive enclosure with 1 mm spacing, balancing during CV taper can raise local cell temperatures by 1.5–3 °C.`,
      connected_domains: ['BMS Control Logic', 'Thermal Enclosure'],
      suggested_resolution:
        'Increase cell spacing to ≥ 3 mm, move balancing resistors to external heatsink trace, or lower balance current.',
    });
  }

  // Conflict 5: Cell-to-Cell Temperature Gradient Exceeds AIS-156 Target
  if (kpis.temp_spread_delta_t_c > 5.0) {
    conflicts.push({
      conflict_id: 'CONF-005',
      category: 'requirement_vs_physics',
      severity: 'warning',
      title: 'Cell-to-Cell Temperature Spread Exceeds 5 °C Limit',
      explanation: `Maximum temperature delta between cells reached ${kpis.temp_spread_delta_t_c.toFixed(
        1
      )} °C (target ≤ 5.0 °C). Unequal temperatures cause uneven degradation rates, accelerating capacity divergence between parallel cells.`,
      connected_domains: ['Thermal Network', 'Ageing Propagation', 'Regulatory Standards'],
      suggested_resolution:
        'Add conductive thermal pads or upgrade to PCM matrix to equilibrate cell temperatures.',
    });
  }

  return conflicts;
}
