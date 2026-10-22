import React from 'react';
import { CellState } from '../../types/battery';
import { Battery, Activity } from 'lucide-react';

interface CellInspectorProps {
  cell: CellState | null;
}

export const CellInspector: React.FC<CellInspectorProps> = ({ cell }) => {
  if (!cell) {
    return (
      <div className="bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-2xl flex flex-col items-center justify-center text-center text-[#8A9A8C] h-full min-h-[220px]">
        <Activity className="w-8 h-8 mb-2 text-[#B8FF24]/50 animate-pulse" />
        <p className="text-xs font-mono">Select any cell in 3D pack or 2D circuit schematic to inspect telemetry</p>
      </div>
    );
  }

  const isOverTemp = cell.temperature_c >= 45.0;

  return (
    <div className="bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E2D21]">
        <div className="flex items-center space-x-2.5">
          <Battery className={`w-5 h-5 ${isOverTemp ? 'text-red-400' : 'text-[#B8FF24]'}`} />
          <div>
            <h4 className="text-sm font-bold text-white font-mono">{cell.cell_id}</h4>
            <span className="text-[11px] text-[#8A9A8C] font-mono">
              Series Group S{cell.series_index + 1} | Parallel Branch P{cell.parallel_index + 1}
            </span>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider ${
            cell.status === 'critical'
              ? 'bg-red-950/80 text-red-400 border border-red-500/50'
              : cell.status === 'warning'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
              : 'bg-[#122216] text-[#B8FF24] border border-[#B8FF24]/50 shadow-[0_0_10px_rgba(184,255,36,0.15)]'
          }`}
        >
          {cell.status}
        </span>
      </div>

      {/* Grid of Measurements */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">Temperature</span>
          <span className={`text-base font-bold ${isOverTemp ? 'text-red-400' : 'text-[#B8FF24]'}`}>
            {cell.temperature_c.toFixed(2)} °C
          </span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">Limit: 45.0 °C</span>
        </div>

        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">Branch Current</span>
          <span className="text-base font-bold text-white">{cell.current_a.toFixed(2)} A</span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">Parallel share</span>
        </div>

        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">Cell Voltage</span>
          <span className="text-base font-bold text-white">{cell.voltage_v.toFixed(3)} V</span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">OCV + IR drop</span>
        </div>

        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">Joule Heat Gen</span>
          <span className="text-base font-bold text-[#B8FF24]">{cell.heat_generation_w.toFixed(3)} W</span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">Q = I²·R</span>
        </div>

        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">Internal Resistance</span>
          <span className="text-base font-bold text-white">{cell.resistance_mohm.toFixed(2)} mΩ</span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">Arrhenius R(T)</span>
        </div>

        <div className="bg-[#080B08] p-3 rounded-xl border border-[#1E2D21]">
          <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">State of Charge</span>
          <span className="text-base font-bold text-[#B8FF24]">{cell.soc_pct.toFixed(1)}%</span>
          <span className="text-[10px] text-[#8A9A8C] block mt-0.5">Coulomb counted</span>
        </div>
      </div>
    </div>
  );
};
