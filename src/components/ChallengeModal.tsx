import React from 'react';
import { Challenge, LanguageMode } from '../types';
import { X, Award, CheckCircle2, Circle, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  onApplyChallengePreset: (challenge: Challenge) => void;
  languageMode: LanguageMode;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onApplyChallengePreset,
  languageMode,
}) => {
  if (!isOpen) return null;

  const completedCount = challenges.filter((c) => c.isCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {languageMode === 'bn' ? 'শিক্ষার্থী পদার্থবিজ্ঞান চ্যালেঞ্জ' : 'Student Physics Challenges'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {languageMode === 'bn'
                  ? `সম্পন্ন হয়েছে: ${completedCount}/${challenges.length}`
                  : `Completed: ${completedCount}/${challenges.length}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border transition-all ${
                c.isCompleted
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {c.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {languageMode === 'bn' ? c.titleBn : c.titleEn}
                  </h3>
                </div>
                {c.isCompleted && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded">
                    {languageMode === 'bn' ? 'সম্পন্ন ✓' : 'COMPLETED ✓'}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {languageMode === 'bn' ? c.descriptionBn : c.descriptionEn}
              </p>

              {/* Target Criteria */}
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1 shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {languageMode === 'bn' ? 'লক্ষ্যমাত্রা (Criteria):' : 'Success Criteria:'}
                </div>
                <div className="font-mono text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold">
                  {languageMode === 'bn' ? c.targetCriteriaBn : c.targetCriteriaEn}
                </div>
              </div>

              {/* Hint and Action */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400/90">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{languageMode === 'bn' ? c.hintBn : c.hintEn}</span>
                </div>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    onApplyChallengePreset(c);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-xs ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{languageMode === 'bn' ? 'সেটআপ প্রয়োগ করুন' : 'Load Setup'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {languageMode === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
