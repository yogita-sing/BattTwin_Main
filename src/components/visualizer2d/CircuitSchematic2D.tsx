import React from 'react';
import { CellState } from '../../types/battery';
import { Activity, Zap, ArrowDown, Cpu, Flame } from 'lucide-react';

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
    <div className="w-full bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              4S2P Electrical Ladder & Balancing Topology
            </h3>
            <p className="text-[11px] text-slate-400">
              Parallel branch impedance division, Joule heating, and passive bleed balancing
            </p>
          </div>
        </div>

        {/* Global Electrical Readout */}
        <div className="flex items-center space-x-3 text-xs font-mono bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">
            Pack V: <strong className="text-cyan-300 font-semibold">{packVoltage.toFixed(2)} V</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Pack I: <strong className="text-emerald-400 font-semibold">{packCurrent.toFixed(2)} A</strong>
          </span>
        </div>
      </div>

      {/* 4 Series Groups Stack with Interconnect Visual Traces */}
      <div className="space-y-4">
        {[0, 1, 2, 3].map((sIndex) => {
          const c1 = cells.find((c) => c.series_index === sIndex && c.parallel_index === 0);
          const c2 = cells.find((c) => c.series_index === sIndex && c.parallel_index === 1);

          if (!c1 || !c2) return null;

          const isC1Selected = c1.cell_id === selectedCellId;
          const isC2Selected = c2.cell_id === selectedCellId;

          // Parallel branch split ratio
          const totalI = Math.abs(c1.current_a) + Math.abs(c2.current_a);
          const split1 = totalI > 0 ? (Math.abs(c1.current_a) / totalI) * 100 : 50;
          const split2 = totalI > 0 ? (Math.abs(c2.current_a) / totalI) * 100 : 50;
          const avgGroupV = ((c1.voltage_v + c2.voltage_v) / 2).toFixed(2);

          return (
            <React.Fragment key={sIndex}>
              {/* Interconnect Busbar Wire from previous series group */}
              {sIndex > 0 && (
                <div className="flex items-center justify-center -my-1.5 py-0.5">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                    <ArrowDown className="w-3 h-3 text-cyan-400" />
                    <span>Series Busbar Interconnect (R: ~0.85 mΩ)</span>
                  </div>
                </div>
              )}

              {/* Series Group Card */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
                {/* Group Sub-Header */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    <span className="font-bold text-slate-200">Series Group {sIndex + 1} (S{sIndex + 1})</span>
                    <span className="text-slate-500 text-[11px]">· Nominal Group Voltage: {avgGroupV} V</span>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Branch Sum: <strong className="text-emerald-400">{(Math.abs(c1.current_a) + Math.abs(c2.current_a)).toFixed(2)} A</strong>
                  </span>
                </div>

                {/* Parallel Cells & Balancing Circuit Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                  {/* Cell 1 (Parallel Branch 1) */}
                  <button
                    onClick={() => onSelectCell(c1.cell_id)}
                    className={`md:col-span-5 p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isC1Selected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400'
                        : c1.temperature_c >= 45.0
                        ? 'bg-red-950/30 border-red-500/60'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200">
                        P1: {c1.cell_id}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          c1.temperature_c >= 45.0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : c1.temperature_c >= 40.0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {c1.temperature_c.toFixed(1)} °C
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>{c1.voltage_v.toFixed(3)} V</span>
                      <span className="text-emerald-400 font-bold">
                        {c1.current_a.toFixed(2)} A ({split1.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>R: {c1.resistance_mohm.toFixed(1)} mΩ</span>
                      <span className="text-amber-400 font-semibold flex items-center space-x-1">
                        <Flame className="w-3 h-3 inline text-amber-400" />
                        <span>{c1.heat_generation_w.toFixed(2)} W</span>
                      </span>
                    </div>
                  </button>

                  {/* Cell 2 (Parallel Branch 2) */}
                  <button
                    onClick={() => onSelectCell(c2.cell_id)}
                    className={`md:col-span-5 p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isC2Selected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400'
                        : c2.temperature_c >= 45.0
                        ? 'bg-red-950/30 border-red-500/60'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200">
                        P2: {c2.cell_id}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          c2.temperature_c >= 45.0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : c2.temperature_c >= 40.0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {c2.temperature_c.toFixed(1)} °C
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>{c2.voltage_v.toFixed(3)} V</span>
                      <span className="text-emerald-400 font-bold">
                        {c2.current_a.toFixed(2)} A ({split2.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>R: {c2.resistance_mohm.toFixed(1)} mΩ</span>
                      <span className="text-amber-400 font-semibold flex items-center space-x-1">
                        <Flame className="w-3 h-3 inline text-amber-400" />
                        <span>{c2.heat_generation_w.toFixed(2)} W</span>
                      </span>
                    </div>
                  </button>

                  {/* Passive Balancing Resistor Circuit */}
                  <div className="md:col-span-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-center font-mono">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                        Balancing
                      </span>
                      <span className="text-xs font-bold text-slate-200 block mt-0.5">82 Ω Resistor</span>
                    </div>
                    <div className="space-y-0.5 my-1">
                      <span className="text-[10px] text-slate-400 block">~50 mA bleed</span>
                      <span className="text-[10px] text-amber-300 block font-semibold">0.20 W heat</span>
                    </div>
                    <span className="text-[9px] text-emerald-400/90 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/80">
                      Standby / Taper
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer Info Ribbon */}
      <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Kirchhoff Split Rule:</strong> <code className="text-cyan-300 font-mono">I₁ = I_tot · R₂ / (R₁ + R₂)</code>.
            Lower resistance cell carries higher current share.
          </span>
        </div>
        <span className="text-slate-500 font-mono text-[11px]">
          Total Pack Balancing Heat: ~0.82 W across 4 groups
        </span>
      </div>
    </div>
  );
};
