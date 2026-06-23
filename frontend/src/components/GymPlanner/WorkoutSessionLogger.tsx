import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { WorkoutDay, ExerciseLog, SetLog } from '../../data/defaultWorkoutPlan';

interface WorkoutSessionLoggerProps {
  activeLoggingDay: WorkoutDay | null;
  onClose: () => void;
  loggingExercises: ExerciseLog[];
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onEditSet: (exerciseIndex: number, setIndex: number, key: keyof SetLog, value: any) => void;
  submittingSession: boolean;
  onSubmit: () => void;
  duration?: number;
  onDurationChange?: (val: number) => void;
  startTime: Date | null;
  notes: string;
  onNotesChange: (val: string) => void;
}

export const WorkoutSessionLogger: React.FC<WorkoutSessionLoggerProps> = ({
  activeLoggingDay,
  onClose,
  loggingExercises,
  onAddSet,
  onRemoveSet,
  onEditSet,
  submittingSession,
  onSubmit,
  duration,
  onDurationChange,
  startTime,
  notes,
  onNotesChange
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!startTime) return;
    const updateTimer = () => {
      const diffMs = new Date().getTime() - new Date(startTime).getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      setElapsedTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      
      if (onDurationChange) {
        // Auto update duration input in minutes
        onDurationChange(Math.max(1, Math.round(diffSecs / 60)));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, onDurationChange]);

  if (!activeLoggingDay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Logger UI Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        className="relative z-10 w-full max-w-2xl bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-950/40 border border-lime-900/30 px-2.5 py-0.5 text-xs font-bold text-lime-400">
              Active Training Logger
            </span>
            <h3 className="text-xl font-black text-white mt-2 flex flex-wrap items-center gap-3">
              Logging Session: {activeLoggingDay.dayName}
              <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg text-[#00f0ff] font-mono tracking-wider border border-slate-850/60">
                ⏱️ {elapsedTime}
              </span>
            </h3>
            <p className="text-xs text-lime-450 font-bold capitalize mt-0.5">{activeLoggingDay.focus.replace(/_/g, ' ')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Exercises Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loggingExercises.map((ex, exIdx) => (
            <div key={ex.name} className="p-5 rounded-2xl border border-slate-850 bg-slate-950/40 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h4 className="font-extrabold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-lime-400 text-slate-950 font-black flex items-center justify-center text-xs">
                    {exIdx + 1}
                  </span>
                  {ex.name}
                </h4>
                <button
                  type="button"
                  onClick={() => onAddSet(exIdx)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-normal text-slate-300 cursor-pointer transition shadow-xs"
                >
                  <Plus className="h-3 w-3" /> Add Set
                </button>
              </div>

              {/* Sets list */}
              <div className="space-y-2">
                {ex.sets.map((set, setIdx) => (
                  <div 
                    key={setIdx} 
                    className={`grid grid-cols-[50px_100px_1fr_1fr_44px_44px] items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                      set.completed 
                        ? 'bg-emerald-950/25 border-emerald-900/30' 
                        : 'bg-slate-900/40 border-slate-850'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-500 text-center uppercase">Set {setIdx + 1}</span>
                    
                    {/* Set Type Dropdown Selector */}
                    <div className="px-1">
                      <select
                        value={set.setType || 'normal'}
                        onChange={(e) => onEditSet(exIdx, setIdx, 'setType', e.target.value)}
                        className={`w-full text-xs font-bold rounded-lg py-1.5 px-2 border outline-none ${
                          set.setType === 'superset'
                            ? 'bg-purple-950/40 text-purple-400 border-purple-900/40'
                            : set.setType === 'dropset'
                              ? 'bg-orange-950/40 text-orange-450 border-orange-900/40'
                              : 'bg-slate-950 text-slate-350 border-slate-800'
                        }`}
                      >
                        <option value="normal">Normal</option>
                        <option value="superset">Superset</option>
                        <option value="dropset">Dropset</option>
                      </select>
                    </div>

                    {/* Weight load input */}
                    <div className="flex items-center gap-1.5 px-1.5">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => onEditSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                        className="w-full text-center font-bold text-white border border-slate-800 bg-slate-950 rounded-lg py-1.5 text-sm outline-none focus:ring-1 focus:ring-lime-500"
                      />
                      <span className="text-[10px] font-bold text-slate-500">kg</span>
                    </div>

                    {/* Reps input */}
                    <div className="flex items-center gap-1.5 px-1.5">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => onEditSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                        className="w-full text-center font-bold text-white border border-slate-800 bg-slate-950 rounded-lg py-1.5 text-sm outline-none focus:ring-1 focus:ring-lime-500"
                      />
                      <span className="text-[10px] font-bold text-slate-500">reps</span>
                    </div>

                    {/* Delete set */}
                    <button
                      type="button"
                      onClick={() => onRemoveSet(exIdx, setIdx)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition cursor-pointer flex justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Mark Completed check mark */}
                    <button
                      type="button"
                      onClick={() => onEditSet(exIdx, setIdx, 'completed', !set.completed)}
                      className={`p-2 rounded-lg transition-all flex justify-center cursor-pointer border ${
                        set.completed 
                          ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md font-bold' 
                          : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Session Notes Box */}
          <div className="p-5 rounded-2xl border border-slate-850 bg-slate-950/40 space-y-2 shadow-sm">
            <h4 className="font-extrabold text-slate-300 text-xs uppercase tracking-wider">
              Workout Session Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Record feelings, reps in reserve, fatigue, or recovery goals..."
              className="w-full h-20 text-xs font-semibold text-slate-300 border border-slate-800 bg-slate-950 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#ccff00]/20 focus:border-[#ccff00] placeholder-slate-600 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-wrap gap-4 justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold text-slate-550">
              Active Session: {loggingExercises.reduce((sum, e) => sum + e.sets.length, 0)} total sets
            </p>
            {duration !== undefined && onDurationChange && (
              <div className="flex items-center gap-2 border border-slate-850 bg-slate-950 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Duration:</span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => onDurationChange(Math.max(1, Number(e.target.value)))}
                  className="w-12 text-center text-sm font-extrabold text-[#ccff00] bg-transparent outline-none border-none animate-pulse"
                />
                <span className="text-[10px] font-bold text-slate-400">min</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submittingSession || loggingExercises.length === 0}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold px-5 py-3 text-sm transition shadow-md disabled:opacity-60 cursor-pointer animate-pulse"
          >
            {submittingSession ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                Submitting...
              </>
            ) : (
              'Save Session & Log Volume'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
