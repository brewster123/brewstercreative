import React from 'react';
import { ProgressUpdate } from '../types';
import { CheckCircle2, Clock, Sparkles, UserCheck } from 'lucide-react';

interface ProgressTimelineProps {
  updates?: ProgressUpdate[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ updates = [] }) => {
  const safeUpdates = updates || [];

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
            Production Ledger
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Milestone Activity Log
          </h3>
        </div>

        <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
          {safeUpdates.length} {safeUpdates.length === 1 ? 'entry' : 'entries'} documented
        </span>
      </div>

      {safeUpdates.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
          No milestones recorded yet. Production entries will appear as the project advances.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#E4E2DC] dark:before:bg-[#27272A]">
          {safeUpdates.map((update, index) => {
            const isLatest = index === safeUpdates.length - 1;

            return (
              <div key={update.id} className="relative group">
                {/* Marker */}
                <div 
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#18181B] ${
                    isLatest
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : 'bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                  }`}
                >
                  {isLatest ? (
                    <Sparkles className="w-2.5 h-2.5" />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#18181B] dark:text-[#EDEDEC]">
                        {update.stage}
                      </span>
                      <span className="font-mono text-[10px] text-[#EA580C]">
                        {update.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                      <Clock className="w-3 h-3 text-[#A1A1AA]" />
                      <span>{update.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    {update.note}
                  </p>

                  <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Recorded by {update.updatedBy}</span>
                    </span>
                    <span>Stage 0{update.stageNumber}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
