import React from 'react';
import { Flame } from 'lucide-react';

interface PlanTotalsProps {
  planTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  calorieTarget: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const PlanTotals: React.FC<PlanTotalsProps> = ({
  planTotals,
  calorieTarget,
  macroGoals
}) => {
  return (
    <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {/* Calories */}
      <div className="rounded-2xl border border-slate-850 bg-slate-950/80 p-4 space-y-2 shadow-md">
        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-400" /> Energy
        </span>
        <p className="text-2xl font-black text-white">
          {planTotals.calories} <span className="text-xs font-normal text-slate-400">kcal</span>
        </p>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500" style={{ width: `${Math.min((planTotals.calories / calorieTarget) * 100, 100)}%` }} />
        </div>
        <span className="block text-[10px] text-slate-500 font-bold">Goal: {calorieTarget} kcal</span>
      </div>

      {/* Protein */}
      <div className="rounded-2xl border border-slate-850 bg-slate-950/80 p-4 space-y-2 shadow-md">
        <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider">Protein</span>
        <p className="text-2xl font-black text-cyan-400">
          {planTotals.protein} <span className="text-xs font-normal text-slate-400">g</span>
        </p>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400" style={{ width: `${Math.min((planTotals.protein / macroGoals.protein) * 100, 100)}%` }} />
        </div>
        <span className="block text-[10px] text-slate-500 font-bold">Target: {macroGoals.protein}g</span>
      </div>

      {/* Carbs */}
      <div className="rounded-2xl border border-slate-850 bg-slate-950/80 p-4 space-y-2 shadow-md">
        <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider">Carbs</span>
        <p className="text-2xl font-black text-[#ccff00]">
          {planTotals.carbs} <span className="text-xs font-normal text-slate-400">g</span>
        </p>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-[#ccff00]" style={{ width: `${Math.min((planTotals.carbs / macroGoals.carbs) * 100, 100)}%` }} />
        </div>
        <span className="block text-[10px] text-slate-500 font-bold">Target: {macroGoals.carbs}g</span>
      </div>

      {/* Fat */}
      <div className="rounded-2xl border border-slate-850 bg-slate-950/80 p-4 space-y-2 shadow-md">
        <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider">Fats</span>
        <p className="text-2xl font-black text-amber-400">
          {planTotals.fat} <span className="text-xs font-normal text-slate-400">g</span>
        </p>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-amber-450" style={{ width: `${Math.min((planTotals.fat / macroGoals.fat) * 100, 100)}%` }} />
        </div>
        <span className="block text-[10px] text-slate-500 font-bold">Target: {macroGoals.fat}g</span>
      </div>
    </section>
  );
};
