import React from 'react';
import { TrendingUp } from 'lucide-react';

interface WorkoutStatsGridProps {
  planName: string;
  sessionsCount: number;
  progressionData: any;
}

export const WorkoutStatsGrid: React.FC<WorkoutStatsGridProps> = ({
  planName,
  sessionsCount,
  progressionData
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-slate-850 bg-slate-900/30 p-5 shadow-md flex flex-col justify-between hover:bg-slate-900/50 transition-all">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current plan</p>
          <p className="mt-2 text-xl font-black capitalize text-white truncate">{planName}</p>
        </div>
        <span className="mt-3 text-xs font-semibold text-slate-400">Targeting {sessionsCount} sessions/wk</span>
      </div>
      <div className="rounded-3xl border border-slate-850 bg-slate-900/30 p-5 shadow-md flex flex-col justify-between hover:bg-slate-900/50 transition-all">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overload Trend</p>
          <p className="mt-2 text-xl font-black capitalize text-white inline-flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-lime-450" />
            {progressionData?.trend === 'progressing' ? 'Progressing' : 'Developing'}
          </p>
        </div>
        <span className="mt-3 text-xs font-bold text-lime-450">
          {progressionData?.volumeChange ? `+${progressionData.volumeChange.toLocaleString()} kg change` : 'Base volume set'}
        </span>
      </div>
      <div className="rounded-3xl border border-slate-850 bg-slate-900/30 p-5 shadow-md flex flex-col justify-between hover:bg-slate-900/50 transition-all">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total volume logged</p>
          <p className="mt-2 text-xl font-black text-white">
            {progressionData?.lastSessionVolume ? `${progressionData.lastSessionVolume.toLocaleString()} kg` : '0 kg'}
          </p>
        </div>
        <span className="mt-3 text-xs font-semibold text-slate-400">
          {progressionData?.sessionCount || 0} sessions recorded
        </span>
      </div>
    </div>
  );
};
