import React from 'react';
import { CellState } from '../../types/battery';
import { Activity, Zap } from 'lucide-react';

interface CircuitSchematic2DProps {
  cells: CellState[];
  selectedCellId: string | null;
  onSelectCell: (cellId: string) => void;
  packVoltage: number;
  packCurrent: number;
}

export const CircuitSchematic2D: React.FC<CircuitSchematic2DProps> = ({
  cells,
  selectedCellId,
  onSelectCell,
  packVoltage,
  packCurrent,
}) => {
  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">4S2P Electrical Ladder & Balancing Circuit</h3>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-slate-400">
            Pack V: <strong className="text-cyan-300 font-semibold">{packVoltage.toFixed(2)} V</strong>
          </span>
          <span className="text-slate-400">
            Pack I: <strong className="text-emerald-400 font-semibold">{packCurrent.toFixed(2)} A</strong>
          </span>
        </div>
      </div>

      {/* 4 Series Groups */}
      <div className="space-y-3.5 my-auto">
        {[0, 1, 2, 3].map((sIndex) => {
          const c1 = cells.find((c) => c.series_index === sIndex && c.parallel_index === 0);
          const c2 = cells.find((c) => c.series_index === sIndex && c.parallel_index === 1);

          if (!c1 || !c2) return null;

          const isC1Selected = c1.cell_id === selectedCellId;
          const isC2Selected = c2.cell_id === selectedCellId;

          // Check current split ratio
          const totalI = Math.abs(c1.current_a) + Math.abs(c2.current_a);
          const split1 = totalI > 0 ? (Math.abs(c1.current_a) / totalI) * 100 : 50;
          const split2 = totalI > 0 ? (Math.abs(c2.current_a) / totalI) * 100 : 50;

          return (
            <div
              key={sIndex}
              className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
            >
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 w-16">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>S{sIndex + 1}</span>
              </div>

              {/* Parallel Cells in Group */}
              <div className="flex-1 grid grid-cols-2 gap-3 px-3">
                {/* Cell 1 (Parallel 1) */}
                <button
                  onClick={() => onSelectCell(c1.cell_id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isC1Selected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400'
                      : c1.temperature_c >= 45.0
                      ? 'bg-red-950/40 border-red-500/60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-slate-300">P1: {c1.cell_id}</span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        c1.temperature_c >= 45.0 ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {c1.temperature_c.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{c1.voltage_v.toFixed(2)} V</span>
                    <span className="text-emerald-400 font-semibold">{c1.current_a.toFixed(2)} A ({split1.toFixed(0)}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    R: {c1.resistance_mohm.toFixed(1)} mΩ | Q: {c1.heat_generation_w.toFixed(2)} W
                  </div>
                </button>

                {/* Cell 2 (Parallel 2) */}
                <button
                  onClick={() => onSelectCell(c2.cell_id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isC2Selected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400'
                      : c2.temperature_c >= 45.0
                      ? 'bg-red-950/40 border-red-500/60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-slate-300">P2: {c2.cell_id}</span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        c2.temperature_c >= 45.0 ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {c2.temperature_c.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{c2.voltage_v.toFixed(2)} V</span>
                    <span className="text-emerald-400 font-semibold">{c2.current_a.toFixed(2)} A ({split2.toFixed(0)}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    R: {c2.resistance_mohm.toFixed(1)} mΩ | Q: {c2.heat_generation_w.toFixed(2)} W
                  </div>
                </button>
              </div>

              {/* Passive Balancing Resistor Branch */}
              <div className="w-24 pl-2 border-l border-slate-800/80 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-mono text-amber-400/90">82 Ω Resistor</span>
                <span className="text-[9px] text-slate-500">~50 mA bleed</span>
                <span className="text-[10px] font-mono text-slate-400">0.20 W heat</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Parallel split formula: <code className="text-cyan-300">I₁ = I_tot · R₂ / (R₁ + R₂)</code></span>
        </span>
        <span className="text-slate-500 font-mono">Governed by Kirchhoff's Laws</span>
      </div>
    </div>
  );
};
