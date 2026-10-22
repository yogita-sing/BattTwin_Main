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
    <div className="w-full bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1E2D21] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[#141F16] text-[#B8FF24]">
            <Sliders className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Simulation Conditions & Electro-Thermal Inputs
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onSimulate}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#B8FF24] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all hover:bg-[#cbf747] hover:shadow-[0_0_15px_rgba(184,255,36,0.35)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running Physics...' : 'Recalculate Twin'}</span>
          </button>
          
          <div className="flex items-center bg-[#080B08] p-1 rounded-full border border-[#1E2D21] text-xs font-mono">
            <button
              onClick={() => setOperationMode('charge')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                operationMode === 'charge'
                  ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.25)]'
                  : 'text-[#8A9A8C] hover:text-white'
              }`}
            >
              Charge (1C)
            </button>
            <button
              onClick={() => setOperationMode('discharge')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                operationMode === 'discharge'
                  ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.25)]'
                  : 'text-[#8A9A8C] hover:text-white'
              }`}
            >
              Discharge (2C)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        {/* 1. Ambient Temp */}
        <div className="p-3.5 bg-[#080B08] rounded-xl border border-[#1E2D21] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8A9A8C] flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-[#B8FF24]" />
              <span>Ambient Temp:</span>
            </span>
            <span className={`font-bold ${ambientTemp >= 40 ? 'text-red-400' : 'text-[#B8FF24]'}`}>
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
            className="w-full accent-[#B8FF24] h-1.5 bg-[#162218] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8A9A8C]">
            <span>20°C (Lab Standard)</span>
            <span className="text-red-400">45°C (Indian Summer)</span>
          </div>
        </div>

        {/* 2. C-rate */}
        <div className="p-3.5 bg-[#080B08] rounded-xl border border-[#1E2D21] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8A9A8C] flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-[#B8FF24]" />
              <span>C-Rate:</span>
            </span>
            <span className="font-bold text-[#B8FF24]">{cRate.toFixed(2)} C</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={cRate}
            onChange={(e) => setCRate(parseFloat(e.target.value))}
            className="w-full accent-[#B8FF24] h-1.5 bg-[#162218] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8A9A8C]">
            <span>0.2C (Slow)</span>
            <span>1.0C (Nominal)</span>
            <span>2.0C (Fast)</span>
          </div>
        </div>

        {/* 3. Resistance Spread */}
        <div className="p-3.5 bg-[#080B08] rounded-xl border border-[#1E2D21] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8A9A8C] flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#B8FF24]" />
              <span>Parallel Spread:</span>
            </span>
            <span className="font-bold text-[#B8FF24]">±{rSpreadPct.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={rSpreadPct}
            onChange={(e) => setRSpreadPct(parseFloat(e.target.value))}
            className="w-full accent-[#B8FF24] h-1.5 bg-[#162218] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#8A9A8C]">
            <span>0% (Matched)</span>
            <span>25% (Worked Ex.)</span>
          </div>
        </div>

        {/* 4. Thermal Strategy Selector */}
        <div className="p-3.5 bg-[#080B08] rounded-xl border border-[#1E2D21] space-y-2">
          <span className="text-[#8A9A8C] block text-[11px]">Thermal Management Strategy:</span>
          <select
            value={coolingType}
            onChange={(e) => setCoolingType(e.target.value)}
            className="w-full bg-[#111A13] border border-[#233526] rounded-lg p-1.5 text-xs text-white font-medium focus:ring-1 focus:ring-[#B8FF24] outline-none cursor-pointer"
          >
            <option value="baseline_passive">Baseline Passive (Tight 1mm)</option>
            <option value="natural_convection">Natural Convection (3mm Spacing)</option>
            <option value="pcm_matrix">Option B: PCM Matrix (RT42 Paraffin)</option>
            <option value="active_cooling">Option C: Active Air / Cold Plate</option>
          </select>

          <label className="flex items-center space-x-2 pt-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deratingEnabled}
              onChange={(e) => setDeratingEnabled(e.target.checked)}
              className="rounded bg-[#111A13] border-[#233526] text-[#B8FF24] accent-[#B8FF24]"
            />
            <span className="text-[11px] text-[#8A9A8C]">Firmware Derating (&gt;40°C)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
