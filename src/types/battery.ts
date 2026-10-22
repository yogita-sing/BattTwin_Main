export interface CellDefinition {
  name: string;
  nominal_capacity_ah: number;
  nominal_voltage_v: number;
  internal_resistance_mohm: number;
  mass_g: number;
  specific_heat_capacity_j_kg_k: number;
  min_voltage_v: number;
  max_voltage_v: number;
  max_continuous_discharge_c: number;
  max_charge_c: number;
  max_charge_temp_c: number;
  max_discharge_temp_c: number;
  temp_veto_margin_c: number;
}

export interface BusbarSpec {
  material: 'nickel' | 'copper';
  thickness_mm: number;
  width_mm: number;
  length_mm: number;
  resistance_mohm: number;
}

export interface PcmSpec {
  enabled: boolean;
  melt_point_c: number;
  latent_heat_j_per_g: number;
  mass_g: number;
  thermal_conductivity_w_m_k: number;
}

export interface ThermalStrategy {
  cooling_type: 'baseline_passive' | 'natural_convection' | 'pcm_matrix' | 'active_cooling';
  cell_spacing_mm: number;
  pcm: PcmSpec;
  active_fan_flow_cfm: number;
  derating_enabled: boolean;
  derating_temp_threshold_c: number;
}

export interface ModuleTopology {
  series_count: number;
  parallel_count: number;
  busbar: BusbarSpec;
  thermal: ThermalStrategy;
  afe_ic_model: string;
  passive_balancing_resistor_ohm: number;
}

export interface SimulationConditions {
  ambient_temp_c: number;
  c_rate: number;
  operation_mode: 'charge' | 'discharge';
  duration_minutes: number;
  resistance_spread_pct: number;
  capacity_spread_pct: number;
  weld_resistance_mohm: number;
  airflow_restriction_pct: number;
}

export interface CellState {
  cell_id: string;
  series_index: number;
  parallel_index: number;
  voltage_v: number;
  current_a: number;
  temperature_c: number;
  soc_pct: number;
  soh_pct: number;
  resistance_mohm: number;
  heat_generation_w: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface CounterfactualFix {
  description: string;
  parameter_name: string;
  current_value: number;
  recommended_value: number;
  unit: string;
  physics_rationale: string;
}

export interface SafetyVetoResult {
  is_vetoed: boolean;
  violated_requirement_id?: string;
  violated_parameter?: string;
  computed_value?: number;
  limit_value?: number;
  unit?: string;
  governing_equation?: string;
  plain_explanation?: string;
  counterfactuals: CounterfactualFix[];
}

export interface CrossDomainConflict {
  conflict_id: string;
  category: 'requirement_vs_physics' | 'material_vs_environment' | 'ic_vs_topology' | 'heat_vs_budget' | 'sensor_vs_accuracy';
  severity: 'blocking' | 'warning';
  title: string;
  explanation: string;
  connected_domains: string[];
  suggested_resolution: string;
}

export interface SummaryKPIs {
  nominal_voltage_v: number;
  pack_capacity_ah: number;
  nominal_energy_wh: number;
  usable_energy_wh: number;
  peak_temperature_c: number;
  min_temperature_c: number;
  temp_spread_delta_t_c: number;
  charge_or_discharge_time_min: number;
  total_mass_g: number;
  gravimetric_energy_density_wh_kg: number;
  estimated_bom_cost_usd: number;
  probability_limit_violation_pct: number;
  balancing_heat_w: number;
  balancing_time_hours: number;
}

export interface TimeSeriesPoint {
  time_s: number;
  pack_voltage_v: number;
  pack_current_a: number;
  t_max_c: number;
  t_min_c: number;
  soc_pct: number;
  pcm_melt_fraction_pct: number;
}

export interface VsiEntry {
  source_name: string;
  description: string;
  delta_kpi_value: number;
  safety_margin_available: number;
  vsi_score: number;
  rank: number;
}

export interface FullSimulationOutput {
  timestamp: string;
  commit_hash: string;
  parent_hash: string;
  veto: SafetyVetoResult;
  conflicts: CrossDomainConflict[];
  kpis: SummaryKPIs;
  cells: CellState[];
  time_series: TimeSeriesPoint[];
  vsi_ranking: VsiEntry[];
  compliance_summary: Record<string, boolean>;
}

export interface LearningChallenge {
  id: string;
  title: string;
  concept: string;
  story: string;
  governing_equation: string;
  target_sliders: Array<{
    name: string;
    default: number;
    min: number;
    max: number;
    step: number;
    unit: string;
  }>;
  trap_explanation: string;
  counterfactual_solution: string;
}

export interface OptionComparisonItem {
  name: string;
  peak_temperature_c: number;
  temp_spread_c: number;
  usable_energy_wh: number;
  charge_time_min: number;
  mass_g: number;
  cost_usd: number;
  prob_violation_pct: number;
  topsis_score: number;
}

export interface CommitRecord {
  commit_hash: string;
  parent_hash: string;
  content_hash: string;
  timestamp: string;
  author: string;
  message: string;
  data_summary: {
    c_rate?: number;
    ambient_temp_c?: number;
    cooling_type?: string;
    is_vetoed?: boolean;
  };
}
