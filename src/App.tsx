import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/common/Header';
import { HierarchySwitcher } from './components/common/HierarchySwitcher';
import { ParameterControls } from './components/common/ParameterControls';
import { BatteryCanvas3D } from './components/visualizer3d/BatteryCanvas3D';
import { CircuitSchematic2D } from './components/visualizer2d/CircuitSchematic2D';
import { CellInspector } from './components/common/CellInspector';
import { StudentModePanel } from './components/student_mode/StudentModePanel';
import { StudentLabWorkspace } from './components/student_mode/StudentLabWorkspace';
import { EngineerModePanel } from './components/engineer_mode/EngineerModePanel';
import { CaseStudyLandingPage } from './components/landing/CaseStudyLandingPage';
import {
  FullSimulationOutput,
  LearningChallenge,
  OptionComparisonItem,
  SimulationConditions,
  ModuleTopology,
  HierarchyScope,
  ParetoCandidate,
} from './types/battery';
import { defaultCell, runL2Simulation } from './services/physicsEngine';
import { evaluateSafetyVeto } from './services/governanceEngine';
import { detectCrossDomainConflicts } from './services/conflictEngine';
import { computeVsiRanking } from './services/vsiEngine';
import { compareOptions } from './services/tradeOffsEngine';
import { computePackRollup } from './services/packRollupEngine';
import { commitManager } from './services/commitManager';
import { downloadEvidenceDossier } from './services/evidenceExport';
import { learningChallenges } from './data/challenges';
import { Box, Cpu, AlertOctagon } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'landing' | 'studio'>('landing');
  const [mode, setMode] = useState<'student' | 'engineer'>('student');
  const [viewTab, setViewTab] = useState<'3d' | '2d'>('3d');
  const [hierarchyScope, setHierarchyScope] = useState<HierarchyScope>('module_4s2p');

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
  const [staleBanner, setStaleBanner] = useState<string[]>([]);

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
          hierarchy_scope: hierarchyScope,
        },
        'Engineer',
        `Simulation run: ${simConditions.operation_mode} at ${simConditions.c_rate}C [${hierarchyScope}]`
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

      // Also compute architectural options for Engineer Mode
      const opts = compareOptions(defaultCell, simConditions);
      setOptions(opts);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ambientTemp, cRate, operationMode, rSpreadPct, coolingType, cellSpacing, deratingEnabled, hierarchyScope]);

  // Initial simulation run
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Handle student counterfactual auto-apply
  const handleApplyCounterfactual = (paramName: string, value: number) => {
    if (paramName === 'c_rate') setCRate(value);
    if (paramName === 'ambient_temp_c') setAmbientTemp(value);
    if (paramName === 'cell_spacing_mm') {
      setCellSpacing(value);
      setCoolingType('natural_convection');
    }
  };

  // Handle Pareto Candidate Selection
  const handleApplyParetoCandidate = (candidate: ParetoCandidate) => {
    setCoolingType(candidate.cooling_type);
    if (candidate.cooling_type === 'pcm_matrix') {
      setCellSpacing(1.5);
    } else if (candidate.cooling_type === 'active_cooling') {
      setCellSpacing(2.0);
    } else if (candidate.cooling_type === 'natural_convection') {
      setCellSpacing(3.0);
    } else {
      setCellSpacing(1.0);
    }
  };

  // Compute Pack Roll-Up metrics
  const packRollup = useMemo(() => {
    return computePackRollup(simOutput?.kpis);
  }, [simOutput?.kpis]);

  // Export Signed Evidence Package
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
    <div className="min-h-screen bg-[#080B08] text-white flex flex-col font-sans selection:bg-[#B8FF24]/30 selection:text-[#B8FF24]">
      {/* Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        mode={mode}
        setMode={setMode}
        isVetoed={simOutput?.veto.is_vetoed || false}
        commitHash={simOutput?.commit_hash || '0000000'}
      />

      {/* When viewMode === 'landing', show full Case Study & Prototype Landing Page */}
      {viewMode === 'landing' ? (
        <CaseStudyLandingPage
          onLaunchStudio={(targetMode) => {
            if (targetMode) setMode(targetMode);
            setViewMode('studio');
          }}
        />
      ) : (
        <>
          {/* Stale Model Invalidation Alert Banner (if assumptions were modified) */}
          {staleBanner.length > 0 && (
            <div className="bg-amber-950/80 border-b border-amber-500/40 px-6 py-2.5 text-xs font-mono text-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>Assumption Invalidation Alert:</strong> Assumption modified. Downstream models{' '}
                  <span className="text-[#B8FF24] font-bold">[{staleBanner.join(', ')}]</span> marked stale. Run recalculation to regenerate evidence.
                </span>
              </div>
              <button
                onClick={() => setStaleBanner([])}
                className="text-amber-400 hover:text-white underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
            {mode === 'student' ? (
              /* ======================================================== */
              /* 1. STUDENT PHYSICS LAB: GUIDED DISCOVERY & EXPERIMENTS   */
              /* ======================================================== */
              <StudentLabWorkspace
                challenges={challenges}
                activeChallengeId={activeChallengeId}
                onSelectChallenge={(id) => setActiveChallengeId(id)}
                simOutput={simOutput}
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
                onApplyCounterfactual={handleApplyCounterfactual}
                onSimulate={runSimulation}
                isLoading={isLoading}
                onSwitchToEngineer={() => setMode('engineer')}
              />
            ) : (
              /* ======================================================== */
              /* 2. ENGINEER SYSTEMS STUDIO: ARCHITECTURE & GOVERNANCE    */
              /* ======================================================== */
              <div className="space-y-6">
                {/* Engineer Studio Header Banner */}
                <div className="bg-[#0E1510] p-5 rounded-2xl border border-[#1E2D21] flex flex-wrap items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-mono font-bold tracking-widest text-[#B8FF24] uppercase px-2.5 py-0.5 rounded-full bg-[#132216] border border-[#273B29]">
                        Engineer Systems Studio
                      </span>
                      <span className="text-xs text-[#8A9A8C] font-mono">
                        Commit: <span className="text-[#B8FF24] font-bold">{simOutput?.commit_hash.slice(0, 8) || '0000000'}</span>
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight mt-1">
                      Multi-Objective Architecture, Safety Governance & Compliance
                    </h2>
                    <p className="text-xs text-[#8A9A8C] mt-0.5">
                      Cell-to-System hierarchy roll-up, non-dominated Pareto frontier, VSI margin consumption ranking, and ISO/IEC compliance-as-code.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMode('student')}
                      className="px-3.5 py-1.5 rounded-full bg-[#111A13] hover:bg-[#18261B] text-[#8A9A8C] hover:text-white border border-[#273B29] text-xs font-mono transition-all cursor-pointer"
                    >
                      ← Switch to Student Lab
                    </button>
                    <button
                      onClick={handleExportEvidence}
                      disabled={isExporting}
                      className="px-4 py-2 rounded-full bg-[#B8FF24] hover:bg-[#c9ff4d] text-black text-xs font-bold font-mono tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(184,255,36,0.25)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>{isExporting ? 'Exporting...' : 'Export Signed Evidence File'}</span>
                    </button>
                  </div>
                </div>

                {/* Hierarchy Switcher (4S2P Module vs 12S2P Light-EV Pack) */}
                <HierarchySwitcher
                  scope={hierarchyScope}
                  setScope={setHierarchyScope}
                  packRollup={packRollup}
                />

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
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                          viewTab === '3d'
                            ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.3)]'
                            : 'bg-[#0E1510] text-[#8A9A8C] border border-[#1E2D21] hover:text-white'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>3D Exploded View</span>
                      </button>

                      <button
                        onClick={() => setViewTab('2d')}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                          viewTab === '2d'
                            ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.3)]'
                            : 'bg-[#0E1510] text-[#8A9A8C] border border-[#1E2D21] hover:text-white'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>2D Circuit Ladder</span>
                      </button>
                    </div>

                    <div className={viewTab === '3d' ? 'h-[480px] w-full' : 'w-full'}>
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
                          packVoltage={
                            hierarchyScope === 'pack_12s2p'
                              ? packRollup.nominal_voltage_v
                              : simOutput?.kpis.nominal_voltage_v || 14.4
                          }
                          packCurrent={
                            simOutput?.cells.reduce((acc, c) => acc + c.current_a, 0)
                              ? simOutput.cells.reduce((acc, c) => acc + c.current_a, 0) / 4
                              : 8.4
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Key Telemetry Cards & Selected Cell Inspector */}
                  <div className="lg:col-span-4 flex flex-col space-y-4">
                    {/* Summary KPI Strip */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0E1510] p-3.5 rounded-2xl border border-[#1E2D21] shadow-xl">
                        <span className="text-[10px] text-[#8A9A8C] block uppercase font-mono tracking-wider">Peak Cell Temp</span>
                        <div className="flex items-baseline space-x-1.5 mt-0.5">
                          <span
                            className={`text-xl font-bold font-mono ${
                              (simOutput?.kpis.peak_temperature_c || 0) >= 45.0 ? 'text-red-400' : 'text-[#B8FF24]'
                            }`}
                          >
                            {simOutput?.kpis.peak_temperature_c.toFixed(1) || '--'} °C
                          </span>
                          <span className="text-[10px] text-[#8A9A8C] font-mono">(Limit 45°)</span>
                        </div>
                      </div>

                      <div className="bg-[#0E1510] p-3.5 rounded-2xl border border-[#1E2D21] shadow-xl">
                        <span className="text-[10px] text-[#8A9A8C] block uppercase font-mono tracking-wider">Cell Spread (ΔT)</span>
                        <div className="flex items-baseline space-x-1.5 mt-0.5">
                          <span className="text-xl font-bold font-mono text-white">
                            {simOutput?.kpis.temp_spread_delta_t_c.toFixed(1) || '--'} °C
                          </span>
                          <span className="text-[10px] text-[#8A9A8C] font-mono">(AIS ≤ 5°)</span>
                        </div>
                      </div>

                      <div className="bg-[#0E1510] p-3.5 rounded-2xl border border-[#1E2D21] shadow-xl">
                        <span className="text-[10px] text-[#8A9A8C] block uppercase font-mono tracking-wider">
                          {hierarchyScope === 'pack_12s2p' ? 'Pack Usable Energy' : 'Module Energy'}
                        </span>
                        <span className="text-xl font-bold font-mono text-[#B8FF24] block mt-0.5">
                          {hierarchyScope === 'pack_12s2p'
                            ? `${packRollup.usable_energy_wh.toFixed(1)} Wh`
                            : `${simOutput?.kpis.usable_energy_wh.toFixed(1) || '120.9'} Wh`}
                        </span>
                      </div>

                      <div className="bg-[#0E1510] p-3.5 rounded-2xl border border-[#1E2D21] shadow-xl">
                        <span className="text-[10px] text-[#8A9A8C] block uppercase font-mono tracking-wider">
                          {hierarchyScope === 'pack_12s2p' ? 'Pack Cost / Mass' : 'Module Cost / Mass'}
                        </span>
                        <span className="text-sm font-bold font-mono text-white block mt-1">
                          {hierarchyScope === 'pack_12s2p'
                            ? `$${packRollup.estimated_bom_cost_usd} | ${packRollup.total_mass_g}g`
                            : `$${simOutput?.kpis.estimated_bom_cost_usd.toFixed(0)} | ${simOutput?.kpis.total_mass_g.toFixed(0)}g`}
                        </span>
                      </div>
                    </div>

                    {/* Live Cell Inspector */}
                    <div className="flex-1">
                      <CellInspector cell={selectedCell} />
                    </div>
                  </div>
                </div>

                {/* Engineer Systems Panels */}
                <EngineerModePanel
                  vsiRanking={simOutput?.vsi_ranking || []}
                  conflicts={simOutput?.conflicts || []}
                  options={options}
                  commitHash={simOutput?.commit_hash || '0000000'}
                  onExportEvidence={handleExportEvidence}
                  isExporting={isExporting}
                  onApplyParetoCandidate={handleApplyParetoCandidate}
                  onInvalidateModels={(models) => setStaleBanner(models)}
                />
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
