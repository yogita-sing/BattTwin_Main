import React from 'react';
import { Sliders, Thermometer, Zap, Layers, RefreshCw } from 'lucide-react';

interface ParameterControlsProps {
  ambientTemp: number;
  setAmbientTemp: (v: number) => void;
  cRate: number;
  setCRate: (v: number) => void;
  operationMode: 'charge' | 'discharge';
  setOperationMode: (v: 'charge' | 'discharge') => void;
  rSpreadPct: number;
  setRSpreadPct: (v: number) => void;
  coolingType: string;
  setCoolingType: (v: string) => void;
  cellSpacing: number;
  setCellSpacing: (v: number) => void;
  deratingEnabled: boolean;
  setDeratingEnabled: (v: boolean) => void;
  onSimulate: () => void;
  isLoading: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  ambientTemp,
  setAmbientTemp,
  cRate,
  setCRate,
  operationMode,
  setOperationMode,
  rSpreadPct,
  setRSpreadPct,
  coolingType,
  setCoolingType,
  cellSpacing,
  setCellSpacing,
  deratingEnabled,
  setDeratingEnabled,
  onSimulate,
  isLoading,
}) => {
  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Design Parameters & Operating Conditions</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSimulate}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 border border-cyan-500/40 text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Simulating...' : 'Recalculate'}</span>
          </button>
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setOperationMode('charge')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                operationMode === 'charge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Charge (1C)
            </button>
            <button
              onClick={() => setOperationMode('discharge')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                operationMode === 'discharge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
              }`}
            >
              Discharge (2C)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* 1. Ambient Temp */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ambient Temp:</span>
            </span>
            <span className={`font-mono font-bold ${ambientTemp >= 40 ? 'text-red-400' : 'text-cyan-300'}`}>
              {ambientTemp.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="50"
            step="1"
            value={ambientTemp}
            onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>20°C (Lab)</span>
            <span className="text-red-400/80">45°C (Indian Summer)</span>
          </div>
        </div>

        {/* 2. C-rate */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>C-Rate:</span>
            </span>
            <span className="font-mono font-bold text-emerald-300">{cRate.toFixed(2)} C</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={cRate}
            onChange={(e) => setCRate(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.2C (Slow)</span>
            <span>1.0C (Nominal)</span>
            <span>2.0C (Fast)</span>
          </div>
        </div>

        {/* 3. Resistance Spread */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Parallel Spread:</span>
            </span>
            <span className="font-mono font-bold text-amber-300">±{rSpreadPct.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={rSpreadPct}
            onChange={(e) => setRSpreadPct(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0% (Matched)</span>
            <span>25% (Worked Ex.)</span>
          </div>
        </div>

        {/* 4. Thermal Strategy Selector */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-slate-400 block">Thermal Management:</span>
          <select
            value={coolingType}
            onChange={(e) => setCoolingType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-cyan-500 outline-none"
          >
            <option value="baseline_passive">Baseline Passive (Tight 1mm)</option>
            <option value="natural_convection">Natural Convection (3mm Spacing)</option>
            <option value="pcm_matrix">Option B: PCM Matrix (RT42 Paraffin)</option>
            <option value="active_cooling">Option C: Active Forced Air / Cold Plate</option>
          </select>

          <label className="flex items-center space-x-2 pt-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deratingEnabled}
              onChange={(e) => setDeratingEnabled(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 accent-cyan-500"
            />
            <span className="text-[11px] text-slate-300">Firmware Charge Derating (&gt;40°C)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
