'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RecipeIngredient {
  ingredientName: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalWeight: number | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  ingredients: RecipeIngredient[];
  userId: string;
  createdAt: string;
}

interface UserInfo {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Recipe | null>(null);

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

    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setRecipes(data);
          data.forEach((r: Recipe) => fetchUser(r.userId));
        }
      })
      .catch((err) => console.error('Failed to fetch recipes:', err))
      .finally(() => setLoading(false));
  }, [router, fetchUser]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setRecipes(recipes.filter((r) => r.id !== id));
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
      const res = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, action: 'edit', edits }),
      });
      if (res.ok) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editItem.id ? { ...r, ...edits as Partial<Recipe> } : r
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
          <h1 className="text-white font-semibold">Revizuire Rețete</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Rețete în așteptare</h2>
            <p className="text-[#8892b0] text-sm mt-1">
              {recipes.length > 0 ? `${recipes.length} rețete de revizuit` : 'Nu sunt rețete în așteptare'}
            </p>
          </div>
          {recipes.length > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {recipes.length} pending
            </span>
          )}
        </div>

        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#172a45] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#8892b0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-[#8892b0]">Nu sunt rețete în așteptare pentru revizuire</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => {
              const user = userCache[recipe.userId];
              return (
                <div
                  key={recipe.id}
                  className="bg-[#172a45] rounded-2xl border border-[#233554] overflow-hidden hover:border-[#64ffda]/20 transition-colors"
                >
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">{recipe.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8892b0]">
                          <span className="flex items-center gap-1.5">
                            {user?.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#64ffda]/20 flex items-center justify-center text-[8px] text-[#64ffda] font-bold">
                                {(user?.email || recipe.userId)[0]?.toUpperCase()}
                              </div>
                            )}
                            {user?.email || recipe.userId.slice(0, 12) + '...'}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(recipe.createdAt).toLocaleDateString('ro-RO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {recipe.servings} porții
                          </span>
                          {recipe.prepTime > 0 && <span>Prep: {recipe.prepTime}min</span>}
                          {recipe.cookTime > 0 && <span>Gătire: {recipe.cookTime}min</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Calorii totale', value: Math.round(recipe.totalCalories), unit: 'kcal', color: 'text-[#64ffda]' },
                        { label: 'Proteine', value: recipe.totalProtein, unit: 'g', color: 'text-blue-400' },
                        { label: 'Carbohidrați', value: recipe.totalCarbs, unit: 'g', color: 'text-amber-400' },
                        { label: 'Grăsimi', value: recipe.totalFat, unit: 'g', color: 'text-red-400' },
                      ].map((m) => (
                        <div key={m.label} className="bg-[#0a192f] rounded-xl p-3 text-center">
                          <p className={`text-lg font-bold ${m.color}`}>{Math.round(m.value)}{m.unit}</p>
                          <p className="text-[#8892b0] text-xs mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[#8892b0] text-xs">
                        Per porție: <span className="text-[#64ffda] font-medium">{Math.round(recipe.caloriesPerServing)} kcal</span>
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-3">
                    <button
                      onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                      className="w-full flex items-center justify-between py-2 text-sm text-[#8892b0] hover:text-[#64ffda] transition-colors"
                    >
                      <span>{recipe.ingredients.length} ingrediente</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedId === recipe.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedId === recipe.id && (
                      <div className="pb-2 space-y-1.5">
                        {recipe.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-[#0a192f] rounded-lg px-3 py-2">
                            <span className="text-white">{ing.ingredientName}</span>
                            <span className="text-[#8892b0]">{ing.amount}{ing.unit === 'grame' ? 'g' : 'ml'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 px-5 pb-5">
                    <button
                      onClick={() => handleAction(recipe.id, 'approve')}
                      disabled={actionLoading === recipe.id}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobă
                    </button>
                    <button
                      onClick={() => setEditItem(recipe)}
                      disabled={actionLoading === recipe.id}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editează
                    </button>
                    <button
                      onClick={() => handleAction(recipe.id, 'reject')}
                      disabled={actionLoading === recipe.id}
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
        <EditRecipeModal
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
          saving={actionLoading === editItem.id}
        />
      )}
    </div>
  );
}

function EditRecipeModal({
  item,
  onSave,
  onClose,
  saving,
}: {
  item: Recipe;
  onSave: (edits: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: item.name,
    servings: String(item.servings),
    prepTime: String(item.prepTime),
    cookTime: String(item.cookTime),
    totalWeight: item.totalWeight ? String(item.totalWeight) : '',
  });

  const handleSave = () => {
    const edits: Record<string, unknown> = {
      name: form.name,
      servings: form.servings,
      prepTime: form.prepTime,
      cookTime: form.cookTime,
    };
    if (form.totalWeight) edits.totalWeight = form.totalWeight;
    onSave(edits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#172a45] rounded-2xl border border-[#233554] max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#172a45] border-b border-[#233554] px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">Editează rețetă</h3>
          <button onClick={onClose} className="text-[#8892b0] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[#8892b0] text-xs mb-1">Nume rețetă *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#8892b0] text-xs mb-1">Porții *</label>
              <input
                type="text"
                value={form.servings}
                onChange={(e) => setForm({ ...form, servings: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[#8892b0] text-xs mb-1">Gramaj total (g)</label>
              <input
                type="text"
                value={form.totalWeight}
                onChange={(e) => setForm({ ...form, totalWeight: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                placeholder="opțional"
              />
            </div>
            <div>
              <label className="block text-[#8892b0] text-xs mb-1">Timp preparare (min)</label>
              <input
                type="text"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[#8892b0] text-xs mb-1">Timp gătire (min)</label>
              <input
                type="text"
                value={form.cookTime}
                onChange={(e) => setForm({ ...form, cookTime: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a192f] text-white rounded-lg border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="bg-[#0a192f] rounded-xl p-4 border border-[#233554]">
            <p className="text-[#8892b0] text-xs mb-2">Ingrediente (read-only)</p>
            <div className="space-y-1.5">
              {item.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-white">{ing.ingredientName}</span>
                  <span className="text-[#8892b0]">{ing.amount}{ing.unit === 'grame' ? 'g' : 'ml'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a192f] rounded-xl p-4 border border-[#233554]">
            <p className="text-[#8892b0] text-xs mb-2">Valori nutriționale (recalculare automată la schimbarea porțiilor)</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[#64ffda] font-bold text-sm">{Math.round(item.totalCalories)}</p>
                <p className="text-[#8892b0] text-xs">kcal total</p>
              </div>
              <div>
                <p className="text-blue-400 font-bold text-sm">{Math.round(item.totalProtein)}g</p>
                <p className="text-[#8892b0] text-xs">proteine</p>
              </div>
              <div>
                <p className="text-amber-400 font-bold text-sm">{Math.round(item.totalCarbs)}g</p>
                <p className="text-[#8892b0] text-xs">carbs</p>
              </div>
              <div>
                <p className="text-red-400 font-bold text-sm">{Math.round(item.totalFat)}g</p>
                <p className="text-[#8892b0] text-xs">grăsimi</p>
              </div>
            </div>
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
