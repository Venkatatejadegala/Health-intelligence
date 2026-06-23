import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface WorkoutPlanSettingsProps {
  goal: string;
  setGoal: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  split: string;
  setSplit: (val: string) => void;
  workoutDays: number[];
  onToggleDay: (day: number) => void;
  equipment: string;
  setEquipment: (val: string) => void;
  loading: boolean;
  onGenerate: () => void;
}

export const WorkoutPlanSettings: React.FC<WorkoutPlanSettingsProps> = ({
  goal,
  setGoal,
  experienceLevel,
  setExperienceLevel,
  split,
  setSplit,
  workoutDays,
  onToggleDay,
  equipment,
  setEquipment,
  loading,
  onGenerate
}) => {
  return (
    <aside className="space-y-5 rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 -mr-16 -mt-16 w-32 h-32 bg-lime-450/5 rounded-full blur-2xl pointer-events-none" />
      <h2 className="text-lg font-extrabold text-white">Plan Inputs</h2>
      <label className="block text-sm font-semibold text-slate-400">
        Goal phase
        <select 
          value={goal} 
          onChange={(event) => setGoal(event.target.value)} 
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
        >
          <option value="deficit">Calorie deficit</option>
          <option value="maintenance">Maintenance</option>
          <option value="surplus">Calorie surplus</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-400">
        Experience
        <select 
          value={experienceLevel} 
          onChange={(event) => setExperienceLevel(event.target.value)} 
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-400">
        Split
        <select 
          value={split} 
          onChange={(event) => setSplit(event.target.value)} 
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
        >
          <option value="full_body">Full body</option>
          <option value="upper_lower">Upper lower</option>
          <option value="push_pull_legs">Push pull legs</option>
          <option value="bro_split">Body part split</option>
        </select>
      </label>
      <div>
        <p className="text-sm font-semibold text-slate-400">Workout days</p>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
            <button
              key={`${label}-${index}`}
              type="button"
              onClick={() => onToggleDay(index)}
              className={`h-10 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                workoutDays.includes(index) 
                  ? 'bg-lime-400 text-slate-950 shadow-md' 
                  : 'border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm font-semibold text-slate-400">
        Equipment
        <input 
          value={equipment} 
          onChange={(event) => setEquipment(event.target.value)} 
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500" 
        />
      </label>
      <button 
        type="button"
        onClick={onGenerate} 
        disabled={loading} 
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 px-4 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer shadow-md transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <RefreshCw className="h-4 w-4 text-slate-950" />}
        Generate Plan
      </button>
    </aside>
  );
};
