'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Overview {
  user: {
    uid: string; email: string; displayName: string | null; photoURL: string | null;
    emailVerified: boolean; disabled: boolean; createdAt: string | null;
    lastSignIn: string | null; providers: string[];
  } | null;
  profile: {
    goal: string | null; gender: string | null; age: number | null;
    heightCm: number | null; currentWeightKg: number | null; targetWeightKg: number | null;
    activityLevel: string | null; waterGoalMl: number | null;
    isOnboardingCompleted: boolean; avatarUrl: string | null;
  } | null;
  plans: Array<{
    id: string; description: string; creationDate: number | null; startDate: string | null;
    endDate: string | null; goalEnergy: number | null; goalProtein: number | null;
    goalCarbohydrates: number | null; goalFat: number | null; goalFiber: number | null;
    onlyLogging: boolean; meals: Array<{ id: string; name: string; mealType: string; time: string }>;
  }>;
  routines: Array<{
    id: string; name: string; description: string; startDate: number | null;
    endDate: number | null; frequency: string; goal: string;
    days: Array<{ id: string; name: string; exercises: Array<{ id: string; nameRo: string; nameEn: string; sets: string; reps: string }> }>;
  }>;
  diary: Array<{
    id: string; date: string; datetime: number | null; mealType: string | null;
    ingredientName: string; recipeName: string | null; amount: number;
    energy: number; protein: number; carbohydrates: number; fat: number; photoUrl: string | null;
  }>;
  weightEntries: Array<{ id: string; weight: number; date: number | null; dateKey: string }>;
  measurements: Array<{
    id: string; date: number | null; weight: number | null; bodyFatPercentage: number | null;
    chest: number | null; waist: number | null; hip: number | null; arm: number | null; thigh: number | null;
  }>;
  workoutSessions: Array<{
    id: string; routineId: string; dayId: string; date: number | null;
    completedAt: number | null; exercises: number; caloriesBurned: number | null; durationSeconds: number | null;
  }>;
  progressPhotos: Array<{ id: string; date: number | null; url: string | null; note: string | null; photoType: number }>;
  medicalAnalyses: Array<{ id: string; createdAt: number | null; url: string | null; resultRaw: string }>;
  dailyTracking: Array<{
    dateKey: string; waterCups: number | null; supplements: Record<string, boolean> | null;
    consumedSupplements: Array<{ name: string; consumedAt: string | null; dosage: string | null }> | null;
    timestamp: number | null;
  }>;
  calorieTargets: Array<{
    id: string; date: number | null; validUntil: number | null;
    calorieAmount: number; proteinAmount: number; carbohydrateAmount: number; fatAmount: number;
  }>;
  coachLinks: Array<{ coachUid: string; coachEmail: string; coachDisplayName: string | null; status: string; linkedAt: number | null }>;
  friends: Array<{ friendUid: string; friendEmail: string; friendDisplayName: string | null }>;
  userIngredients: Array<{ id: string; name: string; status: string; createdAt: number | null }>;
  userRecipes: Array<{ id: string; name: string; status: string; createdAt: number | null }>;
}

type TabKey = 'profil' | 'jurnal' | 'greutate' | 'planuri' | 'antrenamente' | 'poze' | 'analize' | 'tracking' | 'social' | 'continut';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profil', label: 'Profil' },
  { key: 'jurnal', label: 'Jurnal alimentar' },
  { key: 'greutate', label: 'Greutate & Măsurători' },
  { key: 'planuri', label: 'Planuri & Obiective' },
  { key: 'antrenamente', label: 'Antrenamente' },
  { key: 'poze', label: 'Poze progres' },
  { key: 'analize', label: 'Analize medicale' },
  { key: 'tracking', label: 'Tracking zilnic' },
  { key: 'social', label: 'Coach & Prieteni' },
  { key: 'continut', label: 'Conținut creat' },
];

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Mic dejun', lunch: 'Prânz', dinner: 'Cină', snack: 'Gustare',
};

