import { SummaryKPIs, PackRollupData } from '../types/battery';

const fallbackModuleKpis: SummaryKPIs = {
  nominal_voltage_v: 14.4,
  pack_capacity_ah: 8.4,
  nominal_energy_wh: 120.96,
  usable_energy_wh: 120.9,
  peak_temperature_c: 35.0,
  min_temperature_c: 33.8,
  temp_spread_delta_t_c: 1.2,
  charge_or_discharge_time_min: 45.0,
  total_mass_g: 580.0,
  gravimetric_energy_density_wh_kg: 208.5,
  estimated_bom_cost_usd: 62.0,
  probability_limit_violation_pct: 0.0,
  balancing_heat_w: 0.12,
  balancing_time_hours: 1.5,
};

export function computePackRollup(moduleKpis?: SummaryKPIs | null): PackRollupData {
  const kpis = moduleKpis || fallbackModuleKpis;
  const series_modules = 3; // 3x 4S2P = 12S2P
  const total_cells = 8 * series_modules; // 24 cells

  const nominal_voltage_v = Math.round(kpis.nominal_voltage_v * series_modules * 10) / 10; // 43.2 V
  const pack_capacity_ah = kpis.pack_capacity_ah; // 8.4 Ah (series strings maintain capacity)
  const nominal_energy_wh = Math.round(nominal_voltage_v * pack_capacity_ah * 100) / 100; // 362.88 Wh
  const usable_energy_wh = Math.round(kpis.usable_energy_wh * series_modules * 100) / 100;

  // Enclosure and pack auxiliary hardware mass
  const enclosure_mass_g = 1450.0; // IP67 aluminum extrusion + gasket
  const contactors_fuse_mass_g = 350.0;
  const master_bms_mass_g = 180.0;
  const pack_wiring_mass_g = 220.0;
  const total_mass_g =
    Math.round((kpis.total_mass_g * series_modules + enclosure_mass_g + contactors_fuse_mass_g + master_bms_mass_g + pack_wiring_mass_g) * 10) / 10;

  // Pack BOM cost
  const enclosure_cost_usd = 65.0;
  const master_bms_cost_usd = 45.0;
  const contactor_fuse_cost_usd = 35.0;
  const wiring_assembly_cost_usd = 20.0;
  const estimated_bom_cost_usd =
    Math.round((kpis.estimated_bom_cost_usd * series_modules + enclosure_cost_usd + master_bms_cost_usd + contactor_fuse_cost_usd + wiring_assembly_cost_usd) * 100) / 100;

  return {
    series_modules,
    total_cells,
    nominal_voltage_v,
    pack_capacity_ah,
    nominal_energy_wh,
    usable_energy_wh,
    total_mass_g,
    estimated_bom_cost_usd,
    bms_architecture: 'distributed_slave_master',
    bms_notes:
      '3x Module Slave AFEs (bq76920 monitoring 4S each) connected via daisy-chain isolated SPI to 1x Centralized Pack Master Controller. Eliminates single point of failure and handles 43.2 V total voltage.',
    thermal_enclosure_type: 'IP67 Sealed Die-Cast Aluminum Enclosure with Internal Conduction Chassis',
    protection_chain: [
      'Pyro-fuse / Fast-blow Pyrotechnic Cartridge (100 A)',
      'Dual High-Side Bidirectional Solid-State Contactors (MOSFET Array)',
      'Pre-charge Resistor & Relay Circuit (100 ms soft start)',
      'Hardware Redundant Over-Voltage Comparator Window',
      'Isolation Monitoring Interlock (IMD) for chassis leak detection',
    ],
  };
}
