import React from 'react';
import { TrendingUp, RefreshCw, Sparkles } from 'lucide-react';

interface PlannerFormProps {
  calorieTarget: number;
  setCalorieTarget: (val: number) => void;
  mealCount: number;
  setMealCount: (val: number) => void;
  dietType: string;
  setDietType: (val: string) => void;
  loading: boolean;
  onGenerate: () => void;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({
  calorieTarget,
  setCalorieTarget,
  mealCount,
  setMealCount,
  dietType,
  setDietType,
  loading,
  onGenerate
}) => {
  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl space-y-6">
      <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#ccff00]" /> Plan Architect
      </h2>

      <div className="space-y-5">
        {/* Calorie slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Calorie Target</label>
            <span className="text-sm font-black text-[#ccff00]">{calorieTarget} kcal</span>
          </div>
          <input
            type="range"
            min="1200"
            max="4500"
            step="50"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#ccff00]"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-bold">
            <span>1,200 kcal</span>
            <span>3,000 kcal</span>
            <span>4,500 kcal</span>
          </div>
        </div>

        {/* Meal Count */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Number of Meals</label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setMealCount(num)}
                className={`py-2 rounded-xl text-xs font-black border transition-all ${
                  mealCount === num 
                    ? 'bg-[#ccff00] border-[#ccff00] text-slate-950 shadow-[0_0_15px_rgba(204,255,0,0.15)]' 
                    : 'bg-slate-950/60 border-slate-850 text-slate-305 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {num} {num === 5 ? 'meals+' : 'meals'}
              </button>
            ))}
          </div>
        </div>

        {/* Diet Type */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Diet Style</label>
          <select
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-3 text-xs text-slate-300 font-bold focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/15"
          >
            <option value="anything">Anything (No Restrictions)</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="keto">Keto (High Fat / Low Carb)</option>
            <option value="paleo">Paleo (Whole Foods)</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="low-carb">Low Carb</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ccff00] to-[#00f0ff] hover:opacity-90 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-[#ccff00]/15 disabled:opacity-60 transition-all hover:scale-[1.02]"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="h-4 w-4 text-slate-950" />
          )}
          {loading ? 'Synthesizing Menu...' : 'Generate Meal Plan'}
        </button>
      </div>
    </div>
  );
};
