import React, { useState } from 'react';
import { LearningChallenge, SafetyVetoResult } from '../../types/battery';
import { BookOpen, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb, Compass } from 'lucide-react';

interface StudentModePanelProps {
  challenges: LearningChallenge[];
  activeChallengeId: string;
  onSelectChallenge: (id: string) => void;
  vetoResult: SafetyVetoResult;
  onApplyCounterfactual: (paramName: string, value: number) => void;
}

export const StudentModePanel: React.FC<StudentModePanelProps> = ({
  challenges,
  activeChallengeId,
  onSelectChallenge,
  vetoResult,
  onApplyCounterfactual,
}) => {
  const activeChallenge = challenges.find((c) => c.id === activeChallengeId) || challenges[0];
  const [showHint, setShowHint] = useState<boolean>(false);

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Title & Mode Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Student Learning Sandbox</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Discovery Lab
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive physics exploration: understand WHY battery designs fail and how to fix them.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {challenges.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => {
              onSelectChallenge(c.id);
              setShowHint(false);
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              c.id === activeChallengeId
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-indigo-400/80 block">Challenge {idx + 1}</span>
            <span className="text-xs font-semibold line-clamp-1 mt-0.5">{c.concept}</span>
          </button>
        ))}
      </div>

      {/* Active Challenge Story & Mission Card */}
      {activeChallenge && (
        <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                MISSION BRIEFING
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{activeChallenge.title}</h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400">
              {activeChallenge.concept}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
            {activeChallenge.story}
          </p>

          {/* Governing Formula Card */}
          <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[11px] text-indigo-300 font-medium block">Governing Physical Relation:</span>
                <code className="text-xs font-mono font-bold text-indigo-200">{activeChallenge.governing_equation}</code>
              </div>
            </div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Hide Physics Secret' : 'Reveal Physics Secret'}</span>
            </button>
          </div>

          {/* Expandable Explanation Trap */}
          {showHint && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>The Engineering Paradox Explained:</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">{activeChallenge.trap_explanation}</p>
              <div className="pt-2 border-t border-amber-900/40 flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span><strong>Physics Resolution:</strong> {activeChallenge.counterfactual_solution}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Counterfactual "What-If" Fixer (Active when Veto is tripped) */}
      {vetoResult.is_vetoed && vetoResult.counterfactuals.length > 0 && (
        <div className="p-5 rounded-xl bg-red-950/30 border border-red-500/50 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>SAFETY VETO TRIGGERED: {vetoResult.violated_requirement_id}</span>
            </div>
            <span className="text-[11px] font-mono text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
              Deterministic Veto Gate
            </span>
          </div>

          <p className="text-xs text-slate-300">{vetoResult.plain_explanation}</p>

          <div className="space-y-2 pt-2 border-t border-red-900/40">
            <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
              Interactive Counterfactual Fixes (Smallest physical changes that pass):
            </span>
            {vetoResult.counterfactuals.map((cf, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{cf.description}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Current: <strong className="text-red-400">{cf.current_value} {cf.unit}</strong> → Recommended:{' '}
                    <strong className="text-emerald-400 font-bold">{cf.recommended_value} {cf.unit}</strong>
                  </span>
                </div>
                <button
                  onClick={() => onApplyCounterfactual(cf.parameter_name, cf.recommended_value)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium flex items-center space-x-1.5 transition-all text-xs"
                >
                  <span>Apply Fix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
