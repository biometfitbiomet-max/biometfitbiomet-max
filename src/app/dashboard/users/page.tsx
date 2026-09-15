'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string | null;
  lastSignIn: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = async (token?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '1000');
      if (token) params.set('pageToken', token);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (!data.error) {
        if (token) {
          setUsers((prev) => [...prev, ...data.users]);
        } else {
          setUsers(data.users);
        }
        setHasMore(!!data.pageToken);
        setPageToken(data.pageToken || null);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [router]);

  const handleLoadMore = () => {
    if (!pageToken) return;
    setLoadingMore(true);
    fetchUsers(pageToken);
  };

  const filtered = users
    .filter(
      (u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.displayName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
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
            <span className="text-white font-semibold text-lg">Utilizatori</span>
            <span className="text-[#8892b0] text-sm">({users.length}{hasMore ? '+' : ''})</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Caută după email sau nume..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#172a45] border border-[#233554] text-white placeholder-[#8892b0] focus:outline-none focus:border-[#64ffda]/40 transition-colors"
          />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#172a45] rounded-xl p-4 border border-[#233554]">
            <p className="text-2xl font-bold text-[#64ffda]">{users.length}{hasMore ? '+' : ''}</p>
            <p className="text-[#8892b0] text-sm">Total utilizatori</p>
          </div>
          <div className="bg-[#172a45] rounded-xl p-4 border border-[#233554]">
            <p className="text-2xl font-bold text-emerald-400">
              {users.filter((u) => u.emailVerified).length}
            </p>
            <p className="text-[#8892b0] text-sm">Email verificat</p>
          </div>
          <div className="bg-[#172a45] rounded-xl p-4 border border-[#233554]">
            <p className="text-2xl font-bold text-amber-400">
              {(() => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return users.filter((u) => {
                  if (!u.createdAt) return false;
                  return new Date(u.createdAt) >= weekAgo;
                }).length;
              })()}
            </p>
            <p className="text-[#8892b0] text-sm">Înregistrați în ultima săptămână</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#172a45] rounded-2xl border border-[#233554] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#233554]">
                  <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Utilizator</th>
                  <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Data înregistrării</th>
                  <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Ultima autentificare</th>
                  <th className="text-left px-5 py-3 text-[#8892b0] text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.uid}
                    className="border-b border-[#233554]/50 hover:bg-[#0a192f]/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#64ffda]/10 flex items-center justify-center text-[#64ffda] font-bold text-sm shrink-0">
                          {(user.displayName || user.email || '?')[0]?.toUpperCase()}
                        </div>
                        <span className="text-white text-sm">
                          {user.displayName || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#8892b0] text-sm">{user.email || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#8892b0] text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#8892b0] text-sm">{formatDate(user.lastSignIn)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {user.disabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          Dezactivat
                        </span>
                      ) : user.emailVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Activ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Neverificat
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#8892b0]">Nu s-au găsit utilizatori</p>
            </div>
          )}
        </div>

        {/* Load more */}
        {hasMore && !search && (
          <div className="text-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-lg bg-[#172a45] text-[#64ffda] border border-[#64ffda]/20 hover:bg-[#64ffda]/10 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loadingMore ? 'Se încarcă...' : 'Încarcă mai mulți'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
