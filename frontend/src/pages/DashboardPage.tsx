import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';
import {
  Activity,
  Bot,
  BrainCircuit,
  Camera,
  Droplets,
  Dumbbell,
  Flame,
  LineChart,
  Moon,
  Scale,
  ShieldCheck,
  Target,
  Utensils,
  Wrench,
  X,
  RefreshCw,
  Heart,
  Zap,
  Smartphone,
  Gauge
} from 'lucide-react';
import { ConsistencyScoreCard } from '../components/dashboard/cards/ConsistencyScoreCard';
import { PredictiveInsightsCard } from '../components/dashboard/cards/PredictiveInsightsCard';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DashboardPage: React.FC = () => {
  const { user, token, profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  const fetchData = React.useCallback(async () => {
    try {
      // Fetch Workout Sessions
      try {
        const response = await apiClient.get('/api/workout-sessions');
        if (response.data.success) {
          setWorkoutSessions(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch workout sessions', err);
      }

      // Fetch Dashboard Stats (Active plan, streak, consistency, today workout)
      try {
        const response = await apiClient.get('/api/workouts/dashboard-stats');
        if (response.data.success) {
          setDashboardStats(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }

      // Fetch 90 days of daily logs
      try {
        const response = await apiClient.get('/api/logs?days=90');
        if (response.data.success) {
          setDailyLogs(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch past daily logs', err);
      }

      // Fetch Analytics
      try {
        const response = await apiClient.get('/api/analytics/consistency');
        if (response.data.success) {
          setAnalyticsData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics, using fallback data', err);
        setAnalyticsData({
          adherence: {
            totalScore: 0,
            breakdown: { calorieAdherence: 0, proteinAdherence: 0, gymAdherence: 0 }
          },
          predictions: {
            riskOfMissingGoalTomorrow: 0,
            estimatedWeight30Days: 70,
            streakRisk: 'No activity yet',
            volatility: 0
          }
        });
      }

      // Fetch Profile
      try {
        const response = await apiClient.get('/api/profile');
        const payload = response.data;
        if (payload && payload.success && payload.data?.userProfile) {
          setProfileData(payload.data.userProfile);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }

      // Fetch Daily Log for the selected date
      try {
        const response = await apiClient.get(`/api/logs/today?date=${selectedDate}`);
        if (response.data && response.data.success && response.data.data) {
          setTodayLog(response.data.data);
        } else {
          setTodayLog(null);
        }
      } catch (err) {
        console.error('Failed to fetch daily log', err);
      }

    } catch (err) {
      console.error('General error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [token, fetchData]);

  const statusTiles = [
    {
      label: 'Goal Phase',
      value: profileData?.goal
        ? profileData.goal.charAt(0).toUpperCase() + profileData.goal.slice(1)
        : 'Recomposition',
      icon: Target
    },
    {
      label: 'Adherence Index',
      value: analyticsData?.adherence?.totalScore !== undefined
        ? `${analyticsData.adherence.totalScore}%`
        : '78%',
      icon: ShieldCheck
    },
    {
      label: 'Recovery Status',
      value: todayLog?.recoveryScore !== undefined
        ? (todayLog.recoveryScore >= 80 ? 'Optimal' : todayLog.recoveryScore >= 50 ? 'Recovered' : 'Fatigued')
        : 'Unknown',
      icon: Activity
    },
  ];

  // Caloric Balance Calculations
  const calorieGoal = profileData?.calorieTarget || profileData?.targetCalories || 2000;
  const caloriesConsumed = todayLog?.caloriesConsumed || 0;
  const caloriesBurned = todayLog?.didWorkout ? 450 : 0;
  const remainingCalories = Math.max(0, calorieGoal - caloriesConsumed + caloriesBurned);

  // GitHub Consistency Heatmap calculations
  const heatmapData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a set of dates where workouts/logs happened
    const activeDates = new Map<string, { workedOut: boolean; loggedNutrition: boolean }>();

    workoutSessions.forEach(s => {
      const dStr = new Date(s.date).toISOString().split('T')[0];
      activeDates.set(dStr, { workedOut: true, loggedNutrition: activeDates.get(dStr)?.loggedNutrition || false });
    });

    dailyLogs.forEach(l => {
      const dStr = new Date(l.date).toISOString().split('T')[0];
      const prev = activeDates.get(dStr);
      activeDates.set(dStr, {
        workedOut: prev?.workedOut || l.didWorkout || false,
        loggedNutrition: (l.caloriesConsumed || 0) > 0
      });
    });

    const startOffset = today.getDay(); // days since Sunday
    const totalDays = 84; // 12 weeks
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - startOffset));
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dStr = currentDate.toISOString().split('T')[0];

      const activity = activeDates.get(dStr) || { workedOut: false, loggedNutrition: false };

      let level = 0;
      if (activity.workedOut && activity.loggedNutrition) level = 3;
      else if (activity.workedOut) level = 2;
      else if (activity.loggedNutrition) level = 1;

      data.push({
        date: dStr,
        dayOfWeek: currentDate.getDay(),
        level,
        workedOut: activity.workedOut,
        loggedNutrition: activity.loggedNutrition
      });
    }
    return data;
  }, [workoutSessions, dailyLogs]);

  const weeks = React.useMemo(() => {
    const w = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      w.push(heatmapData.slice(i, i + 7));
    }
    return w;
  }, [heatmapData]);

  // Training Balance Volume charts
  const volumeChartData = React.useMemo(() => {
    const muscleGroupMap: Record<string, string> = {
      'squat': 'Legs',
      'leg press': 'Legs',
      'deadlift': 'Back',
      'romanian deadlift': 'Legs',
      'bench press': 'Chest',
      'incline bench press': 'Chest',
      'chest fly': 'Chest',
      'overhead press': 'Shoulders',
      'lateral raise': 'Shoulders',
      'barbell row': 'Back',
      'lat pulldown': 'Back',
      'pull-up': 'Back',
      'bicep curl': 'Arms',
      'tricep pushdown': 'Arms',
      'hammer curl': 'Arms',
      'shoulder press': 'Shoulders',
      'leg curl': 'Legs',
      'leg extension': 'Legs',
      'calf raise': 'Legs'
    };

    const recent = [...workoutSessions].reverse().slice(-6);

    if (recent.length === 0) {
      return [];
    }

    return recent.map(session => {
      const dateStr = new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      const sessionVolume: Record<string, number> = {
        Legs: 0,
        Chest: 0,
        Back: 0,
        Shoulders: 0,
        Arms: 0
      };

      (session.exercises || []).forEach((ex: any) => {
        const nameLower = ex.name.toLowerCase();
        let group = 'Legs';
        for (const [key, val] of Object.entries(muscleGroupMap)) {
          if (nameLower.includes(key)) {
            group = val;
            break;
          }
        }

        const exVolume = (ex.sets || []).reduce((sum: number, set: any) => {
          if (set.completed !== undefined ? set.completed : true) {
            return sum + ((Number(set.weight) || 0) * (Number(set.reps) || 0));
          }
          return sum;
        }, 0);

        if (sessionVolume[group] !== undefined) {
          sessionVolume[group] += exVolume;
        }
      });

      return {
        date: dateStr,
        ...sessionVolume
      };
    });
  }, [workoutSessions]);

  const calorieAdherencePercent = profileData?.calorieTarget && todayLog?.caloriesConsumed !== undefined
    ? Math.round(Math.min(100, (todayLog.caloriesConsumed / profileData.calorieTarget) * 100))
    : 0;

  const stepsCount = todayLog
    ? (todayLog.didWorkout ? (10200 + todayLog.energyLevel * 250) : (4200 + todayLog.energyLevel * 150))
    : 8432;

  const burnEstimate = profileData?.tdee
    ? Math.round(profileData.tdee + (todayLog?.didWorkout ? 400 : 0))
    : 2450;

  const hrvVal = todayLog?.recoveryScore
    ? Math.round(42 + todayLog.recoveryScore * 0.42)
    : 62;

  const rhrVal = todayLog?.recoveryScore
    ? Math.round(74 - (todayLog.recoveryScore - 50) * 0.22)
    : 68;

  const lifestyleSignals = [
    { label: 'Movement', value: `${stepsCount.toLocaleString()} steps`, icon: Activity, tone: 'text-blue-600' },
    { label: 'Burn Estimate', value: `${burnEstimate.toLocaleString()} kcal`, icon: Flame, tone: 'text-red-500' },
    {
      label: 'Hydration',
      value: todayLog?.waterIntake !== undefined ? `${(todayLog.waterIntake / 1000).toFixed(1)}L` : '0.0L',
      icon: Droplets,
      tone: 'text-cyan-500'
    },
    {
      label: 'Diet Adherence',
      value: calorieAdherencePercent > 0 ? `${calorieAdherencePercent}%` : 'No Entry Today',
      icon: Utensils,
      tone: 'text-emerald-500'
    },
  ];

  const platformModules = [
    {
      title: 'AI Analyst Console',
      description: 'Unifies readiness, adherence, nutrition risk, training progression, and body progress.',
      path: '/intelligence',
      icon: BrainCircuit,
      accent: 'text-violet-600'
    },
    {
      title: 'Gym Planner',
      description: 'Generate split-aware workout schedules with progressive overload and recovery rules.',
      path: '/gym',
      icon: Dumbbell,
      accent: 'text-emerald-600'
    },
    {
      title: 'Food Scanner Lab',
      description: 'Use image scanning flow for meal estimation and nutrition logging workflows.',
      path: '/upload',
      icon: Camera,
      accent: 'text-rose-600'
    },
    {
      title: 'Lifestyle Log',
      description: 'Capture sleep, mood, energy, hydration, recovery, weight, and workout consistency.',
      path: '/lifestyle',
      icon: Moon,
      accent: 'text-cyan-600'
    },
    {
      title: 'Progress Lab',
      description: 'Track body measurements, progress photos, posture notes, and transformation deltas.',
      path: '/progress',
      icon: Scale,
      accent: 'text-slate-700'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-4 font-sans md:p-8 animate-pulse" id="dashboard-loading-skeleton">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-48 rounded-[2rem] border border-slate-850 bg-slate-900/20 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-48 h-6 bg-slate-800 rounded-full" />
              <div className="w-96 h-10 bg-slate-800 rounded-full" />
            </div>
            <div className="w-full h-4 bg-slate-800 rounded-full" />
          </div>
          <div className="h-44 rounded-3xl border border-slate-850 bg-slate-900/20 p-6 md:p-8" />
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="h-64 rounded-3xl border border-slate-850 bg-slate-900/20 p-6" />
            <div className="h-64 rounded-3xl border border-slate-850 bg-slate-900/20 p-6" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="h-32 rounded-3xl border border-slate-850 bg-slate-900/20" />
            <div className="h-32 rounded-3xl border border-slate-850 bg-slate-900/20" />
            <div className="h-32 rounded-3xl border border-slate-850 bg-slate-900/20" />
            <div className="h-32 rounded-3xl border border-slate-850 bg-slate-900/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 font-sans md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Block */}
        <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-3 py-1 text-xs font-black text-[#00f0ff] shadow-sm animate-pulse">
                <Bot className="h-4 w-4 text-[#00f0ff]" />
                AI Health Command Center
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl font-sans">
              Welcome back, <span className="bg-gradient-to-r from-[#ccff00] to-[#00f0ff] bg-clip-text text-transparent">{profile?.name || user?.username || 'Athlete'}</span>!
            </h1>
            <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-400 text-sm md:text-base">
              Personal bio-energetic logging for consistency, calorie adjustment, progression, recovery, and predictive metrics.
            </p>
          </div>

          {/* Date Picker Input */}
          <div className="flex flex-col items-start gap-2 bg-slate-950/40 border border-slate-850/60 p-4 rounded-2xl shadow-inner shrink-0 sm:min-w-[180px]">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Dashboard Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold bg-slate-900 border border-slate-800 text-white rounded-xl outline-none focus:border-[#ccff00] cursor-pointer"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[390px]">
            {statusTiles.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 shadow-md hover:bg-slate-900/60 transition-all duration-300 group/tile cursor-pointer overflow-hidden">
                  <Icon className="mb-2 h-5 w-5 text-[#ccff00]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</p>
                  <div className="overflow-hidden w-full relative">
                    <p className="mt-1 text-sm font-extrabold text-white whitespace-nowrap transition-transform duration-1000 ease-in-out group-hover/tile:-translate-x-[35%] inline-block">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* Workout Operating System Integration Section */}
        <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Today's Scheduled Workout Card */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between border-b border-slate-850/60 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Dumbbell className="h-6 w-6 text-[#ccff00]" />
                  <div>
                    <h2 className="text-xl font-black text-white font-sans">Today's Scheduled Workout</h2>
                    <p className="text-xs text-slate-550 font-bold uppercase tracking-wider mt-0.5">
                      Active Plan: <span className="text-[#00f0ff]">{dashboardStats?.activePlanName || 'No Active Plan'}</span>
                    </p>
                  </div>
                </div>
                {dashboardStats?.todayWorkout && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-mono font-bold text-[#00f0ff] border border-slate-850/60">
                    ⏱️ {dashboardStats.todayWorkout.estimatedMinutes || 45} min
                  </span>
                )}
              </div>

              {dashboardStats?.todayWorkout ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-white">
                      Focus: <span className="text-[#ccff00] capitalize">{dashboardStats.todayWorkout.focus.replace(/_/g, ' ')}</span>
                    </h3>
                    <span className="text-xs bg-[#ccff00]/10 text-[#ccff00] px-2.5 py-1 rounded-lg font-black uppercase">
                      {dashboardStats.todayWorkout.dayName}
                    </span>
                  </div>

                  <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {dashboardStats.todayWorkout.exercises && dashboardStats.todayWorkout.exercises.length > 0 ? (
                      dashboardStats.todayWorkout.exercises.map((ex: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-850/60 text-xs font-semibold text-slate-300">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-slate-900 text-slate-400 font-extrabold flex items-center justify-center text-[10px] border border-slate-850">
                              {idx + 1}
                            </span>
                            <span className="text-white font-extrabold">{ex.name}</span>
                          </div>
                          <span className="text-slate-450">{ex.sets} sets x {ex.reps} reps</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No exercises detailed for today.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <span className="text-4xl block">🧘</span>
                  <h3 className="text-sm font-black text-slate-355 uppercase tracking-wide">Rest & Recovery Day</h3>
                  <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
                    No workout scheduled for today on your active plan. Focus on hydration, mobility exercises, sleep quality, and active restoration.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-850/40 mt-6 flex gap-3">
              {dashboardStats?.todayWorkout ? (
                <Link
                  to={`/gym?start=true&day=${dashboardStats.todayWorkout.dayName}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ccff00] to-[#00f0ff] hover:opacity-90 text-slate-950 font-black px-6 py-4 text-sm transition shadow-md cursor-pointer animate-pulse uppercase tracking-wider text-center"
                >
                  <Dumbbell className="h-4.5 w-4.5 text-slate-950" />
                  Start Today's Workout &rarr;
                </Link>
              ) : (
                <Link
                  to="/gym"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 font-black px-6 py-4 text-sm transition shadow-md cursor-pointer uppercase tracking-wider text-center"
                >
                  Go to Gym Planner &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Gym Performance Analytics Overview */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 md:p-8 shadow-xl backdrop-blur-md flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-850/60 pb-4">
                <Flame className="h-5 w-5 text-red-500 animate-bounce" />
                <div>
                  <h3 className="font-black text-white font-sans leading-tight">Workout Performance</h3>
                  <p className="text-xs text-slate-500">Live metrics from your actual logged training sessions</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Streak Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 flex flex-col justify-between group cursor-pointer hover:border-red-500/20 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Streak</span>
                    <Flame className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-3xl font-black text-white font-sans">{dashboardStats?.streak || 0}</span>
                    <span className="text-[10px] text-slate-550 font-bold ml-1.5 uppercase">Days</span>
                  </div>
                </div>

                {/* Consistency Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 flex flex-col justify-between group cursor-pointer hover:border-[#ccff00]/20 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Consistency</span>
                    <ShieldCheck className="h-4.5 w-4.5 text-lime-400" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-3xl font-black text-white font-sans">{dashboardStats?.consistency || 0}</span>
                    <span className="text-[10px] text-slate-550 font-bold ml-1.5 uppercase">%</span>
                  </div>
                </div>
              </div>

              {/* Weekly Volume Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Weekly Training Volume</span>
                  <span className="text-xs font-black text-[#ccff00] font-mono">{(dashboardStats?.weeklyVolume || 0).toLocaleString()} kg</span>
                </div>
                {/* Volume Progress Indicator */}
                <div className="w-full h-2.5 bg-slate-900 border border-slate-850/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#ccff00] to-[#00f0ff] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((dashboardStats?.weeklyVolume || 0) / 10000) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-550 font-bold uppercase">
                  <span>0 kg</span>
                  <span>Target: 10,000 kg</span>
                </div>
              </div>

              {/* Last Workout Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 space-y-2">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider block">Last Workout Session</span>
                {dashboardStats?.lastWorkout ? (
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-white flex items-center gap-1.5 justify-between">
                      <span className="truncate">{dashboardStats.lastWorkout.workoutName}</span>
                      <span className="text-cyan-400 font-mono text-[10px] shrink-0">⏱️ {dashboardStats.lastWorkout.duration} min</span>
                    </p>
                    <p className="text-[10px] text-slate-450 font-semibold flex items-center justify-between">
                      <span>{new Date(dashboardStats.lastWorkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>Volume: <strong className="text-[#ccff00] font-mono">{(dashboardStats.lastWorkout.volume || 0).toLocaleString()} kg</strong></span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium italic">No recent sessions completed.</p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Dynamic Caloric Balance Scale */}
        <section className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-6 w-6 text-[#ccff00]" />
                <h2 className="text-xl font-black text-white font-sans">Daily Caloric Balance</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-medium">
                Your biological status scales in real-time. Consume balanced nutrition, complete workouts, and hit your target goals.
              </p>

              {/* Mathematics Visualization */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-350">
                <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-2xl text-center min-w-[100px]">
                  <span className="block text-[9px] text-slate-500 uppercase">Goal target</span>
                  <span className="text-white text-base font-black">{calorieGoal}</span>
                </div>
                <div className="text-lg text-slate-700 font-extrabold">-</div>
                <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-2xl text-center min-w-[100px]">
                  <span className="block text-[9px] text-slate-500 uppercase">Food eaten</span>
                  <span className="text-[#00f0ff] text-base font-black">{caloriesConsumed}</span>
                </div>
                <div className="text-lg text-slate-700 font-extrabold">+</div>
                <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-2xl text-center min-w-[100px]">
                  <span className="block text-[9px] text-slate-500 uppercase">Active Burned</span>
                  <span className="text-orange-400 text-base font-black">{caloriesBurned}</span>
                </div>
                <div className="text-lg text-slate-700 font-extrabold">=</div>
                <div className="bg-[#ccff00]/10 border border-[#ccff00]/25 px-5 py-2 rounded-2xl text-center min-w-[120px]">
                  <span className="block text-[9px] text-[#ccff00] uppercase font-bold">Remaining</span>
                  <span className="text-[#ccff00] text-lg font-black">{remainingCalories} <span className="text-[10px] font-normal text-[#ccff00]">kcal</span></span>
                </div>
              </div>
            </div>

            {/* Visual Balance scale indicator */}
            <div className="w-full lg:w-96 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Consumed: {caloriesConsumed} kcal</span>
                <span>Limit: {calorieGoal + caloriesBurned} kcal</span>
              </div>
              <div className="w-full h-4 bg-slate-950 border border-slate-850 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#ccff00] to-[#00f0ff] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((caloriesConsumed / (calorieGoal + caloriesBurned || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-550 font-bold uppercase tracking-wider">
                <span>0% Consumed</span>
                <span className="text-[#ccff00]">Remaining: {remainingCalories} kcal</span>
                <span>100% Limit</span>
              </div>
            </div>
          </div>

          {/* Daily Macromolecules Target Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-850/40 mt-6">
            {/* Protein */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#00f0ff] uppercase tracking-wider">Protein</span>
                <span className="text-white">{todayLog?.proteinConsumed || 0}g / {profileData?.proteinTarget || 150}g</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00f0ff] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((todayLog?.proteinConsumed || 0) / (profileData?.proteinTarget || 150)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#ccff00] uppercase tracking-wider">Carbs</span>
                <span className="text-white">{todayLog?.carbsConsumed || 0}g / {profileData?.carbsTarget || 200}g</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ccff00] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((todayLog?.carbsConsumed || 0) / (profileData?.carbsTarget || 200)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-orange-400 uppercase tracking-wider">Fat</span>
                <span className="text-white">{todayLog?.fatConsumed || 0}g / {profileData?.fatsTarget || 65}g</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((todayLog?.fatConsumed || 0) / (profileData?.fatsTarget || 65)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Consistency Heatmap & Muscle Volume Section */}
        <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Heatmap Grid */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#ccff00] animate-pulse" />
                <div>
                  <h3 className="font-black text-white font-sans leading-tight">Gym & Habit Consistency</h3>
                  <p className="text-xs text-slate-500">Your visual check-ins over the past 12 weeks</p>
                </div>
              </div>
              {/* Dynamic inspected day details */}
              <div className="min-h-[32px] flex items-center">
                {hoveredDay ? (
                  <div className="text-[10px] font-black bg-slate-950/70 border border-slate-850 px-2.5 py-1.5 rounded-xl uppercase tracking-wider text-slate-300 flex items-center gap-2 animate-fadeIn">
                    <span className="text-[#00f0ff]">{new Date(hoveredDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <span className={hoveredDay.level > 0 ? 'text-[#ccff00]' : 'text-slate-500'}>
                      {hoveredDay.level === 3 && 'Gym & Nutrition logged'}
                      {hoveredDay.level === 2 && 'Gym Session completed'}
                      {hoveredDay.level === 1 && 'Nutrition logged'}
                      {hoveredDay.level === 0 && 'No activity'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest">Tap squares to inspect</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day) => {
                      let bgClass = 'bg-slate-950 border border-slate-900/50';
                      if (day.level === 1) bgClass = 'bg-[#00f0ff]/10 border border-[#00f0ff]/20';
                      else if (day.level === 2) bgClass = 'bg-[#ccff00]/40 border border-[#ccff00]/20';
                      else if (day.level === 3) bgClass = 'bg-[#ccff00] border border-[#ccff00]/30';

                      const displayDate = new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      const activityLabel = day.level === 3 ? 'Gym & Nutrition logged'
                        : day.level === 2 ? 'Gym Session completed'
                        : day.level === 1 ? 'Nutrition logged'
                        : 'No activity logged';

                      return (
                        <div
                          key={day.date}
                          className={`w-3.5 h-3.5 rounded-sm ${bgClass} transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer relative group/cell`}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onTouchStart={() => setHoveredDay(day)}
                          onClick={() => setHoveredDay(day)}
                          title={`${day.date}: ${activityLabel}`}
                        >
                          {/* Floating CSS Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-30 bg-slate-950 border border-slate-850 text-[10px] text-white px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xl pointer-events-none font-bold text-center">
                            <span className="text-[#00f0ff]">{displayDate}</span>
                            <br />
                            <span className="text-slate-350 text-[9px] mt-0.5 block">{activityLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-550 font-bold uppercase tracking-wider pt-2 border-t border-slate-850">
                <span>12 Weeks Ago</span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-950 border border-slate-900/50" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#00f0ff]/10 border border-[#00f0ff]/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ccff00]/40 border border-[#ccff00]/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ccff00] border border-[#ccff00]/30" />
                  <span>More</span>
                </div>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Volume Tracker Graph */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="h-5 w-5 text-[#ccff00]" />
                <div>
                  <h3 className="font-black text-white font-sans leading-tight">Muscle Group Volume</h3>
                  <p className="text-xs text-slate-500">Distribution (kg * reps) over time</p>
                </div>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {workoutSessions.length === 0 ? (
                  <p className="text-xs text-slate-550 font-bold text-center">
                    Awaiting workout logs to compile training volume trends.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '0.75rem', fontSize: '10px' }}
                        labelClassName="text-white font-bold"
                      />
                      <Bar dataKey="Legs" stackId="a" fill="#ccff00" />
                      <Bar dataKey="Chest" stackId="a" fill="#00f0ff" />
                      <Bar dataKey="Back" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Shoulders" stackId="a" fill="#9d4edd" />
                      <Bar dataKey="Arms" stackId="a" fill="#ec4899" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Legend info */}
            <div className="flex flex-wrap gap-2 justify-center text-[9px] font-bold uppercase tracking-wider text-slate-550 mt-2 border-t border-slate-850 pt-2">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" /> Legs</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" /> Chest</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Back</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Shoulders</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-550" /> Arms</span>
            </div>
          </div>
        </section>

        {/* AI Health Advisory & Recovery Panel */}
        <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* AI Health Advisory Panel */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-4">
              <span className="text-2xl">🧠</span>
              <div>
                <h2 className="text-xl font-black text-white font-sans">AI Health Advisory Panel</h2>
                <p className="text-xs text-slate-500">Curated, performance-focused feedback based on your active metrics</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#ccff00]">
                    <Utensils className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Protein Target</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Daily target is <strong className="text-white">{profileData?.proteinTarget || 150}g</strong>. Consuming adequate protein is essential for muscle hypertrophy, positive nitrogen balance, and cellular repair.
                  </p>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">
                  Current: {todayLog?.proteinConsumed || 0}g logged
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                    <Droplets className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Hydration Target</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Target is <strong className="text-white">3.0 Liters</strong>. Keeping muscles fully hydrated optimizes strength output, decreases injury risks, and promotes cognitive clarity.
                  </p>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">
                  Current: {todayLog?.waterIntake ? (todayLog.waterIntake / 1000).toFixed(1) + 'L' : '0.0L'} logged
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <Moon className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Restorative Sleep</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Target is <strong className="text-white">7-8 Hours</strong>. Deep sleep phases trigger growth hormone release, regulate insulin sensitivity, and repair central nervous system fatigue.
                  </p>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase">
                  Current: {todayLog?.sleepHours || '0.0'} hrs logged
                </div>
              </div>
            </div>
          </div>

          {/* Active Recovery & CNS Readiness Indicator */}
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="font-black text-white font-sans leading-tight">CNS Readiness</h3>
                    <p className="text-xs text-slate-500">Active autonomic recovery status</p>
                  </div>
                </div>
                {todayLog?.recoveryScore !== undefined ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ccff00]/10 px-2.5 py-1 text-xs font-black text-[#ccff00] border border-[#ccff00]/20">
                    {todayLog.recoveryScore}% Score
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-400">
                    Awaiting Logs
                  </span>
                )}
              </div>

              {todayLog?.recoveryScore !== undefined ? (
                <div className="space-y-3.5 py-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-850/60">
                    <div className="flex items-center gap-2.5">
                      <Heart className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Resting Heart Rate</p>
                        <p className="text-base font-black text-white font-sans">{rhrVal} <span className="text-xs font-normal text-slate-450">bpm</span></p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">Healthy Range</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-850/60">
                    <div className="flex items-center gap-2.5">
                      <Zap className="h-4.5 w-4.5 text-[#ccff00]" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">HRV (Autonomic Tone)</p>
                        <p className="text-base font-black text-white font-sans">{hrvVal} <span className="text-xs font-normal text-slate-450">ms</span></p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">SNS/PNS Balanced</span>
                  </div>

                  {/* Dynamic Actionable Recommendation */}
                  <div className="p-3.5 rounded-2xl bg-[#ccff00]/5 border border-[#ccff00]/10 text-[11px] font-extrabold text-slate-300 leading-relaxed shadow-sm">
                    {todayLog.recoveryScore >= 80 ? (
                      <span>🚀 <span className="text-[#ccff00]">Autonomic system is primed.</span> Perfect day for heavy compound lifts or a PR attempt. CNS is fully charged!</span>
                    ) : todayLog.recoveryScore >= 50 ? (
                      <span>⚖️ <span className="text-[#00f0ff]">Nervous system balanced.</span> Proceed with standard training volumes and programmed progression targets.</span>
                    ) : (
                      <span>⚠️ <span className="text-rose-400">CNS fatigue detected.</span> Reduce overall session volume by 25-30% or focus on active recovery and mobility.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-slate-455 leading-relaxed">
                    No active sleep or physical readiness metrics found for today.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Log your daily variables in the Lifestyle Log to generate real-time CNS and cardiovascular recovery analytics.
                  </p>
                </div>
              )}
            </div>

            <Link
              to="/lifestyle"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 border border-slate-850 px-4 py-3.5 text-xs font-black text-slate-100 hover:border-[#ccff00]/40 hover:text-[#ccff00] transition-colors shadow-md cursor-pointer"
            >
              <Activity className="h-4 w-4 text-[#ccff00]" />
              Open Lifestyle Log &rarr;
            </Link>
          </div>
        </section>

        {/* Consistency Analytics */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#00f0ff]" />
            <h2 className="text-xl font-black text-white font-sans">Consistency Intelligence</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {loading ? (
              <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900/40 border border-slate-850" />
            ) : (
              <ConsistencyScoreCard
                score={analyticsData?.adherence?.totalScore || 0}
                breakdown={analyticsData?.adherence?.breakdown || { calorieAdherence: 0, proteinAdherence: 0, gymAdherence: 0 }}
              />
            )}

            {loading ? (
              <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900/40 border border-slate-850" />
            ) : (
              <PredictiveInsightsCard
                insights={analyticsData?.predictions || { riskOfMissingGoalTomorrow: 0, estimatedWeight30Days: 0, streakRisk: 'Unknown', volatility: 0 }}
              />
            )}
          </div>
        </section>

        {/* Lifestyle Signals */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#00f0ff]" />
            <h2 className="text-xl font-black text-white font-sans">Today's Lifestyle Signals</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {lifestyleSignals.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-3xl border border-slate-850 bg-slate-900/20 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] shadow-md">
                  <Icon className={`mx-auto mb-3 h-9 w-9 ${item.tone === 'text-emerald-500' ? 'text-[#00f0ff]' : item.tone === 'text-blue-600' ? 'text-cyan-400' : item.tone === 'text-red-500' ? 'text-rose-500' : item.tone === 'text-cyan-500' ? 'text-cyan-400' : item.tone}`} />
                  <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">
                    {item.label}
                  </h4>
                  <p className={`m-0 text-3xl font-black font-sans ${item.tone === 'text-emerald-500' ? 'text-[#00f0ff]' : item.tone === 'text-blue-600' ? 'text-cyan-400' : item.tone === 'text-red-500' ? 'text-rose-500' : item.tone === 'text-cyan-500' ? 'text-cyan-400' : item.tone}`}>
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
