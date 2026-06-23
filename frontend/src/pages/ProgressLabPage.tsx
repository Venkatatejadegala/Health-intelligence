import * as React from 'react';
import toast from 'react-hot-toast';
import { Camera, RefreshCw, Save, Scale } from 'lucide-react';
import apiClient, { getErrorMessage } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const ProgressLabPage: React.FC = () => {
  const { token } = useAuth();
  const [entries, setEntries] = React.useState<any[]>([]);
  const [comparison, setComparison] = React.useState<any>(null);
  const [form, setForm] = React.useState({
    weight: 72,
    bodyFatPercent: 18,
    waistCm: 82,
    chestCm: 99,
    armsCm: 35,
    thighsCm: 58,
    progressPhotoUrl: '',
    postureNotes: '',
    coachNotes: ''
  });

  const loadProgress = React.useCallback(async () => {
    try {
      const [entriesRes, comparisonRes] = await Promise.all([
        apiClient.get('/api/progress'),
        apiClient.get('/api/progress/comparison')
      ]);
      const entriesPayload = entriesRes.data;
      const comparisonPayload = comparisonRes.data;
      if (entriesPayload.success) setEntries(entriesPayload.data);
      if (comparisonPayload.success) setComparison(comparisonPayload.data);
    } catch (err) {
      console.error('Failed to load progress', err);
    }
  }, []);

  React.useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const setValue = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));

  const saveProgress = async () => {
    try {
      const response = await apiClient.put('/api/progress/entry', form);
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error || 'Could not save progress');
      toast.success('Progress entry saved');
      loadProgress();
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Save failed');
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-900 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-950/30 px-3 py-1 text-sm font-semibold text-rose-450">
              <Camera className="h-4 w-4" /> Body Transformation Analysis
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-[#ccff00] bg-clip-text text-transparent md:text-5xl">
              Progress Lab
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400 font-medium">
              Track weight, body measurements, progress photos, posture notes, and transformation deltas.
            </p>
          </div>
          <button onClick={loadProgress} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 px-4 py-3 text-sm font-bold text-slate-300">
            <RefreshCw className="h-4 w-4" /> Reload
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl">
            <h2 className="text-lg font-black text-white mb-2">New Entry</h2>
            {[
              ['weight', 'Weight (kg)'],
              ['bodyFatPercent', 'Body fat (%)'],
              ['waistCm', 'Waist (cm)'],
              ['chestCm', 'Chest (cm)'],
              ['armsCm', 'Arms (cm)'],
              ['thighsCm', 'Thighs (cm)']
            ].map(([key, label]) => (
              <label key={key} className="block text-xs font-bold text-slate-400 mt-3 first:mt-0">
                {label}
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(event) => setValue(key, Number(event.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/20 font-bold"
                />
              </label>
            ))}
            <label className="block text-xs font-bold text-slate-400 mt-3">
              Progress photo URL
              <input
                value={form.progressPhotoUrl}
                onChange={(event) => setValue('progressPhotoUrl', event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/20 font-bold"
              />
            </label>
            <label className="block text-xs font-bold text-slate-400 mt-3">
              Posture notes
              <textarea
                value={form.postureNotes}
                onChange={(event) => setValue('postureNotes', event.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/20 font-bold resize-none"
              />
            </label>
            <label className="block text-xs font-bold text-slate-400 mt-3">
              Coach notes
              <textarea
                value={form.coachNotes}
                onChange={(event) => setValue('coachNotes', event.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/20 font-bold resize-none"
              />
            </label>
            <button onClick={saveProgress} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] text-slate-950 hover:bg-[#b5e000] px-4 py-3 text-sm font-black transition-all active:scale-[0.98] shadow-md shadow-[#ccff00]/10 mt-4">
              <Save className="h-4 w-4" /> Save Progress
            </button>
          </aside>

          <main className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Weight delta', comparison?.deltas?.weight != null ? `${comparison.deltas.weight}kg` : '-'],
                ['Waist delta', comparison?.deltas?.waistCm != null ? `${comparison.deltas.waistCm}cm` : '-'],
                ['Body fat delta', comparison?.deltas?.bodyFatPercent != null ? `${comparison.deltas.bodyFatPercent}%` : '-']
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl">
                  <Scale className="mb-3 h-7 w-7 text-[#00f0ff]" />
                  <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">{label}</p>
                  <p className="mt-1.5 text-3xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-850 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl">
              <h2 className="text-xl font-black text-white mb-4">Progress Timeline</h2>
              <div className="space-y-4">
                {entries.length ? entries.slice().reverse().map((entry) => (
                  <div key={entry._id} className="rounded-2xl bg-slate-950/65 border border-slate-850 p-5 space-y-4 shadow-sm hover:border-[#ccff00]/25 transition-all">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                      <p className="font-extrabold text-white text-sm">
                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
                      <div className="space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weight</span>
                            <span className="text-xs font-black text-white">{entry.weight != null ? `${entry.weight} kg` : '-'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Body Fat</span>
                            <span className="text-xs font-black text-[#ccff00]">{entry.bodyFatPercent != null ? `${entry.bodyFatPercent}%` : '-'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waist</span>
                            <span className="text-xs font-black text-white">{entry.waistCm != null ? `${entry.waistCm} cm` : '-'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chest</span>
                            <span className="text-xs font-black text-white">{entry.chestCm != null ? `${entry.chestCm} cm` : '-'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Arms</span>
                            <span className="text-xs font-black text-white">{entry.armsCm != null ? `${entry.armsCm} cm` : '-'}</span>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thighs</span>
                            <span className="text-xs font-black text-white">{entry.thighsCm != null ? `${entry.thighsCm} cm` : '-'}</span>
                          </div>
                        </div>

                        {/* Notes Row */}
                        {(entry.postureNotes || entry.coachNotes) && (
                          <div className="grid gap-3 sm:grid-cols-2 pt-2">
                            {entry.postureNotes && (
                              <div className="bg-slate-900/20 border border-slate-850/30 rounded-xl p-3">
                                <span className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Posture Notes</span>
                                <p className="text-xs text-slate-350 leading-relaxed font-semibold">{entry.postureNotes}</p>
                              </div>
                            )}
                            {entry.coachNotes && (
                              <div className="bg-slate-900/20 border border-slate-850/30 rounded-xl p-3">
                                <span className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Coach Notes</span>
                                <p className="text-xs text-slate-350 leading-relaxed font-semibold">{entry.coachNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Photo Display */}
                      {entry.progressPhotoUrl && (
                        <div className="w-full md:w-32 aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-inner flex items-center justify-center shrink-0">
                          <img
                            src={entry.progressPhotoUrl}
                            alt={`Progress on ${new Date(entry.date).toLocaleDateString()}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="rounded-xl bg-slate-950/60 border border-slate-850 p-4 text-xs font-semibold text-slate-400 text-center">No progress entries yet.</p>
                )}
              </div>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
};

export default ProgressLabPage;
