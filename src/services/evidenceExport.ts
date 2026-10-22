import { FullSimulationOutput } from '../types/battery';

export function generateEvidenceDossierMarkdown(payload: FullSimulationOutput): string {
  const vetoStatus = payload.veto.is_vetoed
    ? 'BLOCKED (SAFETY VETO TRIGGERED)'
    : 'PASSED (COMPLIANT)';

  let mdContent = `# BattTwin Certified Engineering Evidence Dossier
Generated: ${payload.timestamp}
Commit Hash: \`${payload.commit_hash}\`
Parent Hash: \`${payload.parent_hash}\`

---

## 1. Safety Status: ${vetoStatus}
`;

  if (payload.veto.is_vetoed) {
    mdContent += `
> **VIOLATION:** ${payload.veto.violated_requirement_id} - ${payload.veto.violated_parameter}
> **Computed Value:** ${payload.veto.computed_value} ${payload.veto.unit} (Limit: ${payload.veto.limit_value} ${payload.veto.unit})
> **Governing Equation:** \`${payload.veto.governing_equation}\`
> **Cause:** ${payload.veto.plain_explanation}

### Recommended Counterfactual Physical Fixes:
`;
    for (const cf of payload.veto.counterfactuals) {
      mdContent += `- **${cf.description}:** Change \`${cf.parameter_name}\` from ${cf.current_value} to **${cf.recommended_value} ${cf.unit}**. *Rationale: ${cf.physics_rationale}*\n`;
    }
  } else {
    mdContent += 'All immutable safety invariants and compliance rules passed without violation.\n';
  }

  mdContent += `
---

## 2. Key Performance Indicators (KPIs)
- **Nominal Energy:** ${payload.kpis.nominal_energy_wh.toFixed(2)} Wh
- **Usable Energy:** ${payload.kpis.usable_energy_wh.toFixed(2)} Wh
- **Peak Temperature:** ${payload.kpis.peak_temperature_c.toFixed(2)} °C
- **Cell-to-Cell Temperature Spread (ΔT):** ${payload.kpis.temp_spread_delta_t_c.toFixed(2)} °C
- **Total Module Mass:** ${payload.kpis.total_mass_g.toFixed(1)} g
- **Gravimetric Energy Density:** ${payload.kpis.gravimetric_energy_density_wh_kg.toFixed(1)} Wh/kg
- **Estimated BOM Cost:** $${payload.kpis.estimated_bom_cost_usd.toFixed(2)} USD
- **Probability of Limit Violation:** ${payload.kpis.probability_limit_violation_pct.toFixed(1)}%

---

## 3. Variation Sensitivity Index (VSI) Ranking
Ranked by fraction of nominal safety margin consumed:

`;

  for (const vsi of payload.vsi_ranking) {
    mdContent += `| #${vsi.rank} | **${vsi.source_name}** | ΔKPI: ${vsi.delta_kpi_value} °C | Margin Left: ${vsi.safety_margin_available} °C | **VSI: ${vsi.vsi_score.toFixed(3)}** |\n`;
  }

  mdContent += `
---

## 4. Bill of Materials (BOM)
- 8x Lithium-Ion 21700 Cylindrical Cells (4.2 Ah, 12 mΩ)
- 1x 4S Nickel/Copper Busbar Interconnect Set
- 1x Structural Cell Holder Frame (FR-4 / ABS)
- 1x BMS Slave Front-End Board with Passive Balancing Resistors (82 Ω)
- 1x Thermal Management Kit (PCM Matrix or Convection Spacers)

---
*Signed and Chained by BattTwin Deterministic Governance Core.*
`;

  return mdContent;
}

export function downloadEvidenceDossier(payload: FullSimulationOutput): void {
  const mdContent = generateEvidenceDossierMarkdown(payload);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BattTwin_Evidence_Commit_${payload.commit_hash.slice(0, 8)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
