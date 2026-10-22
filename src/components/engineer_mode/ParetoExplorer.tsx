import React, { useState } from 'react';
import { ParetoCandidate } from '../../types/battery';
import { Award, ArrowRight, Crosshair, CheckCircle2 } from 'lucide-react';

interface ParetoExplorerProps {
  candidates: ParetoCandidate[];
  onSelectCandidate: (candidate: ParetoCandidate) => void;
}

export const ParetoExplorer: React.FC<ParetoExplorerProps> = ({
  candidates,
  onSelectCandidate,
}) => {
  const [xAxis, setXAxis] = useState<'mass_g' | 'cost_usd' | 'peak_temperature_c'>('mass_g');
  const [yAxis, setYAxis] = useState<'usable_energy_wh' | 'peak_temperature_c'>('usable_energy_wh');
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || 'PAR-001');

  const selectedCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

  // Scale data points to SVG coordinate box (400 x 240)
  const xValues = candidates.map((c) => c[xAxis]);
  const yValues = candidates.map((c) => c[yAxis]);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const getSvgX = (val: number) => {
    if (maxX === minX) return 200;
    return 40 + ((val - minX) / (maxX - minX)) * 320;
  };

  const getSvgY = (val: number) => {
    if (maxY === minY) return 120;
    // Invert Y so higher is higher
    return 200 - ((val - minY) / (maxY - minY)) * 160;
  };

  // Pareto optimal subset sorted for frontier line
  const paretoPoints = candidates
    .filter((c) => c.is_pareto_optimal)
    .sort((a, b) => a[xAxis] - b[xAxis]);

  const frontierPath = paretoPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getSvgX(p[xAxis])} ${getSvgY(p[yAxis])}`)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Intro & Axis Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Multi-Objective Pareto Frontier</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-dominated architectural solutions balancing energy, thermal ceiling, mass, and BOM cost.
          </p>
        </div>

        {/* Axis Toggles */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">X-Axis:</span>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none"
            >
              <option value="mass_g">Mass (g)</option>
              <option value="cost_usd">BOM Cost ($)</option>
              <option value="peak_temperature_c">Peak Temp (°C)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Y-Axis:</span>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none"
            >
              <option value="usable_energy_wh">Usable Energy (Wh)</option>
              <option value="peak_temperature_c">Peak Temp (°C)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Scatter Chart (Left) + Selected Candidate Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive SVG Chart */}
        <div className="lg:col-span-7 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 relative">
          <svg viewBox="0 0 400 240" className="w-full h-64 overflow-visible">
            {/* Grid Lines */}
            <line x1="40" y1="40" x2="40" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="200" x2="360" y2="200" stroke="#334155" strokeWidth="1" />

            {/* Pareto Frontier Line */}
            {frontierPath && (
              <path
                d={frontierPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-70"
              />
            )}

            {/* Scatter Points */}
            {candidates.map((c) => {
              const cx = getSvgX(c[xAxis]);
              const cy = getSvgY(c[yAxis]);
              const isSelected = c.id === selectedId;

              return (
                <g
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : c.is_pareto_optimal ? 5.5 : 4}
                    fill={c.is_pareto_optimal ? (isSelected ? '#38bdf8' : '#06b6d4') : '#64748b'}
                    stroke={isSelected ? '#ffffff' : '#0f172a'}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fill={c.is_pareto_optimal ? '#94a3b8' : '#475569'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {c.id}
                  </text>
                </g>
              );
            })}

            {/* Axis Labels */}
            <text x="360" y="218" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              {xAxis.toUpperCase().replace('_', ' ')}
            </text>
            <text x="35" y="32" textAnchor="start" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              {yAxis.toUpperCase().replace('_', ' ')}
            </text>
          </svg>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Pareto Optimal</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span>Dominated</span>
              </span>
            </div>
            <span>Click any node to inspect trade-off</span>
          </div>
        </div>

        {/* Selected Candidate Inspector */}
        <div className="lg:col-span-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                  {selectedCandidate.id}
                </span>
                <h4 className="text-base font-bold text-slate-100">{selectedCandidate.name}</h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedCandidate.is_pareto_optimal
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {selectedCandidate.is_pareto_optimal ? 'NON-DOMINATED' : 'DOMINATED'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {selectedCandidate.trade_off_summary}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">USABLE ENERGY</span>
                <span className="text-emerald-400 font-bold">{selectedCandidate.usable_energy_wh} Wh</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PEAK TEMP</span>
                <span
                  className={`font-bold ${
                    selectedCandidate.peak_temperature_c >= 45 ? 'text-red-400' : 'text-slate-200'
                  }`}
                >
                  {selectedCandidate.peak_temperature_c} °C
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">MODULE MASS</span>
                <span className="text-slate-200 font-bold">{selectedCandidate.mass_g} g</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">BOM COST</span>
                <span className="text-slate-200 font-bold">${selectedCandidate.cost_usd}</span>
              </div>
            </div>

            {/* Hardware Spec */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mt-3 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Cooling: <strong className="text-slate-200">{selectedCandidate.cooling_type}</strong></div>
              <div>Spacing: <strong className="text-slate-200">{selectedCandidate.spacing_mm} mm</strong> | Busbar: <strong className="text-slate-200">{selectedCandidate.busbar_material}</strong></div>
              <div>Derating Active: <strong className="text-slate-200">{selectedCandidate.derating_enabled ? 'Yes' : 'No'}</strong></div>
            </div>
          </div>

          <button
            onClick={() => onSelectCandidate(selectedCandidate)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <span>Load Configuration Into Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
