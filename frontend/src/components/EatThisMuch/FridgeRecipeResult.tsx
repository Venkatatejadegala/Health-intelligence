import React from 'react';
import { Clock, Plus } from 'lucide-react';

interface FridgeRecipe {
  recipeName: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredientsUsed: string[];
  instructionsMarkdown: string;
  description?: string;
}

interface FridgeRecipeResultProps {
  fridgeRecipe: FridgeRecipe | null;
  onLog: () => void;
}

const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-[#ccff00]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-black text-white mt-4 mb-2">{trimmed.replace('# ', '')}</h1>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-[#00f0ff] mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-bold text-[#00f0ff] mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      return (
        <li key={i} className="list-disc ml-6 text-slate-300 my-1">
          {parseBoldText(content)}
        </li>
      );
    }
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={i} className="list-decimal ml-6 text-slate-300 my-1">
          {parseBoldText(numMatch[2])}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }
    return <p key={i} className="text-slate-300 leading-relaxed my-1.5">{parseBoldText(line)}</p>;
  });
};

export const FridgeRecipeResult: React.FC<FridgeRecipeResultProps> = ({
  fridgeRecipe,
  onLog
}) => {
  if (!fridgeRecipe) return null;

  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4">
        <div>
          <span className="inline-block bg-[#00f0ff]/10 text-[#00f0ff] text-[10px] font-bold px-2 py-0.5 rounded-lg mb-1 uppercase tracking-wide">
            Fridge Custom Creation
          </span>
          <h2 className="text-2xl font-black text-white font-sans">{fridgeRecipe.recipeName}</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-semibold">
            <Clock className="h-3.5 w-3.5 text-cyan-400" /> Prep time: {fridgeRecipe.prepTime}
          </span>
        </div>

        <button
          type="button"
          onClick={onLog}
          className="flex items-center gap-2 rounded-xl bg-[#ccff00] hover:bg-[#b5e000] px-4 py-2.5 text-xs font-black text-slate-950 transition-all shadow-md shadow-[#ccff00]/10"
        >
          <Plus className="h-4 w-4" /> Log Meal to Tracker
        </button>
      </div>

      {/* Macros stats */}
      <div className="grid grid-cols-4 gap-4 bg-slate-950/80 p-4 border border-slate-850 rounded-2xl text-center shadow-inner">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Calories</span>
          <span className="text-lg font-black text-white">{fridgeRecipe.calories} kcal</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Protein</span>
          <span className="text-lg font-black text-cyan-400">{fridgeRecipe.protein}g</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Carbs</span>
          <span className="text-lg font-black text-[#ccff00]">{fridgeRecipe.carbs}g</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Fats</span>
          <span className="text-lg font-black text-amber-400">{fridgeRecipe.fat}g</span>
        </div>
      </div>

      {/* Ingredients used */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ingredients Used:</h3>
        <div className="flex flex-wrap gap-2">
          {fridgeRecipe.ingredientsUsed.map((ing, idx) => (
            <span key={idx} className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Directions */}
      <div className="border-t border-slate-850 pt-4 space-y-3 text-left">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#00f0ff] font-sans">Cooking Directions:</h3>
        {fridgeRecipe.description && (
          <div className="text-xs text-slate-400 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl leading-relaxed mb-4">
            <span className="font-bold text-slate-350 block mb-1">AI Nutritional Analysis:</span>
            {fridgeRecipe.description.replace(/\*\*/g, '')}
          </div>
        )}
        <div className="text-slate-350 space-y-2 text-sm leading-relaxed font-medium">
          {renderMarkdown(fridgeRecipe.instructionsMarkdown)}
        </div>
      </div>
    </div>
  );
};
