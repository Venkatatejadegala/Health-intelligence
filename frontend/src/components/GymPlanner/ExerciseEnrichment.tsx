import React from 'react';
import { Search, Dumbbell } from 'lucide-react';
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

interface ExerciseEnrichmentProps {
  exerciseName: string;
  setExerciseName: (val: string) => void;
  onEnrich: () => void;
  enriched: any;
}

export const ExerciseEnrichment: React.FC<ExerciseEnrichmentProps> = ({
  exerciseName,
  setExerciseName,
  onEnrich,
  enriched
}) => {
  return (
    <section className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
      <h2 className="text-lg font-black text-white">Manual Exercise Enrichment</h2>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input 
          value={exerciseName} 
          onChange={(event) => setExerciseName(event.target.value)} 
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500" 
        />
        <button 
          type="button"
          onClick={onEnrich} 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 px-5 py-3 text-sm font-semibold cursor-pointer transition-all shadow-md"
        >
          <Search className="h-4 w-4" /> Enrich
        </button>
      </div>
      {enriched && (
        <div className="mt-4 rounded-xl bg-slate-950/60 border border-slate-850 p-4">
          {(() => {
            const wikiEx = getMatchedWikiExercise(enriched.exercise.name || exerciseName);
            return (
              <div className="grid gap-4 md:grid-cols-[200px_1fr] items-start">
                {wikiEx?.embedId ? (
                  <div className="w-full max-w-[200px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 flex items-center justify-center mx-auto">
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
                ) : (
                  <div className="w-full max-w-[200px] aspect-square rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-[10px]">No Demo GIF Available</span>
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-white text-base">{enriched.exercise.name}</p>
                  <p className="mt-1 text-sm text-lime-450 font-semibold">{(enriched.exercise.primaryMuscles || enriched.exercise.targetMuscles || []).join(', ')}</p>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{enriched.exercise.instructions?.join(' ')}</p>
                  <p className="mt-2 text-xs font-bold text-slate-550">{enriched.nextIntegration || 'Ready for media API connection.'}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
};
