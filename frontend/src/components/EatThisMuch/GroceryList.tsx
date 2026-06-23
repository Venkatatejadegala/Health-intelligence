import React from 'react';
import { ShoppingBag, Square, CheckSquare } from 'lucide-react';

interface GroceryItem {
  name: string;
  qty: number;
  unit: string;
}

interface GroceryListProps {
  consolidatedGroceries: GroceryItem[];
  groceryChecks: Record<string, boolean>;
  onToggleCheck: (itemName: string) => void;
}

export const GroceryList: React.FC<GroceryListProps> = ({
  consolidatedGroceries,
  groceryChecks,
  onToggleCheck
}) => {
  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl space-y-4">
      <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-[#00f0ff]" /> Grocery Shopping List
      </h2>
      <p className="text-xs text-slate-450">
        Consolidated ingredient lists to prepare all day meals.
      </p>

      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {consolidatedGroceries.map((item, idx) => {
          const isChecked = groceryChecks[item.name];
          return (
            <div 
              key={idx}
              onClick={() => onToggleCheck(item.name)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                isChecked 
                  ? 'bg-slate-950/40 border-slate-850/60 text-slate-500 line-through' 
                  : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-750'
              }`}
            >
              <div className="flex items-center gap-3">
                {isChecked ? <CheckSquare className="h-4 w-4 text-[#ccff00]" /> : <Square className="h-4 w-4 text-slate-600" />}
                <span className="text-xs font-semibold">{item.name}</span>
              </div>
              <span className="text-xs font-black text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded-lg">
                {item.qty} {item.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
