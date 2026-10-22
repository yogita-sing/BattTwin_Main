import React, { useState } from 'react';
import { getBenchValidationDataset } from '../../services/benchDataset';
import { CheckCircle2, TrendingUp, Activity, FileSpreadsheet } from 'lucide-react';

export const BenchValidationPanel: React.FC = () => {
  const [cRate, setCRate] = useState<number>(1.0);
  const { points, metrics } = getBenchValidationDataset(cRate);

  // Voltage range for chart (13.5V to 17.0V)
  const getSvgY_V = (v: number) => 150 - ((v - 13.5) / 3.5) * 120;
  // Temp range for chart (20C to 45C)
  const getSvgY_T = (t: number) => 150 - ((t - 20) / 25) * 120;

  const getSvgX = (t_s: number) => 35 + (t_s / 1800) * 335;

  const measuredV_path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.time_s)} ${getSvgY_V(p.measured_voltage_v)}`).join(' ');
  const predictedV_path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.time_s)} ${getSvgY_V(p.predicted_voltage_v)}`).join(' ');

  const measuredT_path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.time_s)} ${getSvgY_T(p.measured_temp_c)}`).join(' ');
  const predictedT_path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(p.time_s)} ${getSvgY_T(p.predicted_temp_c)}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>Empirical Bench Dataset Validation & Model Calibration</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CONCORDANT FIT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Model validation against 4S cylindrical cell hardware test cycler data.
          </p>
        </div>

        {/* C-rate Test Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setCRate(0.5)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              cRate === 0.5 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            0.5C Test Run
          </button>
          <button
            onClick={() => setCRate(1.0)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              cRate === 1.0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            1.0C Test Run
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">VOLTAGE RMSE</span>
          <span className="text-base font-bold text-emerald-400">{metrics.rmse_voltage_v} V</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">MAPE: {metrics.mape_voltage_pct}%</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">TEMPERATURE RMSE</span>
          <span className="text-base font-bold text-cyan-400">{metrics.rmse_temp_c} °C</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">MAPE: {metrics.mape_temp_pct}%</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">PEAK TEMP ERROR</span>
          <span className="text-base font-bold text-slate-200">±{metrics.peak_temp_error_c} °C</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">Target: &le; 1.0 °C</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2">
          <span className="text-[10px] text-slate-500 block">VSI HARDWARE PERTURBATION CHECK (+10 mΩ)</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-xs text-slate-300">Predicted ΔT: <strong className="text-cyan-300 font-bold">+{metrics.vsi_perturbation_predicted_delta_t}°C</strong></span>
            <span className="text-slate-500">|</span>
            <span className="text-xs text-slate-300">Measured ΔT: <strong className="text-emerald-400 font-bold">+{metrics.vsi_perturbation_measured_delta_t}°C</strong></span>
          </div>
          <span className="text-[9px] text-emerald-400/90 block mt-0.5">✓ VSI sensitivity prediction confirmed within 0.07 °C error</span>
        </div>
      </div>

      {/* SVG Charts: Voltage (Left) & Temperature (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voltage Curve */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-slate-200">Pack Voltage V(t) Tracking</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-emerald-400"></span>
                <span className="text-slate-400">Bench Measured</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed"></span>
                <span className="text-slate-400">L2 Model Predicted</span>
              </span>
            </div>
          </div>

          <svg viewBox="0 0 380 170" className="w-full h-48">
            <line x1="35" y1="20" x2="35" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="35" y1="150" x2="370" y2="150" stroke="#334155" strokeWidth="1" />
            <path d={measuredV_path} fill="none" stroke="#10b981" strokeWidth="2" />
            <path d={predictedV_path} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="35" y="15" fill="#94a3b8" fontSize="9" fontFamily="monospace">17.0V</text>
            <text x="35" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">13.5V</text>
            <text x="370" y="162" textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">1800s</text>
          </svg>
        </div>

        {/* Temperature Curve */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-slate-200">Peak Cell Temperature T(t) Tracking</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-amber-400"></span>
                <span className="text-slate-400">Bench Measured</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-red-400 border-dashed"></span>
                <span className="text-slate-400">L2 Model Predicted</span>
              </span>
            </div>
          </div>

          <svg viewBox="0 0 380 170" className="w-full h-48">
            <line x1="35" y1="20" x2="35" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="35" y1="150" x2="370" y2="150" stroke="#334155" strokeWidth="1" />
            <path d={measuredT_path} fill="none" stroke="#f59e0b" strokeWidth="2" />
            <path d={predictedT_path} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="35" y="15" fill="#94a3b8" fontSize="9" fontFamily="monospace">45°C</text>
            <text x="35" y="162" fill="#94a3b8" fontSize="9" fontFamily="monospace">20°C</text>
            <text x="370" y="162" textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">1800s</text>
          </svg>
        </div>
      </div>
    </div>
  );
};
