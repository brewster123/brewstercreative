import React from 'react';
import { Commission, COMMISSION_STAGES } from '../types';
import { Check, ArrowRight, Circle, Sparkles, Clock, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProgressBarProps {
  commission: Commission;
  interactiveAdmin?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ commission, interactiveAdmin = false }) => {
  const { currentUser, updateCommissionStage } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === commission.currentStage) || COMMISSION_STAGES[0];

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 sm:p-7 shadow-sm relative overflow-hidden">
      {/* Background ambient subtle glow */}
      <div className="absolute top-0 right-0 w-72 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header with Title & Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono-code text-orange-600 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Commission Stage Tracker
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold border border-zinc-200">
              Stage {commission.currentStage} of 8
            </span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>{currentStageInfo.name}</span>
            {commission.status === 'Completed' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-sans font-semibold border border-emerald-200">
                ✓ Completed
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {currentStageInfo.description}
          </p>
        </div>

        {/* Progress Gauge */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-zinc-50 px-4 py-2.5 rounded-2xl border border-zinc-200/80">
          <div className="text-right">
            <div className="text-[11px] text-zinc-500 uppercase font-mono-code font-bold">Progress</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900">
              {commission.progress}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-orange-500 flex items-center justify-center font-mono-code text-xs font-bold text-orange-600">
            {commission.currentStage}/8
          </div>
        </div>
      </div>

      {/* Visual Filled Progress Bar Line */}
      <div className="mb-6">
        <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-sm relative"
            style={{ width: `${commission.progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 8-Stage Stepper Grid (Horizontal on Desktop, Responsive Wraps) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-2">
        {COMMISSION_STAGES.map((stage) => {
          const isCompleted = stage.number < commission.currentStage;
          const isCurrent = stage.number === commission.currentStage;
          const isPending = stage.number > commission.currentStage;

          return (
            <div
              key={stage.number}
              onClick={() => {
                if (isAdmin && interactiveAdmin) {
                  updateCommissionStage(commission.id, stage.number);
                }
              }}
              className={`relative rounded-2xl p-3 flex flex-col justify-between transition-all text-left ${
                isCurrent
                  ? 'bg-orange-50/80 border-2 border-orange-500 shadow-md shadow-orange-500/10'
                  : isCompleted
                  ? 'bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100'
                  : 'bg-zinc-50/50 border border-zinc-200/50 opacity-60'
              } ${isAdmin && interactiveAdmin ? 'cursor-pointer hover:border-orange-400' : ''}`}
            >
              {/* Stage Top Icon & Number */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono-code text-zinc-500 font-bold">
                  0{stage.number}
                </span>

                <div className="shrink-0">
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse shadow-sm">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-400 border border-zinc-300 flex items-center justify-center text-[10px]">
                      <Circle className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Name */}
              <p
                className={`text-xs font-bold leading-tight line-clamp-2 ${
                  isCurrent
                    ? 'text-orange-700'
                    : isCompleted
                    ? 'text-zinc-800'
                    : 'text-zinc-500'
                }`}
              >
                {stage.name}
              </p>

              {/* Current Indicator Label */}
              {isCurrent && (
                <span className="mt-1.5 text-[9px] font-mono-code text-orange-600 uppercase tracking-wider font-bold">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Quick Advance Control (Shown when admin is viewing) */}
      {isAdmin && interactiveAdmin && (
        <div className="mt-4 pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-50 p-3 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-800">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-700">Designer Controls:</span>
            <span className="text-zinc-500">Click any stage box above, or jump stage:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {commission.currentStage > 1 && (
              <button
                type="button"
                onClick={() => updateCommissionStage(commission.id, commission.currentStage - 1)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-semibold border border-zinc-200 transition-colors shadow-2xs"
              >
                ← Previous Stage
              </button>
            )}

            {commission.currentStage < 8 && (
              <button
                type="button"
                onClick={() => updateCommissionStage(commission.id, commission.currentStage + 1)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-all shadow-sm"
              >
                Advance to Next Stage ({COMMISSION_STAGES.find(s => s.number === commission.currentStage + 1)?.name}) →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
