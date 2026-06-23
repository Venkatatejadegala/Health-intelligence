import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { PlannerExercise } from '../../data/defaultWorkoutPlan';
import EXERCISES_DATABASE_JSON from '../../data/exercises.json';

interface WikiExercise {
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  instructions: string[];
  category: string;
  embedId?: string;
  aliases?: string[];
}

const EXERCISES_DATABASE = EXERCISES_DATABASE_JSON as unknown as WikiExercise[];

const getMatchedWikiExercise = (name: string): WikiExercise | undefined => {
  const cleanName = name.toLowerCase().trim();
  let match = EXERCISES_DATABASE.find(ex => ex.name.toLowerCase().trim() === cleanName);
  if (match) return match;
  match = EXERCISES_DATABASE.find(ex => {
    const exCleanName = ex.name.toLowerCase().trim();
    return exCleanName.includes(cleanName) || cleanName.includes(exCleanName);
  });
  return match;
};

interface ExerciseDetailsModalProps {
  selectedExercise: PlannerExercise | null;
  onClose: () => void;
}

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  selectedExercise,
  onClose
}) => {
  if (!selectedExercise) return null;

  const wikiEx = getMatchedWikiExercise(selectedExercise.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="border-b border-slate-800 bg-slate-950/60 p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-lime-950/40 text-lime-400 uppercase tracking-wider border border-lime-900/30">
                {selectedExercise.difficulty}
              </span>
              <h3 className="mt-2 text-xl font-black text-white tracking-tight leading-tight">
                {selectedExercise.name}
              </h3>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {selectedExercise.targetMuscles.map((muscle) => (
              <span key={muscle} className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-350 capitalize font-bold">
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {wikiEx?.embedId && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-lime-450 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                🎬 Visual Demonstration
              </h4>
              <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-inner flex items-center justify-center mx-auto">
                {wikiEx.embedId.startsWith('http') ? (
                  <img
                    src={wikiEx.embedId}
                    alt={wikiEx.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={`https://tenor.com/embed/${wikiEx.embedId}`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title={wikiEx.name}
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-black text-slate-550 uppercase tracking-wider mb-1.5">Instructions</h4>
            <p className="text-sm leading-relaxed text-slate-350">
              {selectedExercise.instructions.join(' ')}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" /> Common Mistakes (Avoid)
            </h4>
            <ul className="space-y-1.5">
              {selectedExercise.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="text-sm text-red-405 bg-red-950/20 border border-red-900/20 rounded-lg p-2.5 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {selectedExercise.progression && (
            <div className="bg-emerald-950/20 border border-emerald-900/20 rounded-xl p-3.5">
              <h4 className="text-[10px] font-black text-lime-450 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Progression Guidance
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                {selectedExercise.progression}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/60 p-4 flex justify-between items-center shrink-0">
          <div className="text-sm text-slate-400 font-semibold">
            Target Volume: <span className="font-extrabold text-lime-450">{selectedExercise.sets} sets × {selectedExercise.reps} reps</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition shadow-md cursor-pointer"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
};
