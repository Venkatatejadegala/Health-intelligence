import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Camera, 
  Edit3, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { geminiService, FoodAnalysis } from '../services/geminiService';
import { nutritionService, MealEntry, DailyNutrition } from '../services/nutritionService';
import toast from 'react-hot-toast';

// Real-time circular SVG progress indicator
const CircularProgress: React.FC<{ 
  current: number; 
  target: number; 
  label: string; 
  colorClass: string; 
  strokeColor: string; 
  unit: string; 
  icon: string 
}> = ({ current, target, label, colorClass, strokeColor, unit, icon }) => {
  const radius = 42;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentage = Math.round(Math.min((current / Math.max(target, 1)) * 100, 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6 flex items-center justify-between group hover:shadow-2xl transition-all duration-300">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-white">{current}<span className="text-xs font-normal text-slate-400">/{target}{unit}</span></p>
        <p className={`text-xs font-bold ${colorClass}`}>{percentage}% Target</p>
      </div>
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-slate-950/40"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`${strokeColor} transition-all duration-700 ease-out`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute text-xl">{icon}</span>
      </div>
    </div>
  );
};

const NutritionFacts: React.FC<{ analysis: FoodAnalysis }> = ({ analysis }) => {
  const calculateDV = (value: number | undefined, dv: number) => {
    if (value === undefined || isNaN(value)) return 0;
    return Math.round((value / dv) * 100);
  };

  return (
    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl select-none space-y-4">
      {/* Title & Serving */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nutrition Estimate</h4>
          <p className="text-xs text-slate-400 mt-0.5">Serving: <span className="font-semibold text-slate-350">{analysis.servingSize || '1 serving'}</span></p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 block">Calories</span>
          <span className="text-2xl font-black text-white">{analysis.calories} <span className="text-xs font-normal text-slate-450">kcal</span></span>
        </div>
      </div>

      {/* Primary Macros Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Protein */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-cyan-400 block uppercase">Protein</span>
          <span className="text-lg font-extrabold text-white block mt-0.5">{analysis.protein}g</span>
          <span className="text-[9px] font-semibold text-slate-500 block mt-0.5">{calculateDV(analysis.protein, 50)}% DV</span>
        </div>
        {/* Carbs */}
        <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-lime-400 block uppercase">Carbs</span>
          <span className="text-lg font-extrabold text-white block mt-0.5">{analysis.carbs}g</span>
          <span className="text-[9px] font-semibold text-slate-500 block mt-0.5">{calculateDV(analysis.carbs, 275)}% DV</span>
        </div>
        {/* Fat */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-amber-400 block uppercase">Fat</span>
          <span className="text-lg font-extrabold text-white block mt-0.5">{analysis.fat}g</span>
          <span className="text-[9px] font-semibold text-slate-500 block mt-0.5">{calculateDV(analysis.fat, 65)}% DV</span>
        </div>
        {/* Fiber */}
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-teal-400 block uppercase">Fiber</span>
          <span className="text-lg font-extrabold text-white block mt-0.5">{analysis.fiber || 0}g</span>
          <span className="text-[9px] font-semibold text-slate-500 block mt-0.5">{calculateDV(analysis.fiber || 0, 25)}% DV</span>
        </div>
      </div>

      {/* Details List */}
      <div className="border-t border-slate-850 pt-3 space-y-2">
        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nutritional Details</h5>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {analysis.saturatedFat !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Saturated Fat</span>
              <span className="font-semibold text-slate-200">{analysis.saturatedFat}g</span>
            </div>
          )}
          {analysis.transFat !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Trans Fat</span>
              <span className="font-semibold text-slate-200">{analysis.transFat}g</span>
            </div>
          )}
          {analysis.cholesterol !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Cholesterol</span>
              <span className="font-semibold text-slate-200">{analysis.cholesterol}mg</span>
            </div>
          )}
          {analysis.sodium !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Sodium</span>
              <span className="font-semibold text-slate-200">{analysis.sodium}mg</span>
            </div>
          )}
          {analysis.sugar !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Sugars</span>
              <span className="font-semibold text-slate-200">{analysis.sugar}g</span>
            </div>
          )}
          {analysis.potassium !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Potassium</span>
              <span className="font-semibold text-slate-200">{analysis.potassium}mg</span>
            </div>
          )}
          {analysis.calcium !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Calcium</span>
              <span className="font-semibold text-slate-200">{analysis.calcium}mg</span>
            </div>
          )}
          {analysis.iron !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Iron</span>
              <span className="font-semibold text-slate-200">{analysis.iron}mg</span>
            </div>
          )}
          {analysis.vitaminA !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Vitamin A</span>
              <span className="font-semibold text-slate-200">{analysis.vitaminA}mcg</span>
            </div>
          )}
          {analysis.vitaminC !== undefined && (
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-400">Vitamin C</span>
              <span className="font-semibold text-slate-200">{analysis.vitaminC}mg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EnhancedNutritionTrackerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInputTab, setActiveInputTab] = useState<'search' | 'ai'>('search');
  const [naturalLanguageText, setNaturalLanguageText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [todayNutrition, setTodayNutrition] = useState<DailyNutrition>({
    date: new Date().toISOString().split('T')[0],
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    water: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    goals: {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 65,
      fiber: 25,
      water: 2000
    },
    remaining: {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 65,
      fiber: 25,
      water: 2000
    },
    meals: []
  });

  const nutritionGoals = todayNutrition.goals;

  useEffect(() => {
    // Load local storage data immediately for instant response
    const dailyData = nutritionService.getDailyNutrition(selectedDate);
    setTodayNutrition(dailyData);

    // Background sync from backend
    const pullFromBackend = async () => {
      const synced = await nutritionService.syncFromBackend(selectedDate);
      if (synced) {
        setTodayNutrition(synced);
      }
    };
    pullFromBackend();
  }, [selectedDate]);

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', time: '8:00 AM', icon: '🌅' },
    { id: 'lunch', name: 'Lunch', time: '1:00 PM', icon: '☀️' },
    { id: 'dinner', name: 'Dinner', time: '7:00 PM', icon: '🌙' },
    { id: 'snack', name: 'Snacks', time: '3:00 PM', icon: '🍎' }
  ];

  const recentFoods = [
    { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
    { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15 },
    { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0 },
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 }
  ];


  const handleFoodSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await geminiService.searchFoodInfo(searchTerm);
      setAnalysisResult(analysis);
      toast.success('Food information retrieved!');
    } catch (error) {
      toast.error('Failed to get food information. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNaturalLanguageParse = async () => {
    if (!naturalLanguageText.trim()) return;

    setIsParsingText(true);
    try {
      const analysis = await geminiService.parseMealDescription(naturalLanguageText);
      setAnalysisResult(analysis);
      setNaturalLanguageText('');
      toast.success('AI parsed meal macros successfully!');
    } catch (error) {
      toast.error('Failed to parse meal description. Please check your API key.');
      console.error('AI parse error:', error);
    } finally {
      setIsParsingText(false);
    }
  };

  const addFoodToMeal = (food: FoodAnalysis) => {
    const newMeal: Omit<MealEntry, 'id' | 'timestamp'> = {
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0,
      serving: food.servingSize || '1 serving',
      confidence: food.confidence,
      mealType: selectedMeal
    };

    nutritionService.addCustomMeal(newMeal, selectedDate);
    const updatedData = nutritionService.getDailyNutrition(selectedDate);
    setTodayNutrition(updatedData);

    setAnalysisResult(null);
    toast.success(`${food.name} added to ${selectedMeal}!`);
  };

  const removeMeal = (mealId: string) => {
    nutritionService.removeMeal(mealId, selectedDate);
    const updatedData = nutritionService.getDailyNutrition(selectedDate);
    setTodayNutrition(updatedData);
    toast.success('Meal removed successfully');
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'text-green-600';
    if (percentage >= 70 && percentage < 90) return 'text-yellow-600';
    if (percentage > 110) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'bg-green-500';
    if (percentage >= 70 && percentage < 90) return 'bg-yellow-500';
    if (percentage > 110) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-lime-300 bg-clip-text text-transparent">Enhanced Nutrition Tracker</h1>
          <p className="text-slate-400 font-medium mt-1">AI-powered food logging with smart analysis</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-semibold">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500 outline-none bg-slate-950 text-sm font-semibold text-slate-200"
            />
          </div>
          <div className="text-sm text-slate-400 font-bold">
            Selected Day: <span className="text-white font-extrabold">{todayNutrition.calories} / {nutritionGoals.calories} cal</span>
          </div>
          <div className="w-2.5 h-2.5 bg-lime-450 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Nutrition Overview with Circular SVG Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CircularProgress
          current={todayNutrition.calories}
          target={nutritionGoals.calories}
          label="Calories"
          colorClass="text-red-400"
          strokeColor="text-red-500"
          unit=" kcal"
          icon="🔥"
        />
        <CircularProgress
          current={todayNutrition.protein}
          target={nutritionGoals.protein}
          label="Protein"
          colorClass="text-cyan-400"
          strokeColor="text-cyan-400"
          unit="g"
          icon="💪"
        />
        <CircularProgress
          current={todayNutrition.carbs}
          target={nutritionGoals.carbs}
          label="Carbohydrates"
          colorClass="text-lime-400"
          strokeColor="text-lime-400"
          unit="g"
          icon="🌾"
        />
        <CircularProgress
          current={todayNutrition.fat}
          target={nutritionGoals.fat}
          label="Fat"
          colorClass="text-amber-400"
          strokeColor="text-amber-400"
          unit="g"
          icon="🥑"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal Selection & Logging */}
        <div className="lg:col-span-2 space-y-6">
              {/* Meal Types */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6">
            <h2 className="text-xl font-black text-white font-sans mb-4">Meals for {selectedDate}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {mealTypes.map((meal) => {
                const mealData = todayNutrition.meals.filter(m => m.mealType === meal.id);
                const totalCalories = mealData.reduce((sum, m) => sum + m.calories, 0);
                
                return (
                  <button
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal.id as any)}
                    className={`p-4 rounded-2xl border transition-all duration-300 ${
                      selectedMeal === meal.id
                        ? 'border-[#ccff00] bg-[#ccff00]/10 shadow-[0_0_15px_rgba(204,255,0,0.15)] text-slate-100'
                        : 'border-slate-850 bg-slate-900/20 hover:border-slate-700 text-slate-350'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{meal.icon}</div>
                      <div className="text-sm font-bold text-slate-100">{meal.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{meal.time}</div>
                      <div className="text-lg font-black text-[#ccff00] mt-2">{totalCalories}</div>
                      <div className="text-xs text-slate-400">cal</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Search & AI Natural Language Parser */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6">
            <h3 className="text-lg font-black text-white font-sans mb-4">Add Food</h3>

            {/* Input Selection Tabs */}
            <div className="flex border-b border-slate-850 mb-6">
              <button
                onClick={() => setActiveInputTab('search')}
                className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-all ${
                  activeInputTab === 'search'
                    ? 'border-[#00f0ff] text-[#00f0ff]'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                🔍 Search Database
              </button>
              <button
                onClick={() => setActiveInputTab('ai')}
                className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-all ${
                  activeInputTab === 'ai'
                    ? 'border-[#ccff00] text-[#ccff00]'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                🧠 AI Natural Language Snap
              </button>
            </div>
            
            {activeInputTab === 'search' ? (
              /* Search Input */
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-450" />
                  <input
                    type="text"
                    placeholder="Search for food items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFoodSearch()}
                    className="w-full pl-10 pr-24 py-3 border border-slate-850 bg-slate-950 text-white rounded-xl focus:ring-2 focus:ring-[#00f0ff]/20 focus:border-[#00f0ff] outline-none transition-all placeholder-slate-500"
                  />
                  <button
                    onClick={handleFoodSearch}
                    disabled={isAnalyzing}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00f0ff] text-slate-950 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-[#00f0ff]/80 disabled:opacity-50 transition-all"
                  >
                    {isAnalyzing ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            ) : (
              /* Natural Language Input */
              <div className="space-y-4 mb-4">
                <p className="text-sm text-slate-450 leading-relaxed">
                  Describe what you ate in natural language, and Gemini will automatically extract individual foods, estimate weights, and log nutrition metrics:
                </p>
                <textarea
                  rows={3}
                  value={naturalLanguageText}
                  onChange={(e) => setNaturalLanguageText(e.target.value)}
                  placeholder="e.g., I had a bowl of curd, two wheat rotis, and 150g grilled chicken fry"
                  className="w-full p-3 border border-slate-850 bg-slate-950 text-white rounded-xl focus:ring-2 focus:ring-[#ccff00]/20 focus:border-[#ccff00] outline-none transition-all placeholder-slate-500"
                  disabled={isParsingText}
                />
                <button
                  onClick={handleNaturalLanguageParse}
                  disabled={isParsingText || !naturalLanguageText.trim()}
                  className="w-full bg-[#ccff00] hover:bg-[#b5e000] text-slate-950 font-black py-3 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                >
                  {isParsingText ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                      Analyzing Meal...
                    </>
                  ) : 'Parse & Log Macros'}
                </button>
              </div>
            )}


            {/* Analysis Result */}
            {analysisResult && (
              <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 mb-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-white font-sans text-sm tracking-wide uppercase text-slate-400">Analysis Result</h4>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-850 px-3 py-1 rounded-full text-xs text-slate-300">
                    <span>AI Confidence:</span>
                    <span className="font-extrabold text-[#0ea5e9]">{analysisResult.confidence}%</span>
                  </div>
                </div>

                <div className="text-xs text-slate-450 mb-4 bg-slate-950/20 border border-slate-850/40 p-3 rounded-xl">
                  <span className="font-bold text-slate-300 block mb-1">AI Analyst Description:</span>
                  {analysisResult.description ? analysisResult.description.replace(/\*\*/g, '') : 'Nutritional breakdown based on standard ingredients and specified portion sizes.'}
                </div>

                {/* Styled FDA-compliant Nutrition Facts Label */}
                <NutritionFacts analysis={analysisResult} />

                <button
                  onClick={() => addFoodToMeal(analysisResult)}
                  className="w-full mt-4 bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white font-black py-3 rounded-2xl transition-all shadow-md shadow-[#2563eb]/15"
                >
                  Add to {selectedMeal}
                </button>
              </div>
            )}

            {/* Recent Foods */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider text-slate-400">Recent Foods</h4>
              <div className="space-y-2">
                {recentFoods.map((food, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const mockAnalysis: FoodAnalysis = {
                        foodName: food.name,
                        name: food.name,
                        calories: food.calories,
                        protein: food.protein,
                        carbs: food.carbs,
                        fat: food.fat,
                        fiber: 3,
                        confidence: 95,
                        description: 'Food item',
                        servingSize: '1 serving'
                      };
                      addFoodToMeal(mockAnalysis);
                    }}
                    className="w-full p-3.5 text-left bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-sm">{food.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                        </div>
                      </div>
                      <div className="text-xs font-black text-[#ccff00] bg-[#ccff00]/10 px-2 py-1 rounded-md">{food.calories} cal</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Food Scanner Promo Card */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
              <Camera className="w-48 h-48 text-[#00f0ff]" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-[#00f0ff]">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-white font-sans tracking-tight">AI Food Scanner Lab</h3>
                </div>
                <p className="text-slate-350 text-sm max-w-xl leading-relaxed">
                  Have a photo of your food? Jump to our advanced scanner to analyze calories and macronutrients instantly using Gemini 2.5 Flash Vision.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link 
                  to="/upload" 
                  className="inline-flex items-center justify-center bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-md shadow-[#00f0ff]/10"
                >
                  Scan Meal Photo &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Meals List */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6">
            <h3 className="text-lg font-black text-white font-sans mb-4">Meals for {selectedDate}</h3>
            <div className="space-y-3">
              {todayNutrition.meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850/60 rounded-2xl hover:border-slate-800 transition-all">
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{meal.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {meal.protein}g protein • {meal.carbs}g carbs • {meal.fat}g fat
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 inline-block bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">{meal.mealType}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-black text-[#00f0ff] text-sm">{meal.calories} cal</div>
                    </div>
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {todayNutrition.meals.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                  <p className="font-bold text-slate-455 text-sm">No meals logged for this date</p>
                  <p className="text-xs text-slate-500 mt-1">Start by adding your first meal!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-850 p-6">
            <h3 className="text-lg font-black text-white font-sans mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-850/50 pb-2">
                <span className="text-sm text-slate-400 font-medium">Meals logged</span>
                <span className="font-bold text-white">{todayNutrition.meals.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/50 pb-2">
                <span className="text-sm text-slate-400 font-medium">Calorie goal</span>
                <span className="font-bold text-white">{nutritionGoals.calories}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-sm text-slate-400 font-medium">Remaining</span>
                <span className="font-black text-[#ccff00]">
                  {nutritionGoals.calories - todayNutrition.calories}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNutritionTrackerPage;
