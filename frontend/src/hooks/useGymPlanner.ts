import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { 
  WorkoutPlan, 
  WorkoutDay, 
  PlannerExercise, 
  SetLog, 
  ExerciseLog, 
  DEFAULT_WORKOUT_PLAN 
} from '../data/defaultWorkoutPlan';

export const useGymPlanner = () => {
  const [goal, setGoal] = useState('deficit');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [split, setSplit] = useState('upper_lower');
  const [workoutDays, setWorkoutDays] = useState<number[]>([1, 2, 4, 5]);
  const [equipment, setEquipment] = useState('barbell,dumbbells,cable,bench');
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [duration, setDuration] = useState<number>(45);
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Todo completed state for exercises
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('gym_completed_exercises');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleExerciseCompleted = (dayName: string, exerciseName: string) => {
    setCompletedExercises(prev => {
      const updated = {
        ...prev,
        [`${dayName}-${exerciseName}`]: !prev[`${dayName}-${exerciseName}`]
      };
      localStorage.setItem('gym_completed_exercises', JSON.stringify(updated));
      return updated;
    });
  };

  const [activeTabDay, setActiveTabDay] = useState<string>('Monday');

  useEffect(() => {
    if (plan && plan.weeklySchedule.length > 0) {
      setActiveTabDay(plan.weeklySchedule[0].dayName);
    }
  }, [plan]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exerciseName, setExerciseName] = useState('Incline dumbbell press');
  const [enriched, setEnriched] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<PlannerExercise | null>(null);

  // Live Workout Session Logger State
  const [activeLoggingDay, setActiveLoggingDay] = useState<WorkoutDay | null>(null);
  const [loggingExercises, setLoggingExercises] = useState<ExerciseLog[]>([]);
  const [submittingSession, setSubmittingSession] = useState(false);

  // Progression Signals State
  const [progressionData, setProgressionData] = useState<any>(null);

  const toggleDay = (day: number) => {
    setWorkoutDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort()
    );
  };

  const loadSavedPlans = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/workouts');
      if (response.data.success) {
        setSavedPlans(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load saved plans', err);
    }
  }, []);

  const loadActivePlan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/workouts/active');
      if (response.data.success && response.data.data) {
        setPlan(response.data.data);
      } else {
        setPlan(DEFAULT_WORKOUT_PLAN);
      }
    } catch (err) {
      console.error('Failed to load active plan', err);
      setPlan(DEFAULT_WORKOUT_PLAN);
    } finally {
      setLoading(false);
    }
  }, []);

  const activatePlan = async (planId: string) => {
    const actToast = toast.loading('Activating plan...');
    try {
      const response = await apiClient.post(`/api/workouts/${planId}/activate`);
      if (response.data.success) {
        toast.success('Workout plan activated!', { id: actToast });
        await loadActivePlan();
        await loadSavedPlans();
      } else {
        throw new Error(response.data.error || 'Activation failed');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to activate plan'), { id: actToast });
    }
  };

  const deletePlan = async (planId: string) => {
    const delToast = toast.loading('Deleting plan...');
    try {
      const response = await apiClient.delete(`/api/workouts/${planId}`);
      if (response.data.success) {
        toast.success('Workout plan deleted!', { id: delToast });
        await loadActivePlan();
        await loadSavedPlans();
      } else {
        throw new Error(response.data.error || 'Delete failed');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete plan'), { id: delToast });
    }
  };

  const createCustomPlan = async (planData: Partial<WorkoutPlan>) => {
    const buildToast = toast.loading('Saving custom plan...');
    try {
      const response = await apiClient.post('/api/workouts/custom', planData);
      if (response.data.success) {
        toast.success('Custom plan created and activated!', { id: buildToast });
        await loadActivePlan();
        await loadSavedPlans();
        return true;
      } else {
        throw new Error(response.data.error || 'Saving custom plan failed');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save custom plan'), { id: buildToast });
      return false;
    }
  };

  useEffect(() => {
    loadActivePlan();
    loadSavedPlans();
  }, [loadActivePlan, loadSavedPlans]);

  const loadProgression = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/workout-sessions/progression');
      const payload = response.data;
      if (payload.success) {
        setProgressionData(payload.data);
      }
    } catch (err) {
      console.error('Failed to load progression signals', err);
    }
  }, []);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/workouts/generate-plan', {
        goal,
        experienceLevel,
        split,
        workoutDays,
        equipment: equipment.split(',').map((item) => item.trim()).filter(Boolean),
        bodyFocusAreas: ['chest', 'back', 'legs', 'shoulders']
      });
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Unable to generate plan');
      setPlan(payload.data.plan || payload.data);
      await loadSavedPlans();
      toast.success('AI plan generated and activated!');
    } catch (err) {
      setError(getErrorMessage(err, 'Workout planner unavailable'));
    } finally {
      setLoading(false);
    }
  }, [equipment, experienceLevel, goal, split, workoutDays, loadSavedPlans]);

  const enrichExercise = async () => {
    if (!exerciseName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/workouts/enrich-exercise', { exerciseName });
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Failed to enrich exercise details');
      setEnriched(payload.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Exercise enrichment failed'));
    } finally {
      setLoading(false);
    }
  };

  // Initialize workout session logger UI
  const handleStartLogging = (day: WorkoutDay) => {
    setActiveLoggingDay(day);
    setStartTime(new Date());
    setNotes('');
    const initialExercises: ExerciseLog[] = day.exercises.map(ex => {
      const storedWeight = localStorage.getItem(`overload_weight_${ex.name}`);
      const defaultWeight = storedWeight ? Number(storedWeight) : 60;
      
      const parsedReps = parseInt(ex.reps.split('-')[0]) || 8;
      const sets: SetLog[] = Array.from({ length: ex.sets }, () => ({
        weight: defaultWeight,
        reps: parsedReps,
        completed: false,
        setType: 'normal'
      }));
      return {
        name: ex.name,
        sets
      };
    });
    setLoggingExercises(initialExercises);
  };

  // Add set to exercise log
  const handleAddSet = (exerciseIndex: number) => {
    const newLog = [...loggingExercises];
    const targetEx = newLog[exerciseIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1] || { weight: 60, reps: 8, completed: false, setType: 'normal' };
    targetEx.sets.push({
      weight: lastSet.weight,
      reps: lastSet.reps,
      completed: false,
      setType: lastSet.setType || 'normal'
    });
    setLoggingExercises(newLog);
  };

  // Remove set from exercise log
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newLog = [...loggingExercises];
    newLog[exerciseIndex].sets.splice(setIndex, 1);
    setLoggingExercises(newLog);
  };

  // Edit weight/reps/completion in logger
  const handleEditSet = (exerciseIndex: number, setIndex: number, key: keyof SetLog, value: any) => {
    const newLog = [...loggingExercises];
    (newLog[exerciseIndex].sets[setIndex] as any)[key] = value;
    setLoggingExercises(newLog);
  };

  // Submit workout session log
  const handleSubmitSession = async () => {
    if (!plan || !activeLoggingDay) return;
    setSubmittingSession(true);
    const saveToast = toast.loading('Logging workout session volume...');
    try {
      const planId = plan.planId || plan._id || '665000000000000000000005';
      const response = await apiClient.post('/api/workout-sessions', {
        workoutPlanId: planId,
        workoutName: activeLoggingDay.dayName || 'Workout Session',
        date: new Date().toISOString(),
        exercises: loggingExercises,
        duration: duration,
        startTime: startTime ? startTime.toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        notes
      });

      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Failed to save session');

      const totalVol = payload.data.volume || 0;
      toast.success(`Session tracked! Logged ${totalVol.toLocaleString()} kg total volume.`, { id: saveToast });

      const compoundLifts = ['squat', 'bench', 'deadlift', 'overhead press', 'press', 'dumbbell press', 'incline press'];
      loggingExercises.forEach(ex => {
        const isCompound = compoundLifts.some(c => ex.name.toLowerCase().includes(c));
        const allCompleted = ex.sets.length > 0 && ex.sets.every(s => s.completed);
        
        if (isCompound && allCompleted) {
          const maxWeight = Math.max(...ex.sets.map(s => s.weight));
          const percentIncrease = Math.round((maxWeight * 0.05) / 2.5) * 2.5;
          const increase = Math.max(2.5, percentIncrease);
          const nextWeight = maxWeight + increase;
          
          localStorage.setItem(`overload_weight_${ex.name}`, nextWeight.toString());
          
          setTimeout(() => {
            toast.success(`💥 Progressive Overload Unlocked for ${ex.name}! Target weight for next week is scaled up to ${nextWeight} kg (+${increase} kg).`, { duration: 6500 });
          }, 800);
        }
      });

      setActiveLoggingDay(null);
      setNotes('');
      setStartTime(null);
      loadProgression();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'), { id: saveToast });
    } finally {
      setSubmittingSession(false);
    }
  };

  useEffect(() => {
    loadProgression();
  }, [loadProgression]);

  return {
    goal, setGoal,
    experienceLevel, setExperienceLevel,
    split, setSplit,
    workoutDays, setWorkoutDays,
    equipment, setEquipment,
    plan, setPlan,
    completedExercises, setCompletedExercises,
    toggleExerciseCompleted,
    activeTabDay, setActiveTabDay,
    loading,
    error, setError,
    exerciseName, setExerciseName,
    enriched, setEnriched,
    selectedExercise, setSelectedExercise,
    activeLoggingDay, setActiveLoggingDay,
    loggingExercises, setLoggingExercises,
    submittingSession,
    progressionData,
    toggleDay,
    loadProgression,
    generatePlan,
    enrichExercise,
    handleStartLogging,
    handleAddSet,
    handleRemoveSet,
    handleEditSet,
    handleSubmitSession,
    duration,
    setDuration,
    savedPlans, setSavedPlans,
    startTime, setStartTime,
    notes, setNotes,
    loadSavedPlans,
    loadActivePlan,
    activatePlan,
    deletePlan,
    createCustomPlan
  };
};
