import React from 'react';
import { CellState } from '../../types/battery';
import { Battery, Activity } from 'lucide-react';

interface CellInspectorProps {
  cell: CellState | null;
}

export const CellInspector: React.FC<CellInspectorProps> = ({ cell }) => {
  if (!cell) {
    return (
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center text-slate-500 h-full">
        <Activity className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
        <p className="text-xs font-mono">Click any cell in the 3D pack or 2D circuit to inspect telemetry</p>
      </div>
    );
  }

  const isOverTemp = cell.temperature_c >= 45.0;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Battery className={`w-5 h-5 ${isOverTemp ? 'text-red-400' : 'text-cyan-400'}`} />
          <div>
            <h4 className="text-sm font-bold text-slate-100 font-mono">{cell.cell_id}</h4>
            <span className="text-[11px] text-slate-400">
              Series Group S{cell.series_index + 1} | Parallel Branch P{cell.parallel_index + 1}
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase ${
            cell.status === 'critical'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : cell.status === 'warning'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {cell.status}
        </span>
      </div>

      {/* Grid of Measurements */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Temperature</span>
          <span className={`text-base font-bold ${isOverTemp ? 'text-red-400' : 'text-cyan-300'}`}>
            {cell.temperature_c.toFixed(2)} °C
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ceiling: 45.0 °C</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Branch Current</span>
          <span className="text-base font-bold text-emerald-400">{cell.current_a.toFixed(2)} A</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Parallel share</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Cell Voltage</span>
          <span className="text-base font-bold text-slate-200">{cell.voltage_v.toFixed(3)} V</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">OCV + IR drop</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Joule Heat Gen</span>
          <span className="text-base font-bold text-amber-400">{cell.heat_generation_w.toFixed(3)} W</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Q = I²·R</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Internal Resistance</span>
          <span className="text-base font-bold text-purple-400">{cell.resistance_mohm.toFixed(2)} mΩ</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Arrhenius R(T)</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">State of Charge</span>
          <span className="text-base font-bold text-sky-400">{cell.soc_pct.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Coulomb counted</span>
        </div>
      </div>
    </div>
  );
};
