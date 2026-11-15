import React from 'react';
import { ProgressUpdate } from '../types';
import { CheckCircle2, Clock, Sparkles, UserCheck } from 'lucide-react';

interface ProgressTimelineProps {
  updates?: ProgressUpdate[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ updates = [] }) => {
  const safeUpdates = updates || [];

  return (
    <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
            Production Ledger
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-carbon">
            Milestone Activity Log
          </h3>
        </div>

        <span className="font-mono text-xs text-graphite">
          {safeUpdates.length} {safeUpdates.length === 1 ? 'entry' : 'entries'} documented
        </span>
      </div>

      {safeUpdates.length === 0 ? (
        <div className="py-8 text-center text-xs text-graphite">
          No milestones recorded yet. Production entries will appear as the project advances.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border-hairline dark:before:bg-[#222634]">
          {safeUpdates.map((update, index) => {
            const isLatest = index === safeUpdates.length - 1;

            return (
              <div key={update.id} className="relative group">
                {/* Marker */}
                <div 
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#11131B] ${
                    isLatest
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface-secondary border border-hairline text-graphite'
                  }`}
                >
                  {isLatest ? (
                    <Sparkles className="w-2.5 h-2.5" />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="bg-surface-secondary border border-hairline rounded-2xl p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-carbon">
                        {update.stage}
                      </span>
                      <span className="font-mono text-[10px] text-accent font-semibold">
                        {update.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-graphite font-mono">
                      <Clock className="w-3 h-3 text-graphite" />
                      <span>{update.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-xs text-graphite leading-relaxed">
                    {update.note}
                  </p>

                  <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-graphite">
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
