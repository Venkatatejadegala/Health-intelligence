import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Dumbbell,
  BookOpen,
  RotateCw,
  Clock,
  Flame,
  Play,
  Square,
  Info,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Exercise Database Types
export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: 'barbell' | 'dumbbell' | 'bodyweight' | 'cable' | 'machine';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  mistakes: string[];
  embedId?: string;
}

import exercisesData from '../data/exercises.json';
export const EXERCISES_DATABASE = exercisesData as Exercise[];



const MuscleWikiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('chest');
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);



  // Workout Builder state
  const [selectedMusclesForWorkout, setSelectedMusclesForWorkout] = useState<string[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [workoutDifficulty, setWorkoutDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [generatedWorkout, setGeneratedWorkout] = useState<any | null>(null);

  // Timer state
  const [activeWorkoutMode, setActiveWorkoutMode] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  // Toggle muscle selection for workout builder
  const toggleMuscleForWorkout = (muscle: string) => {
    setSelectedMusclesForWorkout(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  // SVG Hotspots definitions
  const musclesList = useMemo(() => {
    return {
      front: [
        { id: 'shoulders', name: 'Shoulders', x: 120, y: 110, rx: 20, ry: 20, cx: 120, cy: 110 },
        { id: 'shoulders-r', name: 'Shoulders', x: 280, y: 110, rx: 20, ry: 20, cx: 280, cy: 110, alias: 'shoulders' },
        { id: 'chest', name: 'Chest', x: 155, y: 110, w: 90, h: 40, rx: 10, ry: 10, isRect: true },
        { id: 'biceps', name: 'Biceps', x: 90, y: 135, rx: 12, ry: 25, cx: 90, cy: 145 },
        { id: 'biceps-r', name: 'Biceps', x: 310, y: 135, rx: 12, ry: 25, cx: 310, cy: 145, alias: 'biceps' },
        { id: 'forearms', name: 'Forearms', x: 70, y: 180, rx: 12, ry: 30, cx: 70, cy: 195 },
        { id: 'forearms-r', name: 'Forearms', x: 330, y: 180, rx: 12, ry: 30, cx: 330, cy: 195, alias: 'forearms' },
        { id: 'abs', name: 'Abs', x: 165, y: 160, w: 70, h: 65, rx: 8, ry: 8, isRect: true },
        { id: 'quadriceps', name: 'Quadriceps', x: 145, y: 250, rx: 22, ry: 60, cx: 150, cy: 280 },
        { id: 'quadriceps-r', name: 'Quadriceps', x: 235, y: 250, rx: 22, ry: 60, cx: 250, cy: 280, alias: 'quadriceps' },
      ],
      back: [
        { id: 'shoulders', name: 'Shoulders', x: 120, y: 110, rx: 20, ry: 20, cx: 120, cy: 110 },
        { id: 'shoulders-r', name: 'Shoulders', x: 280, y: 110, rx: 20, ry: 20, cx: 280, cy: 110, alias: 'shoulders' },
        { id: 'triceps', name: 'Triceps', x: 90, y: 135, rx: 12, ry: 25, cx: 90, cy: 145 },
        { id: 'triceps-r', name: 'Triceps', x: 310, y: 135, rx: 12, ry: 25, cx: 310, cy: 145, alias: 'triceps' },
        { id: 'lats', name: 'Lats & Back', x: 145, y: 120, w: 110, h: 65, rx: 12, ry: 12, isRect: true },
        { id: 'lower-back', name: 'Lower Back', x: 160, y: 195, w: 80, h: 35, rx: 6, ry: 6, isRect: true },
        { id: 'glutes', name: 'Glutes', x: 150, y: 235, w: 100, h: 45, rx: 10, ry: 10, isRect: true },
        { id: 'hamstrings', name: 'Hamstrings', x: 145, y: 290, rx: 20, ry: 50, cx: 150, cy: 320 },
        { id: 'hamstrings-r', name: 'Hamstrings', x: 235, y: 290, rx: 20, ry: 50, cx: 250, cy: 320, alias: 'hamstrings' },
        { id: 'calves', name: 'Calves', x: 148, y: 390, rx: 16, ry: 40, cx: 150, cy: 410 },
        { id: 'calves-r', name: 'Calves', x: 232, y: 390, rx: 16, ry: 40, cx: 250, cy: 410, alias: 'calves' },
      ]
    };
  }, []);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return EXERCISES_DATABASE.filter(ex => {
      // Muscle filter
      if (ex.primaryMuscle !== selectedMuscle) return false;

      // Equipment filter
      if (equipmentFilter !== 'all' && ex.equipment !== equipmentFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== 'all' && ex.difficulty !== difficultyFilter) return false;

      // Search Query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return ex.name.toLowerCase().includes(query) ||
          ex.secondaryMuscles.some(m => m.toLowerCase().includes(query)) ||
          ex.steps.some(s => s.toLowerCase().includes(query));
      }

      return true;
    });
  }, [selectedMuscle, equipmentFilter, difficultyFilter, searchQuery]);

  // Generate Workout Routine
  const handleGenerateWorkout = () => {
    if (selectedMusclesForWorkout.length === 0) {
      toast.error('Please select at least one muscle group from the body map!');
      return;
    }

    const filteredPool = EXERCISES_DATABASE.filter(ex =>
      selectedMusclesForWorkout.includes(ex.primaryMuscle) &&
      (workoutDifficulty === 'intermediate' || ex.difficulty === workoutDifficulty || ex.difficulty === 'beginner')
    );

    if (filteredPool.length === 0) {
      toast.error('No exercises found in our database for the selected combination. Try adding more muscles!');
      return;
    }

    // Select exercises (aim for 4 to 6 depending on duration)
    const exerciseCount = workoutDuration <= 30 ? 3 : workoutDuration <= 45 ? 4 : 6;
    const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
    const exercisesSelected = shuffled.slice(0, exerciseCount).map((ex, idx) => ({
      ...ex,
      sets: workoutDifficulty === 'advanced' ? 4 : 3,
      reps: workoutDifficulty === 'beginner' ? '12-15' : workoutDifficulty === 'intermediate' ? '10-12' : '6-8',
      rest: 60
    }));

    // Calculate details
    const caloriesBurned = Math.round(workoutDuration * (workoutDifficulty === 'advanced' ? 8.5 : workoutDifficulty === 'intermediate' ? 7.2 : 5.5));

    setGeneratedWorkout({
      muscles: selectedMusclesForWorkout,
      duration: workoutDuration,
      difficulty: workoutDifficulty,
      exercises: exercisesSelected,
      caloriesBurned
    });

    toast.success('Custom Workout generated successfully!');
  };

  // Start Workout execution
  const startWorkoutMode = () => {
    if (!generatedWorkout) return;
    setActiveWorkoutMode(true);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setIsResting(false);
  };

  const endWorkoutMode = () => {
    setActiveWorkoutMode(false);
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    toast.success('Workout completed! Outstanding effort!');
  };

  // Set-Rest Cycle timers
  const triggerRest = () => {
    setIsResting(true);
    setRestTimeLeft(60);

    const interval = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerIntervalId(null);
          setIsResting(false);
          // Advance set
          const maxSets = generatedWorkout.exercises[currentExerciseIndex].sets;
          if (currentSetIndex + 1 < maxSets) {
            setCurrentSetIndex(prevSet => prevSet + 1);
          } else {
            // Advance exercise
            if (currentExerciseIndex + 1 < generatedWorkout.exercises.length) {
              setCurrentExerciseIndex(prevEx => prevEx + 1);
              setCurrentSetIndex(0);
            } else {
              // Workout complete!
              endWorkoutMode();
            }
          }
          toast('Time to lift! Start your next set.', { icon: '💪' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerIntervalId(interval);
  };

  const skipRest = () => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setIsResting(false);

    // Advance set
    const maxSets = generatedWorkout.exercises[currentExerciseIndex].sets;
    if (currentSetIndex + 1 < maxSets) {
      setCurrentSetIndex(prevSet => prevSet + 1);
    } else {
      if (currentExerciseIndex + 1 < generatedWorkout.exercises.length) {
        setCurrentExerciseIndex(prevEx => prevEx + 1);
        setCurrentSetIndex(0);
      } else {
        endWorkoutMode();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header Banner */}
        <header className="relative overflow-hidden rounded-3xl bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/40 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-500/20 p-6 md:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm tracking-wider uppercase mb-2">
                <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                <span>Interact • Explore • Plan</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-blue-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-blue-300">
                Muscle Wiki Lab
              </h1>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-base md:text-lg leading-relaxed">
                Click muscles on our digital anatomical projection to load precision exercises, study perfect lifting form, or orchestrate specialized custom workouts.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedMuscle('chest');
                  setEquipmentFilter('all');
                  setDifficultyFilter('all');
                  setSearchQuery('');
                }}
                className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:scale-105"
              >
                <RotateCw className="h-4 w-4" /> Reset Directory
              </button>
            </div>
          </div>
        </header>

        {!activeWorkoutMode ? (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">

            {/* Left Column: Interactive Body Map & Target Generator */}
            <div className="space-y-6">

              {/* Anatomy Map Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 shadow-xl flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" /> Anatomy Projector
                  </h2>
                  <div className="flex bg-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab('front')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'front' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'}`}
                    >
                      Front
                    </button>
                    <button
                      onClick={() => setActiveTab('back')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'back' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'}`}
                    >
                      Back
                    </button>
                  </div>
                </div>

                {/* SVG Human Figure Projection */}
                <div className="relative w-full max-w-[320px] aspect-[3/5] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 400 500"
                    className="w-full h-full"
                  >
                    {/* Simplified Stylized Human Body Outline */}
                    <g fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" className="anatomy-outline">
                      {/* Head */}
                      <circle cx="200" cy="50" r="22" />
                      {/* Neck */}
                      <line x1="200" y1="72" x2="200" y2="85" />
                      {/* Shoulders */}
                      <path d="M 120 110 Q 200 85 280 110" />
                      {/* Arms */}
                      <path d="M 120 110 L 80 160 L 65 220" />
                      <path d="M 280 110 L 320 160 L 335 220" />
                      {/* Torso Outline */}
                      <path d="M 140 110 L 150 220 L 250 220 L 260 110 Z" />
                      {/* Pelvis */}
                      <path d="M 150 220 L 200 240 L 250 220 Z" />
                      {/* Legs */}
                      <path d="M 160 235 L 150 360 L 150 460" />
                      <path d="M 240 235 L 250 360 L 250 460" />
                      {/* Hands & Feet */}
                      <circle cx="65" cy="223" r="5" />
                      <circle cx="335" cy="223" r="5" />
                      <ellipse cx="148" cy="465" rx="8" ry="4" />
                      <ellipse cx="252" cy="465" rx="8" ry="4" />
                    </g>

                    {/* Interactive Hotspots Overlay */}
                    {musclesList[activeTab].map((muscle) => {
                      const isSelectedInDirectory = selectedMuscle === (muscle.alias || muscle.id);
                      const isSelectedInWorkout = selectedMusclesForWorkout.includes(muscle.alias || muscle.id);

                      let fillColor = 'rgba(59, 130, 246, 0.08)'; // Normal blue overlay tint
                      let strokeColor = 'rgba(59, 130, 246, 0.3)';

                      if (isSelectedInDirectory) {
                        fillColor = 'rgba(34, 211, 238, 0.45)'; // Bright Cyan for active directory selection
                        strokeColor = 'rgba(34, 211, 238, 0.85)';
                      } else if (isSelectedInWorkout) {
                        fillColor = 'rgba(139, 92, 246, 0.4)'; // Violet for active workout selection
                        strokeColor = 'rgba(139, 92, 246, 0.8)';
                      }

                      return (
                        <g
                          key={muscle.id}
                          className="cursor-pointer group"
                          onClick={() => {
                            const actualMuscleName = muscle.alias || muscle.id;
                            setSelectedMuscle(actualMuscleName);
                            // Also select/toggle for workout builder
                            toggleMuscleForWorkout(actualMuscleName);
                            toast.success(`Selected ${actualMuscleName.toUpperCase()}`, { id: 'muscle-select' });
                          }}
                        >
                          {/* Title Tooltip */}
                          <title>{muscle.name}</title>

                          {muscle.isRect ? (
                            <rect
                              x={muscle.x}
                              y={muscle.y}
                              width={muscle.w}
                              height={muscle.h}
                              rx={muscle.rx}
                              ry={muscle.ry}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth="1.5"
                              className={`transition-all duration-300 group-hover:fill-blue-500/25 group-hover:stroke-blue-400 ${
                                isSelectedInDirectory 
                                  ? 'anatomy-hotspot-directory' 
                                  : isSelectedInWorkout 
                                    ? 'anatomy-hotspot-workout' 
                                    : 'anatomy-hotspot'
                              }`}
                            />
                          ) : (
                            <ellipse
                              cx={muscle.cx}
                              cy={muscle.cy}
                              rx={muscle.rx}
                              ry={muscle.ry}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth="1.5"
                              className={`transition-all duration-300 group-hover:fill-blue-500/25 group-hover:stroke-blue-400 ${
                                isSelectedInDirectory 
                                  ? 'anatomy-hotspot-directory' 
                                  : isSelectedInWorkout 
                                    ? 'anatomy-hotspot-workout' 
                                    : 'anatomy-hotspot'
                              }`}
                            />
                          )}

                          {/* Label Text inside hotspot */}
                          <text
                            x={muscle.cx || (muscle.x + muscle.w! / 2)}
                            y={muscle.cy || (muscle.y + muscle.h! / 2) + 4}
                            fill="#94a3b8"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            {muscle.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating guide badge */}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-400 text-center">
                    <span>💡 Click areas to load exercises & toggle selection for the builder.</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-slate-300">
                    Selected Muscle: <span className="text-cyan-400 capitalize font-bold text-base">{selectedMuscle}</span>
                  </p>
                </div>
              </div>

              {/* Workout Planner / Builder */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-400" /> Target Workout Builder
                </h2>
                <p className="text-xs text-slate-400">
                  Select multiple muscle groups on the map above, choose parameters, and build a tailored session.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Selected Muscles ({selectedMusclesForWorkout.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      {selectedMusclesForWorkout.length === 0 ? (
                        <span className="text-xs text-slate-500 italic m-auto">Click body map muscles to add...</span>
                      ) : (
                        selectedMusclesForWorkout.map(m => (
                          <span
                            key={m}
                            onClick={() => toggleMuscleForWorkout(m)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-900/50 hover:bg-red-950 border border-indigo-500/30 px-2 py-1 text-xs font-medium text-indigo-300 cursor-pointer transition-colors hover:text-red-300 hover:border-red-800"
                          >
                            {m} <span className="text-[9px] opacity-60">×</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Target Duration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => setWorkoutDuration(mins)}
                          className={`py-2 rounded-xl text-xs font-medium border transition-all ${workoutDuration === mins ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border border-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Intensity Level
                    </label>
                    <select
                      value={workoutDifficulty}
                      onChange={(e) => setWorkoutDifficulty(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 font-medium"
                    >
                      <option value="beginner">Beginner (12-15 reps / 3 sets)</option>
                      <option value="intermediate">Intermediate (10-12 reps / 3 sets)</option>
                      <option value="advanced">Advanced (6-8 reps / 4 sets)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateWorkout}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="h-4 w-4" /> Assemble Custom Routine
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Exercises & Generated Workout display */}
            <div className="space-y-6">

              {/* Show Generated workout plan if active */}
              {generatedWorkout && (
                <div className="rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-gradient-to-b dark:from-indigo-950/20 dark:to-slate-950/60 p-6 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-750 dark:text-indigo-300 mb-2">
                        <Zap className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400" /> Custom Target Routine
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {generatedWorkout.difficulty.toUpperCase()} {generatedWorkout.duration}m Workout
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Focused on: {generatedWorkout.muscles.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end"><Flame className="h-3 w-3 text-orange-600 dark:text-orange-400" /> Est. Burn</div>
                        <div className="text-lg font-black text-orange-600 dark:text-orange-400">{generatedWorkout.caloriesBurned} kcal</div>
                      </div>
                      <button
                        onClick={startWorkoutMode}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-105 shadow-md"
                      >
                        <Play className="h-4 w-4 fill-white" /> Start Workout
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {generatedWorkout.exercises.map((ex: any, index: number) => (
                      <div key={ex.id} className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                        <span className="absolute top-3 right-3 text-2xl font-black text-slate-300 dark:text-slate-800">#{index + 1}</span>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{ex.name}</h3>
                          <p className="text-xs text-indigo-650 dark:text-indigo-400 font-semibold capitalize mt-0.5">{ex.primaryMuscle} • {ex.equipment}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{ex.sets} sets</span>
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{ex.reps} reps</span>
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{ex.rest}s rest</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed truncate">{ex.steps[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Directory Cards */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white capitalize">{selectedMuscle} Exercises</h2>
                    <p className="text-xs text-slate-400 mt-1">Showing {filteredExercises.length} filtered movements</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search movements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500/80"
                    />
                  </div>
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap gap-3 border-b border-slate-800/80 pb-5">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Equipment</span>
                    <select
                      value={equipmentFilter}
                      onChange={(e) => setEquipmentFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Equipment</option>
                      <option value="barbell">Barbell</option>
                      <option value="dumbbell">Dumbbell</option>
                      <option value="bodyweight">Bodyweight</option>
                      <option value="cable">Cable</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Difficulty</span>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Exercise Cards grid */}
                <div className="space-y-4">
                  {filteredExercises.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Dumbbell className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                      <p className="font-semibold text-sm">No exercises found matching criteria.</p>
                      <p className="text-xs text-slate-600 mt-1">Try resetting filters or changing the active muscle group.</p>
                    </div>
                  ) : (
                    filteredExercises.map((ex) => {
                      const isExpanded = expandedExercise === ex.id;

                      return (
                        <div
                          key={ex.id}
                          className={`rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-blue-500/40 bg-slate-900' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700/80 hover:bg-slate-900/30'}`}
                        >
                          {/* Header Accordion Trigger */}
                          <div
                            onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                            className="flex items-center justify-between p-4 cursor-pointer"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-white text-base md:text-lg">{ex.name}</h3>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${ex.difficulty === 'advanced' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    ex.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-green-500/10 text-green-400 border border-green-500/20'
                                  }`}>
                                  {ex.difficulty}
                                </span>
                              </div>
                              <div className="flex gap-2 text-xs text-slate-400 font-medium">
                                <span className="capitalize">Equipment: <strong className="text-slate-300">{ex.equipment}</strong></span>
                                <span>•</span>
                                <span className="capitalize">Target: <strong className="text-slate-300">{ex.primaryMuscle}</strong></span>
                              </div>
                            </div>
                            <div>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-800/60"
                              >
                                <div className="p-5 space-y-5">

                                  {/* Visual Demonstration */}
                                  {ex.embedId && (
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                        🎬 Visual Demonstration
                                      </h4>
                                      <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-inner flex items-center justify-center">
                                        {ex.embedId.startsWith('http') ? (
                                          <img
                                            src={ex.embedId}
                                            alt={ex.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <iframe
                                            src={`https://tenor.com/embed/${ex.embedId}`}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none' }}
                                            title={ex.name}
                                            allowFullScreen
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Instructions */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <Info className="h-3.5 w-3.5" /> Instructions
                                    </h4>
                                    <ol className="space-y-2 list-decimal list-inside text-sm text-slate-300 leading-relaxed">
                                      {ex.steps.map((step, idx) => (
                                        <li key={idx} className="pl-1">
                                          <span className="text-slate-300">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {/* Common Mistakes */}
                                  {ex.mistakes.length > 0 && (
                                    <div className="space-y-3 p-4 rounded-xl bg-red-950/20 border border-red-500/20">
                                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Avoid Mistakes
                                      </h4>
                                      <ul className="space-y-1.5 list-disc list-inside text-sm text-red-300/80 leading-relaxed">
                                        {ex.mistakes.map((mistake, idx) => (
                                          <li key={idx} className="pl-1">
                                            <span>{mistake}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Secondary Muscles */}
                                  {ex.secondaryMuscles.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="font-semibold text-slate-400 uppercase tracking-wider">Secondary Muscles Involved:</span>
                                      {ex.secondaryMuscles.map(sec => (
                                        <span key={sec} className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300 capitalize font-medium">{sec}</span>
                                      ))}
                                    </div>
                                  )}



                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </div>
        ) : (

          /* ACTIVE WORKOUT MODE TIMERS SCREEN */
          <div className="max-w-4xl mx-auto rounded-3xl border border-indigo-500/40 bg-slate-950/80 p-8 shadow-2xl space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 mb-2 animate-pulse">
                  ● ACTIVE TRAINING SESSION
                </span>
                <h2 className="text-3xl font-extrabold text-white">Active Workout Tracker</h2>
              </div>
              <button
                onClick={endWorkoutMode}
                className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Square className="h-4 w-4" /> End Workout
              </button>
            </div>

            {/* Rest Mode UI vs Lifting Mode UI */}
            {isResting ? (
              <div className="text-center py-16 space-y-6">
                <div className="w-40 h-40 rounded-full border-4 border-indigo-500 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(99,102,241,0.25)] animate-pulse">
                  <div className="text-5xl font-black text-indigo-400">{restTimeLeft}s</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Resting Phase</h3>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Deep breaths. Keep hydrated and prepare for the next set.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={skipRest}
                    className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3 text-sm font-normal text-slate-200 transition-all hover:scale-105"
                  >
                    Skip Rest Timer <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">

                {/* Active Exercise Detail */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Current Exercise</span>
                    <h3 className="text-2xl font-black text-white">{generatedWorkout.exercises[currentExerciseIndex].name}</h3>
                    <p className="text-xs text-slate-400 capitalize">Target: {generatedWorkout.exercises[currentExerciseIndex].primaryMuscle} ({generatedWorkout.exercises[currentExerciseIndex].equipment})</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Set</span>
                      <span className="text-3xl font-black text-white">{currentSetIndex + 1} / {generatedWorkout.exercises[currentExerciseIndex].sets}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Reps Target</span>
                      <span className="text-3xl font-black text-white">{generatedWorkout.exercises[currentExerciseIndex].reps}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Info className="h-3 w-3" /> Quick Tip:</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{generatedWorkout.exercises[currentExerciseIndex].steps[0]}</p>
                  </div>

                  <button
                    onClick={triggerRest}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="h-5 w-5" /> Completed Set
                  </button>
                </div>

                {/* Workout Timeline Progress */}
                <div className="space-y-4 border-l border-slate-800 pl-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Timeline</h4>
                  <div className="space-y-3">
                    {generatedWorkout.exercises.map((ex: any, idx: number) => {
                      const isPast = idx < currentExerciseIndex;
                      const isCurrent = idx === currentExerciseIndex;

                      return (
                        <div
                          key={ex.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? 'bg-indigo-900/20 border border-indigo-500/30' : isPast ? 'opacity-40' : 'opacity-70'}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isPast ? 'bg-emerald-500 text-slate-950' : isCurrent ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                            <p className="text-[10px] text-slate-400">{ex.sets} sets • {ex.reps} reps</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MuscleWikiPage;
