import React, { useState } from 'react';
import {
  LearningChallenge,
  SafetyVetoResult,
  FullSimulationOutput,
  CellState,
  SummaryKPIs,
} from '../../types/battery';
import { BatteryCanvas3D } from '../visualizer3d/BatteryCanvas3D';
import { CircuitSchematic2D } from '../visualizer2d/CircuitSchematic2D';
import { CellInspector } from '../common/CellInspector';
import {
  Compass,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Box,
  Cpu,
  Flame,
  Award,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface StudentLabWorkspaceProps {
  challenges: LearningChallenge[];
  activeChallengeId: string;
  onSelectChallenge: (id: string) => void;
  simOutput: FullSimulationOutput | null;
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
  onApplyCounterfactual: (paramName: string, value: number) => void;
  onSimulate: () => void;
  isLoading: boolean;
  onSwitchToEngineer: () => void;
}

export const StudentLabWorkspace: React.FC<StudentLabWorkspaceProps> = ({
  challenges,
  activeChallengeId,
  onSelectChallenge,
  simOutput,
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
  onApplyCounterfactual,
  onSimulate,
  isLoading,
  onSwitchToEngineer,
}) => {
  const activeChallenge = challenges.find((c) => c.id === activeChallengeId) || challenges[0];
  const [showPhysicsHint, setShowPhysicsHint] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'3d' | '2d'>('3d');
  const [selectedCellId, setSelectedCellId] = useState<string | null>('Cell_S1_P1');

  // Load predefined trap states for challenges
  const handleLoadChallengeTrap = (cId: string) => {
    onSelectChallenge(cId);
    setShowPhysicsHint(false);

    if (cId === 'challenge_1') {
      // The 45 °C charging trap
      setAmbientTemp(45.0);
      setCRate(1.0);
      setOperationMode('charge');
      setCoolingType('baseline_passive');
      setDeratingEnabled(false);
      setRSpreadPct(0.0);
    } else if (cId === 'challenge_2') {
      // 25% parallel resistance spread
      setAmbientTemp(25.0);
      setCRate(1.0);
      setOperationMode('discharge');
      setRSpreadPct(25.0);
      setCoolingType('baseline_passive');
    } else if (cId === 'challenge_3') {
      // PCM meltdown trap (ambient 43 °C > melt point 42 °C)
      setAmbientTemp(43.0);
      setCRate(1.0);
      setOperationMode('charge');
      setCoolingType('pcm_matrix');
    } else if (cId === 'challenge_4') {
      // Passive balancing slow
      setAmbientTemp(25.0);
      setCRate(0.5);
      setOperationMode('charge');
    }
  };

  const selectedCell =
    simOutput?.cells.find((c) => c.cell_id === selectedCellId) ||
    simOutput?.cells[0] ||
    null;

  const isVetoed = simOutput?.veto.is_vetoed || false;

  return (
    <div className="space-y-6">
      {/* Student Lab Hero Header */}
      <div className="bg-gradient-to-r from-[#0E1510] via-[#142316] to-[#0E1510] p-5 sm:p-6 rounded-3xl border border-[#273B29] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8FF24]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#182B1B] border border-[#B8FF24]/40 flex items-center justify-center text-[#B8FF24] shadow-[0_0_20px_rgba(184,255,36,0.2)]">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B8FF24] uppercase px-2.5 py-0.5 rounded-full bg-[#122215] border border-[#2A3E2D]">
                  Student Physics Lab
                </span>
                <span className="text-xs text-[#8A9A8C] font-mono">• 4 Guided Missions</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Interactive Battery Discovery Sandbox
              </h2>
              <p className="text-xs sm:text-sm text-[#8A9A8C] max-w-2xl mt-0.5">
                Discover <strong className="text-white">WHY</strong> battery designs fail in the real world and <strong className="text-[#B8FF24]">HOW</strong> governing physics equations lead to verifiable fixes.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onSwitchToEngineer}
              className="px-4 py-2 rounded-full bg-[#111A13] hover:bg-[#18261B] text-[#8A9A8C] hover:text-white border border-[#273B29] text-xs font-mono transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Need Advanced CAD/CAE?</span>
              <span className="text-[#B8FF24] font-bold">Switch to Engineer Studio →</span>
            </button>
          </div>
        </div>

        {/* Challenge Selection Stepper */}
        <div className="mt-6 pt-5 border-t border-[#1E2D21] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {challenges.map((c, idx) => {
            const isSelected = c.id === activeChallengeId;
            return (
              <button
                key={c.id}
                onClick={() => handleLoadChallengeTrap(c.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#182B1B] border-[#B8FF24] text-white shadow-[0_0_20px_rgba(184,255,36,0.2)] ring-1 ring-[#B8FF24]'
                    : 'bg-[#080B08]/80 border-[#1E2D21] text-[#8A9A8C] hover:border-[#273B29] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                  <span className={isSelected ? 'text-[#B8FF24] font-bold' : 'text-[#8A9A8C]'}>
                    Mission 0{idx + 1}
                  </span>
                  {isSelected && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8FF24] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8FF24]"></span>
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{c.concept}</h3>
                <p className="text-[11px] text-[#8A9A8C] line-clamp-1 mt-0.5">{c.title.split(': ')[1] || c.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Guided Lab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Mission Briefing & Targeted Guided Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Mission Story Card */}
          <div className="bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#B8FF24] font-semibold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CURRENT EXPERIMENT</span>
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeChallenge.title}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#142316] border border-[#273B29] text-[10px] font-mono text-[#B8FF24]">
                {activeChallenge.concept}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#080B08] p-3.5 rounded-xl border border-[#1E2D21]">
              {activeChallenge.story}
            </p>

            {/* Governing Physics Equation */}
            <div className="p-3.5 rounded-xl bg-[#111A13] border border-[#233526] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8A9A8C] font-mono flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#B8FF24]" />
                  <span>Governing Physical Law:</span>
                </span>
                <button
                  onClick={() => setShowPhysicsHint(!showPhysicsHint)}
                  className="text-[11px] font-mono text-[#B8FF24] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>{showPhysicsHint ? 'Hide Physics Hint' : 'Show Physics Hint'}</span>
                </button>
              </div>
              <code className="text-xs font-mono font-bold text-[#B8FF24] block break-all">
                {activeChallenge.governing_equation}
              </code>
            </div>

            {/* Physics Hint Card */}
            {showPhysicsHint && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>The Engineering Trap:</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">{activeChallenge.trap_explanation}</p>
                <div className="pt-2 border-t border-amber-900/40 flex items-center space-x-2 text-[#B8FF24]">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Physics Fix:</strong> {activeChallenge.counterfactual_solution}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Guided Physics Sliders */}
          <div className="bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2D21]">
              <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#B8FF24]" />
                <span>Lab Test Parameters</span>
              </h4>
              <button
                onClick={() => handleLoadChallengeTrap(activeChallengeId)}
                className="text-[10px] font-mono text-[#8A9A8C] hover:text-[#B8FF24] flex items-center space-x-1 cursor-pointer"
                title="Reset this challenge to default trap conditions"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Trap</span>
              </button>
            </div>

            {/* Ambient Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A9A8C] flex items-center space-x-1.5">
                  <span>Ambient Temperature (T_amb)</span>
                  {activeChallengeId === 'challenge_1' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono">
                      Key Variable
                    </span>
                  )}
                </span>
                <span className={`font-mono font-bold ${ambientTemp >= 45 ? 'text-red-400' : 'text-white'}`}>
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
                className="w-full accent-[#B8FF24] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8A9A8C]">
                <span>20 °C (Room)</span>
                <span>35 °C (Nominal Design)</span>
                <span className="text-red-400">45 °C (Indian Summer)</span>
              </div>
            </div>

            {/* C-rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A9A8C]">Current Rate (C-rate)</span>
                <span className="font-mono font-bold text-white">{cRate.toFixed(1)} C ({operationMode})</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={cRate}
                onChange={(e) => setCRate(parseFloat(e.target.value))}
                className="w-full accent-[#B8FF24] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8A9A8C]">
                <span>0.2 C (Trickle)</span>
                <span>1.0 C (Nominal 8.4A)</span>
                <span>2.0 C (Max Discharge)</span>
              </div>
            </div>

            {/* Mode & Derating Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setOperationMode(operationMode === 'charge' ? 'discharge' : 'charge')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                  operationMode === 'charge'
                    ? 'bg-[#152417] text-[#B8FF24] border-[#B8FF24]/40'
                    : 'bg-[#1C1A14] text-amber-300 border-amber-600/40'
                }`}
              >
                Mode: {operationMode.toUpperCase()}
              </button>

              <button
                onClick={() => setDeratingEnabled(!deratingEnabled)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                  deratingEnabled
                    ? 'bg-[#152417] text-[#B8FF24] border-[#B8FF24]/40'
                    : 'bg-[#080B08] text-[#8A9A8C] border-[#1E2D21]'
                }`}
              >
                Derating: {deratingEnabled ? 'ON (Above 40°)' : 'OFF'}
              </button>
            </div>

            {/* Challenge 2 Specific: Resistance Spread */}
            {activeChallengeId === 'challenge_2' && (
              <div className="space-y-1.5 pt-2 border-t border-[#1E2D21]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9A8C]">Cell Resistance Spread (ΔR)</span>
                  <span className="font-mono font-bold text-amber-400">{rSpreadPct.toFixed(0)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={rSpreadPct}
                  onChange={(e) => setRSpreadPct(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-[#8A9A8C] block">
                  Simulates batch tolerance: Cell 1 has 12 mΩ, Cell 2 has 15 mΩ (+25%).
                </span>
              </div>
            )}

            {/* Challenge 3 Specific: Thermal Management */}
            {activeChallengeId === 'challenge_3' && (
              <div className="space-y-1.5 pt-2 border-t border-[#1E2D21]">
                <label className="text-xs text-[#8A9A8C] block">Thermal Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCoolingType('baseline_passive')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all cursor-pointer ${
                      coolingType === 'baseline_passive'
                        ? 'bg-[#152417] text-[#B8FF24] border-[#B8FF24]/40'
                        : 'bg-[#080B08] text-[#8A9A8C] border-[#1E2D21]'
                    }`}
                  >
                    Tight Baseline
                  </button>
                  <button
                    onClick={() => setCoolingType('pcm_matrix')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all cursor-pointer ${
                      coolingType === 'pcm_matrix'
                        ? 'bg-[#152417] text-[#B8FF24] border-[#B8FF24]/40'
                        : 'bg-[#080B08] text-[#8A9A8C] border-[#1E2D21]'
                    }`}
                  >
                    PCM Matrix (42°C)
                  </button>
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={onSimulate}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#B8FF24] hover:bg-[#c9ff4d] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(184,255,36,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{isLoading ? 'Solving Physics Models...' : 'Run Physics Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visualizer Canvas + Live Causal Explainer */}
        <div className="lg:col-span-7 space-y-5">
          {/* Visualizer Canvas & Mode Switcher */}
          <div className="bg-[#0E1510] rounded-2xl p-5 border border-[#1E2D21] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewTab('3d')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    viewTab === '3d'
                      ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.3)]'
                      : 'bg-[#080B08] text-[#8A9A8C] border border-[#1E2D21] hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Heat Canvas</span>
                </button>

                <button
                  onClick={() => setViewTab('2d')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    viewTab === '2d'
                      ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.3)]'
                      : 'bg-[#080B08] text-[#8A9A8C] border border-[#1E2D21] hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>2D Circuit Ladder</span>
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-[#8A9A8C]">Peak Temp:</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    (simOutput?.kpis.peak_temperature_c || 0) >= 45.0 ? 'text-red-400' : 'text-[#B8FF24]'
                  }`}
                >
                  {simOutput?.kpis.peak_temperature_c.toFixed(1) || '--'} °C
                </span>
                <span className="text-[10px] text-[#8A9A8C] font-mono">(Ceiling 45°)</span>
              </div>
            </div>

            {/* Canvas */}
            <div className="h-[360px] w-full rounded-xl overflow-hidden border border-[#1E2D21] bg-[#080B08]">
              {viewTab === '3d' ? (
                <BatteryCanvas3D
                  cells={simOutput?.cells || []}
                  selectedCellId={selectedCellId}
                  onSelectCell={(cid) => setSelectedCellId(cid)}
                  coolingType={coolingType}
                  isVetoed={isVetoed}
                />
              ) : (
                <CircuitSchematic2D
                  cells={simOutput?.cells || []}
                  selectedCellId={selectedCellId}
                  onSelectCell={(cid) => setSelectedCellId(cid)}
                  packVoltage={simOutput?.kpis.nominal_voltage_v || 14.4}
                  packCurrent={8.4}
                />
              )}
            </div>

            {/* Parallel Split Insight Badge for Challenge 2 */}
            {activeChallengeId === 'challenge_2' && simOutput?.cells && simOutput.cells.length >= 2 && (
              <div className="p-3 bg-[#111A13] rounded-xl border border-[#233526] text-xs font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong>Branch Split:</strong> Cell 1 (12 mΩ):{' '}
                    <span className="text-[#B8FF24] font-bold">{Math.abs(simOutput.cells[0].current_a).toFixed(2)} A</span> | Cell 2 (15 mΩ):{' '}
                    <span className="text-slate-300 font-bold">{Math.abs(simOutput.cells[1].current_a).toFixed(2)} A</span>
                  </span>
                </div>
                <span className="text-amber-400 font-bold">
                  Heat Ratio: {(simOutput.cells[0].heat_generation_w / Math.max(0.001, simOutput.cells[1].heat_generation_w)).toFixed(2)}x
                </span>
              </div>
            )}
          </div>

          {/* Causal Explainer & Counterfactual Resolution Box */}
          {isVetoed ? (
            <div className="bg-red-950/30 rounded-2xl p-5 border border-red-500/50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <span>PHYSICS TRAP TRIGGERED: SAFETY VETO</span>
                </div>
                <span className="text-[10px] font-mono text-red-300 bg-red-900/60 px-2 py-0.5 rounded-full border border-red-700">
                  REQ-003 VIOLATED
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-white">Why Did This Battery Design Fail?</h4>
                <p className="text-slate-200 leading-relaxed">
                  {simOutput?.veto.plain_explanation}
                </p>
              </div>

              <div className="p-3 bg-[#080B08] rounded-xl border border-red-900/40 text-xs font-mono">
                <span className="text-[#8A9A8C] block text-[10px] uppercase">Violated Governing Relation:</span>
                <span className="text-red-300 font-bold">{simOutput?.veto.governing_equation}</span>
              </div>

              {/* Counterfactual Fix Options */}
              <div className="space-y-2 pt-2 border-t border-red-900/40">
                <span className="text-[11px] font-mono uppercase text-[#B8FF24] font-bold block">
                  PHYSICAL COUNTERFACTUAL RESOLUTIONS (Click to Auto-Apply & Pass):
                </span>
                {simOutput?.veto.counterfactuals.map((cf, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#080B08] border border-[#1E2D21] hover:border-[#273B29] transition-all text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{cf.description}</span>
                      <span className="text-[11px] text-[#8A9A8C] font-mono">
                        Adjust <code className="text-amber-400">{cf.parameter_name}</code> to{' '}
                        <strong className="text-[#B8FF24] font-bold">{cf.recommended_value} {cf.unit}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onApplyCounterfactual(cf.parameter_name, cf.recommended_value)}
                      className="px-3.5 py-1.5 rounded-full bg-[#B8FF24] hover:bg-[#c9ff4d] text-black font-mono font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer shadow-[0_0_10px_rgba(184,255,36,0.3)]"
                    >
                      <span>Apply Physics Fix</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#101F13] rounded-2xl p-5 border border-[#B8FF24]/40 shadow-xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-[#B8FF24] font-bold">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">MISSION OBJECTIVE ACCOMPLISHED: DESIGN COMPLIANT!</span>
              </div>
              <p className="text-slate-200 pl-7 leading-relaxed">
                All physical safety invariants are respected (T_peak &lt; 45.0 °C). The battery can safely charge/discharge without metallic lithium plating or accelerated degradation risk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
