import React from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { GeneratedMeal } from '../../data/recipes';

interface RecipeDrawerProps {
  selectedRecipeForDetails: GeneratedMeal | null;
  onClose: () => void;
  onLogSingle: (meal: GeneratedMeal) => void;
}

export const RecipeDrawer: React.FC<RecipeDrawerProps> = ({
  selectedRecipeForDetails,
  onClose,
  onLogSingle
}) => {
  if (!selectedRecipeForDetails) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-50"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-850 shadow-2xl z-[100] flex flex-col"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">
              {selectedRecipeForDetails.mealType} Details
            </span>
            <h3 className="text-xl font-black text-white pr-4 font-sans leading-tight">
              {selectedRecipeForDetails.name}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* Calorie Stats */}
          <div className="grid grid-cols-4 gap-2 bg-slate-900/40 rounded-2xl p-4 border border-slate-850 text-center">
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-black">Calories</span>
              <span className="text-sm font-black text-white">{selectedRecipeForDetails.calories}</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-black">Protein</span>
              <span className="text-sm font-black text-cyan-400">{selectedRecipeForDetails.protein}g</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-black">Carbs</span>
              <span className="text-sm font-black text-[#ccff00]">{selectedRecipeForDetails.carbs}g</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-black">Fat</span>
              <span className="text-sm font-black text-amber-400">{selectedRecipeForDetails.fat}g</span>
            </div>
          </div>

          {/* AI Scientific Analysis */}
          {selectedRecipeForDetails.description && (
            <div className="text-xs text-slate-400 bg-slate-900/40 border border-slate-850 p-4 rounded-2xl leading-relaxed">
              <span className="font-bold text-slate-350 block mb-1">AI Nutritional Analysis:</span>
              {selectedRecipeForDetails.description.replace(/\*\*/g, '')}
            </div>
          )}

          {/* Ingredients */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#00f0ff] uppercase tracking-widest">Ingredients List</h4>
            <div className="space-y-2">
              {selectedRecipeForDetails.ingredients.map((ing, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/10 border border-slate-850 text-xs">
                  <span className="font-bold text-slate-300">{ing.name}</span>
                  <span className="text-[#ccff00] font-black bg-[#ccff00]/10 px-2.5 py-0.5 rounded-lg">
                    {ing.qty} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#00f0ff] uppercase tracking-widest">Preparation Steps</h4>
            <ol className="space-y-3 list-decimal list-inside text-xs text-slate-350 leading-relaxed font-medium">
              {selectedRecipeForDetails.instructions.map((step, idx) => (
                <li key={idx} className="pl-1">
                  <span className="text-slate-305">{step}</span>
                </li>
              ))}
            </ol>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-slate-850 bg-slate-900/20">
          <button 
            type="button"
            onClick={() => onLogSingle(selectedRecipeForDetails)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ccff00] hover:bg-[#b5e000] py-3.5 text-sm font-black text-slate-950 transition-all shadow-md shadow-[#ccff00]/10"
          >
            <Plus className="h-4 w-4 text-slate-950" /> Log This Single Meal
          </button>
        </div>
      </motion.div>
    </>
  );
};
