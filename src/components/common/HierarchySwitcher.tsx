import React from 'react';
import { HierarchyScope, PackRollupData } from '../../types/battery';
import { Layers, Shield, Cpu, ChevronRight } from 'lucide-react';

interface HierarchySwitcherProps {
  scope: HierarchyScope;
  setScope: (scope: HierarchyScope) => void;
  packRollup: PackRollupData;
}

export const HierarchySwitcher: React.FC<HierarchySwitcherProps> = ({
  scope,
  setScope,
  packRollup,
}) => {
  return (
    <div className="w-full bg-[#0E1510] rounded-2xl p-4 sm:p-5 border border-[#1E2D21] shadow-2xl flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 rounded-xl bg-[#141F16] border border-[#273B29] text-[#B8FF24]">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
              Hierarchy Scale Explorer
            </h3>
            <span className="text-[10px] text-[#8A9A8C] font-mono border-l border-[#273B29] pl-2">
              Cell → 4S2P Module → 12S2P Pack
            </span>
          </div>
          <p className="text-[11px] text-[#8A9A8C] mt-0.5">
            {scope === 'module_4s2p'
              ? 'Multi-physics electro-thermal coupled analysis on primary 4S2P building block.'
              : 'Parametric hierarchy roll-up to 12S2P Light-EV pack (3x modules in series).'}
          </p>
        </div>
      </div>

      {/* Scope Segmented Control */}
      <div className="flex items-center bg-[#080B08] p-1 rounded-full border border-[#1E2D21]">
        <button
          onClick={() => setScope('module_4s2p')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
            scope === 'module_4s2p'
              ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_15px_rgba(184,255,36,0.3)]'
              : 'text-[#8A9A8C] hover:text-white'
          }`}
        >
          <span>4S2P Module (14.4 V)</span>
        </button>

        <button
          onClick={() => setScope('pack_12s2p')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
            scope === 'pack_12s2p'
              ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_15px_rgba(184,255,36,0.3)]'
              : 'text-[#8A9A8C] hover:text-white'
          }`}
        >
          <span>12S2P Pack Roll-Up (43.2 V)</span>
        </button>
      </div>

      {/* Pack Architecture Quick Callout (when in pack mode) */}
      {scope === 'pack_12s2p' && (
        <div className="w-full pt-3 mt-1 border-t border-[#1E2D21] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#080B08] border border-[#1E2D21]">
            <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">SERIES STRING</span>
            <span className="text-white font-bold">3x 4S2P (24 Cells)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B08] border border-[#1E2D21]">
            <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">PACK ENERGY</span>
            <span className="text-[#B8FF24] font-bold">{packRollup.nominal_energy_wh} Wh ({packRollup.nominal_voltage_v} V)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B08] border border-[#1E2D21]">
            <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">TOTAL PACK MASS</span>
            <span className="text-white font-bold">{packRollup.total_mass_g} g (IP67 Cast)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B08] border border-[#1E2D21]">
            <span className="text-[10px] text-[#8A9A8C] block uppercase tracking-wider">BMS ARCHITECTURE</span>
            <span className="text-[#B8FF24] font-bold">3x Slaves + 1x Master</span>
          </div>
        </div>
      )}
    </div>
  );
};
