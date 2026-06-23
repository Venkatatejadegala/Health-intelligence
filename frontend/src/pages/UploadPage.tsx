import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, Zap, Activity, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { nutritionService } from '../services/nutritionService';
import toast from 'react-hot-toast';

const NutritionFacts: React.FC<{ nutrition: any; servingSize?: string }> = ({ nutrition, servingSize }) => {
  const calculateDV = (value: number | undefined, dv: number) => {
    if (value === undefined || isNaN(value)) return 0;
    return Math.round((value / dv) * 100);
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl select-none space-y-4">
      {/* Title & Serving */}
      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nutrition Estimate</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Serving: <span className="font-semibold text-slate-700 dark:text-slate-300">{servingSize || '1 serving'}</span></p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Calories</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {nutrition.calories} <span className="text-xs font-normal text-slate-500">kcal</span>
          </span>
        </div>
      </div>

      {/* Primary Macros Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Protein */}
        <div className="bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/10 dark:border-cyan-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block uppercase">Protein</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">{nutrition.protein}g</span>
          <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 block mt-0.5">{calculateDV(nutrition.protein, 50)}% DV</span>
        </div>
        {/* Carbs */}
        <div className="bg-lime-500/5 dark:bg-lime-500/10 border border-lime-500/10 dark:border-lime-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-lime-600 dark:text-lime-400 block uppercase">Carbs</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">{nutrition.carbs}g</span>
          <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 block mt-0.5">{calculateDV(nutrition.carbs, 275)}% DV</span>
        </div>
        {/* Fat */}
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">Fat</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">{nutrition.fat}g</span>
          <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 block mt-0.5">{calculateDV(nutrition.fat, 65)}% DV</span>
        </div>
        {/* Fiber */}
        <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-500/20 rounded-xl p-2 text-center">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block uppercase">Fiber</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">{nutrition.fiber || 0}g</span>
          <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 block mt-0.5">{calculateDV(nutrition.fiber || 0, 25)}% DV</span>
        </div>
      </div>

      {/* Details List */}
      <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
        <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nutritional Details</h5>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {nutrition.saturatedFat !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Saturated Fat</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.saturatedFat}g</span>
            </div>
          )}
          {nutrition.transFat !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Trans Fat</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.transFat}g</span>
            </div>
          )}
          {nutrition.cholesterol !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Cholesterol</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.cholesterol}mg</span>
            </div>
          )}
          {nutrition.sodium !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Sodium</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.sodium}mg</span>
            </div>
          )}
          {nutrition.sugar !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Sugars</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.sugar}g</span>
            </div>
          )}
          {nutrition.potassium !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Potassium</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.potassium}mg</span>
            </div>
          )}
          {nutrition.calcium !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Calcium</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.calcium}mg</span>
            </div>
          )}
          {nutrition.iron !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Iron</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.iron}mg</span>
            </div>
          )}
          {nutrition.vitaminA !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Vitamin A</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.vitaminA}mcg</span>
            </div>
          )}
          {nutrition.vitaminC !== undefined && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900/40 pb-1">
              <span className="text-slate-500 dark:text-slate-400">Vitamin C</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{nutrition.vitaminC}mg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeFoodFromImage(selectedFile);
      
      const adaptedResult = {
        foodName: result.foodName || result.name,
        confidence: (result.confidence || 95) / 100,
        nutrition: {
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber || 0,
          sugar: result.sugar,
          saturatedFat: result.saturatedFat,
          transFat: result.transFat,
          cholesterol: result.cholesterol,
          sodium: result.sodium,
          potassium: result.potassium,
          calcium: result.calcium,
          iron: result.iron,
          vitaminA: result.vitaminA,
          vitaminC: result.vitaminC,
        },
        servingSize: result.servingSize || '1 serving',
        description: result.description || 'Nutritional breakdown from image.',
      };
      
      setAnalysisResult(adaptedResult);
      toast.success('Food scanner completed analysis!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze the food image. Check your API key.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddFoodToLog = () => {
    if (!analysisResult) return;
    
    const meal = {
      name: analysisResult.foodName,
      calories: analysisResult.nutrition.calories,
      protein: analysisResult.nutrition.protein,
      carbs: analysisResult.nutrition.carbs,
      fat: analysisResult.nutrition.fat,
      fiber: analysisResult.nutrition.fiber || 0,
      serving: analysisResult.servingSize || '1 serving',
      confidence: Math.round(analysisResult.confidence * 100),
      mealType: selectedMeal
    };

    nutritionService.addCustomMeal(meal);
    toast.success(`Logged ${analysisResult.foodName} to ${selectedMeal}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
            <span className="text-blue-500">📷</span> Food Scanner Lab
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Upload a photo of your meal and let Gemini 2.5 Flash analyze the calories and macronutrients instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Upload Meal Photo
            </h2>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('fileInput')?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px]
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-slate-950'
                }`}
            >
              {previewUrl ? (
                <div className="relative group w-full max-h-[220px] overflow-hidden rounded-xl">
                  <img src={previewUrl} alt="Food preview" className="w-full h-full object-contain max-h-[220px] mx-auto rounded-lg shadow-md" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-sm font-semibold bg-slate-900/80 px-4 py-2 rounded-lg">Change Image</span>
                  </div>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3 animate-pulse" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">
                    {dragActive ? 'Drop the file here' : 'Drag & drop image here'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Supports JPG, PNG, WEBP files
                  </p>
                  <span className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all">
                    Browse Files
                  </span>
                </>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={analyzeImage}
              disabled={!selectedFile || isAnalyzing}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                ${selectedFile && !isAnalyzing 
                  ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20' 
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing Food...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze Food
                </>
              )}
            </button>
          </motion.div>

          {/* Results panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              Nutritional Breakdown
            </h2>

            {isAnalyzing && (
              <div className="text-center py-16 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Scanning image particles and parsing nutrition databases...
                </p>
              </div>
            )}

            {analysisResult ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {analysisResult.foodName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                      {Math.round(analysisResult.confidence * 100)}% Confidence
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      Est. serving: {analysisResult.servingSize}
                    </span>
                  </div>
                </div>

                {/* Detailed Nutrition Facts Breakdown */}
                <NutritionFacts nutrition={analysisResult.nutrition} servingSize={analysisResult.servingSize} />

                {analysisResult.description && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-850/60 leading-relaxed">
                    <span className="font-bold text-slate-850 dark:text-white block mb-1">AI Scan Rationale:</span>
                    {analysisResult.description.replace(/\*\*/g, '')}
                  </div>
                )}

                {/* Logging Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Meal Slot:
                    </label>
                    <select
                      value={selectedMeal}
                      onChange={(e) => setSelectedMeal(e.target.value as any)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="breakfast">🌅 Breakfast</option>
                      <option value="lunch">☀️ Lunch</option>
                      <option value="dinner">🌙 Dinner</option>
                      <option value="snack">🍎 Snack</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddFoodToLog}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 text-center"
                  >
                    + Add to Nutrition Log
                  </button>
                </div>
              </div>
            ) : (
              !isAnalyzing && (
                <div className="text-center py-20 text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-750" />
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">
                    No image scanned yet. Select a picture of your food on the left panel to begin.
                  </p>
                </div>
              )
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default UploadPage;
