'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number | null;
  sugar: number | null;
  fiber: number | null;
  salt: number | null;
  unit: string;
  portionSize: number | null;
  description: string | null;
  userId: string;
  createdAt: string;
}

interface UserInfo {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const [editItem, setEditItem] = useState<Ingredient | null>(null);

  const fetchUser = useCallback(async (uid: string) => {
    if (userCache[uid] || !uid) return;
    try {
      const res = await fetch(`/api/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserCache((prev) => ({ ...prev, [uid]: data }));
      }
    } catch (e) {
      console.error('Failed to fetch user:', e);
    }
  }, [userCache]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetch('/api/ingredients')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setIngredients(data);
          data.forEach((ing: Ingredient) => fetchUser(ing.userId));
        }
      })
      .catch((err) => console.error('Failed to fetch ingredients:', err))
      .finally(() => setLoading(false));
  }, [router, fetchUser]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setIngredients(ingredients.filter((ing) => ing.id !== id));
      }
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (edits: Record<string, unknown>) => {
    if (!editItem) return;
    setActionLoading(editItem.id);
    try {
      const res = await fetch(`/api/ingredients/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', edits }),
      });
      if (res.ok) {
        setIngredients((prev) =>
          prev.map((ing) =>
            ing.id === editItem.id
              ? { ...ing, ...edits as Partial<Ingredient> }
              : ing
          )
        );
        setEditItem(null);
      }
    } catch (err) {
      console.error('Failed to edit:', err);
    } finally {
      setActionLoading(null);
    }
  };

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
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#8892b0] hover:text-[#64ffda] text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Panou
          </button>
          <h1 className="text-white font-semibold">Revizuire Alimente</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Alimente în așteptare</h2>
            <p className="text-[#8892b0] text-sm mt-1">
              {ingredients.length > 0 ? `${ingredients.length} alimente de revizuit` : 'Nu sunt alimente în așteptare'}
            </p>
          </div>
          {ingredients.length > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {ingredients.length} pending
            </span>
          )}
        </div>

        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#172a45] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#8892b0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[#8892b0]">Nu sunt alimente în așteptare pentru revizuire</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ingredients.map((ingredient) => {
              const user = userCache[ingredient.userId];
              return (
                <div
                  key={ingredient.id}
                  className="bg-[#172a45] rounded-2xl border border-[#233554] overflow-hidden hover:border-[#64ffda]/20 transition-colors"
                >
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">{ingredient.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8892b0]">
                          <span className="flex items-center gap-1.5">
                            {user?.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#64ffda]/20 flex items-center justify-center text-[8px] text-[#64ffda] font-bold">
                                {(user?.email || ingredient.userId)[0]?.toUpperCase()}
                              </div>
                            )}
                            {user?.email || ingredient.userId.slice(0, 12) + '...'}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(ingredient.createdAt).toLocaleDateString('ro-RO')}
                          </span>
                        </div>
                        {ingredient.description && (
                          <p className="text-[#8892b0] text-sm mt-2 line-clamp-2">{ingredient.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#0a192f] text-[#8892b0] text-xs font-medium border border-[#233554]">
                        / 100{ingredient.unit === 'grame' ? 'g' : 'ml'}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Calorii', value: ingredient.calories, unit: 'kcal', color: 'text-[#64ffda]' },
                        { label: 'Proteine', value: ingredient.protein, unit: 'g', color: 'text-blue-400' },
                        { label: 'Carbohidrați', value: ingredient.carbs, unit: 'g', color: 'text-amber-400' },
                        { label: 'Grăsimi', value: ingredient.fat, unit: 'g', color: 'text-red-400' },
                      ].map((m) => (
                        <div key={m.label} className="bg-[#0a192f] rounded-xl p-3 text-center">
                          <p className={`text-lg font-bold ${m.color}`}>{m.value}{m.unit}</p>
                          <p className="text-[#8892b0] text-xs mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    {(ingredient.fiber || ingredient.sugar || ingredient.saturatedFat || ingredient.salt) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {ingredient.saturatedFat != null && <span className="text-xs px-2 py-1 rounded-lg bg-[#0a192f] text-[#8892b0]">Grăsimi sat: {ingredient.saturatedFat}g</span>}
                        {ingredient.sugar != null && <span className="text-xs px-2 py-1 rounded-lg bg-[#0a192f] text-[#8892b0]">Zahăr: {ingredient.sugar}g</span>}
                        {ingredient.fiber != null && <span className="text-xs px-2 py-1 rounded-lg bg-[#0a192f] text-[#8892b0]">Fibre: {ingredient.fiber}g</span>}
                        {ingredient.salt != null && <span className="text-xs px-2 py-1 rounded-lg bg-[#0a192f] text-[#8892b0]">Sare: {ingredient.salt}mg</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 px-5 pb-5">
                    <button
                      onClick={() => handleAction(ingredient.id, 'approve')}
                      disabled={actionLoading === ingredient.id}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobă
                    </button>
                    <button
                      onClick={() => setEditItem(ingredient)}
                      disabled={actionLoading === ingredient.id}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editează
                    </button>
                    <button
                      onClick={() => handleAction(ingredient.id, 'reject')}
                      disabled={actionLoading === ingredient.id}
                      className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Respinge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editItem && (
        <EditModal
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
          saving={actionLoading === editItem.id}
        />
      )}
    </div>
  );
}

function EditModal({
  item,
  onSave,
  onClose,
  saving,
}: {
  item: Ingredient;
  onSave: (edits: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: item.name,
    calories: String(item.calories),
    protein: String(item.protein),
    carbs: String(item.carbs),
    fat: String(item.fat),
    saturatedFat: item.saturatedFat ? String(item.saturatedFat) : '',
    sugar: item.sugar ? String(item.sugar) : '',
    fiber: item.fiber ? String(item.fiber) : '',
    salt: item.salt ? String(item.salt) : '',
    unit: item.unit,
    portionSize: item.portionSize ? String(item.portionSize) : '',
    description: item.description || '',
  });

  const handleSave = () => {
    const edits: Record<string, unknown> = {
      name: form.name,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      unit: form.unit,
      description: form.description,
    };
    if (form.saturatedFat) edits.saturatedFat = form.saturatedFat;
    if (form.sugar) edits.sugar = form.sugar;
    if (form.fiber) edits.fiber = form.fiber;
    if (form.salt) edits.salt = form.salt;
    if (form.portionSize) edits.portionSize = form.portionSize;
    onSave(edits);
  };

  const field = (label: string, key: keyof typeof form, suffix?: string) => (
    <div>
      <label className="block text-[#8892b0] text-xs mb-1">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
        placeholder={suffix}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#172a45] rounded-2xl border border-[#233554] max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#172a45] border-b border-[#233554] px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">Editează aliment</h3>
          <button onClick={onClose} className="text-[#8892b0] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {field('Nume aliment *', 'name')}
          <div>
            <label className="block text-[#8892b0] text-xs mb-1">Unitate</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
            >
              <option value="grame">Grame</option>
              <option value="mililitri">Mililitri</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Calorii (kcal) *', 'calories')}
            {field('Proteine (g) *', 'protein')}
            {field('Carbohidrați (g) *', 'carbs')}
            {field('Grăsimi (g) *', 'fat')}
            {field('Grăsimi saturate (g)', 'saturatedFat')}
            {field('Zahăr (g)', 'sugar')}
            {field('Fibre (g)', 'fiber')}
            {field('Sare (mg)', 'salt')}
            {field('Gramaj porție (g)', 'portionSize')}
          </div>
          <div>
            <label className="block text-[#8892b0] text-xs mb-1">Descriere</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#172a45] border-t border-[#233554] px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#0a192f] text-[#8892b0] font-medium text-sm border border-[#233554] hover:bg-[#0a192f]/80 transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#64ffda] text-[#0a192f] font-semibold text-sm hover:bg-[#64ffda]/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </div>
    </div>
  );
}
