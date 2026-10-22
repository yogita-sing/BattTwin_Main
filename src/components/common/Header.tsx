import React from 'react';
import { BatteryCharging, GraduationCap, Cpu, ShieldAlert, CheckCircle2, BookOpen } from 'lucide-react';

interface HeaderProps {
  viewMode: 'landing' | 'studio';
  setViewMode: (v: 'landing' | 'studio') => void;
  mode: 'student' | 'engineer';
  setMode: (m: 'student' | 'engineer') => void;
  isVetoed: boolean;
  commitHash: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  mode,
  setMode,
  isVetoed,
  commitHash,
}) => {
  return (
    <header className="w-full bg-[#080B08]/90 backdrop-blur-xl border-b border-[#1E2D21] sticky top-0 z-40 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Brand & Logo */}
      <div
        onClick={() => setViewMode('landing')}
        className="flex items-center space-x-3 cursor-pointer group"
        title="View Case Study Overview"
      >
        <div className="w-9 h-9 rounded-xl bg-[#111712] border border-[#273B29] flex items-center justify-center shadow-lg shadow-black/40 group-hover:border-[#B8FF24]/50 transition-colors">
          <BatteryCharging className="w-4 h-4 text-[#B8FF24] group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center font-mono">
              <span>BATT</span>
              <span className="text-[#B8FF24]">TWIN</span>
            </h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#111812] text-[#B8FF24] border border-[#233526]">
              DIGITAL TWIN PRO
            </span>
          </div>
          <p className="text-[10px] text-[#8A9A8C] hidden sm:block">
            Tata Elxsi TELIPORT Season 4 • Case Study 2 Platform
          </p>
        </div>
      </div>

      {/* Primary Navigation: Case Study Overview vs Interactive Studio */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-[#0E1510] p-1 rounded-full border border-[#1E2D21]">
          <button
            onClick={() => setViewMode('landing')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
              viewMode === 'landing'
                ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.25)]'
                : 'text-[#8A9A8C] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem & Prototype</span>
          </button>

          <button
            onClick={() => setViewMode('studio')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
              viewMode === 'studio'
                ? 'bg-[#B8FF24] text-black font-bold shadow-[0_0_12px_rgba(184,255,36,0.25)]'
                : 'text-[#8A9A8C] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive Studio</span>
          </button>
        </div>

        {/* Persona Switcher when inside Studio */}
        {viewMode === 'studio' && (
          <div className="flex items-center bg-[#0E1510] p-1 rounded-full border border-[#1E2D21]">
            <button
              onClick={() => setMode('student')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                mode === 'student'
                  ? 'bg-[#182B1B] text-[#B8FF24] font-bold border border-[#B8FF24]/40 shadow-[0_0_10px_rgba(184,255,36,0.2)]'
                  : 'text-[#8A9A8C] hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Lab</span>
            </button>
            <button
              onClick={() => setMode('engineer')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                mode === 'engineer'
                  ? 'bg-[#182B1B] text-[#B8FF24] font-bold border border-[#B8FF24]/40 shadow-[0_0_10px_rgba(184,255,36,0.2)]'
                  : 'text-[#8A9A8C] hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Engineer Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety Gate Status & Git-like SHA-256 Commit Badge */}
      <div className="flex items-center space-x-2.5">
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0E1510] border border-[#1E2D21] text-[11px] font-mono">
          <span className="text-[#8A9A8C]">SHA:</span>
          <span className="text-[#B8FF24] font-semibold">{commitHash.slice(0, 7)}</span>
        </div>

        {isVetoed ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/70 border border-red-500/60 text-red-400 text-[11px] font-mono font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SAFETY VETO</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#112014] border border-[#B8FF24]/60 text-[#B8FF24] text-[11px] font-mono font-bold shadow-[0_0_10px_rgba(184,255,36,0.15)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLIANT</span>
          </div>
        )}
      </div>
    </header>
  );
};
