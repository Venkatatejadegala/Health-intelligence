import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  Dumbbell, 
  Loader2, 
  RefreshCw, 
  Scale, 
  Utensils, 
  Sparkles, 
  Zap, 
  Gauge, 
  TrendingUp 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import apiClient, { getErrorMessage } from '../services/apiClient';

const IntelligenceOverviewPage: React.FC = () => {
  const { logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ML Simulator State
  const [simulatedDailyCalories, setSimulatedDailyCalories] = useState<number>(2000);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/intelligence/overview');
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Unable to load intelligence overview');
      setData(payload.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Overview unavailable'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const profile = data?.profile || {};
  const currentWeight = profile.weight || 70;
  const targetCalories = profile.targetCalories || 2000;
  const avgCalories = data?.analytics?.averages?.avgCalories30d || 2200;
  const predictions = data?.analytics?.predictions || {};

  // Initialize simulator with profile's target calories or average
  useEffect(() => {
    if (data?.profile?.targetCalories) {
      setSimulatedDailyCalories(data.profile.targetCalories);
    } else if (data?.analytics?.averages?.avgCalories30d) {
      setSimulatedDailyCalories(data.analytics.averages.avgCalories30d);
    }
  }, [data]);

  // Compute maintenance calories (TDEE) based on profile
  const calculatedTDEE = useMemo(() => {
    if (!profile || !profile.weight) return 2200;
    
    // Mifflin-St Jeor Equation
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    bmr += (profile.sex || 'male').toLowerCase() === 'male' ? 5 : -161;
    
    const multipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'super_active': 1.9
    };
    const factor = multipliers[profile.activityLevel || 'moderately_active'] || 1.2;
    return Math.round(bmr * factor);
  }, [profile]);

  // Calculate 6-week projection curves using thermodynamics regression
  const forecastData = useMemo(() => {
    const startWeight = currentWeight;
    const weeklyData = [];
    const tdee = calculatedTDEE;

    for (let week = 0; week <= 6; week++) {
      // 1. Target Curve: strict target calories
      const targetDailyDeficit = tdee - targetCalories;
      const targetWeight = startWeight - ((targetDailyDeficit * 7 * week) / 7700);

      // 2. Actual Curve: actual 30d logs average
      const actualDailyDeficit = tdee - avgCalories;
      const actualWeight = startWeight - ((actualDailyDeficit * 7 * week) / 7700);

      // 3. Simulated Curve: slider driven
      const simulatedDailyDeficit = tdee - simulatedDailyCalories;
      const simulatedWeight = startWeight - ((simulatedDailyDeficit * 7 * week) / 7700);

      weeklyData.push({
        name: `Wk ${week}`,
        Target: Number(targetWeight.toFixed(1)),
        Actual: Number(actualWeight.toFixed(1)),
        Simulated: Number(simulatedWeight.toFixed(1))
      });
    }
    return weeklyData;
  }, [currentWeight, calculatedTDEE, targetCalories, avgCalories, simulatedDailyCalories]);

  // Model confidence / reliability based on variance volatility
  const modelConfidence = useMemo(() => {
    const volatility = predictions.volatility || 200;
    const confidence = 100 - (volatility / 15);
    return Math.max(50, Math.min(99, Math.round(confidence)));
  }, [predictions.volatility]);

  const readiness = data?.readiness || {};
  const adherence = data?.analytics?.adherence || {};
  const nutrition = data?.nutrition || {};
  const training = data?.training || {};
  const progress = data?.progress || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 text-sm font-semibold text-violet-700 dark:text-violet-400">
              <BrainCircuit className="h-4 w-4" /> Machine Learning Engine
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              AI Health Analyst Console
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
              Thermodynamic projections, consistency analytics, and predictive ML weight models driven by your logs.
            </p>
          </div>
          <button 
            onClick={loadOverview} 
            disabled={loading} 
            className="refresh-overview-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-slate-800 px-5 py-3 text-sm font-bold hover:bg-violet-700 dark:hover:bg-slate-700 disabled:opacity-60 transition-all shadow-md"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Overview
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 text-sm font-semibold text-amber-800 dark:text-amber-400">
            {error}
          </div>
        )}

        {/* Readiness and stats grid */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Readiness Score', readiness.score ?? 0, readiness.label || 'needs data', Activity, 'text-blue-500 bg-blue-500/10 border-blue-500/20'],
            ['Adherence Index', `${adherence.totalScore ?? 0}%`, 'weekly discipline', BrainCircuit, 'text-violet-500 bg-violet-500/10 border-violet-500/20'],
            ['Protein Gap', `${nutrition.adherence?.proteinGap ?? 0}g`, 'daily average gap', Utensils, 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'],
            ['Gym Workouts', training.trend || 'stable', `${training.weeklyFrequency ?? 0} sessions/week`, Dumbbell, 'text-rose-500 bg-rose-500/10 border-rose-500/20']
          ].map(([label, value, helper, Icon, colorStyle]: any) => (
            <div key={label} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl relative overflow-hidden">
              <Icon className={`mb-4 h-9 w-9 p-1.5 rounded-xl border ${colorStyle}`} />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="mt-1 text-3xl font-black capitalize text-slate-900 dark:text-white">{value}</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">{helper}</p>
            </div>
          ))}
        </section>

        {/* ML Predictive Engine Section */}
        <section className="bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-indigo-500/10 text-slate-900 dark:text-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-indigo-500/15 pb-5">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2 text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-300">
                <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-pulse" /> ML Weight Forecast Simulator
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                A thermodynamics-based regression model predicting weight change scenarios over the next 6 weeks.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-center">
                <span className="block text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Model R² Confidence</span>
                <span className="text-lg font-black text-violet-600 dark:text-violet-400">{modelConfidence}%</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-center">
                <span className="block text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Metabolic TDEE</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{calculatedTDEE} cal</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            
            {/* Chart Area */}
            <div className="h-[320px] md:h-[380px] bg-white dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" fontSize={11} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '12px' }}
                    labelClassName="font-bold text-violet-600 dark:text-violet-400"
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="Simulated" stroke="#c084fc" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Simulated Intake" />
                  <Line type="monotone" dataKey="Actual" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" name="Actual Logs Average" />
                  <Line type="monotone" dataKey="Target" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" name="Goal Plan Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Control Panel */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-6">
              
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Scenario Planner
                </h3>

                {/* Calorie Simulator Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-650 dark:text-slate-400 font-semibold">Simulated Calories</span>
                    <span className="font-black text-violet-600 dark:text-violet-400 text-sm">{simulatedDailyCalories} kcal</span>
                  </div>
                  <input
                    type="range"
                    min={calculatedTDEE - 1000}
                    max={calculatedTDEE + 1000}
                    step="50"
                    value={simulatedDailyCalories}
                    onChange={(e) => setSimulatedDailyCalories(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600 dark:accent-violet-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-500 font-bold">
                    <span>-{calculatedTDEE - simulatedDailyCalories >= 0 ? calculatedTDEE - simulatedDailyCalories : 0} Deficit</span>
                    <span>+{simulatedDailyCalories - calculatedTDEE >= 0 ? simulatedDailyCalories - calculatedTDEE : 0} Surplus</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Deficit / Surplus Rate</span>
                    <span className={`font-bold ${simulatedDailyCalories > calculatedTDEE ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                      {simulatedDailyCalories > calculatedTDEE 
                        ? `+${simulatedDailyCalories - calculatedTDEE} kcal/day` 
                        : `${simulatedDailyCalories - calculatedTDEE} kcal/day`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Predicted Weight Delta (6 Wks)</span>
                    <span className={`font-bold ${simulatedDailyCalories > calculatedTDEE ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-teal-600 dark:text-teal-400 font-extrabold'}`}>
                      {simulatedDailyCalories > calculatedTDEE 
                        ? `+${Number(((simulatedDailyCalories - calculatedTDEE) * 7 * 6 / 7700).toFixed(2))} kg`
                        : `${Number(((simulatedDailyCalories - calculatedTDEE) * 7 * 6 / 7700).toFixed(2))} kg`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Goal Risk Gauge */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-rose-500" /> Compliance Risk
                  </span>
                  <span className={`text-xs font-bold ${predictions.riskOfMissingGoalTomorrow > 70 ? 'text-red-600 dark:text-red-500' : predictions.riskOfMissingGoalTomorrow > 40 ? 'text-amber-600 dark:text-amber-500' : 'text-teal-600 dark:text-teal-500'}`}>
                    {predictions.riskOfMissingGoalTomorrow ?? 30}% Risk
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${predictions.riskOfMissingGoalTomorrow > 70 ? 'bg-red-500' : predictions.riskOfMissingGoalTomorrow > 40 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                    style={{ width: `${predictions.riskOfMissingGoalTomorrow ?? 30}%` }} 
                  />
                </div>
                <span className="block text-[9px] text-slate-500 dark:text-slate-500 font-bold">
                  {predictions.riskOfMissingGoalTomorrow > 60 
                    ? '⚠️ High risk of off-plan deviations tomorrow.' 
                    : '✔️ High probability of staying on track.'}
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* Next Best Actions & Recovery Drivers Grid */}
        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Next Best Actions</h2>
              <div className="mt-4 space-y-3">
                {(data?.nextBestActions?.length ? data.nextBestActions : ['Start logging nutrition, sleep, workouts, and body progress to unlock better recommendations.']).map((action: string) => (
                  <div key={action} className="flex gap-3 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/gym" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between gap-3">
                <div>
                  <Dumbbell className="h-7 w-7 text-rose-500 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20" />
                  <h3 className="font-bold text-slate-900 dark:text-white mt-2">Gym Planner</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Volume trend is currently {training.trend || 'stable'}.</p>
              </Link>
              <Link to="/progress" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between gap-3">
                <div>
                  <Scale className="h-7 w-7 text-blue-500 bg-blue-500/10 p-1.5 rounded-xl border border-blue-500/20" />
                  <h3 className="font-bold text-slate-900 dark:text-white mt-2">Progress Lab</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{progress.latest?.weight ? `${progress.latest.weight}kg latest logged weight.` : 'Add measurements and photos.'}</p>
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recovery Drivers</h2>
              <div className="space-y-2">
                {(readiness.drivers?.length ? readiness.drivers : ['No major recovery blockers detected yet.']).map((driver: string) => (
                  <p key={driver} className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">{driver}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/20 p-5 text-violet-900 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider">Readiness Status</p>
              <p className="mt-1 text-3xl font-black capitalize">{readiness.label || 'needs data'}</p>
            </div>
          </aside>
        </section>
        
      </div>
    </div>
  );
};

export default IntelligenceOverviewPage;
