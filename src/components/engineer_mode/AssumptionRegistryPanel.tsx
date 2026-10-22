import React, { useState } from 'react';
import { EngineeringAssumption } from '../../types/battery';
import { defaultAssumptions, updateAssumption } from '../../services/assumptionRegistry';
import { Database, AlertOctagon, CheckCircle2, RotateCcw } from 'lucide-react';

interface AssumptionRegistryPanelProps {
  onInvalidateModels?: (staleModels: string[]) => void;
}

export const AssumptionRegistryPanel: React.FC<AssumptionRegistryPanelProps> = ({
  onInvalidateModels,
}) => {
  const [assumptions, setAssumptions] = useState<EngineeringAssumption[]>(defaultAssumptions);
  const [staleList, setStaleList] = useState<string[]>([]);

  const handleValueChange = (id: string, val: number) => {
    const { updatedAssumptions, staleModels } = updateAssumption(assumptions, id, val);
    setAssumptions(updatedAssumptions);
    setStaleList(staleModels);
    if (onInvalidateModels) onInvalidateModels(staleModels);
  };

  const handleReset = () => {
    setAssumptions(defaultAssumptions);
    setStaleList([]);
    if (onInvalidateModels) onInvalidateModels([]);
  };

  const anyStale = assumptions.some((a) => a.is_stale);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Assumption Registry & Stale Result Invalidation Graph</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every assumption carries provenance and owner. Editing an assumption invalidates downstream results.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {anyStale ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-bold animate-pulse">
              <AlertOctagon className="w-4 h-4" />
              <span>{staleList.length} MODELS MARKED STALE</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ALL RESULTS CURRENT</span>
            </div>
          )}

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Assumptions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="py-2.5 px-3">ID & Parameter</th>
              <th className="py-2.5 px-3">Source Label</th>
              <th className="py-2.5 px-3">Active Value</th>
              <th className="py-2.5 px-3">Valid Range</th>
              <th className="py-2.5 px-3">Owner</th>
              <th className="py-2.5 px-3">Downstream Dependent Models</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {assumptions.map((asm) => (
              <tr
                key={asm.id}
                className={`hover:bg-slate-800/40 transition-colors ${
                  asm.is_stale ? 'bg-amber-950/20' : ''
                }`}
              >
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-200">{asm.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{asm.id} · {asm.category}</div>
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asm.source_label === '[Datasheet]'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : asm.source_label === '[Calculated]'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : asm.source_label === '[Target]'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {asm.source_label}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step={asm.unit === 'mΩ' || asm.unit === 'Ω' ? '0.1' : '1'}
                      min={asm.valid_min}
                      max={asm.valid_max}
                      value={asm.value}
                      onChange={(e) => handleValueChange(asm.id, parseFloat(e.target.value) || asm.default_value)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-bold outline-none focus:border-cyan-400"
                    />
                    <span className="text-slate-400 text-[11px]">{asm.unit}</span>
                  </div>
                </td>

                <td className="py-3 px-3 text-slate-400 text-[11px]">
                  [{asm.valid_min}, {asm.valid_max}] {asm.unit}
                </td>

                <td className="py-3 px-3 text-slate-300 text-[11px] font-sans">
                  {asm.owner}
                </td>

                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {asm.dependent_models.map((m, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          asm.is_stale
                            ? 'bg-red-950/60 text-red-300 border-red-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3 px-3 text-right">
                  {asm.is_stale ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      STALE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      CURRENT
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
