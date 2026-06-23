import React from 'react';
import { Clock, RefreshCw, Eye } from 'lucide-react';
import { GeneratedMeal } from '../../data/recipes';

interface MealCardProps {
  meal: GeneratedMeal;
  onSwap: (mealId: string) => void;
  onDetails: (meal: GeneratedMeal) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onSwap,
  onDetails
}) => {
  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all hover:border-slate-800 shadow-xl">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">
            {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
          </span>
          <div>
            <span className="block text-[10px] font-black text-[#00f0ff] uppercase tracking-wider">{meal.mealType}</span>
            <h3 className="font-extrabold text-white text-base font-sans">{meal.name}</h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-450 font-bold">
            <Clock className="w-3.5 h-3.5 text-[#ccff00]" /> {meal.prepTime}
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-350 font-extrabold">{meal.calories} kcal</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-455">P: <strong className="text-slate-200">{meal.protein}g</strong></span>
          <span className="text-slate-455">C: <strong className="text-slate-200">{meal.carbs}g</strong></span>
          <span className="text-slate-455">F: <strong className="text-slate-200">{meal.fat}g</strong></span>
        </div>
      </div>

      <div className="flex gap-2 w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={() => onSwap(meal.id)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-750 px-3 py-2 text-xs font-bold text-slate-300 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Swap
        </button>
        <button
          type="button"
          onClick={() => onDetails(meal)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/25 hover:bg-[#ccff00] hover:text-slate-950 px-4 py-2 text-xs font-black text-[#ccff00] transition-all"
        >
          <Eye className="h-3.5 w-3.5" /> Recipe Details
        </button>
      </div>
    </div>
  );
};