function fmtDate(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('profil');

  useEffect(() => {
    fetch(`/api/user/${params.uid}/overview`)
      .then(async (res) => {
        if (res.status === 401) { router.push('/login'); return null; }
        if (!res.ok) throw new Error('Eroare la încărcare');
        return res.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.uid, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
        <div className="w-8 h-8 border-2 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data || !data.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
        <div className="text-center">
          <p className="text-[#8892b0] mb-4">{error || 'Utilizator negăsit'}</p>
          <button onClick={() => router.push('/dashboard/users')} className="text-[#64ffda] hover:underline">
            ← Înapoi la utilizatori
          </button>
        </div>
      </div>
    );
  }

  const u = data.user;
  const p = data.profile;

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <header className="sticky top-0 z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/users')} className="text-[#8892b0] hover:text-[#64ffda] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {u.photoURL ? (
              <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#64ffda]/10 flex items-center justify-center text-[#64ffda] font-bold text-sm">
                {(u.displayName || u.email || '?')[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-white font-semibold">{u.displayName || u.email}</span>
              <span className="text-[#8892b0] text-sm ml-3">{u.email}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {u.providers.map((pr) => (
              <span key={pr} className="px-2 py-0.5 rounded text-xs bg-[#233554] text-[#8892b0]">{pr}</span>
            ))}
            {u.disabled && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-400/10 text-red-400 border border-red-400/20">Dezactivat</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#64ffda] text-[#0a192f]'
                  : 'bg-[#172a45] text-[#8892b0] hover:text-white border border-[#233554]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profil' && <ProfilTab data={data} />}
        {tab === 'jurnal' && <JurnalTab diary={data.diary} />}
        {tab === 'greutate' && <GreutateTab data={data} />}
        {tab === 'planuri' && <PlanuriTab data={data} />}
        {tab === 'antrenamente' && <AntrenamenteTab data={data} />}
        {tab === 'poze' && <PozeTab photos={data.progressPhotos} />}
        {tab === 'analize' && <AnalizeTab analyses={data.medicalAnalyses} />}
        {tab === 'tracking' && <TrackingTab tracking={data.dailyTracking} />}
        {tab === 'social' && <SocialTab data={data} />}
        {tab === 'continut' && <ContinutTab data={data} />}
      </main>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-[#172a45] rounded-2xl border border-[#233554] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-[#0a192f] rounded-xl p-3 border border-[#233554]/50">
      <p className="text-[#8892b0] text-xs mb-1">{label}</p>
      <p className="text-white font-medium">{value ?? '—'}</p>
    </div>
  );
}

function Empty({ text = 'Fără date' }: { text?: string }) {
  return <p className="text-[#8892b0] text-sm text-center py-8">{text}</p>;
}

function ProfilTab({ data }: { data: Overview }) {
  const u = data.user!;
  const p = data.profile;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Cont">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Email" value={u.email} />
          <Stat label="Nume" value={u.displayName} />
          <Stat label="Email verificat" value={u.emailVerified ? 'Da' : 'Nu'} />
          <Stat label="Status" value={u.disabled ? 'Dezactivat' : 'Activ'} />
          <Stat label="Înregistrat" value={fmtDateTime(u.createdAt ? Date.parse(u.createdAt) : null)} />
          <Stat label="Ultima autentificare" value={fmtDateTime(u.lastSignIn ? Date.parse(u.lastSignIn) : null)} />
          <Stat label="Provideri" value={u.providers.join(', ')} />
          <Stat label="UID" value={u.uid.slice(0, 12) + '…'} />
        </div>
      </Card>
      <Card title="Profil fizic">
        {p ? (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Gen" value={p.gender} />
            <Stat label="Vârstă" value={p.age} />
            <Stat label="Înălțime" value={p.heightCm ? `${p.heightCm} cm` : null} />
            <Stat label="Greutate curentă" value={p.currentWeightKg ? `${p.currentWeightKg} kg` : null} />
            <Stat label="Greutate țintă" value={p.targetWeightKg ? `${p.targetWeightKg} kg` : null} />
            <Stat label="Nivel activitate" value={p.activityLevel} />
            <Stat label="Obiectiv" value={p.goal} />
            <Stat label="Țintă apă" value={p.waterGoalMl ? `${p.waterGoalMl} ml` : null} />
          </div>
        ) : (
          <Empty text="Profil necompletat" />
        )}
      </Card>
      <Card title="Statistici activitate">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Intrări jurnal" value={data.diary.length} />
          <Stat label="Înregistrări greutate" value={data.weightEntries.length} />
          <Stat label="Sesiuni antrenament" value={data.workoutSessions.length} />
          <Stat label="Poze progres" value={data.progressPhotos.length} />
          <Stat label="Analize medicale" value={data.medicalAnalyses.length} />
          <Stat label="Planuri nutriționale" value={data.plans.length} />
          <Stat label="Rutine" value={data.routines.length} />
          <Stat label="Prieteni" value={data.friends.length} />
        </div>
      </Card>
    </div>
  );
}

function JurnalTab({ diary }: { diary: Overview['diary'] }) {
  const [filterDate, setFilterDate] = useState('');
  const dates = [...new Set(diary.map((d) => d.date).filter(Boolean))].sort().reverse();
  const shown = filterDate ? diary.filter((d) => d.date === filterDate) : diary.slice(0, 100);

  // Grupare pe zi
  const byDate = new Map<string, typeof shown>();
  for (const e of shown) {
    const k = e.date || 'fără dată';
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k)!.push(e);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title={`Jurnal alimentar (${diary.length} intrări)`} action={
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-[#0a192f] text-white text-sm rounded-lg border border-[#233554] px-3 py-1.5"
        >
          <option value="">Toate zilele</option>
          {dates.slice(0, 60).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      }>
        {shown.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-5">
            {[...byDate.entries()].map(([date, entries]) => {
              const totKcal = entries.reduce((s, e) => s + e.energy, 0);
              const totP = entries.reduce((s, e) => s + e.protein, 0);
              const totC = entries.reduce((s, e) => s + e.carbohydrates, 0);
              const totF = entries.reduce((s, e) => s + e.fat, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64ffda] font-medium text-sm">{date}</span>
                    <span className="text-[#8892b0] text-xs">
                      {Math.round(totKcal)} kcal · P {Math.round(totP)}g · C {Math.round(totC)}g · G {Math.round(totF)}g
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {entries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm truncate">{e.ingredientName}{e.recipeName ? ` (${e.recipeName})` : ''}</p>
                          <p className="text-[#8892b0] text-xs">
                            {MEAL_LABELS[e.mealType ?? ''] ?? e.mealType ?? ''} · {e.amount}g
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-amber-400 text-sm font-medium">{Math.round(e.energy)} kcal</p>
                          <p className="text-[#8892b0] text-xs">P{Math.round(e.protein)} C{Math.round(e.carbohydrates)} G{Math.round(e.fat)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function GreutateTab({ data }: { data: Overview }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`Greutate (${data.weightEntries.length})`}>
        {data.weightEntries.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
            {data.weightEntries.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <span className="text-[#8892b0] text-sm">{w.dateKey || fmtDate(w.date)}</span>
                <span className="text-white font-medium">{w.weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={`Măsurători (${data.measurements.length})`}>
        {data.measurements.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {data.measurements.map((m) => (
              <div key={m.id} className="bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <p className="text-[#64ffda] text-xs mb-1">{fmtDate(m.date)}</p>
                <p className="text-white text-sm">
                  {[
                    m.weight && `${m.weight} kg`,
                    m.bodyFatPercentage && `${m.bodyFatPercentage}% grăsime`,
                    m.chest && `piept ${m.chest}`,
                    m.waist && `talie ${m.waist}`,
                    m.hip && `șold ${m.hip}`,
                    m.arm && `braț ${m.arm}`,
                    m.thigh && `coapsă ${m.thigh}`,
                  ].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PlanuriTab({ data }: { data: Overview }) {
  return (
    <div className="flex flex-col gap-4">
      {data.plans.length === 0 && data.calorieTargets.length === 0 && <Card title="Planuri"><Empty text="Fără planuri" /></Card>}
      {data.plans.map((plan) => (
        <Card key={plan.id} title={plan.description || 'Plan alimentar'} action={
          plan.onlyLogging ? <span className="text-xs px-2 py-1 rounded bg-[#233554] text-[#8892b0]">Doar logging</span> : undefined
        }>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label="Calorii" value={plan.goalEnergy ? `${Math.round(plan.goalEnergy)} kcal` : null} />
            <Stat label="Proteine" value={plan.goalProtein ? `${Math.round(plan.goalProtein)} g` : null} />
            <Stat label="Carbohidrați" value={plan.goalCarbohydrates ? `${Math.round(plan.goalCarbohydrates)} g` : null} />
            <Stat label="Grăsimi" value={plan.goalFat ? `${Math.round(plan.goalFat)} g` : null} />
          </div>
          <p className="text-[#8892b0] text-xs mb-3">
            Creat: {fmtDate(plan.creationDate)} · Start: {plan.startDate ?? '—'} · Sfârșit: {plan.endDate ?? 'nedeterminat'}
          </p>
          {plan.meals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.meals.map((m) => (
                <span key={m.id} className="px-3 py-1 rounded-full bg-[#0a192f] border border-[#233554] text-sm text-white">
                  {m.name} <span className="text-[#8892b0]">{m.time}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}
      {data.calorieTargets.length > 0 && (
        <Card title="Calorie targets (istoric)">
          <div className="flex flex-col gap-1.5">
            {data.calorieTargets.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <span className="text-[#8892b0] text-sm">{fmtDate(t.date)}</span>
                <span className="text-white text-sm">{Math.round(t.calorieAmount)} kcal · P{t.proteinAmount} C{t.carbohydrateAmount} G{t.fatAmount}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AntrenamenteTab({ data }: { data: Overview }) {
  return (
    <div className="flex flex-col gap-4">
      <Card title={`Sesiuni antrenament (${data.workoutSessions.length})`}>
        {data.workoutSessions.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
            {data.workoutSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <div>
                  <p className="text-white text-sm">{fmtDate(s.date)}</p>
                  <p className="text-[#8892b0] text-xs">
                    {s.completedAt ? 'Completat' : 'În progres'} · {s.exercises} exerciții
                    {s.durationSeconds ? ` · ${Math.round(s.durationSeconds / 60)} min` : ''}
                  </p>
                </div>
                {s.caloriesBurned != null && (
                  <span className="text-amber-400 text-sm">{Math.round(s.caloriesBurned)} kcal</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      {data.routines.map((r) => (
        <Card key={r.id} title={r.name || 'Rutină'}>
          <p className="text-[#8892b0] text-xs mb-3">
            {r.description} · {r.frequency} · {r.goal}
          </p>
          {r.days.map((d) => (
            <div key={d.id} className="mb-3">
              <p className="text-[#64ffda] text-sm font-medium mb-1">{d.name}</p>
              <div className="flex flex-col gap-1">
                {d.exercises.map((e) => (
                  <div key={e.id} className="flex justify-between bg-[#0a192f] rounded px-3 py-1.5 text-sm border border-[#233554]/50">
                    <span className="text-white">{e.nameRo || e.nameEn}</span>
                    <span className="text-[#8892b0]">{e.sets}×{e.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function PozeTab({ photos }: { photos: Overview['progressPhotos'] }) {
  return (
    <Card title={`Poze progres (${photos.length})`}>
      {photos.length === 0 ? <Empty /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((ph) => (
            <div key={ph.id} className="bg-[#0a192f] rounded-xl overflow-hidden border border-[#233554]/50">
              {ph.url ? (
                <a href={ph.url} target="_blank" rel="noreferrer">
                  <img src={ph.url} alt="" className="w-full aspect-square object-cover" />
                </a>
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-[#8892b0] text-xs">Indisponibilă</div>
              )}
              <div className="p-2">
                <p className="text-[#8892b0] text-xs">{fmtDate(ph.date)}</p>
                {ph.note && <p className="text-white text-xs mt-0.5">{ph.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AnalizeTab({ analyses }: { analyses: Overview['medicalAnalyses'] }) {
  return (
    <Card title={`Analize medicale (${analyses.length})`}>
      {analyses.length === 0 ? <Empty /> : (
        <div className="flex flex-col gap-3">
          {analyses.map((a) => (
            <div key={a.id} className="bg-[#0a192f] rounded-xl p-4 border border-[#233554]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#64ffda] text-sm">{fmtDateTime(a.createdAt)}</span>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-[#64ffda] text-xs hover:underline">
                    Vezi imagine →
                  </a>
                )}
              </div>
              {a.resultRaw ? (
                <pre className="text-[#8892b0] text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">{a.resultRaw}</pre>
              ) : (
                <p className="text-[#8892b0] text-xs">Fără rezultat</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TrackingTab({ tracking }: { tracking: Overview['dailyTracking'] }) {
  return (
    <Card title={`Tracking zilnic (${tracking.length} zile)`}>
      {tracking.length === 0 ? <Empty /> : (
        <div className="flex flex-col gap-1.5">
          {tracking.map((t) => (
            <div key={t.dateKey} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
              <span className="text-[#8892b0] text-sm">{t.dateKey}</span>
              <div className="flex items-center gap-4 text-sm">
                {t.waterCups != null && <span className="text-cyan-400">{t.waterCups} pahare apă</span>}
                {t.consumedSupplements && t.consumedSupplements.length > 0 && (
                  <span className="text-emerald-400">{t.consumedSupplements.length} suplimente</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SocialTab({ data }: { data: Overview }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`Coach (${data.coachLinks.length})`}>
        {data.coachLinks.length === 0 ? <Empty text="Fără coach asociat" /> : (
          <div className="flex flex-col gap-1.5">
            {data.coachLinks.map((c) => (
              <div key={c.coachUid} className="bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <p className="text-white text-sm">{c.coachDisplayName || c.coachEmail}</p>
                <p className="text-[#8892b0] text-xs">{c.coachEmail} · {c.status} · {fmtDate(c.linkedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={`Prieteni (${data.friends.length})`}>
        {data.friends.length === 0 ? <Empty text="Fără prieteni" /> : (
          <div className="flex flex-col gap-1.5">
            {data.friends.map((f) => (
              <div key={f.friendUid} className="bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <p className="text-white text-sm">{f.friendDisplayName || f.friendEmail || f.friendUid}</p>
                {f.friendEmail && <p className="text-[#8892b0] text-xs">{f.friendEmail}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ContinutTab({ data }: { data: Overview }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`Ingrediente create (${data.userIngredients.length})`}>
        {data.userIngredients.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
            {data.userIngredients.map((i) => (
              <div key={i.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <span className="text-white text-sm">{i.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  i.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400' :
                  i.status === 'rejected' ? 'bg-red-400/10 text-red-400' :
                  'bg-amber-400/10 text-amber-400'
                }`}>{i.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={`Rețete create (${data.userRecipes.length})`}>
        {data.userRecipes.length === 0 ? <Empty /> : (
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
            {data.userRecipes.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-[#0a192f] rounded-lg px-3 py-2 border border-[#233554]/50">
                <span className="text-white text-sm">{r.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  r.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400' :
                  r.status === 'rejected' ? 'bg-red-400/10 text-red-400' :
                  'bg-amber-400/10 text-amber-400'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
