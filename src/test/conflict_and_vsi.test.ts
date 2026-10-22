import { describe, it, expect } from 'vitest';
import { defaultCell, defaultModule, runL2Simulation } from '../services/physicsEngine';
import { detectCrossDomainConflicts } from '../services/conflictEngine';
import { computeVsiRanking } from '../services/vsiEngine';
import { SimulationConditions, ModuleTopology } from '../types/battery';

describe('AC-07: Cross-Domain Conflict Detection', () => {
  it('detects CONF-001: Requirement vs Physics conflict when charge ambient equals cell limit (45 °C)', () => {
    const simCond: SimulationConditions = {
      ambient_temp_c: 45.0,
      c_rate: 1.0,
      operation_mode: 'charge',
      duration_minutes: 45.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , kpis] = runL2Simulation(defaultCell, defaultModule, simCond);
    const conflicts = detectCrossDomainConflicts(defaultCell, defaultModule, simCond, kpis);

    const c1 = conflicts.find((c) => c.conflict_id === 'CONF-001');
    expect(c1).toBeDefined();
    expect(c1?.category).toBe('requirement_vs_physics');
    expect(c1?.severity).toBe('blocking');
    expect(c1?.explanation).toContain('requirements conflict, not a cooling shortfall');
  });

  it('detects CONF-002: Material vs Environment when PCM melt point <= Ambient', () => {
    const pcmModule: ModuleTopology = {
      ...defaultModule,
      thermal: {
        ...defaultModule.thermal,
        cooling_type: 'pcm_matrix',
        pcm: {
          enabled: true,
          melt_point_c: 42.0,
          latent_heat_j_per_g: 150.0,
          mass_g: 120.0,
          thermal_conductivity_w_m_k: 0.25,
        },
      },
    };

    // Ambient set above melt point (43 °C > 42 °C)
    const simCond: SimulationConditions = {
      ambient_temp_c: 43.0,
      c_rate: 0.5,
      operation_mode: 'charge',
      duration_minutes: 30.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , kpis] = runL2Simulation(defaultCell, pcmModule, simCond);
    const conflicts = detectCrossDomainConflicts(defaultCell, pcmModule, simCond, kpis);

    const c2 = conflicts.find((c) => c.conflict_id === 'CONF-002');
    expect(c2).toBeDefined();
    expect(c2?.category).toBe('material_vs_environment');
    expect(c2?.severity).toBe('blocking');
    expect(c2?.explanation).toContain('already completely liquid in standby');
  });

  it('detects CONF-003: IC Limit vs Topology warning for 12S pack scale-up', () => {
    const simCond: SimulationConditions = {
      ambient_temp_c: 25.0,
      c_rate: 1.0,
      operation_mode: 'charge',
      duration_minutes: 30.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , kpis] = runL2Simulation(defaultCell, defaultModule, simCond);
    const conflicts = detectCrossDomainConflicts(defaultCell, defaultModule, simCond, kpis);

    const c3 = conflicts.find((c) => c.conflict_id === 'CONF-003');
    expect(c3).toBeDefined();
    expect(c3?.category).toBe('ic_vs_topology');
    expect(c3?.suggested_resolution).toContain('distributed BMS');
  });
});

describe('AC-09: Variation Sensitivity Index (VSI)', () => {
  it('computes VSI ranking normalized by available safety margin', () => {
    const simCond: SimulationConditions = {
      ambient_temp_c: 30.0,
      c_rate: 1.0,
      operation_mode: 'charge',
      duration_minutes: 40.0,
      resistance_spread_pct: 0.0,
      capacity_spread_pct: 0.0,
      weld_resistance_mohm: 0.0,
      airflow_restriction_pct: 0.0,
    };

    const [, , nominalKpis] = runL2Simulation(defaultCell, defaultModule, simCond);
    const vsiList = computeVsiRanking(defaultCell, defaultModule, simCond, nominalKpis);

    expect(vsiList.length).toBeGreaterThanOrEqual(4);

    // Sorted descending by VSI score
    for (let i = 0; i < vsiList.length - 1; i++) {
      expect(vsiList[i].vsi_score).toBeGreaterThanOrEqual(vsiList[i + 1].vsi_score);
      expect(vsiList[i].rank).toBe(i + 1);
    }

    // Every item has valid positive delta_kpi and margin_available
    vsiList.forEach((entry) => {
      expect(entry.delta_kpi_value).toBeGreaterThanOrEqual(0);
      expect(entry.safety_margin_available).toBeGreaterThan(0);
      expect(entry.vsi_score).toBeCloseTo(entry.delta_kpi_value / entry.safety_margin_available, 2);
    });
  });
});
