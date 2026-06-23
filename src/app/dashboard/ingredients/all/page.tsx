'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  energy: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  saturatedFat: number | null;
  sodium: number | null;
  nutriscore: string | null;
  isVegan: boolean | null;
  isVegetarian: boolean | null;
  imageUrl: string | null;
  barcode: string | null;
  status: string;
  createdBy: string;
  createdAt: string | null;
}

export default function AllIngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const fetchIngredients = useCallback(
    async (pageNum: number, searchTerm: string, cursor: string | null) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('pageSize', String(pageSize));
        if (searchTerm) params.set('search', searchTerm);
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/ingredients/all?${params.toString()}`);
        const data = await res.json();

        if (data.error) {
          console.error(data.error);
          return;
        }

        setIngredients(data.ingredients);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        if (data.totalCount !== null) setTotalCount(data.totalCount);
      } catch (err) {
        console.error('Failed to fetch ingredients:', err);
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
    fetchIngredients(1, '', null);
  }, [router, fetchIngredients]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
    setNextCursor(null);
    fetchIngredients(1, searchInput, null);
  };

  const handleNextPage = () => {
    if (!hasMore || !nextCursor) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchIngredients(nextPage, search, nextCursor);
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const prevPage = page - 1;
    setPage(prevPage);
    // For prev page we need to refetch from scratch (cursor pagination limitation)
    // Simple approach: refetch from page 1 and advance — or just go to page 1
    if (prevPage === 1) {
      fetchIngredients(1, search, null);
    } else {
      // Cursor-based doesn't support going back easily — reload from start
      fetchIngredients(1, search, null);
      setPage(1);
    }
  };

  const openEdit = (ing: Ingredient) => {
    setEditing(ing);
    setEditForm({
      name: ing.name,
      category: ing.category,
      energy: String(ing.energy),
      protein: String(ing.protein),
      carbohydrates: String(ing.carbohydrates),
      fat: String(ing.fat),
      fiber: ing.fiber ? String(ing.fiber) : '',
      sugar: ing.sugar ? String(ing.sugar) : '',
      saturatedFat: ing.saturatedFat ? String(ing.saturatedFat) : '',
      sodium: ing.sodium ? String(ing.sodium) : '',
      nutriscore: ing.nutriscore || '',
      imageUrl: ing.imageUrl || '',
      barcode: ing.barcode || '',
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
      if (editForm.category !== editing.category) edits.category = editForm.category;
      if (Number(editForm.energy) !== editing.energy) edits.energy = editForm.energy;
      if (Number(editForm.protein) !== editing.protein) edits.protein = editForm.protein;
      if (Number(editForm.carbohydrates) !== editing.carbohydrates) edits.carbohydrates = editForm.carbohydrates;
      if (Number(editForm.fat) !== editing.fat) edits.fat = editForm.fat;
      if (editForm.fiber !== (editing.fiber ? String(editing.fiber) : '')) edits.fiber = editForm.fiber;
      if (editForm.sugar !== (editing.sugar ? String(editing.sugar) : '')) edits.sugar = editForm.sugar;
      if (editForm.saturatedFat !== (editing.saturatedFat ? String(editing.saturatedFat) : '')) edits.saturatedFat = editForm.saturatedFat;
      if (editForm.sodium !== (editing.sodium ? String(editing.sodium) : '')) edits.sodium = editForm.sodium;
      if (editForm.nutriscore !== (editing.nutriscore || '')) edits.nutriscore = editForm.nutriscore;
      if (editForm.imageUrl !== (editing.imageUrl || '')) edits.imageUrl = editForm.imageUrl;
      if (editForm.barcode !== (editing.barcode || '')) edits.barcode = editForm.barcode;

      if (Object.keys(edits).length === 0) {
        setEditMessage('Nu sunt modificări');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/ingredients/${editing.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      });

      if (res.ok) {
        setEditMessage('Salvat cu succes!');
        // Update local state
        setIngredients((prev) =>
          prev.map((ing) =>
            ing.id === editing.id
              ? {
                  ...ing,
                  name: editForm.name,
                  category: editForm.category,
                  energy: Number(editForm.energy),
                  protein: Number(editForm.protein),
                  carbohydrates: Number(editForm.carbohydrates),
                  fat: Number(editForm.fat),
                  fiber: editForm.fiber ? Number(editForm.fiber) : null,
                  sugar: editForm.sugar ? Number(editForm.sugar) : null,
                  saturatedFat: editForm.saturatedFat ? Number(editForm.saturatedFat) : null,
                  sodium: editForm.sodium ? Number(editForm.sodium) : null,
                  nutriscore: editForm.nutriscore || null,
                  imageUrl: editForm.imageUrl || null,
                  barcode: editForm.barcode || null,
                }
              : ing
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

  const nutriscoreColors: Record<string, string> = {
    a: 'bg-emerald-500',
    b: 'bg-green-500',
    c: 'bg-yellow-500',
    d: 'bg-orange-500',
    e: 'bg-red-500',
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
            <span className="text-white font-semibold text-lg">Toate Alimentele</span>
            {totalCount !== null && (
              <span className="text-[#8892b0] text-sm">({totalCount} total)</span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Caută aliment (min. 2 caractere)..."
            className="flex-1 bg-[#172a45] text-white rounded-xl px-4 py-2.5 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
          />
          <button
            onClick={handleSearch}
            className="bg-[#64ffda] text-[#0a192f] font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-[#64ffda]/90 transition-colors"
          >
            Caută
          </button>
          {search && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
                fetchIngredients(1, '', null);
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
        ) : ingredients.length === 0 ? (
          <div className="text-center py-20 text-[#8892b0]">Nu s-au găsit alimente</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#233554]">
              <table className="w-full text-sm">
                <thead className="bg-[#172a45] text-[#8892b0]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nume</th>
                    <th className="text-left px-4 py-3 font-medium">Categorie</th>
                    <th className="text-right px-4 py-3 font-medium">Kcal</th>
                    <th className="text-right px-4 py-3 font-medium">Prot</th>
                    <th className="text-right px-4 py-3 font-medium">Carb</th>
                    <th className="text-right px-4 py-3 font-medium">Grăs</th>
                    <th className="text-center px-4 py-3 font-medium">Nutri</th>
                    <th className="text-center px-4 py-3 font-medium">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233554]">
                  {ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-[#172a45]/50 transition-colors">
                      <td className="px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                          {ing.imageUrl && (
                            <img
                              src={ing.imageUrl}
                              alt={ing.name}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span>{ing.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#8892b0]">{ing.category || '—'}</td>
                      <td className="px-4 py-3 text-right text-white">{ing.energy}</td>
                      <td className="px-4 py-3 text-right text-[#8892b0]">{ing.protein}g</td>
                      <td className="px-4 py-3 text-right text-[#8892b0]">{ing.carbohydrates}g</td>
                      <td className="px-4 py-3 text-right text-[#8892b0]">{ing.fat}g</td>
                      <td className="px-4 py-3 text-center">
                        {ing.nutriscore && (
                          <span
                            className={`inline-block w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${nutriscoreColors[ing.nutriscore] || 'bg-gray-500'}`}
                          >
                            {ing.nutriscore.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEdit(ing)}
                          className="text-[#64ffda] hover:text-[#64ffda]/80 text-xs font-medium mr-3"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => setDeleting(ing)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Șterge
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
                Pagina {page} · {ingredients.length} rezultate
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

      {/* Delete Confirm Modal */}
      {deleting && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !deleteSaving && setDeleting(null)}
        >
          <div
            className="bg-[#172a45] rounded-2xl border border-[#233554] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg">Confirmă ștergerea</h2>
            </div>
            <p className="text-[#8892b0] text-sm mb-1">Sigur vrei să ștergi alimentul:</p>
            <p className="text-white font-medium mb-4">{deleting.name}</p>
            <p className="text-red-400/70 text-xs mb-6">
              ⚠️ Această acțiune este ireversibilă. Dacă utilizatori au acest aliment în jurnal, referința va fi pierdută.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={deleteSaving}
                className="flex-1 py-2.5 rounded-xl border border-[#233554] text-[#8892b0] hover:text-white text-sm font-medium transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={async () => {
                  setDeleteSaving(true);
                  try {
                    const res = await fetch(`/api/ingredients/${deleting.id}/edit`, { method: 'DELETE' });
                    if (res.ok) {
                      setIngredients((prev) => prev.filter((i) => i.id !== deleting.id));
                      setDeleting(null);
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Eroare la ștergere');
                    }
                  } catch {
                    alert('Eroare la ștergere');
                  } finally {
                    setDeleteSaving(false);
                  }
                }}
                disabled={deleteSaving}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-500/90 transition-colors disabled:opacity-50"
              >
                {deleteSaving ? 'Se șterge...' : 'Șterge definitiv'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-[#172a45] rounded-2xl border border-[#233554] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Editează aliment</h2>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[#8892b0] text-xs mb-1">Nume</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Categorie</label>
                <input
                  type="text"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Nutriscore (a-e)</label>
                <input
                  type="text"
                  value={editForm.nutriscore || ''}
                  onChange={(e) => setEditForm({ ...editForm, nutriscore: e.target.value.toLowerCase() })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                  placeholder="a, b, c, d, e"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Calorii (kcal/100g)</label>
                <input
                  type="number"
                  value={editForm.energy || ''}
                  onChange={(e) => setEditForm({ ...editForm, energy: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Proteine (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.protein || ''}
                  onChange={(e) => setEditForm({ ...editForm, protein: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Carbohidrați (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.carbohydrates || ''}
                  onChange={(e) => setEditForm({ ...editForm, carbohydrates: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Grăsimi (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.fat || ''}
                  onChange={(e) => setEditForm({ ...editForm, fat: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Grăsimi sature (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.saturatedFat || ''}
                  onChange={(e) => setEditForm({ ...editForm, saturatedFat: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Zahăr (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.sugar || ''}
                  onChange={(e) => setEditForm({ ...editForm, sugar: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Fibre (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.fiber || ''}
                  onChange={(e) => setEditForm({ ...editForm, fiber: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Sodiu (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.sodium || ''}
                  onChange={(e) => setEditForm({ ...editForm, sodium: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[#8892b0] text-xs mb-1">Barcode</label>
                <input
                  type="text"
                  value={editForm.barcode || ''}
                  onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#8892b0] text-xs mb-1">URL Imagine</label>
                <input
                  type="text"
                  value={editForm.imageUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full bg-[#0a192f] text-white rounded-lg px-3 py-2 border border-[#233554] focus:border-[#64ffda] focus:outline-none text-sm"
                />
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
