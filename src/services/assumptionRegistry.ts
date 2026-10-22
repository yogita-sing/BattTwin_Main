import { EngineeringAssumption } from '../types/battery';

export const defaultAssumptions: EngineeringAssumption[] = [
  {
    id: 'ASM-001',
    name: 'Cell Baseline Internal Resistance (R_0)',
    category: 'electrical',
    value: 12.0,
    default_value: 12.0,
    unit: 'mΩ',
    valid_min: 8.0,
    valid_max: 20.0,
    source_label: '[Datasheet]',
    owner: 'Electrochemistry Team',
    dependent_models: ['L0 Sizing', 'L1 Module Lumped', 'L2 Coupled Arrhenius', 'VSI Ranking'],
    is_stale: false,
  },
  {
    id: 'ASM-002',
    name: 'Arrhenius Activation Temperature (E_a / R)',
    category: 'thermal',
    value: 1850.0,
    default_value: 1850.0,
    unit: 'K',
    valid_min: 1200.0,
    valid_max: 2500.0,
    source_label: '[Assumption]',
    owner: 'Thermal Systems Lead',
    dependent_models: ['L2 Coupled Arrhenius', 'Hot-Spot Propagation', 'Ageing Drift'],
    is_stale: false,
  },
  {
    id: 'ASM-003',
    name: 'Cell Specific Heat Capacity (C_p)',
    category: 'thermal',
    value: 950.0,
    default_value: 950.0,
    unit: 'J/kg·K',
    valid_min: 800.0,
    valid_max: 1100.0,
    source_label: '[Assumption]',
    owner: 'Thermal Systems Lead',
    dependent_models: ['L0 Adiabatic Upper Bound', 'L1 Thermal Network', 'L2 Coupled Arrhenius'],
    is_stale: false,
  },
  {
    id: 'ASM-004',
    name: 'PCM Latent Heat of Fusion (L_f)',
    category: 'thermal',
    value: 150.0,
    default_value: 150.0,
    unit: 'J/g',
    valid_min: 100.0,
    valid_max: 220.0,
    source_label: '[Datasheet]',
    owner: 'Materials Science Group',
    dependent_models: ['Option B PCM Sizing', 'Latent Buffer Saturation', 'CONF-002 Detector'],
    is_stale: false,
  },
  {
    id: 'ASM-005',
    name: 'Passive Balancing Resistor Value',
    category: 'control',
    value: 82.0,
    default_value: 82.0,
    unit: 'Ω',
    valid_min: 33.0,
    valid_max: 150.0,
    source_label: '[Datasheet]',
    owner: 'BMS Hardware Lead',
    dependent_models: ['BMS Bleed Rate (~50 mA)', 'Balancing Heat Dissipation', 'CONF-004 Detector'],
    is_stale: false,
  },
  {
    id: 'ASM-006',
    name: 'Cell Capacity Mismatch Baseline',
    category: 'electrical',
    value: 2.0,
    default_value: 2.0,
    unit: '%',
    valid_min: 0.5,
    valid_max: 6.0,
    source_label: '[Estimate]',
    owner: 'Manufacturing Quality',
    dependent_models: ['Weakest-Group Usable Energy', 'Time-to-Balance Calculation'],
    is_stale: false,
  },
  {
    id: 'ASM-007',
    name: 'Nickel Busbar Interconnect Resistance',
    category: 'mechanical',
    value: 0.85,
    default_value: 0.85,
    unit: 'mΩ',
    valid_min: 0.2,
    valid_max: 2.0,
    source_label: '[Calculated]',
    owner: 'Mechanical Packaging Lead',
    dependent_models: ['Parallel Current Imbalance', 'Busbar Joule Heating'],
    is_stale: false,
  },
];

export function updateAssumption(
  assumptions: EngineeringAssumption[],
  id: string,
  newValue: number
): { updatedAssumptions: EngineeringAssumption[]; staleModels: string[] } {
  const staleModelsSet = new Set<string>();

  const updatedAssumptions = assumptions.map((asm) => {
    if (asm.id === id) {
      const isChanged = asm.default_value !== newValue;
      if (isChanged) {
        asm.dependent_models.forEach((m) => staleModelsSet.add(m));
      }
      return {
        ...asm,
        value: newValue,
        is_stale: isChanged,
      };
    }
    return asm;
  });

  return {
    updatedAssumptions,
    staleModels: Array.from(staleModelsSet),
  };
}
