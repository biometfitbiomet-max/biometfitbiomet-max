'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Recipe {
  id: string;
  name: string;
  imageUrl: string | null;
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
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  status: string;
  isPublic: boolean;
  userId: string;
  createdAt: string | null;
}

export default function AllRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRecipes = useCallback(
    async (pageNum: number, searchTerm: string, cursor: string | null, status: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('pageSize', String(pageSize));
        if (searchTerm) params.set('search', searchTerm);
        if (cursor) params.set('cursor', cursor);
        if (status) params.set('status', status);

        const res = await fetch(`/api/recipes/all?${params.toString()}`);
        const data = await res.json();

        if (data.error) {
          console.error(data.error);
          return;
        }

        setRecipes(data.recipes);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        if (data.totalCount !== null) setTotalCount(data.totalCount);
      } catch (err) {
        console.error('Failed to fetch recipes:', err);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRecipes(1, '', null, '');
  }, [router, fetchRecipes]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
    setNextCursor(null);
    fetchRecipes(1, searchInput, null, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setSearch('');
    setSearchInput('');
    setPage(1);
    setNextCursor(null);
    fetchRecipes(1, '', null, status);
  };

  const handleNextPage = () => {
    if (!hasMore || !nextCursor) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(nextPage, search, nextCursor, statusFilter);
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    setPage(1);
    fetchRecipes(1, search, null, statusFilter);
  };

  const openEdit = (recipe: Recipe) => {
    setEditing(recipe);
    setEditForm({
      name: recipe.name,
      servings: String(recipe.servings),
      prepTime: String(recipe.prepTime),
      cookTime: String(recipe.cookTime),
      totalWeight: recipe.totalWeight ? String(recipe.totalWeight) : '',
      imageUrl: recipe.imageUrl || '',
    });
    setEditMessage(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setEditMessage(null);
    try {
      const edits: Record<string, unknown> = {};
      if (editForm.name !== editing.name) edits.name = editForm.name;
      if (Number(editForm.servings) !== editing.servings) edits.servings = editForm.servings;
      if (Number(editForm.prepTime) !== editing.prepTime) edits.prepTime = editForm.prepTime;
      if (Number(editForm.cookTime) !== editing.cookTime) edits.cookTime = editForm.cookTime;
      if (editForm.totalWeight !== (editing.totalWeight ? String(editing.totalWeight) : '')) edits.totalWeight = editForm.totalWeight;
      if (editForm.imageUrl !== (editing.imageUrl || '')) edits.imageUrl = editForm.imageUrl;

      if (Object.keys(edits).length === 0) {
        setEditMessage('Nu sunt modificări');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/recipes/${editing.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      });

      if (res.ok) {
        setEditMessage('Salvat cu succes!');
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editing.id
              ? {
                  ...r,
                  name: editForm.name,
                  servings: Number(editForm.servings),
                  prepTime: Number(editForm.prepTime),
                  cookTime: Number(editForm.cookTime),
                  totalWeight: editForm.totalWeight ? Number(editForm.totalWeight) : null,
                  imageUrl: editForm.imageUrl || null,
                }
              : r
          )
        );
        setTimeout(() => {
          setEditing(null);
          setEditMessage(null);
        }, 1000);
      } else {
        const data = await res.json();
        setEditMessage(data.error || 'Eroare la salvare');
      }
    } catch {
      setEditMessage('Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10',
    approved: 'text-emerald-400 bg-emerald-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  };

  const statusLabels: Record<string, string> = {
    pending: 'În așteptare',
    approved: 'Aprobat',
    rejected: 'Respins',
  };

  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#8892b0] hover:text-[#64ffda] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Înapoi
            </button>
            <span className="text-white font-semibold text-lg">Toate Rețetele</span>
            {totalCount !== null && (
              <span className="text-[#8892b0] text-sm">({totalCount} total)</span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Caută rețetă (min. 2 caractere)..."
            className="flex-1 min-w-[200px] bg-[#172a45] text-white rounded-xl px-4 py-2.5 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
          />
          <button
            onClick={handleSearch}
            className="bg-[#64ffda] text-[#0a192f] font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-[#64ffda]/90 transition-colors"
          >
            Caută
          </button>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="bg-[#172a45] text-white rounded-xl px-4 py-2.5 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
          >
            <option value="">Toate statusurile</option>
            <option value="pending">În așteptare</option>
            <option value="approved">Aprobate</option>
            <option value="rejected">Respise</option>
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setStatusFilter('');
                setPage(1);
                fetchRecipes(1, '', null, '');
              }}
              className="text-[#8892b0] hover:text-white rounded-xl px-4 py-2.5 text-sm border border-[#233554] hover:border-[#64ffda]/40 transition-colors"
            >
              Resetează
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#64ffda] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 text-[#8892b0]">Nu s-au găsit rețete</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#233554]">
              <table className="w-full text-sm">
                <thead className="bg-[#172a45] text-[#8892b0]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nume</th>
                    <th className="text-center px-4 py-3 font-medium">Imagine</th>
                    <th className="text-right px-4 py-3 font-medium">Porții</th>
                    <th className="text-right px-4 py-3 font-medium">Kcal/porție</th>
                    <th className="text-right px-4 py-3 font-medium">Prot/porție</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233554]">
                  {recipes.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-[#172a45]/50 transition-colors">
                      <td className="px-4 py-3 text-white">
                        {recipe.name}
                        <div className="text-[#8892b0] text-xs mt-0.5">
                          {recipe.ingredients?.length || 0} ingrediente
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            className="w-10 h-10 rounded-lg object-cover inline-block"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[#8892b0]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-white">{recipe.servings}</td>
                      <td className="px-4 py-3 text-right text-white">
                        {Math.round(recipe.caloriesPerServing)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#8892b0]">
                        {Math.round(recipe.proteinPerServing)}g
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[recipe.status] || 'text-gray-400 bg-gray-400/10'}`}
                        >
                          {statusLabels[recipe.status] || recipe.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEdit(recipe)}
                          className="text-[#64ffda] hover:text-[#64ffda]/80 text-xs font-medium"
                        >
                          Editează
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-[#8892b0] text-sm">
                Pagina {page} · {recipes.length} rezultate
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg text-sm border border-[#233554] text-[#8892b0] hover:text-white hover:border-[#64ffda]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="px-4 py-2 rounded-lg text-sm border border-[#233554] text-[#8892b0] hover:text-white hover:border-[#64ffda]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Următor
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-[#172a45] rounded-2xl border border-[#233554] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Editează rețetă</h2>
              <button
                onClick={() => !saving && setEditing(null)}
                className="text-[#8892b0] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editMessage && (
              <div
                className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                  editMessage.includes('succes')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {editMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Nume</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8892b0] text-xs mb-1">Porții</label>
                  <input
                    type="number"
                    value={editForm.servings || ''}
                    onChange={(e) => setEditForm({ ...editForm, servings: e.target.value })}
                    className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#8892b0] text-xs mb-1">Timp prep (min)</label>
                  <input
                    type="number"
                    value={editForm.prepTime || ''}
                    onChange={(e) => setEditForm({ ...editForm, prepTime: e.target.value })}
                    className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#8892b0] text-xs mb-1">Timp gătire (min)</label>
                  <input
                    type="number"
                    value={editForm.cookTime || ''}
                    onChange={(e) => setEditForm({ ...editForm, cookTime: e.target.value })}
                    className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Greutate totală (g)</label>
                <input
                  type="number"
                  value={editForm.totalWeight || ''}
                  onChange={(e) => setEditForm({ ...editForm, totalWeight: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">URL Imagine</label>
                <input
                  type="text"
                  value={editForm.imageUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>

              {/* Nutrition info (read-only) */}
              <div className="bg-[#0a192f] rounded-lg p-3 border border-[#233554]">
                <p className="text-[#8892b0] text-xs mb-2">Valori nutriționale (per porție)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-white font-bold text-sm">{Math.round(editing.caloriesPerServing)}</p>
                    <p className="text-[#8892b0] text-xs">Kcal</p>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{Math.round(editing.proteinPerServing)}g</p>
                    <p className="text-[#8892b0] text-xs">Prot</p>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{Math.round(editing.carbsPerServing)}g</p>
                    <p className="text-[#8892b0] text-xs">Carb</p>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{Math.round(editing.fatPerServing)}g</p>
                    <p className="text-[#8892b0] text-xs">Grăs</p>
                  </div>
                </div>
                <p className="text-[#8892b0] text-xs mt-2 text-center">
                  * Se recalculează automat la schimbarea porțiilor
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-[#233554] text-[#8892b0] hover:text-white text-sm font-medium transition-colors"
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
      )}
    </div>
  );
}
