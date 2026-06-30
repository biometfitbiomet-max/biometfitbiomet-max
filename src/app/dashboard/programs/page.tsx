'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  name: string;
  originalName?: string;
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchPrograms();
  }, [router]);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      if (!data.error) setPrograms(data);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    try {
      await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      setEditingId(null);
      fetchPrograms();
    } catch (err) {
      console.error('Failed to save program:', err);
    }
  };

  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
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
            <span className="text-white font-semibold text-lg">Programe Antrenament</span>
            <span className="text-[#8892b0] text-sm">({programs.length})</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Caută program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#172a45] border border-[#233554] text-white placeholder-[#8892b0] focus:outline-none focus:border-[#64ffda]/40 transition-colors"
          />
        </div>

        <div className="bg-[#172a45] rounded-2xl border border-[#233554] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#233554]">
                <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">ID</th>
                <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Titlu</th>
                <th className="text-right px-5 py-3 text-[#8892b0] text-sm font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((program) => (
                <tr
                  key={program.id}
                  className="border-b border-[#233554]/50 hover:bg-[#0a192f]/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="text-[#8892b0] text-sm font-mono">{program.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    {editingId === program.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-[#0a192f] border border-[#64ffda]/40 text-white focus:outline-none"
                      />
                    ) : (
                      <span className="text-white">{program.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingId === program.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSave(program.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#64ffda] text-[#0a192f] text-sm font-medium hover:bg-[#64ffda]/90 transition-colors"
                        >
                          Salvează
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 rounded-lg bg-[#233554] text-[#8892b0] text-sm font-medium hover:bg-[#233554]/80 transition-colors"
                        >
                          Anulează
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(program.id);
                          setEditName(program.name);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-[#64ffda]/10 text-[#64ffda] text-sm font-medium hover:bg-[#64ffda]/20 transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editează
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#8892b0] text-lg">Nu s-au găsit programe</p>
          </div>
        )}
      </main>
    </div>
  );
}
