import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { WorkoutPlan, WorkoutDay, PlannerExercise } from '../../data/defaultWorkoutPlan';

interface WorkoutDayScheduleProps {
  plan: WorkoutPlan;
  activeTabDay: string;
  setActiveTabDay: (day: string) => void;
  completedExercises: Record<string, boolean>;
  onToggleCompleted: (dayName: string, exerciseName: string) => void;
  onStartLogging: (day: WorkoutDay) => void;
  onSelectExercise: (ex: PlannerExercise) => void;
}

export const WorkoutDaySchedule: React.FC<WorkoutDayScheduleProps> = ({
  plan,
  activeTabDay,
  setActiveTabDay,
  completedExercises,
  onToggleCompleted,
  onStartLogging,
  onSelectExercise
}) => {
  return (
    <div className="space-y-4">
      {/* Tab selector for workout days */}
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-900/30 p-2.5 rounded-2xl border border-slate-850">
        {plan.weeklySchedule.map((day) => (
          <button
            key={day.dayName}
            type="button"
            onClick={() => setActiveTabDay(day.dayName)}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold cursor-pointer transition-all shadow-sm border ${
              activeTabDay === day.dayName
                ? 'bg-[#ccff00] border-[#ccff00] text-slate-950 font-black'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-250 hover:bg-slate-900'
            }`}
          >
            {day.dayName}
          </button>
        ))}
      </div>

      {/* Active Day Table Container */}
      {plan.weeklySchedule.filter(d => d.dayName === activeTabDay).map((day) => (
        <div key={day.dayName} className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md space-y-5 border-t-4 border-t-[#ccff00]">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div>
              <h3 className="text-2xl font-black text-slate-100">{day.dayName}</h3>
              <p className="text-sm font-bold capitalize text-[#ccff00] mt-0.5">{day.focus.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-950/60 border border-slate-850 px-3 py-1.5 text-xs font-bold text-slate-350">{day.estimatedMinutes} min</span>
              <button
                type="button"
                onClick={() => onStartLogging(day)}
                className="flex items-center gap-2 rounded-2xl border border-[#ccff00]/20 hover:border-[#ccff00]/50 bg-[#ccff00]/5 hover:bg-[#ccff00]/10 px-5 py-3 text-xs font-extrabold text-[#ccff00] cursor-pointer transition-all shadow-md"
              >
                <Calendar className="h-4 w-4" />
                Log Workout Session
              </button>
            </div>
          </div>

          {/* Exercises Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-10">Done</th>
                  <th className="py-2.5 px-3">Exercise</th>
                  <th className="py-2.5 px-3 text-right w-20">Sets×Reps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs">
                {day.exercises.map((exercise) => {
                  const isCompleted = completedExercises[`${day.dayName}-${exercise.name}`] || false;
                  return (
                    <tr
                      key={`${day.dayName}-${exercise.name}`}
                      onClick={() => onSelectExercise(exercise)}
                      className="group cursor-pointer hover:bg-slate-900 transition-colors"
                    >
                      {/* Done Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompleted(day.dayName, exercise.name);
                        }}
                      >
                        <div className="flex justify-center items-center">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-[#ccff00] border-[#ccff00]'
                                : 'border-slate-800 hover:border-[#ccff00]/50 bg-slate-950/40'
                            }`}
                          >
                            {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
                          </button>
                        </div>
                      </td>

                      {/* Exercise Details */}
                      <td className="py-3 px-3">
                        <div className="min-w-0">
                          <span className={`font-bold transition-all text-sm block group-hover:text-[#ccff00] ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'
                          }`}>
                            {exercise.name}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {exercise.targetMuscles.slice(0, 3).map((muscle) => (
                              <span
                                key={muscle}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold capitalize border transition-all ${
                                  isCompleted
                                    ? 'bg-slate-900/20 border-slate-950 text-slate-500'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-350'
                                }`}
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Sets × Reps */}
                      <td className="py-3 px-3 text-right">
                        <span className={`font-black text-xs px-2 py-1 rounded-lg border shadow-inner inline-block whitespace-nowrap transition-all ${
                          isCompleted
                            ? 'bg-slate-900/20 border-slate-950 text-slate-550'
                            : 'bg-slate-950/60 border-slate-800 text-[#ccff00]'
                        }`}>
                          {exercise.sets}×{exercise.reps}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
