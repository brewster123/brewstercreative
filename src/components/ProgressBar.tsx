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

  return (
    <div className="space-y-6">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
            Stage 0{commission.currentStage} of 08 · {currentStageInfo.name}
          </span>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            {currentStageInfo.description}
          </p>
        </div>

        <div className="flex items-baseline gap-3 shrink-0 self-start sm:self-auto font-mono">
          <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">Progress</span>
          <span className="text-xl font-bold text-[#18181B] dark:text-[#EDEDEC] font-display">
            {commission.progress}%
          </span>
        </div>
      </div>

      {/* Hairline Progress Rule */}
      <div className="h-0.5 w-full bg-[#E4E2DC] dark:bg-[#27272A] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#EA580C] transition-all duration-500 ease-out"
          style={{ width: `${commission.progress}%` }}
        />
      </div>

      {/* 8-Stage Production Flow: Vertical on Mobile, Clean Grid on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
        {COMMISSION_STAGES.map((stage) => {
          const isCompleted = isCommissionCompleted
            ? stage.number <= commission.currentStage
            : stage.number < commission.currentStage;
          const isCurrent = !isCommissionCompleted && stage.number === commission.currentStage;
          const isUpcoming = !isCommissionCompleted && stage.number > commission.currentStage;

          return (
            <div
              key={stage.number}
              onClick={() => {
                if (isAdmin && interactiveAdmin) {
                  updateCommissionStage(commission.id, stage.number);
                }
              }}
              className={`p-3 rounded-lg border text-left flex sm:flex-col justify-between items-center sm:items-start gap-2 transition-all ${
                isCurrent
                  ? 'border-[#EA580C] bg-[#FFF7ED] dark:bg-[#78350F]/20'
                  : isCompleted
                  ? 'border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11]'
                  : 'border-transparent bg-transparent opacity-40'
              } ${isAdmin && interactiveAdmin ? 'cursor-pointer hover:border-[#EA580C]' : ''}`}
            >
              <div className="flex items-center sm:justify-between w-full gap-2 font-mono text-[10px]">
                <span className={`font-semibold tracking-wider ${isCurrent ? 'text-[#EA580C]' : 'text-[#71717A] dark:text-[#A1A1AA]'}`}>
                  0{stage.number}
                </span>

                <div className="shrink-0">
                  {isCompleted ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-[9px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E4E2DC] dark:bg-[#27272A]" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:flex-initial">
                <p className={`font-mono text-[10px] uppercase tracking-wider font-semibold line-clamp-2 ${
                  isCurrent ? 'text-[#EA580C]' : isCompleted ? 'text-[#18181B] dark:text-[#EDEDEC]' : 'text-[#71717A] dark:text-[#A1A1AA]'
                }`}>
                  {stage.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && interactiveAdmin && (
        <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] text-right">
          Studio Director: Click any milestone stage above to advance production.
        </p>
      )}

    </div>
  );
};
