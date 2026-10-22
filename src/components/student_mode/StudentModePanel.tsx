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
    <div className="w-full bg-[#0E1510] rounded-2xl p-6 border border-[#1E2D21] shadow-2xl space-y-6">
      {/* Title & Mode Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1E2D21]">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#142316] border border-[#273B29] text-[#B8FF24]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2 font-mono">
              <span>Student Learning Sandbox</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#132216] text-[#B8FF24] border border-[#273B29]">
                Discovery Lab
              </span>
            </h2>
            <p className="text-xs text-[#8A9A8C] mt-0.5">
              Interactive physics exploration: understand WHY battery designs fail and how to fix them.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {challenges.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => {
              onSelectChallenge(c.id);
              setShowHint(false);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              c.id === activeChallengeId
                ? 'bg-[#142316] border-[#B8FF24]/60 text-white shadow-[0_0_15px_rgba(184,255,36,0.15)] ring-1 ring-[#B8FF24]/40'
                : 'bg-[#080B08] border-[#1E2D21] text-[#8A9A8C] hover:border-[#273B29] hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-[#B8FF24] block">Challenge {idx + 1}</span>
            <span className="text-xs font-semibold line-clamp-1 mt-0.5">{c.concept}</span>
          </button>
        ))}
      </div>

      {/* Active Challenge Story & Mission Card */}
      {activeChallenge && (
        <div className="bg-[#080B08] rounded-xl p-5 border border-[#1E2D21] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B8FF24] font-semibold">
                MISSION BRIEFING
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeChallenge.title}</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#111A13] border border-[#273B29] text-xs font-mono text-[#B8FF24]">
              {activeChallenge.concept}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#0E1510] p-4 rounded-xl border border-[#1E2D21]">
            {activeChallenge.story}
          </p>

          {/* Governing Formula Card */}
          <div className="p-3.5 rounded-xl bg-[#111A13] border border-[#233526] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-[#B8FF24]" />
              <div>
                <span className="text-[11px] text-[#8A9A8C] font-mono block">Governing Physical Relation:</span>
                <code className="text-xs font-mono font-bold text-[#B8FF24]">{activeChallenge.governing_equation}</code>
              </div>
            </div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1.5 rounded-full bg-[#162719] hover:bg-[#1e3422] text-[#B8FF24] border border-[#273B29] text-xs font-mono font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
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
              <div className="pt-2 border-t border-amber-900/40 flex items-center space-x-2 text-[#B8FF24]">
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
            <span className="text-[11px] font-mono text-red-300 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800">
              Deterministic Veto Gate
            </span>
          </div>

          <p className="text-xs text-slate-300">{vetoResult.plain_explanation}</p>

          <div className="space-y-2 pt-2 border-t border-red-900/40">
            <span className="text-[11px] font-mono uppercase text-[#8A9A8C] block font-semibold">
              Interactive Counterfactual Fixes (Minimal physical changes to achieve compliance):
            </span>
            {vetoResult.counterfactuals.map((cf, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#080B08] border border-[#1E2D21] hover:border-[#273B29] transition-all text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{cf.description}</span>
                  <span className="text-[11px] text-[#8A9A8C] font-mono">
                    Current: <strong className="text-red-400">{cf.current_value} {cf.unit}</strong> → Recommended:{' '}
                    <strong className="text-[#B8FF24] font-bold">{cf.recommended_value} {cf.unit}</strong>
                  </span>
                </div>
                <button
                  onClick={() => onApplyCounterfactual(cf.parameter_name, cf.recommended_value)}
                  className="px-3.5 py-1.5 rounded-full bg-[#B8FF24] hover:bg-[#c9ff4d] text-black font-mono font-bold flex items-center space-x-1.5 transition-all text-xs cursor-pointer shadow-[0_0_10px_rgba(184,255,36,0.3)]"
                >
                  <span>Apply Fix</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
