import React from 'react';
import { ChefHat, RefreshCw, Sparkles } from 'lucide-react';

interface FridgeFormProps {
  fridgeGoal: string;
  setFridgeGoal: (val: string) => void;
  fridgeIngredients: string;
  setFridgeIngredients: (val: string) => void;
  customRemaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  setCustomRemaining: React.Dispatch<React.SetStateAction<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>>;
  fridgeLoading: boolean;
  onGenerate: () => void;
}

export const FridgeForm: React.FC<FridgeFormProps> = ({
  fridgeGoal,
  setFridgeGoal,
  fridgeIngredients,
  setFridgeIngredients,
  customRemaining,
  setCustomRemaining,
  fridgeLoading,
  onGenerate
}) => {
  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl space-y-6">
      <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
        <ChefHat className="h-5 w-5 text-[#ccff00]" /> Fridge Inspector
      </h2>

      <div className="space-y-5">
        {/* Goal Dropdown */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Fitness Goal</label>
          <select
            value={fridgeGoal}
            onChange={(e) => setFridgeGoal(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-3 text-xs text-slate-300 font-bold focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/15"
          >
            <option value="Lean Bulk">Lean Bulk</option>
            <option value="Cutting">Cutting</option>
            <option value="Maintain Health">Maintain Health</option>
          </select>
        </div>

        {/* Ingredients Text Box */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Ingredients in Fridge</label>
          <textarea
            placeholder="e.g. Chicken breast, eggs, spinach, brown rice, olive oil"
            rows={3}
            value={fridgeIngredients}
            onChange={(e) => setFridgeIngredients(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/15"
          />
          <p className="text-[10px] text-slate-500">Separate ingredients with commas.</p>
        </div>

        {/* Macro Budget Overrides */}
        <div className="border-t border-slate-850 pt-4 space-y-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Remaining Budget</label>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold">Calories (kcal)</span>
              <input
                type="number"
                value={customRemaining.calories}
                onChange={(e) => setCustomRemaining(prev => ({ ...prev, calories: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-[#ccff00] outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold">Protein (g)</span>
              <input
                type="number"
                value={customRemaining.protein}
                onChange={(e) => setCustomRemaining(prev => ({ ...prev, protein: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-[#ccff00] outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold">Carbs (g)</span>
              <input
                type="number"
                value={customRemaining.carbs}
                onChange={(e) => setCustomRemaining(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-[#ccff00] outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold">Fat (g)</span>
              <input
                type="number"
                value={customRemaining.fat}
                onChange={(e) => setCustomRemaining(prev => ({ ...prev, fat: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-[#ccff00] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={fridgeLoading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ccff00] to-[#00f0ff] hover:opacity-90 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-[#ccff00]/15 disabled:opacity-60 transition-all hover:scale-[1.02]"
        >
          {fridgeLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="h-4 w-4 text-slate-950" />
          )}
          {fridgeLoading ? 'Compiling Recipe...' : 'Generate Fridge Recipe'}
        </button>
      </div>
    </div>
  );
};
