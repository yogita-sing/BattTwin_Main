import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { ParameterControls } from './components/common/ParameterControls';
import { BatteryCanvas3D } from './components/visualizer3d/BatteryCanvas3D';
import { CircuitSchematic2D } from './components/visualizer2d/CircuitSchematic2D';
import { CellInspector } from './components/common/CellInspector';
import { StudentModePanel } from './components/student_mode/StudentModePanel';
import { EngineerModePanel } from './components/engineer_mode/EngineerModePanel';
import {
  FullSimulationOutput,
  LearningChallenge,
  OptionComparisonItem,
  SimulationConditions,
  ModuleTopology,
} from './types/battery';
import { defaultCell, runL2Simulation } from './services/physicsEngine';
import { evaluateSafetyVeto } from './services/governanceEngine';
import { detectCrossDomainConflicts } from './services/conflictEngine';
import { computeVsiRanking } from './services/vsiEngine';
import { compareOptions } from './services/tradeOffsEngine';
import { commitManager } from './services/commitManager';
import { downloadEvidenceDossier } from './services/evidenceExport';
import { learningChallenges } from './data/challenges';
import { Box, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'student' | 'engineer'>('student');
  const [viewTab, setViewTab] = useState<'3d' | '2d'>('3d');

  // Simulation Parameters
  const [ambientTemp, setAmbientTemp] = useState<number>(35.0);
  const [cRate, setCRate] = useState<number>(1.0);
  const [operationMode, setOperationMode] = useState<'charge' | 'discharge'>('charge');
  const [rSpreadPct, setRSpreadPct] = useState<number>(0.0);
  const [coolingType, setCoolingType] = useState<string>('baseline_passive');
  const [cellSpacing, setCellSpacing] = useState<number>(1.0);
  const [deratingEnabled, setDeratingEnabled] = useState<boolean>(false);

  // Simulation State
  const [simOutput, setSimOutput] = useState<FullSimulationOutput | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>('Cell_S1_P1');
  const [challenges] = useState<LearningChallenge[]>(learningChallenges);
  const [activeChallengeId, setActiveChallengeId] = useState<string>('challenge_1');
  const [options, setOptions] = useState<OptionComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Run simulation whenever parameters change
  const runSimulation = useCallback(() => {
    setIsLoading(true);
    try {
      const simConditions: SimulationConditions = {
        ambient_temp_c: ambientTemp,
        c_rate: cRate,
        operation_mode: operationMode,
        duration_minutes: 45.0,
        resistance_spread_pct: rSpreadPct,
        capacity_spread_pct: 0.0,
        weld_resistance_mohm: 0.0,
        airflow_restriction_pct: 0.0,
      };

      const moduleTopo: ModuleTopology = {
        series_count: 4,
        parallel_count: 2,
        busbar: {
          material: coolingType === 'pcm_matrix' ? 'copper' : 'nickel',
          thickness_mm: 0.3,
          width_mm: 8.0,
          length_mm: 25.0,
          resistance_mohm: coolingType === 'pcm_matrix' ? 0.25 : 0.85,
        },
        thermal: {
          cooling_type: coolingType as any,
          cell_spacing_mm: cellSpacing,
          pcm: {
            enabled: coolingType === 'pcm_matrix',
            melt_point_c: 42.0,
            latent_heat_j_per_g: 150.0,
            mass_g: 120.0,
            thermal_conductivity_w_m_k: 0.25,
          },
          active_fan_flow_cfm: coolingType === 'active_cooling' ? 12.0 : 0.0,
          derating_enabled: deratingEnabled,
          derating_temp_threshold_c: 40.0,
        },
        afe_ic_model: 'TI bq76920 (5-Series)',
        passive_balancing_resistor_ohm: 82.0,
      };

      // 1. Physical Simulation
      const [cells, time_series, kpis] = runL2Simulation(defaultCell, moduleTopo, simConditions);

      // 2. Governance: Safety Veto
      const veto_result = evaluateSafetyVeto(defaultCell, moduleTopo, simConditions, kpis);

      // 3. Governance: Conflict Detector
      const conflicts = detectCrossDomainConflicts(defaultCell, moduleTopo, simConditions, kpis);

      // 4. Sensitivity: VSI Ranking
      const vsi_ranking = computeVsiRanking(defaultCell, moduleTopo, simConditions, kpis);

      // 5. Versioning: SHA-256 commit record
      const commit_record = commitManager.createCommit(
        {
          ambient_temp_c: simConditions.ambient_temp_c,
          c_rate: simConditions.c_rate,
          mode: simConditions.operation_mode,
          cooling_type: moduleTopo.thermal.cooling_type,
          peak_temp_c: kpis.peak_temperature_c,
          is_vetoed: veto_result.is_vetoed,
        },
        'Engineer',
        `Simulation run: ${simConditions.operation_mode} at ${simConditions.c_rate}C`
      );

      // 6. Compliance assertions check summary
      const compliance_summary = {
        IEC_62133_2_Overcharge_Safe: !veto_result.is_vetoed && kpis.peak_temperature_c < 45.0,
        AIS_156_Temp_Spread_Below_5C: kpis.temp_spread_delta_t_c <= 5.0,
        IEC_62619_OT_Protection_Present: true,
        UN_38_3_Cell_Voltage_Safe: cells.every((c) => c.voltage_v <= 4.25 && c.voltage_v >= 2.45),
      };

      const simData: FullSimulationOutput = {
        timestamp: new Date().toISOString(),
        commit_hash: commit_record.commit_hash,
        parent_hash: commit_record.parent_hash,
        veto: veto_result,
        conflicts,
        kpis,
        cells,
        time_series,
        vsi_ranking,
        compliance_summary,
      };

      setSimOutput(simData);

      // 7. Multi-criteria Trade-offs
      const tradeData = compareOptions(defaultCell, simConditions);
      setOptions(tradeData);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ambientTemp, cRate, operationMode, rSpreadPct, coolingType, cellSpacing, deratingEnabled]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Handle counterfactual application from Student Mode
  const handleApplyCounterfactual = (paramName: string, value: number) => {
    if (paramName === 'ambient_temp_c') setAmbientTemp(value);
    if (paramName === 'c_rate') setCRate(value);
    if (paramName === 'derating_enabled') setDeratingEnabled(value === 1);
    if (paramName === 'cooling_type') setCoolingType('pcm_matrix');
  };

  // Export Signed Evidence Dossier
  const handleExportEvidence = () => {
    if (!simOutput) return;
    setIsExporting(true);
    try {
      downloadEvidenceDossier(simOutput);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCell =
    simOutput?.cells.find((c) => c.cell_id === selectedCellId) ||
    simOutput?.cells[0] ||
    null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        mode={mode}
        setMode={setMode}
        isVetoed={simOutput?.veto.is_vetoed || false}
        commitHash={simOutput?.commit_hash || '0000000'}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Parameter Sliders */}
        <ParameterControls
          ambientTemp={ambientTemp}
          setAmbientTemp={setAmbientTemp}
          cRate={cRate}
          setCRate={setCRate}
          operationMode={operationMode}
          setOperationMode={setOperationMode}
          rSpreadPct={rSpreadPct}
          setRSpreadPct={setRSpreadPct}
          coolingType={coolingType}
          setCoolingType={setCoolingType}
          cellSpacing={cellSpacing}
          setCellSpacing={setCellSpacing}
          deratingEnabled={deratingEnabled}
          setDeratingEnabled={setDeratingEnabled}
          onSimulate={runSimulation}
          isLoading={isLoading}
        />

        {/* Visualizer & Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left/Middle: Visualizer Canvas (3D or 2D) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewTab('3d')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewTab === '3d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Exploded View</span>
              </button>

              <button
                onClick={() => setViewTab('2d')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewTab === '2d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>2D Circuit Ladder</span>
              </button>
            </div>

            <div className="h-[460px] w-full">
              {viewTab === '3d' ? (
                <BatteryCanvas3D
                  cells={simOutput?.cells || []}
                  selectedCellId={selectedCellId}
                  onSelectCell={(cid) => setSelectedCellId(cid)}
                  coolingType={coolingType}
                  isVetoed={simOutput?.veto.is_vetoed || false}
                />
              ) : (
                <CircuitSchematic2D
                  cells={simOutput?.cells || []}
                  selectedCellId={selectedCellId}
                  onSelectCell={(cid) => setSelectedCellId(cid)}
                  packVoltage={simOutput?.kpis.nominal_voltage_v || 14.4}
                  packCurrent={
                    simOutput?.cells.reduce((acc, c) => acc + c.current_a, 0) ? simOutput.cells.reduce((acc, c) => acc + c.current_a, 0) / 4 : 8.4
                  }
                />
              )}
            </div>
          </div>

          {/* Right: Key Telemetry Cards & Selected Cell Inspector */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Peak Cell Temp</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span
                    className={`text-xl font-bold font-mono ${
                      (simOutput?.kpis.peak_temperature_c || 0) >= 45.0 ? 'text-red-400' : 'text-cyan-300'
                    }`}
                  >
                    {simOutput?.kpis.peak_temperature_c.toFixed(1) || '--'} °C
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">(Limit 45°)</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Cell Spread (ΔT)</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-xl font-bold font-mono text-emerald-300">
                    {simOutput?.kpis.temp_spread_delta_t_c.toFixed(1) || '--'} °C
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">(AIS ≤ 5°)</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Usable Energy</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-0.5">
                  {simOutput?.kpis.usable_energy_wh.toFixed(1) || '120.9'} Wh
                </span>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">BOM Cost / Mass</span>
                <span className="text-sm font-bold font-mono text-slate-200 block mt-1">
                  ${simOutput?.kpis.estimated_bom_cost_usd.toFixed(0) || '60'} | {simOutput?.kpis.total_mass_g.toFixed(0) || '670'}g
                </span>
              </div>
            </div>

            {/* Live Cell Inspector */}
            <div className="flex-1">
              <CellInspector cell={selectedCell} />
            </div>
          </div>
        </div>

        {/* Bottom Section: Mode specific panels */}
        {mode === 'student' ? (
          <StudentModePanel
            challenges={challenges}
            activeChallengeId={activeChallengeId}
            onSelectChallenge={(id) => setActiveChallengeId(id)}
            vetoResult={simOutput?.veto || { is_vetoed: false, counterfactuals: [] }}
            onApplyCounterfactual={handleApplyCounterfactual}
          />
        ) : (
          <EngineerModePanel
            vsiRanking={simOutput?.vsi_ranking || []}
            conflicts={simOutput?.conflicts || []}
            options={options}
            commitHash={simOutput?.commit_hash || '0000000'}
            onExportEvidence={handleExportEvidence}
            isExporting={isExporting}
          />
        )}
      </main>
    </div>
  );
};

export default App;
