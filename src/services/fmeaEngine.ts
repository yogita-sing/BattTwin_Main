import { FmeaFaultItem } from '../types/battery';

export const defaultFmeaFaults: FmeaFaultItem[] = [
  {
    id: 'FLT-001',
    name: 'Thermistor Offset / Sensor Drift (+3.5 °C)',
    category: 'sensor',
    description: 'NTC sensor adhesive degradation introduces a +3.5 °C positive thermal offset',
    injected: false,
    injected_value: 3.5,
    unit: '°C',
    measured_reaction_ms: 45,
    allowed_ftti_ms: 100,
    safe_state_achieved: true,
    diagnostic_coverage_pct: 94.5,
    rpn_score: 54, // S=6, O=3, D=3
    mitigation_strategy: 'Cross-sensor plausibility check comparing neighboring NTC readings across series groups.',
  },
  {
    id: 'FLT-002',
    name: 'Stuck NTC Thermistor (Reads Ambient 25 °C Constant)',
    category: 'sensor',
    description: 'Open-circuit or ADC latch causes temperature sensor to report static 25 °C while cell overheats',
    injected: false,
    injected_value: 25.0,
    unit: '°C',
    measured_reaction_ms: 82,
    allowed_ftti_ms: 100,
    safe_state_achieved: true,
    diagnostic_coverage_pct: 98.2,
    rpn_score: 72, // S=9, O=2, D=4
    mitigation_strategy: 'Dynamic gradient check: dT/dt must correlate with pack current squared (I²R thermal model).',
  },
  {
    id: 'FLT-003',
    name: 'Spot Weld Interconnect Fracture (+25 mΩ Resistance)',
    category: 'connection',
    description: 'Vibration fracture creates 25 mΩ contact resistance on Cell S1-P2 busbar weld',
    injected: false,
    injected_value: 25.0,
    unit: 'mΩ',
    measured_reaction_ms: 60,
    allowed_ftti_ms: 120,
    safe_state_achieved: true,
    diagnostic_coverage_pct: 91.0,
    rpn_score: 112, // S=7, O=4, D=4
    mitigation_strategy: 'Parallel branch impedance mismatch detection during charging current ramp.',
  },
  {
    id: 'FLT-004',
    name: 'Protection Contactor Trip Stiction / Delay',
    category: 'actuator',
    description: 'MOSFET gate driver delay or contactor coil lag delays disconnection beyond standard window',
    injected: false,
    injected_value: 115,
    unit: 'ms',
    measured_reaction_ms: 115,
    allowed_ftti_ms: 100,
    safe_state_achieved: false, // Fails FTTI!
    diagnostic_coverage_pct: 88.0,
    rpn_score: 180, // S=10, O=3, D=6
    mitigation_strategy: 'Secondary pyrofuse blow command triggered independently by hardware comparator.',
  },
  {
    id: 'FLT-005',
    name: 'Thermal Fan / Active Cooling Stalling',
    category: 'thermal',
    description: 'Cooling fan rotor locks due to debris or motor driver phase loss',
    injected: false,
    injected_value: 0.0,
    unit: 'CFM',
    measured_reaction_ms: 90,
    allowed_ftti_ms: 500,
    safe_state_achieved: true,
    diagnostic_coverage_pct: 96.0,
    rpn_score: 60, // S=5, O=3, D=4
    mitigation_strategy: 'Tachometer feedback sensor + automatic continuous charge current derating to 0.4C.',
  },
];

export function evaluateFmeaState(faults: FmeaFaultItem[]): {
  overall_status: 'safe' | 'critical_breach' | 'warning';
  active_faults_count: number;
  ftti_violations: string[];
} {
  const active = faults.filter((f) => f.injected);
  const ftti_violations = active
    .filter((f) => f.measured_reaction_ms > f.allowed_ftti_ms || !f.safe_state_achieved)
    .map((f) => `${f.name} (Reaction: ${f.measured_reaction_ms}ms > Allowed FTTI: ${f.allowed_ftti_ms}ms)`);

  let overall_status: 'safe' | 'critical_breach' | 'warning' = 'safe';
  if (ftti_violations.length > 0) {
    overall_status = 'critical_breach';
  } else if (active.length > 0) {
    overall_status = 'warning';
  }

  return {
    overall_status,
    active_faults_count: active.length,
    ftti_violations,
  };
}
