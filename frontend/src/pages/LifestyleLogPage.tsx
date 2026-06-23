import * as React from 'react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Activity, 
  Droplets, 
  Moon, 
  Save, 
  Utensils, 
  Zap, 
  Smile, 
  Battery, 
  Frown, 
  Dumbbell, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { nutritionService } from '../services/nutritionService';
import apiClient, { getErrorMessage } from '../services/apiClient';

const LifestyleLogPage: React.FC = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    caloriesConsumed: 0,
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatConsumed: 0,
    waterIntake: 0,
    sleepHours: 7,
    energyLevel: 5,
    stressLevel: 5,
    mood: 3,
    recoveryScore: 70,
    didWorkout: false,
    weight: 70
  });
  
  const [saving, setSaving] = useState(false);
  const [fetchingBackend, setFetchingBackend] = useState(false);

  // Sync nutrition data from localStorage
  const syncNutritionData = () => {
    const today = new Date().toISOString().split('T')[0];
    const nutrition = nutritionService.getDailyNutrition(today);
    
    setForm(prev => ({
      ...prev,
      caloriesConsumed: nutrition.calories,
      proteinConsumed: nutrition.protein,
      carbsConsumed: nutrition.carbs,
      fatConsumed: nutrition.fat,
      waterIntake: nutrition.water || prev.waterIntake
    }));
    toast.success('Synced calories, macros, and water from Nutrition Tracker!');
  };

  // Initial load: sync nutrition tracker and fetch today's backend logs if they exist
  useEffect(() => {
    // 1. Sync from local nutrition service first
    const todayStr = new Date().toISOString().split('T')[0];
    const nutrition = nutritionService.getDailyNutrition(todayStr);
    
    setForm(prev => ({
      ...prev,
      caloriesConsumed: nutrition.calories,
      proteinConsumed: nutrition.protein,
      carbsConsumed: nutrition.carbs,
      fatConsumed: nutrition.fat,
      waterIntake: nutrition.water || prev.waterIntake
    }));

    // 2. Fetch from backend log if authenticated
    if (!token) return;
    const fetchTodayLog = async () => {
      setFetchingBackend(true);
      try {
        const response = await apiClient.get('/api/logs/today');
        const payload = response.data;
        if (payload.success && payload.data) {
          const data = payload.data;
          setForm(prev => ({
            ...prev,
            ...data,
            // Keep nutrition tracking priorities from localStorage if backend is empty
            caloriesConsumed: data.caloriesConsumed || nutrition.calories,
            proteinConsumed: data.proteinConsumed || nutrition.protein,
            carbsConsumed: data.carbsConsumed || nutrition.carbs,
            fatConsumed: data.fatConsumed || nutrition.fat,
            waterIntake: data.waterIntake || nutrition.water || prev.waterIntake
          }));
        }
      } catch (err) {
        console.error('Error fetching today log:', err);
      } finally {
        setFetchingBackend(false);
      }
    };
    fetchTodayLog();
  }, [token]);

  const setValue = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));

  const saveLog = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/api/logs/today', form);
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Could not save log');
      toast.success('Daily intelligence log saved successfully!');
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Save failed');
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Helper emojis and labels
  const getEnergyLabel = (val: number) => {
    if (val <= 3) return '🥱 Exhausted';
    if (val <= 5) return '😐 Moderate';
    if (val <= 8) return '⚡ Energetic';
    return '🚀 Limitless';
  };

  const getStressLabel = (val: number) => {
    if (val <= 3) return '🧘 Calm / Relaxed';
    if (val <= 6) return '😐 Manageable';
    if (val <= 8) return '😰 High Stress';
    return '🌋 Overwhelmed';
  };

  const getMoodLabel = (val: number) => {
    const moods = ['😢 Sad', '😕 Unhappy', '😐 Neutral', '🙂 Happy', '😄 Radiant'];
    return moods[val - 1] || '😐 Neutral';
  };

  const getRecoveryLabel = (val: number) => {
    if (val < 40) return '🔴 Fatigued (Rest Needed)';
    if (val < 75) return '🟡 Recovering (Moderate Training)';
    return '🟢 Fully Rested (Go Heavy!)';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 dark:bg-teal-950/30 px-3 py-1 text-sm font-semibold text-teal-700 dark:text-teal-400">
              <Activity className="h-4 w-4" /> Daily Capture
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Daily Lifestyle Log
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Correlate calories, recovery scores, sleep patterns, stress levels, and gym work for full intelligence insights.
            </p>
          </div>
          <button
            onClick={syncNutritionData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all text-sm self-start md:self-center"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Sync Nutrition Logs
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Section 1: Diet and Water */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Utensils className="w-5 h-5 text-blue-500" />
              Logged Intake (Syncable)
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Calories (kcal)</label>
                <input
                  type="number"
                  value={form.caloriesConsumed}
                  onChange={(e) => setValue('caloriesConsumed', Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Water Intake (ml)</label>
                <input
                  type="number"
                  value={form.waterIntake}
                  onChange={(e) => setValue('waterIntake', Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Protein (g)</label>
                <input
                  type="number"
                  value={form.proteinConsumed}
                  onChange={(e) => setValue('proteinConsumed', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Carbs (g)</label>
                <input
                  type="number"
                  value={form.carbsConsumed}
                  onChange={(e) => setValue('carbsConsumed', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fat (g)</label>
                <input
                  type="number"
                  value={form.fatConsumed}
                  onChange={(e) => setValue('fatConsumed', Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setValue('weight', Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Workout Completed Today?</span>
              </div>
              <input 
                type="checkbox" 
                checked={form.didWorkout} 
                onChange={(e) => setValue('didWorkout', e.target.checked)} 
                className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>
          </div>

          {/* Section 2: Sleep & Lifestyle Sliders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              Interactive Lifestyle Sliders
            </h2>

            {/* Sleep Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Moon className="w-4 h-4 text-indigo-400" /> Sleep Hours</span>
                <span className="text-indigo-600 dark:text-indigo-400">{form.sleepHours} hrs</span>
              </div>
              <input
                type="range"
                min="3"
                max="14"
                step="0.5"
                value={form.sleepHours}
                onChange={(e) => setValue('sleepHours', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Energy Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Battery className="w-4 h-4 text-orange-400" /> Energy Level</span>
                <span className="text-orange-600 dark:text-orange-400">{getEnergyLabel(form.energyLevel)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.energyLevel}
                onChange={(e) => setValue('energyLevel', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Stress Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Frown className="w-4 h-4 text-red-400" /> Stress Level</span>
                <span className="text-red-600 dark:text-red-400">{getStressLabel(form.stressLevel)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.stressLevel}
                onChange={(e) => setValue('stressLevel', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Mood Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Smile className="w-4 h-4 text-teal-400" /> Mood</span>
                <span className="text-teal-600 dark:text-teal-400">{getMoodLabel(form.mood)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={form.mood}
                onChange={(e) => setValue('mood', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Recovery Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> Recovery Score</span>
                <span className="text-emerald-600 dark:text-emerald-400">{getRecoveryLabel(form.recoveryScore)} ({form.recoveryScore}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={form.recoveryScore}
                onChange={(e) => setValue('recoveryScore', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Submit */}
        <button
          onClick={saveLog}
          disabled={saving}
          className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving Daily Log...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Daily Log
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default LifestyleLogPage;
