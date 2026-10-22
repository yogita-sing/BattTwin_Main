import { describe, it, expect } from 'vitest';
import { CommitChainManager } from '../services/commitManager';
import { generateEvidenceDossierMarkdown } from '../services/evidenceExport';
import { FullSimulationOutput } from '../types/battery';

describe('AC-11: Immutable Audit Trail & Git-Style SHA-256 Commit History', () => {
  it('correctly creates chained commits with genesis and parent hash chaining', () => {
    const manager = new CommitChainManager();

    expect(manager.currentParentHash).toBe(CommitChainManager.GENESIS_HASH);

    const commit1 = manager.createCommit(
      { test_key: 'value1', ambient_temp_c: 25.0 },
      'Engineer-1',
      'Initial baseline module commit'
    );

    expect(commit1.parent_hash).toBe(CommitChainManager.GENESIS_HASH);
    expect(commit1.commit_hash).toHaveLength(64); // Valid 64-char hex SHA-256
    expect(manager.currentParentHash).toBe(commit1.commit_hash);

    const commit2 = manager.createCommit(
      { test_key: 'value2', ambient_temp_c: 35.0 },
      'Engineer-1',
      'Second design iteration'
    );

    expect(commit2.parent_hash).toBe(commit1.commit_hash);
    expect(commit2.commit_hash).toHaveLength(64);
    expect(commit2.commit_hash).not.toBe(commit1.commit_hash);
    expect(manager.history.length).toBe(2);
  });

  it('guarantees deterministic hashing for identical content', () => {
    const manager = new CommitChainManager();
    const hashA = manager.computeContentHash({ a: 1, b: 2, c: 'test' });
    const hashB = manager.computeContentHash({ c: 'test', b: 2, a: 1 }); // different key order

    expect(hashA).toBe(hashB);
  });
});

describe('AC-12: Evidence Dossier & Artifact Export', () => {
  it('generates a compliant markdown evidence dossier with signed hash and KPIs', () => {
    const mockOutput: FullSimulationOutput = {
      timestamp: '2026-10-22T10:00:00Z',
      commit_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      parent_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      veto: {
        is_vetoed: false,
        counterfactuals: [],
      },
      conflicts: [],
      kpis: {
        nominal_voltage_v: 14.4,
        pack_capacity_ah: 8.4,
        nominal_energy_wh: 120.96,
        usable_energy_wh: 120.9,
        peak_temperature_c: 34.2,
        min_temperature_c: 33.1,
        temp_spread_delta_t_c: 1.1,
        charge_or_discharge_time_min: 45.0,
        total_mass_g: 580.0,
        gravimetric_energy_density_wh_kg: 208.5,
        estimated_bom_cost_usd: 62.0,
        probability_limit_violation_pct: 0.5,
        balancing_heat_w: 0.12,
        balancing_time_hours: 1.5,
      },
      cells: [],
      time_series: [],
      vsi_ranking: [
        {
          source_name: 'Cell Resistance Spread (±15%)',
          description: 'Manufacturing batch tolerance',
          delta_kpi_value: 1.8,
          safety_margin_available: 10.8,
          vsi_score: 0.167,
          rank: 1,
        },
      ],
      compliance_summary: {
        IEC_62133_2: true,
        AIS_156: true,
      },
    };

    const dossier = generateEvidenceDossierMarkdown(mockOutput);

    expect(dossier).toContain('BattTwin Certified Engineering Evidence Dossier');
    expect(dossier).toContain(mockOutput.commit_hash);
    expect(dossier).toContain('120.96 Wh');
    expect(dossier).toContain('PASSED (COMPLIANT)');
    expect(dossier).toContain('Variation Sensitivity Index (VSI) Ranking');
    expect(dossier).toContain('Bill of Materials (BOM)');
  });
});
