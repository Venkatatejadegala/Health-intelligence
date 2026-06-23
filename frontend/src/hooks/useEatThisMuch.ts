import { useState, useMemo, useEffect } from 'react';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import { nutritionService } from '../services/nutritionService';
import { geminiService } from '../services/geminiService';
import { RECIPE_DATABASE, GeneratedMeal } from '../data/recipes';

export const useEatThisMuch = () => {
  const [activeMode, setActiveMode] = useState<'planner' | 'fridge'>('planner');
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [mealCount, setMealCount] = useState<number>(3);
  const [dietType, setDietType] = useState<string>('anything');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMeal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [groceryChecks, setGroceryChecks] = useState<Record<string, boolean>>({});

  // Fridge-specific states
  const [fridgeIngredients, setFridgeIngredients] = useState<string>('');
  const [fridgeGoal, setFridgeGoal] = useState<string>('Lean Bulk');
  const [fridgeRecipe, setFridgeRecipe] = useState<{
    recipeName: string;
    prepTime: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredientsUsed: string[];
    instructionsMarkdown: string;
    description?: string;
  } | null>(null);
  const [fridgeLoading, setFridgeLoading] = useState<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dailyNutrition = useMemo(() => nutritionService.getDailyNutrition(todayStr), [todayStr]);

  const [customRemaining, setCustomRemaining] = useState({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 65
  });

  useEffect(() => {
    setCustomRemaining({
      calories: dailyNutrition.remaining.calories > 0 ? dailyNutrition.remaining.calories : 1500,
      protein: dailyNutrition.remaining.protein > 0 ? dailyNutrition.remaining.protein : 100,
      carbs: dailyNutrition.remaining.carbs > 0 ? dailyNutrition.remaining.carbs : 180,
      fat: dailyNutrition.remaining.fat > 0 ? dailyNutrition.remaining.fat : 50
    });
  }, [dailyNutrition]);

  // Fridge handlers
  const handleGenerateFridgeRecipe = async () => {
    if (!fridgeIngredients.trim()) {
      toast.error('Please list the ingredients in your fridge!');
      return;
    }

    setFridgeLoading(true);
    try {
      const ingredientsList = fridgeIngredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const recipe = await geminiService.generateFridgeRecipe(
        fridgeGoal,
        ingredientsList,
        customRemaining
      );

      setFridgeRecipe(recipe);
      toast.success('Fridge recipe compiled successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile fridge recipe. Check your connection or API key.');
    } finally {
      setFridgeLoading(false);
    }
  };

  const handleLogFridgeRecipe = () => {
    if (!fridgeRecipe) return;
    try {
      nutritionService.addCustomMeal({
        name: `${fridgeRecipe.recipeName} (Fridge Planner)`,
        calories: fridgeRecipe.calories,
        protein: fridgeRecipe.protein,
        carbs: fridgeRecipe.carbs,
        fat: fridgeRecipe.fat,
        fiber: 0,
        serving: '1 serving',
        confidence: 95,
        mealType: 'lunch'
      });
      toast.success(`Logged "${fridgeRecipe.recipeName}" to tracker!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log recipe.');
    }
  };

  // Rule-based offline generator
  const generateOfflinePlan = (targetCals: number, numMeals: number, diet: string): GeneratedMeal[] => {
    let allocations: { type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; ratio: number }[] = [];
    if (numMeals === 2) {
      allocations = [
        { type: 'lunch', ratio: 0.50 },
        { type: 'dinner', ratio: 0.50 }
      ];
    } else if (numMeals === 3) {
      allocations = [
        { type: 'breakfast', ratio: 0.30 },
        { type: 'lunch', ratio: 0.40 },
        { type: 'dinner', ratio: 0.30 }
      ];
    } else if (numMeals === 4) {
      allocations = [
        { type: 'breakfast', ratio: 0.25 },
        { type: 'lunch', ratio: 0.35 },
        { type: 'dinner', ratio: 0.30 },
        { type: 'snack', ratio: 0.10 }
      ];
    } else if (numMeals === 5) {
      allocations = [
        { type: 'breakfast', ratio: 0.20 },
        { type: 'lunch', ratio: 0.30 },
        { type: 'dinner', ratio: 0.30 },
        { type: 'snack', ratio: 0.10 },
        { type: 'snack', ratio: 0.10 }
      ];
    }

    return allocations.map((slot, index) => {
      const slotTargetCals = targetCals * slot.ratio;
      
      let pool = RECIPE_DATABASE.filter(r => r.mealType === slot.type);
      if (diet !== 'anything') {
        pool = pool.filter(r => r.diets.includes(diet));
      }
      
      if (pool.length === 0) {
        pool = RECIPE_DATABASE.filter(r => r.mealType === slot.type);
      }
      
      const sorted = [...pool].sort((a, b) => 
        Math.abs(a.baseCalories - slotTargetCals) - Math.abs(b.baseCalories - slotTargetCals)
      );
      const chosenRecipe = sorted[0];

      const scaleFactor = slotTargetCals / chosenRecipe.baseCalories;

      return {
        id: `${chosenRecipe.id}-${index}-${Date.now()}`,
        name: chosenRecipe.name,
        mealType: chosenRecipe.mealType,
        calories: Math.round(chosenRecipe.baseCalories * scaleFactor),
        protein: Math.round(chosenRecipe.baseProtein * scaleFactor),
        carbs: Math.round(chosenRecipe.baseCarbs * scaleFactor),
        fat: Math.round(chosenRecipe.baseFat * scaleFactor),
        fiber: Math.round(chosenRecipe.baseFiber * scaleFactor),
        prepTime: chosenRecipe.prepTime,
        ingredients: chosenRecipe.ingredients.map(ing => ({
          name: ing.name,
          qty: Number((ing.baseQty * scaleFactor).toFixed(1)),
          unit: ing.unit
        })),
        instructions: chosenRecipe.instructions,
        description: `This is a standard ${chosenRecipe.name} scaled by ${scaleFactor.toFixed(2)}x to fit your calorie and macro targets. Grounded in baseline nutritional datasets for standard ingredients.`
      };
    });
  };

  // Generate Meal Plan logic
  const handleGenerateMealPlan = async () => {
    setLoading(true);
    const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.replace(/['"]/g, '').trim();
    const rawModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
    const model = rawModel.replace(/['"]/g, '').trim();
    
    if (apiKey) {
      const modelsToTry = [model, 'gemini-flash-latest'];
      for (const currentModel of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
          const prompt = `
            Generate a daily meal plan matching these constraints:
            - Total Daily Calories: ${calorieTarget} kcal
            - Number of Meals: ${mealCount}
            - Diet Preference: ${dietType}
            
            Return ONLY a valid JSON array of meal objects with this exact structure (do not include any markdown format like \`\`\`json or \`\`\` tags around the JSON, return ONLY the raw JSON array):
            [
              {
                "id": "unique-string-1",
                "name": "Recipe name",
                "mealType": "breakfast", // must be one of 'breakfast', 'lunch', 'dinner', 'snack'
                "calories": 450, // number
                "protein": 30, // number (g)
                "carbs": 50, // number (g)
                "fat": 15, // number (g)
                "fiber": 6, // number (g)
                "prepTime": "15 mins",
                "ingredients": [
                  { "name": "Ingredient name", "qty": 100, "unit": "g" }
                ],
                "instructions": [
                  "Step 1...",
                  "Step 2..."
                ],
                "description": "A brief, highly readable 2-3 sentence summary of why this meal is suitable for your plan, written in plain text. Do NOT use any markdown characters or double asterisks '**'."
              }
            ]
            
            Ensure total calories sum up very close to ${calorieTarget} kcal (within 50-100 kcal). Make sure the meals are highly realistic, clean, appetizing, and match the diet preference. Calculate all values strictly according to real-world database standards, scaling macros logically with ingredient weights. Keep the description concise and in plain, readable text (no markdown formatting or double asterisks).
          `;

          const response = await apiClient.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.75 }
          });

          if (response.status !== 200) throw new Error(`API call failed for model ${currentModel}`);
          const data = response.data;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
          const mealPlan = JSON.parse(cleaned) as GeneratedMeal[];
          
          setGeneratedPlan(mealPlan);
          
          const newChecks: Record<string, boolean> = {};
          mealPlan.forEach(meal => {
            meal.ingredients.forEach(ing => {
              newChecks[`${meal.id}-${ing.name}`] = false;
            });
          });
          setGroceryChecks(newChecks);
          
          toast.success('AI-Powered Meal Plan generated successfully!');
          setLoading(false);
          return;
        } catch (err) {
          console.warn(`AI Meal generation failed with model ${currentModel}:`, err);
        }
      }
      toast.error('AI generation encountered an issue. Falling back to local templates.');
    }

    setTimeout(() => {
      try {
        const mealPlan = generateOfflinePlan(calorieTarget, mealCount, dietType);
        setGeneratedPlan(mealPlan);
        
        const newChecks: Record<string, boolean> = {};
        mealPlan.forEach(meal => {
          meal.ingredients.forEach(ing => {
            newChecks[`${meal.id}-${ing.name}`] = false;
          });
        });
        setGroceryChecks(newChecks);
        
        toast.success('Your Meal Plan has been generated! (Local Fallback)');
      } catch (err) {
        toast.error('Failed to generate plan. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  // Swap a single meal in the plan
  const handleSwapMeal = async (mealId: string) => {
    const mealIndex = generatedPlan.findIndex(m => m.id === mealId);
    if (mealIndex === -1) return;

    const originalMeal = generatedPlan[mealIndex];
    const targetRatio = originalMeal.calories / calorieTarget;
    const targetSlotCals = calorieTarget * targetRatio;

    const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.replace(/['"]/g, '').trim();
    const rawModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
    const model = rawModel.replace(/['"]/g, '').trim();

    if (apiKey) {
      toast.loading('Swapping meal with AI...', { id: 'swapping-meal' });
      const modelsToTry = [model, 'gemini-flash-latest'];
      for (const currentModel of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
          const prompt = `
            Generate a single alternative meal recipe of type '${originalMeal.mealType}' for a '${dietType}' diet, containing approximately ${originalMeal.calories} calories.
            This must be different from '${originalMeal.name}'.
            
            Return ONLY a valid JSON object matching this structure (do not include markdown format like \`\`\`json or \`\`\` around the JSON, return ONLY the raw JSON text):
            {
              "id": "swapped-meal-${Date.now()}",
              "name": "New recipe name",
              "mealType": "${originalMeal.mealType}",
              "calories": ${Math.round(originalMeal.calories)},
              "protein": 25, // number (g)
              "carbs": 30, // number (g)
              "fat": 12, // number (g)
              "fiber": 4, // number (g)
              "prepTime": "12 mins",
              "ingredients": [
                { "name": "Ingredient", "qty": 50, "unit": "g" }
              ],
              "instructions": [
                "Step 1...",
                "Step 2..."
              ],
              "description": "A brief, highly readable 2-3 sentence summary of why this alternative meal fits your plan, written in plain text. Do NOT use any markdown characters or double asterisks '**'."
            }
            
            Make sure the meal is highly realistic, appetizing, and matches the diet preference. Scale nutritional values precisely based on real-world reference data. Keep the description concise and in plain, readable text (no markdown formatting or double asterisks).
          `;

          const response = await apiClient.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
          });

          if (response.status !== 200) throw new Error(`API failed for model ${currentModel}`);
          const data = response.data;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
          const newMeal = JSON.parse(cleaned) as GeneratedMeal;

          setGeneratedPlan(prev => {
            const copy = [...prev];
            copy[mealIndex] = newMeal;
            return copy;
          });

          toast.success(`Swapped with AI: ${newMeal.name}!`, { id: 'swapping-meal' });
          return;
        } catch (err) {
          console.warn(`AI Meal swap failed with model ${currentModel}:`, err);
        }
      }
      toast.error('AI swap failed. Falling back to local database.', { id: 'swapping-meal' });
    }

    let pool = RECIPE_DATABASE.filter(r => r.mealType === originalMeal.mealType);
    if (dietType !== 'anything') {
      pool = pool.filter(r => r.diets.includes(dietType));
    }
    if (pool.length === 0) {
      pool = RECIPE_DATABASE.filter(r => r.mealType === originalMeal.mealType);
    }

    const excludedPool = pool.filter(r => !originalMeal.name.includes(r.name));
    const selectionPool = excludedPool.length > 0 ? excludedPool : pool;

    const shuffled = [...selectionPool].sort(() => 0.5 - Math.random());
    const chosenRecipe = shuffled[0];

    const scaleFactor = targetSlotCals / chosenRecipe.baseCalories;

    const newMeal: GeneratedMeal = {
      id: `${chosenRecipe.id}-${mealIndex}-${Date.now()}`,
      name: chosenRecipe.name,
      mealType: chosenRecipe.mealType,
      calories: Math.round(chosenRecipe.baseCalories * scaleFactor),
      protein: Math.round(chosenRecipe.baseProtein * scaleFactor),
      carbs: Math.round(chosenRecipe.baseCarbs * scaleFactor),
      fat: Math.round(chosenRecipe.baseFat * scaleFactor),
      fiber: Math.round(chosenRecipe.baseFiber * scaleFactor),
      prepTime: chosenRecipe.prepTime,
      ingredients: chosenRecipe.ingredients.map(ing => ({
        name: ing.name,
        qty: Number((ing.baseQty * scaleFactor).toFixed(1)),
        unit: ing.unit
      })),
      instructions: chosenRecipe.instructions
    };

    setGeneratedPlan(prev => {
      const copy = [...prev];
      copy[mealIndex] = newMeal;
      return copy;
    });

    toast.success(`Swapped meal for ${chosenRecipe.name}!`);
  };

  // Sync / Log generated meals to the main tracker database
  const handleLogFullDay = () => {
    if (generatedPlan.length === 0) {
      toast.error('Generate a meal plan first!');
      return;
    }

    try {
      generatedPlan.forEach(meal => {
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
      });

      toast.success('All generated meals logged to your Tracker successfully!');
    } catch (err) {
      toast.error('Failed to log meals to tracker.');
    }
  };

  // Calculate overall macros totals
  const planTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    generatedPlan.forEach(meal => {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      totals.carbs += meal.carbs;
      totals.fat += meal.fat;
      totals.fiber += meal.fiber;
    });
    return totals;
  }, [generatedPlan]);

  // Aggregate grocery shopping list
  const consolidatedGroceries = useMemo(() => {
    const map: Record<string, { qty: number; unit: string }> = {};
    generatedPlan.forEach(meal => {
      meal.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (map[key]) {
          if (map[key].unit === ing.unit) {
            map[key].qty = Number((map[key].qty + ing.qty).toFixed(1));
          }
        } else {
          map[key] = { qty: ing.qty, unit: ing.unit };
        }
      });
    });

    return Object.entries(map).map(([name, detail]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      qty: detail.qty,
      unit: detail.unit
    }));
  }, [generatedPlan]);

  const toggleGroceryCheck = (itemName: string) => {
    setGroceryChecks(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Target ratios for charts
  const macroGoals = useMemo(() => {
    const proteinTarget = calorieTarget * 0.30 / 4;
    const carbsTarget = calorieTarget * 0.40 / 4;
    const fatsTarget = calorieTarget * 0.30 / 9;
    return {
      protein: Math.round(proteinTarget),
      carbs: Math.round(carbsTarget),
      fat: Math.round(fatsTarget)
    };
  }, [calorieTarget]);

  // Drawer selected recipe state
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<GeneratedMeal | null>(null);

  return {
    activeMode, setActiveMode,
    calorieTarget, setCalorieTarget,
    mealCount, setMealCount,
    dietType, setDietType,
    generatedPlan, setGeneratedPlan,
    loading,
    groceryChecks,
    fridgeIngredients, setFridgeIngredients,
    fridgeGoal, setFridgeGoal,
    fridgeRecipe, setFridgeRecipe,
    fridgeLoading,
    customRemaining, setCustomRemaining,
    handleGenerateFridgeRecipe,
    handleLogFridgeRecipe,
    handleGenerateMealPlan,
    handleSwapMeal,
    handleLogFullDay,
    planTotals,
    consolidatedGroceries,
    toggleGroceryCheck,
    macroGoals,
    selectedRecipeForDetails, setSelectedRecipeForDetails
  };
};
