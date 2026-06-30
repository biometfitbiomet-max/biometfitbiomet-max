'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Exercise {
  docId: string;
  id: number;
  nameRo: string;
  nameEn: string;
  description: string;
  instructions: string[];
  category: string;
  muscles: string[];
  musclesSecondary: string[];
  equipment: string[];
  difficulty: string;
}

const CATEGORIES = ['Piept', 'Spate', 'Picioare', 'Umeri', 'Bicepși', 'Tricepși', 'Abdomen'];
const DIFFICULTIES = ['Începător', 'Intermediar', 'Avansat'];

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchExercises();
  }, [router]);

  const fetchExercises = async () => {
    try {
      const res = await fetch('/api/exercises');
      const data = await res.json();
      if (!data.error) setExercises(data);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (exercise: Partial<Exercise>) => {
    try {
      if (editing) {
        await fetch(`/api/exercises/${editing.docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exercise),
        });
      } else {
        await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exercise),
        });
      }
      setEditing(null);
      setShowForm(false);
      fetchExercises();
    } catch (err) {
      console.error('Failed to save exercise:', err);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Sigur vrei să ștergi acest exercițiu?')) return;
    try {
      await fetch(`/api/exercises/${docId}`, { method: 'DELETE' });
      fetchExercises();
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const filtered = exercises.filter(
    (e) =>
      e.nameRo.toLowerCase().includes(search.toLowerCase()) ||
      e.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8892b0] text-sm">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <header className="sticky top-0 z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-[#233554]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-semibold text-lg">Exerciții</span>
            <span className="text-[#8892b0] text-sm">({exercises.length})</span>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#64ffda]/10 text-[#64ffda] hover:bg-[#64ffda]/20 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Exercițiu nou
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Caută exercițiu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#172a45] border border-[#233554] text-white placeholder-[#8892b0] focus:outline-none focus:border-[#64ffda]/40 transition-colors"
          />
        </div>

        {/* Form */}
        {showForm && (
          <ExerciseForm
            exercise={editing}
            onSave={handleSave}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
          />
        )}

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((exercise) => (
            <div
              key={exercise.docId}
              className="bg-[#172a45] rounded-2xl p-5 border border-[#233554] hover:border-[#64ffda]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{exercise.nameRo}</h3>
                  <p className="text-[#8892b0] text-sm">{exercise.nameEn}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(exercise);
                      setShowForm(true);
                    }}
                    className="p-2 rounded-lg bg-[#64ffda]/10 text-[#64ffda] hover:bg-[#64ffda]/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(exercise.docId)}
                    className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 rounded-md bg-[#64ffda]/10 text-[#64ffda] text-xs font-medium">
                  {exercise.category}
                </span>
                <span className="px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 text-xs font-medium">
                  {exercise.difficulty}
                </span>
                {exercise.muscles.map((m) => (
                  <span key={m} className="px-2 py-1 rounded-md bg-[#233554] text-[#8892b0] text-xs">
                    {m}
                  </span>
                ))}
              </div>

              <p className="text-[#8892b0] text-sm line-clamp-2">{exercise.description}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#8892b0] text-lg">Nu s-au găsit exerciții</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ExerciseForm({
  exercise,
  onSave,
  onCancel,
}: {
  exercise: Exercise | null;
  onSave: (data: Partial<Exercise>) => void;
  onCancel: () => void;
}) {
  const [nameRo, setNameRo] = useState(exercise?.nameRo || '');
  const [nameEn, setNameEn] = useState(exercise?.nameEn || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [instructions, setInstructions] = useState(exercise?.instructions.join('\n') || '');
  const [category, setCategory] = useState(exercise?.category || CATEGORIES[0]);
  const [muscles, setMuscles] = useState(exercise?.muscles.join(', ') || '');
  const [musclesSecondary, setMusclesSecondary] = useState(exercise?.musclesSecondary.join(', ') || '');
  const [equipment, setEquipment] = useState(exercise?.equipment.join(', ') || '');
  const [difficulty, setDifficulty] = useState(exercise?.difficulty || DIFFICULTIES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: exercise?.id,
      nameRo,
      nameEn,
      description,
      instructions: instructions.split('\n').filter((s) => s.trim()),
      category,
      muscles: muscles.split(',').map((s) => s.trim()).filter(Boolean),
      musclesSecondary: musclesSecondary.split(',').map((s) => s.trim()).filter(Boolean),
      equipment: equipment.split(',').map((s) => s.trim()).filter(Boolean),
      difficulty,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-[#172a45] rounded-2xl p-6 border border-[#64ffda]/20">
      <h2 className="text-white font-semibold text-lg mb-4">
        {exercise ? 'Editează exercițiu' : 'Exercițiu nou'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Nume (RO)</label>
          <input
            type="text"
            value={nameRo}
            onChange={(e) => setNameRo(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          />
        </div>
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Nume (EN)</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[#8892b0] text-sm mb-1">Descriere</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[#8892b0] text-sm mb-1">Instrucțiuni (una pe linie)</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Categorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Dificultate</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Echipament (virgulă)</label>
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Mușchi primari (virgulă)</label>
          <input
            type="text"
            value={muscles}
            onChange={(e) => setMuscles(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          />
        </div>
        <div>
          <label className="block text-[#8892b0] text-sm mb-1">Mușchi secundari (virgulă)</label>
          <input
            type="text"
            value={musclesSecondary}
            onChange={(e) => setMusclesSecondary(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#233554] text-white focus:outline-none focus:border-[#64ffda]/40"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-[#64ffda] text-[#0a192f] font-medium hover:bg-[#64ffda]/90 transition-colors"
        >
          Salvează
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-[#233554] text-[#8892b0] font-medium hover:bg-[#233554]/80 transition-colors"
        >
          Anulează
        </button>
      </div>
    </form>
  );
}
