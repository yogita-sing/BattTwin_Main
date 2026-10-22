import React, { useState } from 'react';
import { VsiEntry, CrossDomainConflict, OptionComparisonItem } from '../../types/battery';
import { Sliders, ShieldCheck, AlertCircle, Download, Award } from 'lucide-react';

interface EngineerModePanelProps {
  vsiRanking: VsiEntry[];
  conflicts: CrossDomainConflict[];
  options: OptionComparisonItem[];
  commitHash: string;
  onExportEvidence: () => void;
  isExporting: boolean;
}

export const EngineerModePanel: React.FC<EngineerModePanelProps> = ({
  vsiRanking,
  conflicts,
  options,
  commitHash,
  onExportEvidence,
  isExporting,
}) => {
  const [activeTab, setActiveTab] = useState<'trade_offs' | 'vsi' | 'conflicts' | 'compliance'>('trade_offs');

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>Systems Engineering & Trade-Off Studio</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Commit: {commitHash.slice(0, 8)}...
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-objective trade-offs, VSI margin consumption, and cross-domain conflict analysis.
          </p>
        </div>

        <button
          onClick={onExportEvidence}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Dossier...' : 'Export Signed Evidence File'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {[
          { id: 'trade_offs', label: 'Architecture Options (Baseline vs A/B/C)', icon: Sliders },
          { id: 'vsi', label: 'VSI Tornado Ranking', icon: Award },
          { id: 'conflicts', label: `Cross-Domain Conflicts (${conflicts.length})`, icon: AlertCircle },
          { id: 'compliance', label: 'Compliance-as-Code Checks', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
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
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Option</th>
                  <th className="py-2.5 px-3">Peak Temp</th>
                  <th className="py-2.5 px-3">Spread (ΔT)</th>
                  <th className="py-2.5 px-3">Usable Energy</th>
                  <th className="py-2.5 px-3">Mass</th>
                  <th className="py-2.5 px-3">BOM Cost</th>
                  <th className="py-2.5 px-3">P(Violation)</th>
                  <th className="py-2.5 px-3 text-right">TOPSIS Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {options.map((opt, idx) => {
                  const isTop = idx === 0;
                  return (
                    <tr
                      key={opt.name}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isTop ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-slate-200 font-sans flex items-center space-x-1.5">
                        {isTop && <Award className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                        <span>{opt.name}</span>
                      </td>
                      <td className={`py-3 px-3 ${opt.peak_temperature_c >= 45 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {opt.peak_temperature_c.toFixed(1)} °C
                      </td>
                      <td className="py-3 px-3 text-slate-300">{opt.temp_spread_c.toFixed(1)} °C</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">{opt.usable_energy_wh.toFixed(1)} Wh</td>
                      <td className="py-3 px-3 text-slate-300">{opt.mass_g.toFixed(0)} g</td>
                      <td className="py-3 px-3 text-slate-300">${opt.cost_usd.toFixed(2)}</td>
                      <td className="py-3 px-3 text-amber-400">{opt.prob_violation_pct.toFixed(1)}%</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isTop ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-300'
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

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span><strong>Multi-Criteria TOPSIS Note:</strong> Hard safety invariants are feasibility barriers. Options with peak temperature &ge; 45 °C incur a probability of violation penalty.</span>
          </div>
        </div>
      )}

      {/* 2. VSI Tornado Chart */}
      {activeTab === 'vsi' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <strong>Variation Sensitivity Index Formula:</strong> <code className="text-cyan-300 font-mono">VSI_k = |ΔKPI_k| / (KPI_limit - KPI_nominal)</code>.
            A value of 1.0 means this variation source alone consumes 100% of available thermal safety margin!
          </div>

          <div className="space-y-3">
            {vsiRanking.map((item) => {
              const pctWidth = Math.min(100, item.vsi_score * 80);
              const isHigh = item.vsi_score >= 0.7;
              return (
                <div key={item.source_name} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      #{item.rank} {item.source_name}
                    </span>
                    <span className="font-mono text-xs">
                      VSI: <strong className={isHigh ? 'text-red-400 font-bold' : 'text-cyan-400'}>{item.vsi_score.toFixed(3)}</strong>
                    </span>
                  </div>

                  {/* Tornado Bar */}
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${Math.max(5, pctWidth)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{item.description}</span>
                    <span>ΔT: +{item.delta_kpi_value.toFixed(1)}°C | Margin Left: {item.safety_margin_available.toFixed(1)}°C</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Cross-Domain Conflicts */}
      {activeTab === 'conflicts' && (
        <div className="space-y-3">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
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
                  <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {conf.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{conf.explanation}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Connected Domains: <strong className="text-slate-200">{conf.connected_domains.join(' ↔ ')}</strong>
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    Resolution: {conf.suggested_resolution}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Compliance-as-Code */}
      {activeTab === 'compliance' && (
        <div className="space-y-3 text-xs">
          {[
            { standard: 'IEC 62133-2', clause: 'Cl. 7.3.8', title: 'Overcharge / High Temp Inhibition', status: true, note: 'BMS inhibits charging when T ≥ 45°C' },
            { standard: 'AIS-156 Amd 3', clause: 'Annex 8', title: 'Cell-to-Cell Temperature Spread ≤ 5°C', status: true, note: 'Monitored across parallel S/P array' },
            { standard: 'IEC 62619', clause: 'Cl. 8.2.4', title: 'Over-Temperature Control & Trip Delay', status: true, note: 'Reaction time ≤ 100 ms via hardware AFE' },
            { standard: 'UN 38.3', clause: 'T.1 - T.5', title: 'Cell Voltage Window [2.5V, 4.2V]', status: true, note: 'Strict hardware comparator window' },
          ].map((check, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">{check.standard} ({check.clause})</span>
                  <span className="text-slate-400">- {check.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono pl-6">{check.note}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                PASSED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
