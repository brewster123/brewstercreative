import React from 'react';
import { Commission, COMMISSION_STAGES } from '../types';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProgressBarProps {
  commission: Commission;
  interactiveAdmin?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ commission, interactiveAdmin = false }) => {
  const { currentUser, updateCommissionStage } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const isCommissionCompleted =
    commission.currentStage === 8 ||
    (commission.status || '').toLowerCase() === 'completed';

  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === commission.currentStage) || COMMISSION_STAGES[0];
  const clampedProgress = Math.min(100, Math.max(0, Math.round(commission.progress ?? 0)));

  return (
    <div className="space-y-6">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold block">
            Stage 0{commission.currentStage} of 08 · {currentStageInfo.name}
          </span>
          <p className="text-xs text-graphite">
            {currentStageInfo.description}
          </p>
        </div>

        <div className="flex items-baseline gap-3 shrink-0 self-start sm:self-auto font-mono">
          <span className="text-[11px] text-graphite uppercase tracking-wider">Progress</span>
          <span className="text-xl font-bold text-carbon font-display">
            {clampedProgress}%
          </span>
        </div>
      </div>

      {/* Hairline Progress Rule */}
      <div className="h-1 w-full bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* 8-Stage Production Flow: Vertical on Mobile, Clean Grid on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
        {COMMISSION_STAGES.map((stage) => {
          const isCompleted = isCommissionCompleted
            ? stage.number <= commission.currentStage
            : stage.number < commission.currentStage;
          const isCurrent = !isCommissionCompleted && stage.number === commission.currentStage;

          const stageStatusText = isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming';
          const stageClasses = `p-3 rounded-2xl border text-left flex sm:flex-col justify-between items-center sm:items-start gap-2 transition-all ${
            isCurrent
              ? 'border-accent bg-[#E0F2FE]/60 dark:bg-sky-950/30'
              : isCompleted
              ? 'border-hairline bg-surface-secondary'
              : 'border-transparent bg-transparent opacity-40'
          } ${isAdmin && interactiveAdmin ? 'cursor-pointer hover:border-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile' : ''}`;

          const content = (
            <>
              <div className="flex items-center sm:justify-between w-full gap-2 font-mono text-[10px]">
                <span className={`font-semibold tracking-wider ${isCurrent ? 'text-accent' : 'text-graphite'}`}>
                  0{stage.number}
                </span>

                <div className="shrink-0" aria-hidden="true">
                  {isCompleted ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-[9px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-secondary" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:flex-initial">
                <p className={`font-mono text-[10px] uppercase tracking-wider font-semibold line-clamp-2 ${
                  isCurrent ? 'text-accent' : isCompleted ? 'text-carbon' : 'text-graphite'
                }`}>
                  {stage.name}
                </p>
              </div>
            </>
          );

          if (isAdmin && interactiveAdmin) {
            return (
              <button
                key={stage.number}
                type="button"
                onClick={() => updateCommissionStage(commission.id, stage.number)}
                className={stageClasses}
                aria-label={`Advance to Stage 0${stage.number}: ${stage.name} (${stageStatusText})`}
                title={`Click to set stage to 0${stage.number} - ${stage.name}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={stage.number}
              className={stageClasses}
              aria-label={`Stage 0${stage.number}: ${stage.name} (${stageStatusText})`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {isAdmin && interactiveAdmin && (
        <p className="text-[11px] font-mono text-graphite text-right">
          Studio Director: Click any milestone stage above to advance production.
        </p>
      )}

    </div>
  );
};
