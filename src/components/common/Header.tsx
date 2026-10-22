import React from 'react';
import { BatteryCharging, GraduationCap, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  mode: 'student' | 'engineer';
  setMode: (m: 'student' | 'engineer') => void;
  isVetoed: boolean;
  commitHash: string;
}

export const Header: React.FC<HeaderProps> = ({ mode, setMode, isVetoed, commitHash }) => {
  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-900/30">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <BatteryCharging className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center">
              <span>Batt</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Twin</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
              v1.0 Unified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Cell-to-System Multi-Physics Design, Trade-Off & Deterministic Compliance Platform
          </p>
        </div>
      </div>

      {/* Mode Switcher: Student vs Engineer */}
      <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setMode('student')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'student'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Mode (Interactive Lab)</span>
        </button>

        <button
          onClick={() => setMode('engineer')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'engineer'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Engineer Mode (Design Studio)</span>
        </button>
      </div>

      {/* Safety Gate Status & Git-like SHA-256 Commit Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500">SHA-256:</span>
          <span className="text-slate-300 font-semibold">{commitHash.slice(0, 7)}</span>
        </div>

        {isVetoed ? (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-400 text-xs font-bold animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            <span>SAFETY VETO</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>COMPLIANT</span>
          </div>
        )}
      </div>
    </header>
  );
};
