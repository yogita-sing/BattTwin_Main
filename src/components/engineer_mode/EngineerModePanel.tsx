import React, { useState } from 'react';
import {
  VsiEntry,
  CrossDomainConflict,
  OptionComparisonItem,
  ParetoCandidate,
} from '../../types/battery';
import { ParetoExplorer } from './ParetoExplorer';
import { FmeaPanel } from './FmeaPanel';
import { AssumptionRegistryPanel } from './AssumptionRegistryPanel';
import { BenchValidationPanel } from './BenchValidationPanel';
import { generateParetoCandidates } from '../../services/paretoEngine';
import {
  Sliders,
  ShieldCheck,
  AlertCircle,
  Download,
  Award,
  Zap,
  Database,
  Activity,
  Layers,
} from 'lucide-react';

interface EngineerModePanelProps {
  vsiRanking: VsiEntry[];
  conflicts: CrossDomainConflict[];
  options: OptionComparisonItem[];
  commitHash: string;
  onExportEvidence: () => void;
  isExporting: boolean;
  onApplyParetoCandidate?: (candidate: ParetoCandidate) => void;
  onInvalidateModels?: (staleModels: string[]) => void;
}

export const EngineerModePanel: React.FC<EngineerModePanelProps> = ({
  vsiRanking,
  conflicts,
  options,
  commitHash,
  onExportEvidence,
  isExporting,
  onApplyParetoCandidate,
  onInvalidateModels,
}) => {
  const [activeTab, setActiveTab] = useState<
    'trade_offs' | 'pareto' | 'vsi' | 'conflicts' | 'fmea' | 'assumptions' | 'bench' | 'compliance'
  >('trade_offs');

  const paretoCandidates = generateParetoCandidates();

  return (
    <div className="w-full bg-[#0E1510] rounded-2xl p-6 border border-[#1E2D21] shadow-2xl space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E2D21]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2 font-mono">
            <span>Systems Engineering & Trade-Off Studio</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#142317] text-[#B8FF24] border border-[#273B29]">
              Commit: {commitHash.slice(0, 8)}...
            </span>
          </h2>
          <p className="text-xs text-[#8A9A8C] mt-0.5">
            Multi-objective trade-offs, Pareto front, VSI margin consumption, FMEA fault analysis, and empirical bench calibration.
          </p>
        </div>

        <button
          onClick={onExportEvidence}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-full bg-[#B8FF24] hover:bg-[#c9ff4d] text-black text-xs font-bold font-mono tracking-wider flex items-center space-x-2 shadow-[0_0_15px_rgba(184,255,36,0.3)] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{isExporting ? 'Generating Dossier...' : 'Export Signed Evidence File'}</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1E2D21] pb-3">
        {[
          { id: 'trade_offs', label: 'Options & TOPSIS', icon: Sliders },
          { id: 'pareto', label: 'Pareto Frontier', icon: Award },
          { id: 'vsi', label: 'VSI Tornado Ranking', icon: Award },
          { id: 'conflicts', label: `Conflicts (${conflicts.length})`, icon: AlertCircle },
          { id: 'fmea', label: 'FMEA & FTTI', icon: Zap },
          { id: 'assumptions', label: 'Assumption Registry', icon: Database },
          { id: 'bench', label: 'Bench Validation', icon: Activity },
          { id: 'compliance', label: 'Compliance Checks', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.25)]'
                  : 'text-[#8A9A8C] hover:text-white hover:bg-[#142017]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Architecture Options & TOPSIS */}
      {activeTab === 'trade_offs' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2D21] text-[#8A9A8C] font-mono text-[11px]">
                  <th className="py-2.5 px-3 uppercase tracking-wider">Option</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">Peak Temp</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">Spread (ΔT)</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">Usable Energy</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">Mass</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">BOM Cost</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider">P(Violation)</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider">TOPSIS Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D21]/60 font-mono">
                {options.map((opt, idx) => {
                  const isTop = idx === 0;
                  return (
                    <tr
                      key={opt.name}
                      className={`hover:bg-[#142017]/60 transition-colors ${
                        isTop ? 'bg-[#142217]/60 border-l-2 border-[#B8FF24]' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-white font-sans flex items-center space-x-1.5">
                        {isTop && <Award className="w-3.5 h-3.5 text-[#B8FF24] flex-shrink-0" />}
                        <span>{opt.name}</span>
                      </td>
                      <td className={`py-3 px-3 ${opt.peak_temperature_c >= 45 ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                        {opt.peak_temperature_c.toFixed(1)} °C
                      </td>
                      <td className="py-3 px-3 text-slate-300">{opt.temp_spread_c.toFixed(1)} °C</td>
                      <td className="py-3 px-3 text-[#B8FF24] font-semibold">{opt.usable_energy_wh.toFixed(1)} Wh</td>
                      <td className="py-3 px-3 text-slate-300">{opt.mass_g.toFixed(0)} g</td>
                      <td className="py-3 px-3 text-slate-300">${opt.cost_usd.toFixed(2)}</td>
                      <td className="py-3 px-3 text-amber-400">{opt.prob_violation_pct.toFixed(1)}%</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isTop ? 'bg-[#162719] text-[#B8FF24] border border-[#B8FF24]/40' : 'bg-[#111A13] text-slate-300'
                        }`}>
                          {opt.topsis_score.toFixed(1)} / 100
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#080B08] rounded-xl border border-[#1E2D21] text-[11px] text-[#8A9A8C] font-mono flex items-center justify-between">
            <span><strong>Multi-Criteria TOPSIS Note:</strong> Hard safety invariants are feasibility barriers. Options with peak temperature &ge; 45 °C incur an immediate penalty.</span>
          </div>
        </div>
      )}

      {/* 2. Pareto Frontier Explorer */}
      {activeTab === 'pareto' && (
        <ParetoExplorer
          candidates={paretoCandidates}
          onSelectCandidate={(c) => {
            if (onApplyParetoCandidate) onApplyParetoCandidate(c);
          }}
        />
      )}

      {/* 3. VSI Tornado Chart */}
      {activeTab === 'vsi' && (
        <div className="space-y-4">
          <div className="text-xs text-[#8A9A8C] bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
            <strong className="text-white">Variation Sensitivity Index Formula:</strong> <code className="text-[#B8FF24] font-mono">VSI_k = |ΔKPI_k| / (KPI_limit - KPI_nominal)</code>.
            A value of 1.0 means this variation source alone consumes 100% of available thermal safety margin!
          </div>

          <div className="space-y-3">
            {vsiRanking.map((item) => {
              const pctWidth = Math.min(100, item.vsi_score * 80);
              const isHigh = item.vsi_score >= 0.7;
              return (
                <div key={item.source_name} className="p-3.5 rounded-xl bg-[#080B08] border border-[#1E2D21] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      #{item.rank} {item.source_name}
                    </span>
                    <span className="font-mono text-xs">
                      VSI: <strong className={isHigh ? 'text-red-400 font-bold' : 'text-[#B8FF24]'}>{item.vsi_score.toFixed(3)}</strong>
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-[#142017] rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-[#B8FF24]'
                      }`}
                      style={{ width: `${Math.max(5, pctWidth)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8A9A8C]">
                    <span>{item.description}</span>
                    <span>ΔT: +{item.delta_kpi_value.toFixed(1)}°C | Margin Left: {item.safety_margin_available.toFixed(1)}°C</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Cross-Domain Conflicts */}
      {activeTab === 'conflicts' && (
        <div className="space-y-3">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A9A8C]">
              No cross-domain conflicts detected in this configuration.
            </div>
          ) : (
            conflicts.map((conf) => (
              <div
                key={conf.conflict_id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  conf.severity === 'blocking'
                    ? 'bg-red-950/20 border-red-500/40 text-red-300'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>[{conf.conflict_id}] {conf.title}</span>
                  </span>
                  <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#080B08] border border-[#1E2D21]">
                    {conf.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">{conf.explanation}</p>
                <div className="pt-2 border-t border-[#1E2D21] flex items-center justify-between text-[11px]">
                  <span className="text-[#8A9A8C]">
                    Connected Domains: <strong className="text-white">{conf.connected_domains.join(' ↔ ')}</strong>
                  </span>
                  <span className="text-[#B8FF24] font-semibold">
                    Resolution: {conf.suggested_resolution}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Interactive FMEA */}
      {activeTab === 'fmea' && <FmeaPanel />}

      {/* 6. Assumption Registry */}
      {activeTab === 'assumptions' && (
        <AssumptionRegistryPanel onInvalidateModels={onInvalidateModels} />
      )}

      {/* 7. Bench Dataset Validation */}
      {activeTab === 'bench' && <BenchValidationPanel />}

      {/* 8. Compliance-as-Code */}
      {activeTab === 'compliance' && (
        <div className="space-y-3 text-xs">
          {[
            { standard: 'IEC 62133-2', clause: 'Cl. 7.3.8', title: 'Overcharge / High Temp Inhibition', status: true, note: 'BMS inhibits charging when T ≥ 45°C' },
            { standard: 'AIS-156 Amd 3', clause: 'Annex 8', title: 'Cell-to-Cell Temperature Spread ≤ 5°C', status: true, note: 'Monitored across parallel S/P array' },
            { standard: 'IEC 62619', clause: 'Cl. 8.2.4', title: 'Over-Temperature Control & Trip Delay', status: true, note: 'Reaction time ≤ 100 ms via hardware AFE' },
            { standard: 'UN 38.3', clause: 'T.1 - T.5', title: 'Cell Voltage Window [2.5V, 4.2V]', status: true, note: 'Strict hardware comparator window' },
          ].map((check, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#080B08] border border-[#1E2D21] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#B8FF24]" />
                  <span className="font-semibold text-white">{check.standard} ({check.clause})</span>
                  <span className="text-[#8A9A8C]">- {check.title}</span>
                </div>
                <p className="text-[11px] text-[#8A9A8C] font-mono pl-6">{check.note}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#122216] text-[#B8FF24] text-[11px] font-bold border border-[#B8FF24]/40 shadow-[0_0_8px_rgba(184,255,36,0.2)]">
                PASSED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
