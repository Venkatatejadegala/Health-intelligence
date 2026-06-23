import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChefHat, PlusCircle, ArrowRight } from 'lucide-react';
import { useEatThisMuch } from '../hooks/useEatThisMuch';
import { PlannerForm } from '../components/EatThisMuch/PlannerForm';
import { FridgeForm } from '../components/EatThisMuch/FridgeForm';
import { GroceryList } from '../components/EatThisMuch/GroceryList';
import { PlanTotals } from '../components/EatThisMuch/PlanTotals';
import { MealCard } from '../components/EatThisMuch/MealCard';
import { RecipeDrawer } from '../components/EatThisMuch/RecipeDrawer';
import { FridgeRecipeResult } from '../components/EatThisMuch/FridgeRecipeResult';
import { nutritionService } from '../services/nutritionService';

const EatThisMuchPage: React.FC = () => {
  const {
    activeMode,
    setActiveMode,
    calorieTarget,
    setCalorieTarget,
    mealCount,
    setMealCount,
    dietType,
    setDietType,
    generatedPlan,
    loading,
    groceryChecks,
    fridgeIngredients,
    setFridgeIngredients,
    fridgeGoal,
    setFridgeGoal,
    fridgeRecipe,
    fridgeLoading,
    customRemaining,
    setCustomRemaining,
    handleGenerateFridgeRecipe,
    handleLogFridgeRecipe,
    handleGenerateMealPlan,
    handleSwapMeal,
    handleLogFullDay,
    planTotals,
    consolidatedGroceries,
    toggleGroceryCheck,
    macroGoals,
    selectedRecipeForDetails,
    setSelectedRecipeForDetails
  } = useEatThisMuch();

  if (loading && generatedPlan.length === 0) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans animate-pulse" id="eatthismuch-loading-skeleton">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-44 rounded-3xl bg-slate-900" />
          <div className="flex gap-6 border-b border-slate-850 pb-3">
            <div className="w-24 h-6 bg-slate-900" />
            <div className="w-36 h-6 bg-slate-900" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            <div className="h-96 rounded-3xl border border-slate-850 bg-slate-900/20" />
            <div className="space-y-6">
              <div className="h-28 rounded-3xl border border-slate-850 bg-slate-900/20" />
              <div className="h-48 rounded-3xl border border-slate-850 bg-slate-900/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Block */}
        <header className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 border border-slate-200 dark:border-slate-850 p-6 md:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-600 dark:text-[#00f0ff] font-bold text-xs tracking-wider uppercase mb-2">
                <ChefHat className="h-4 w-4" />
                <span>Automatic Meal Planner</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-slate-150 dark:to-[#ccff00] font-sans">
                Eat This Much AI
              </h1>
              <p className="mt-3 text-slate-650 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                Input your daily calorie thresholds and nutritional style, then watch our algorithms compile complete recipes, ingredients, and automated shopping checklists.
              </p>
            </div>
            
            {generatedPlan.length > 0 && (
              <button
                type="button"
                onClick={handleLogFullDay}
                className="flex items-center gap-2 rounded-2xl bg-[#ccff00] hover:bg-[#b5e000] px-5 py-3.5 text-sm font-black text-slate-950 transition-all hover:scale-105 shadow-lg shadow-[#ccff00]/10"
              >
                <PlusCircle className="h-4 w-4" /> Log Full Day to Tracker
              </button>
            )}
          </div>
        </header>

        {/* Mode switcher tabs */}
        <div className="flex gap-6 border-b border-slate-850 pb-3">
          <button
            type="button"
            onClick={() => setActiveMode('planner')}
            className={`pb-2 text-sm font-black tracking-wider uppercase border-b-2 transition-all duration-300 ${activeMode === 'planner' ? 'border-[#ccff00] text-[#ccff00]' : 'border-transparent text-slate-450 hover:text-white'}`}
          >
            🗓️ Daily Planner
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('fridge')}
            className={`pb-2 text-sm font-black tracking-wider uppercase border-b-2 transition-all duration-300 ${activeMode === 'fridge' ? 'border-[#ccff00] text-[#ccff00]' : 'border-transparent text-slate-450 hover:text-white'}`}
          >
            🍳 What's in the Fridge?
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          
          {/* Inputs Panel (Left) */}
          <aside className="space-y-6">
            {activeMode === 'planner' ? (
              <PlannerForm
                calorieTarget={calorieTarget}
                setCalorieTarget={setCalorieTarget}
                mealCount={mealCount}
                setMealCount={setMealCount}
                dietType={dietType}
                setDietType={setDietType}
                loading={loading}
                onGenerate={handleGenerateMealPlan}
              />
            ) : (
              <FridgeForm
                fridgeGoal={fridgeGoal}
                setFridgeGoal={setFridgeGoal}
                fridgeIngredients={fridgeIngredients}
                setFridgeIngredients={setFridgeIngredients}
                customRemaining={customRemaining}
                setCustomRemaining={setCustomRemaining}
                fridgeLoading={fridgeLoading}
                onGenerate={handleGenerateFridgeRecipe}
              />
            )}

            {/* Grocery Checklist display if generated */}
            {activeMode === 'planner' && generatedPlan.length > 0 && (
              <GroceryList
                consolidatedGroceries={consolidatedGroceries}
                groceryChecks={groceryChecks}
                onToggleCheck={toggleGroceryCheck}
              />
            )}
          </aside>

          {/* Results Display Area (Right) */}
          <main className="space-y-6">
            {activeMode === 'planner' ? (
              generatedPlan.length === 0 ? (
                // Empty State
                <div className="rounded-3xl border border-slate-850 bg-slate-950/40 py-24 text-center space-y-4 shadow-xl">
                  <ChefHat className="h-16 w-16 mx-auto text-slate-800 animate-bounce" />
                  <h3 className="text-xl font-black text-slate-350 font-sans">Assemble Your Day's Menu</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adjust targets in the plan architect panel and hit generate to compile a custom day meal plan.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateMealPlan}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-850 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
                  >
                    Quick Setup <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                // Generated Plan Display
                <div className="space-y-6">
                  
                  {/* Macros totals bar */}
                  <PlanTotals
                    planTotals={planTotals}
                    calorieTarget={calorieTarget}
                    macroGoals={macroGoals}
                  />

                  {/* Meals timeline cards */}
                  <div className="space-y-4">
                    {generatedPlan.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        onSwap={handleSwapMeal}
                        onDetails={setSelectedRecipeForDetails}
                      />
                    ))}
                  </div>

                </div>
              )
            ) : (
              // Fridge Results Display
              <FridgeRecipeResult
                fridgeRecipe={fridgeRecipe}
                onLog={handleLogFridgeRecipe}
              />
            )}
          </main>

        </div>

        {/* Sliding Modal Drawer for Recipe Details */}
        <AnimatePresence>
          {selectedRecipeForDetails && (
            <RecipeDrawer
              selectedRecipeForDetails={selectedRecipeForDetails}
              onClose={() => setSelectedRecipeForDetails(null)}
              onLogSingle={(meal) => {
                const todayStrLocal = new Date().toISOString().split('T')[0];
                nutritionService.addCustomMeal({
                  name: `${meal.name} (EatThisMuch)`,
                  calories: meal.calories,
                  protein: meal.protein,
                  carbs: meal.carbs,
                  fat: meal.fat,
                  fiber: meal.fiber,
                  serving: '1 serving',
                  confidence: 100,
                  mealType: meal.mealType
                });
                setSelectedRecipeForDetails(null);
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default EatThisMuchPage;
