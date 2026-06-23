import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ShieldCheck, TrendingUp, Activity, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGymPlanner } from '../hooks/useGymPlanner';
import { WorkoutPlanSettings } from '../components/GymPlanner/WorkoutPlanSettings';
import { WorkoutStatsGrid } from '../components/GymPlanner/WorkoutStatsGrid';
import { WorkoutDaySchedule } from '../components/GymPlanner/WorkoutDaySchedule';
import { ExerciseEnrichment } from '../components/GymPlanner/ExerciseEnrichment';
import { ExerciseDetailsModal } from '../components/GymPlanner/ExerciseDetailsModal';
import { WorkoutSessionLogger } from '../components/GymPlanner/WorkoutSessionLogger';
import apiClient from '../services/apiClient';

const GymPlannerPage: React.FC = () => {
  const {
    goal,
    setGoal,
    experienceLevel,
    setExperienceLevel,
    split,
    setSplit,
    workoutDays,
    equipment,
    setEquipment,
    plan,
    completedExercises,
    toggleExerciseCompleted,
    activeTabDay,
    setActiveTabDay,
    loading,
    error,
    setError,
    exerciseName,
    setExerciseName,
    enriched,
    selectedExercise,
    setSelectedExercise,
    activeLoggingDay,
    setActiveLoggingDay,
    loggingExercises,
    submittingSession,
    progressionData,
    toggleDay,
    generatePlan,
    enrichExercise,
    handleStartLogging,
    handleAddSet,
    handleRemoveSet,
    handleEditSet,
    handleSubmitSession,
    duration,
    setDuration,
    savedPlans,
    startTime,
    notes,
    setNotes,
    loadSavedPlans,
    loadActivePlan,
    activatePlan,
    deletePlan,
    createCustomPlan
  } = useGymPlanner();

  const [subTab, setSubTab] = React.useState<'plan' | 'history' | 'my-plans'>('plan');
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customGoal, setCustomGoal] = React.useState('maintenance');
  const [customLevel, setCustomLevel] = React.useState('intermediate');
  const [customSplit, setCustomSplit] = React.useState('custom');
  const [customDays, setCustomDays] = React.useState<any[]>([]);

  const addCustomDay = () => {
    const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const nextDayName = defaultDays[customDays.length % 7];
    setCustomDays(prev => [
      ...prev,
      {
        day: prev.length + 1,
        dayName: nextDayName,
        focus: 'Workout Routine',
        estimatedMinutes: 60,
        exercises: []
      }
    ]);
  };

  const removeCustomDay = (dayIdx: number) => {
    setCustomDays(prev => prev.filter((_, idx) => idx !== dayIdx));
  };

  const updateCustomDay = (dayIdx: number, key: string, value: any) => {
    setCustomDays(prev => {
      const copy = [...prev];
      copy[dayIdx] = { ...copy[dayIdx], [key]: value };
      return copy;
    });
  };

  const addCustomExercise = (dayIdx: number) => {
    setCustomDays(prev => {
      const copy = [...prev];
      copy[dayIdx].exercises = [
        ...copy[dayIdx].exercises,
        {
          name: '',
          targetMuscles: ['chest'],
          sets: 3,
          reps: '8-12',
          difficulty: 'intermediate',
          instructions: ['Perform standard movement.'],
          commonMistakes: ['Rushing through reps.']
        }
      ];
      return copy;
    });
  };

  const removeCustomExercise = (dayIdx: number, exIdx: number) => {
    setCustomDays(prev => {
      const copy = [...prev];
      copy[dayIdx].exercises = copy[dayIdx].exercises.filter((_: any, idx: number) => idx !== exIdx);
      return copy;
    });
  };

  const updateCustomExercise = (dayIdx: number, exIdx: number, key: string, value: any) => {
    setCustomDays(prev => {
      const copy = [...prev];
      const exCopy = [...copy[dayIdx].exercises];
      exCopy[exIdx] = { ...exCopy[exIdx], [key]: value };
      copy[dayIdx].exercises = exCopy;
      return copy;
    });
  };

  const handleSaveCustomPlan = async () => {
    if (!customName.trim()) {
      toast.error('Please enter a plan name.');
      return;
    }
    if (customDays.length === 0) {
      toast.error('Please add at least one workout day.');
      return;
    }
    const hasEmptyEx = customDays.some(d => d.exercises.length === 0 || d.exercises.some((e: any) => !e.name.trim()));
    if (hasEmptyEx) {
      toast.error('Please add and name all exercises in your schedule.');
      return;
    }

    const dayNameNumbers = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const workoutDaysList = customDays.map(d => (dayNameNumbers as any)[d.dayName] !== undefined ? (dayNameNumbers as any)[d.dayName] : 1);

    const success = await createCustomPlan({
      name: customName,
      goal: customGoal,
      experienceLevel: customLevel,
      split: customSplit,
      workoutDays: Array.from(new Set(workoutDaysList)),
      weeklySchedule: customDays,
    });

    if (success) {
      setIsBuilderOpen(false);
      setCustomName('');
      setCustomDays([]);
      setSubTab('plan');
    }
  };

  const [historySessions, setHistorySessions] = React.useState<any[]>([]);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyTotalPages, setHistoryTotalPages] = React.useState(1);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [expandedSessions, setExpandedSessions] = React.useState<Record<string, boolean>>({});

  const loadHistory = React.useCallback(async (page: number) => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.get(`/api/workout-sessions?page=${page}&limit=5`);
        const payload = response.data;
        if (payload.success) {
          setHistorySessions(payload.data);
          const pagination = payload.metadata?.pagination || payload.pagination;
          if (pagination) {
            setHistoryTotalPages(pagination.pages || 1);
          }
        }
    } catch (err) {
      console.error('Failed to load workout history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    if (subTab === 'history') {
      loadHistory(historyPage);
    }
  }, [subTab, historyPage, loadHistory]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('start') === 'true' && plan) {
      const dayParam = params.get('day');
      const targetDay = plan.weeklySchedule?.find((d: any) => d.dayName === dayParam);
      if (targetDay) {
        // Clear search parameters to avoid re-triggering on reload
        window.history.replaceState({}, document.title, window.location.pathname);
        handleStartLogging(targetDay);
      }
    }
  }, [plan]);

  if (loading && !plan) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans animate-pulse" id="gym-loading-skeleton">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-28 rounded-2xl bg-slate-900" />
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="h-96 rounded-3xl border border-slate-850 bg-slate-900/20" />
            <div className="space-y-5">
              <div className="h-28 rounded-3xl border border-slate-850 bg-slate-900/20" />
              <div className="h-64 rounded-3xl border border-slate-850 bg-slate-900/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-slate-900 pb-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-sm font-bold text-lime-450">
              <Dumbbell className="h-4 w-4 text-lime-450" /> Gym Intelligence
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-850 bg-slate-900/50 px-3 py-1 text-sm font-bold text-slate-355">
              <ShieldCheck className="h-4 w-4 text-lime-450" /> Progressive overload aware
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl bg-gradient-to-r from-white via-slate-100 to-[#ccff00] bg-clip-text text-transparent">
            Adaptive Workout Planner
          </h1>
          <p className="mt-3 max-w-3xl text-slate-400 font-medium">
            Generate phase-aware training plans with volume balance, recovery guidance, exercise instructions,
            and log live sets to track progressive overload.
          </p>
        </motion.header>

        {/* Tab Navigation (Glassmorphic Pills) */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSubTab('plan')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer
              ${subTab === 'plan'
                ? 'bg-gradient-to-r from-[#ccff00] to-[#00f0ff] text-slate-950 shadow-md'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 border border-slate-850'}`}
          >
            📋 Training Plan
          </button>
          <button
            onClick={() => setSubTab('my-plans')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer
              ${subTab === 'my-plans'
                ? 'bg-gradient-to-r from-[#ccff00] to-[#00f0ff] text-slate-950 shadow-md'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 border border-slate-850'}`}
          >
            🗂️ My Plans
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer
              ${subTab === 'history'
                ? 'bg-gradient-to-r from-[#ccff00] to-[#00f0ff] text-slate-950 shadow-md'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 border border-slate-850'}`}
          >
            ⏳ Session History
          </button>
        </div>

        {subTab === 'plan' ? (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* Plan Settings Panel */}
            <WorkoutPlanSettings
              goal={goal}
              setGoal={setGoal}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              split={split}
              setSplit={setSplit}
              workoutDays={workoutDays}
              onToggleDay={toggleDay}
              equipment={equipment}
              setEquipment={setEquipment}
              loading={loading}
              onGenerate={generatePlan}
            />

            {/* Main Plan View */}
            <main className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  {error}
                </div>
              )}

              {!plan ? (
                <div className="text-center py-20 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-8 space-y-4 shadow-xl">
                  <div className="text-6xl mb-2">📋</div>
                  <h3 className="text-xl font-black text-white font-sans">No Active Workout Plan</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed animate-pulse">
                    You do not have an active workout routine. Generate an AI plan on the left or go to the "My Plans" tab to build or select one.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (savedPlans.length > 0) {
                        activatePlan(savedPlans[0]._id || savedPlans[0].planId || '');
                      } else {
                        generatePlan();
                      }
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-md cursor-pointer transition-all inline-flex items-center gap-2 animate-bounce"
                  >
                    Quick Start Plan
                  </button>
                </div>
              ) : (
                <>
                  {/* Progression Stat Grid */}
                  <WorkoutStatsGrid
                    planName={plan.name}
                    sessionsCount={plan.weeklySchedule?.length || 0}
                    progressionData={progressionData}
                  />

                  {/* Day Schedule Tab Selector and Table */}
                  <WorkoutDaySchedule
                    plan={plan}
                    activeTabDay={activeTabDay}
                    setActiveTabDay={setActiveTabDay}
                    completedExercises={completedExercises}
                    onToggleCompleted={toggleExerciseCompleted}
                    onStartLogging={handleStartLogging}
                    onSelectExercise={setSelectedExercise}
                  />

                  {/* Rules & Guidance Widgets */}
                  <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-white">
                        <TrendingUp className="h-5 w-5 text-lime-450" /> Progression Rules
                      </h3>
                      <div className="space-y-2">
                        {(plan.progressionRules || []).map((rule) => (
                          <p key={rule} className="rounded-xl bg-slate-950/60 border border-slate-850/60 p-3.5 text-sm font-semibold text-slate-300">
                            {rule}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-white">
                        <Activity className="h-5 w-5 text-cyan-400" /> Recovery Guidance
                      </h3>
                      <div className="space-y-2">
                        {(plan.recoveryGuidance || []).map((rule) => (
                          <p key={rule} className="rounded-xl bg-slate-950/60 border border-slate-850/60 p-3.5 text-sm font-semibold text-slate-300">
                            {rule}
                          </p>
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </main>
          </section>
        ) : subTab === 'my-plans' ? (
          /* Saved Workout Plans Tab */
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white font-sans">Saved Workout Plans</h2>
                <p className="text-xs text-slate-400 font-medium">Activate, delete, or build custom routines</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomName('');
                  setCustomDays([]);
                  setIsBuilderOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#ccff00] to-[#00f0ff] hover:opacity-90 text-slate-950 px-5 py-3 text-xs font-black shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> Create Custom Routine
              </button>
            </div>

            {savedPlans.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-8 space-y-4 shadow-xl">
                <div className="text-6xl mb-2">🗂️</div>
                <h3 className="text-xl font-black text-white">No Saved Plans Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  You don't have any workout routines in your vault. Create a custom workout plan or generate an AI routine to begin.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedPlans.map((item) => {
                  const isActive = plan?._id === item._id || plan?.planId === item._id;
                  const totalExercises = item.weeklySchedule?.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) || item.exercises?.length || 0;
                  const daysCount = item.weeklySchedule?.length || item.workoutDays?.length || 0;

                  return (
                    <motion.div
                      layout
                      key={item._id}
                      className={`rounded-3xl border p-6 flex flex-col justify-between space-y-4 hover:bg-slate-900/20 hover:border-slate-700 transition duration-300 bg-slate-900/40 relative overflow-hidden ${
                        isActive ? 'border-lime-500/40 shadow-[0_0_15px_rgba(204,255,0,0.05)]' : 'border-slate-850'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute right-0 top-0 bg-lime-400 text-slate-950 text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                          Active
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-base font-extrabold text-white line-clamp-1">{item.name}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-350">{item.goal}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[#00f0ff]">{item.split}</span>
                          {item.isCustom && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">Custom</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold text-slate-400">
                          <div>📅 {daysCount} Days/Week</div>
                          <div>🏋️‍♂️ {totalExercises} Exercises</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-850/60">
                        {isActive ? (
                          <button
                            disabled
                            className="flex-1 text-center py-2 bg-lime-950/20 border border-lime-900/20 text-lime-450 text-xs font-extrabold rounded-xl"
                          >
                            Active Routine
                          </button>
                        ) : (
                          <button
                            onClick={() => activatePlan(item._id || item.planId || '')}
                            className="flex-1 text-center py-2 bg-slate-950 border border-slate-850 hover:border-slate-600 text-xs font-bold text-slate-200 rounded-xl transition cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => deletePlan(item._id || item.planId || '')}
                          className="px-3.5 py-2 border border-slate-850 hover:border-red-900/50 hover:bg-red-950/10 hover:text-red-400 text-slate-400 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Workout History View */
          <div className="space-y-4 max-w-4xl mx-auto">
            {loadingHistory ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-850 rounded-[2rem] shadow-xl">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-[#ccff00] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400">Loading your workout logs...</p>
              </div>
            ) : historySessions.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-8 space-y-4 shadow-xl">
                <div className="text-6xl mb-2">🏋️‍♂️</div>
                <h3 className="text-xl font-black text-white font-sans">No Workout History Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  You haven't completed any logged workout sessions. Head over to the Training Plan tab, select a day, and save a session!
                </p>
              </div>
            ) : (
              <div className="space-y-5 font-sans">
                {historySessions.map((session) => {
                  const isExpanded = !!expandedSessions[session._id];
                  const sessionDateStr = new Date(session.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  // Calculate volume
                  let totalVolume = 0;
                  session.exercises?.forEach((ex: any) => {
                    ex.sets?.forEach((set: any) => {
                      if (set.completed !== false) {
                        totalVolume += (set.weight || 0) * (set.reps || 0);
                      }
                    });
                  });

                  return (
                    <motion.div
                      layout
                      key={session._id}
                      className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 space-y-4 hover:border-slate-700 transition duration-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-white font-sans">
                            {session.workoutName || 'Logged Session'}
                          </h3>
                          <p className="text-xs text-[#00f0ff] font-bold mt-1">
                            📅 {sessionDateStr}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] px-4 py-2 rounded-xl text-center">
                            <span className="block text-[8px] uppercase tracking-wider font-black opacity-60">Total Volume</span>
                            <span className="text-sm font-black">{totalVolume.toLocaleString()} kg</span>
                          </div>
                          {session.duration > 0 && (
                            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-center">
                              <span className="block text-[8px] uppercase tracking-wider font-black opacity-60">Duration</span>
                              <span className="text-sm font-black">{session.duration} min</span>
                            </div>
                          )}
                          <button
                            onClick={() => setExpandedSessions(prev => ({ ...prev, [session._id]: !isExpanded }))}
                            className="px-4 py-2 bg-slate-950 border border-slate-800 text-xs font-bold text-slate-355 rounded-xl hover:border-slate-600 transition cursor-pointer"
                          >
                            {isExpanded ? 'Hide Routine' : 'View Exercises'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 pt-2">
                          {session.notes && (
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850/80 text-xs font-medium text-slate-300 leading-relaxed italic">
                              <span className="block text-[9px] font-black text-[#ccff00] uppercase tracking-wider not-italic mb-1">Session notes</span>
                              "{session.notes}"
                            </div>
                          )}

                          {session.exercises?.map((ex: any, exIdx: number) => (
                            <div key={exIdx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850/60 space-y-3">
                              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                                <span className="w-5.5 h-5.5 rounded-lg bg-[#ccff00] text-slate-950 font-black flex items-center justify-center text-xs">
                                  {exIdx + 1}
                                </span>
                                {ex.name}
                              </h4>

                              <div className="flex flex-wrap gap-2">
                                {ex.sets?.map((set: any, setIdx: number) => (
                                  <div
                                    key={setIdx}
                                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold ${
                                      set.completed
                                        ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-450'
                                        : 'bg-slate-900 border-slate-850 text-slate-450'
                                    }`}
                                  >
                                    Set {setIdx + 1}: {set.weight}kg x {set.reps} reps
                                    {set.setType && set.setType !== 'normal' && (
                                      <span className="ml-1 text-[9px] font-black text-amber-500 uppercase">({set.setType})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Pagination Controls */}
                {historyTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 rounded-xl hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                    >
                      &larr; Prev
                    </button>
                    <span className="text-xs text-slate-400 font-bold">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <button
                      disabled={historyPage === historyTotalPages}
                      onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 rounded-xl hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Exercise Manual Enrichment */}
        {subTab === 'plan' && (
          <ExerciseEnrichment
            exerciseName={exerciseName}
            setExerciseName={setExerciseName}
            onEnrich={enrichExercise}
            enriched={enriched}
          />
        )}

        {/* Exercise Details Modal Popup */}
        <AnimatePresence>
          {selectedExercise && (
            <ExerciseDetailsModal
              selectedExercise={selectedExercise}
              onClose={() => setSelectedExercise(null)}
            />
          )}
        </AnimatePresence>

        {/* Live Workout Session Logger Modal Drawer */}
        <AnimatePresence>
          {activeLoggingDay && (
            <WorkoutSessionLogger
              activeLoggingDay={activeLoggingDay}
              onClose={() => setActiveLoggingDay(null)}
              loggingExercises={loggingExercises}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onEditSet={handleEditSet}
              submittingSession={submittingSession}
              onSubmit={handleSubmitSession}
              duration={duration}
              onDurationChange={setDuration}
              startTime={startTime}
              notes={notes}
              onNotesChange={setNotes}
            />
          )}
        </AnimatePresence>

        {/* Custom Plan Builder Modal */}
        <AnimatePresence>
          {isBuilderOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBuilderOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 24 }}
                className="relative z-10 w-full max-w-4xl bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-800"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/40 border border-cyan-900/30 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                      Workout Routine Studio
                    </span>
                    <h3 className="text-xl font-black text-white mt-2 font-sans">
                      Build Custom Workout Plan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Routine Name
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Hypertrophy Upper/Lower, Powerlifting split"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Split Category Name
                      <input
                        type="text"
                        value={customSplit}
                        onChange={(e) => setCustomSplit(e.target.value)}
                        placeholder="e.g. upper_lower, push_pull_legs, custom"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 font-sans">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Goal Phase
                      <select
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                      >
                        <option value="deficit">Calorie Deficit</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="surplus">Calorie Surplus</option>
                      </select>
                    </label>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Experience Target
                      <select
                        value={customLevel}
                        onChange={(e) => setCustomLevel(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </label>
                  </div>

                  {/* Workout Days Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <h4 className="font-extrabold text-white text-sm">Workout Days Schedule</h4>
                      <button
                        type="button"
                        onClick={addCustomDay}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 px-4 py-2 text-xs font-bold text-cyan-400 cursor-pointer transition shadow-sm"
                      >
                        <Plus className="h-4 w-4" /> Add Training Day
                      </button>
                    </div>

                    {customDays.length === 0 ? (
                      <p className="text-xs text-slate-550 font-bold py-6 text-center">
                        No training days added yet. Click 'Add Training Day' to customize your schedule!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {customDays.map((day, dayIdx) => (
                          <div key={dayIdx} className="p-5 rounded-2xl border border-slate-850 bg-slate-950/20 space-y-4 relative">
                            {/* Day Header Row */}
                            <div className="flex flex-wrap items-center gap-3 justify-between">
                              <div className="flex flex-wrap items-center gap-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                  Day Name
                                  <select
                                    value={day.dayName}
                                    onChange={(e) => updateCustomDay(dayIdx, 'dayName', e.target.value)}
                                    className="mt-1 block rounded-lg border border-slate-800 bg-slate-900 text-slate-200 px-2 py-1.5 text-xs outline-none"
                                  >
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                  </select>
                                </label>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                  Focus Muscles
                                  <input
                                    type="text"
                                    value={day.focus}
                                    onChange={(e) => updateCustomDay(dayIdx, 'focus', e.target.value)}
                                    placeholder="e.g. Chest/Shoulders, Legs"
                                    className="mt-1 block w-40 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500"
                                  />
                                </label>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                  Duration (min)
                                  <input
                                    type="number"
                                    value={day.estimatedMinutes}
                                    onChange={(e) => updateCustomDay(dayIdx, 'estimatedMinutes', Number(e.target.value))}
                                    className="mt-1 block w-20 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 px-2 py-1.5 text-xs outline-none text-center"
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomDay(dayIdx)}
                                className="text-xs text-red-400 hover:text-red-300 font-bold border border-red-950 bg-red-950/10 hover:bg-red-950/30 px-3 py-1.5 rounded-xl cursor-pointer transition"
                              >
                                Remove Day
                              </button>
                            </div>

                            {/* Exercises in this Day */}
                            <div className="space-y-3 pt-2 border-t border-slate-900">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-extrabold text-slate-355">Exercises</h5>
                                <button
                                  type="button"
                                  onClick={() => addCustomExercise(dayIdx)}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-black bg-[#ccff00]/10 hover:bg-[#ccff00]/20 border border-[#ccff00]/20 text-[#ccff00] px-2.5 py-1 rounded-lg cursor-pointer transition uppercase"
                                >
                                  + Add Exercise
                                </button>
                              </div>

                              {day.exercises.length === 0 ? (
                                <p className="text-[10px] text-slate-550 font-bold py-2 text-center">
                                  No exercises added to this training day yet.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {day.exercises.map((ex: any, exIdx: number) => (
                                    <div key={exIdx} className="grid grid-cols-[1fr_120px_60px_80px_40px] gap-2 items-center bg-slate-900/40 p-2 rounded-xl border border-slate-850">
                                      <input
                                        type="text"
                                        value={ex.name}
                                        onChange={(e) => updateCustomExercise(dayIdx, exIdx, 'name', e.target.value)}
                                        placeholder="Exercise (e.g. Bench Press)"
                                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded-lg py-1.5 px-2.5 outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={ex.targetMuscles.join(', ')}
                                        onChange={(e) => updateCustomExercise(dayIdx, exIdx, 'targetMuscles', e.target.value.split(',').map((s: string) => s.trim()))}
                                        placeholder="targetMuscles"
                                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-lg py-1.5 px-2.5 outline-none"
                                      />
                                      <input
                                        type="number"
                                        value={ex.sets}
                                        onChange={(e) => updateCustomExercise(dayIdx, exIdx, 'sets', Number(e.target.value))}
                                        placeholder="Sets"
                                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-center text-white rounded-lg py-1.5 outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={ex.reps}
                                        onChange={(e) => updateCustomExercise(dayIdx, exIdx, 'reps', e.target.value)}
                                        placeholder="Reps (e.g. 8-12)"
                                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-center text-white rounded-lg py-1.5 outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeCustomExercise(dayIdx, exIdx)}
                                        className="text-red-400 hover:text-red-300 transition cursor-pointer flex justify-center py-1"
                                      >
                                        <Trash2 className="h-4.5 w-4.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomPlan}
                    className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black rounded-xl transition shadow-md cursor-pointer"
                  >
                    Save & Activate Routine
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default GymPlannerPage;
