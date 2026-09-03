import React from 'react';
import { ProgressUpdate } from '../types';
import { CheckCircle2, Clock, Calendar, Sparkles, UserCheck } from 'lucide-react';

interface ProgressTimelineProps {
  updates?: ProgressUpdate[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ updates = [] }) => {
  const safeUpdates = updates || [];
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-7 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-200/80">
        <div>
          <h3 className="font-display text-base sm:text-lg font-black text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            Project Milestone Timeline
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Key milestones, stage transitions, and activity logs
          </p>
        </div>
        <span className="text-xs font-mono-code text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200 font-bold">
          {safeUpdates.length} Events Logged
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
        {safeUpdates.map((update, index) => {
          const isLatest = index === safeUpdates.length - 1;

          return (
            <div key={update.id} className="relative group">
              {/* Timeline marker icon */}
              <div 
                className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isLatest
                    ? 'bg-orange-500 text-white shadow-sm animate-pulse'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                }`}
              >
                {isLatest ? (
                  <Sparkles className="w-2.5 h-2.5" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </div>

              {/* Event Content Card */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 transition-all hover:border-zinc-300">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">
                      {update.stage}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code bg-orange-50 text-orange-600 font-bold border border-orange-200">
                      {update.percentage}% Completed
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono-code">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{update.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                  {update.note}
                </p>

                <div className="mt-2 pt-2 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-zinc-400" />
                    Logged by: <strong className="text-zinc-700 font-semibold">{update.updatedBy}</strong>
                  </span>
                  <span className="font-mono-code text-[10px] text-zinc-400 font-bold">
                    Stage 0{update.stageNumber}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
