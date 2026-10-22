import React, { useState } from 'react';
import { FmeaFaultItem } from '../../types/battery';
import { defaultFmeaFaults, evaluateFmeaState } from '../../services/fmeaEngine';
import { ShieldAlert, CheckCircle2, AlertTriangle, Play, RotateCcw, Zap } from 'lucide-react';

export const FmeaPanel: React.FC = () => {
  const [faults, setFaults] = useState<FmeaFaultItem[]>(defaultFmeaFaults);

  const toggleFault = (id: string) => {
    setFaults((prev) =>
      prev.map((f) => (f.id === id ? { ...f, injected: !f.injected } : f))
    );
  };

  const resetFaults = () => {
    setFaults((prev) => prev.map((f) => ({ ...f, injected: false })));
  };

  const evaluation = evaluateFmeaState(faults);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Interactive FMEA & Fault-Tolerant Time Interval (FTTI) Testing</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              ISO 26262 / IEC 62619
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject sensor drift, stuck thermistors, weld fractures, and contactor lag to verify protection timing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {evaluation.overall_status === 'critical_breach' ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-400 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>FTTI CEILING BREACH</span>
            </div>
          ) : evaluation.overall_status === 'warning' ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>FAULTS CONTAINED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ALL CIRCUITS NOMINAL</span>
            </div>
          )}

          <button
            onClick={resetFaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Fault Injection List */}
      <div className="space-y-3">
        {faults.map((f) => {
          const isFttiBreach = f.injected && (f.measured_reaction_ms > f.allowed_ftti_ms || !f.safe_state_achieved);

          return (
            <div
              key={f.id}
              className={`p-4 rounded-xl border transition-all text-xs ${
                f.injected
                  ? isFttiBreach
                    ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/30'
                    : 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">{f.id}</span>
                    <span className="font-bold text-slate-200">{f.name}</span>
                    <span className="uppercase text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.description}</p>
                </div>

                {/* Inject Toggle Button */}
                <button
                  onClick={() => toggleFault(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                    f.injected
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f.injected ? 'INJECTED (ACTIVE)' : 'INJECT FAULT'}
                </button>
              </div>

              {/* Metrics & Mitigation Details */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">REACTION TIME</span>
                  <span
                    className={`font-bold ${
                      isFttiBreach ? 'text-red-400 text-sm' : f.injected ? 'text-amber-300' : 'text-slate-300'
                    }`}
                  >
                    {f.measured_reaction_ms} ms (Limit: {f.allowed_ftti_ms} ms)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">DIAGNOSTIC COVERAGE</span>
                  <span className="text-emerald-400 font-bold">{f.diagnostic_coverage_pct}%</span>
                </div>

                <div>
                  <span className="text-slate-500 block">RPN RISK INDEX</span>
                  <span className="text-slate-300 font-bold">{f.rpn_score} / 1000</span>
                </div>

                <div>
                  <span className="text-slate-500 block">SAFE STATE STATUS</span>
                  <span className={f.safe_state_achieved ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {f.safe_state_achieved ? 'ACHIEVED' : 'FAILED / TIMEOUT'}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                <strong className="text-slate-300">Mitigation Strategy:</strong> {f.mitigation_strategy}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
