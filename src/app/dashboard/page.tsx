'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingIngredients: 0,
    pendingRecipes: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch((err) => console.error('Failed to fetch stats:', err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/login');
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

  const statCards = [
    { label: 'Alimente în așteptare', value: stats.pendingIngredients, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Rețete în așteptare', value: stats.pendingRecipes, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { label: 'Aprobate azi', value: stats.approvedToday, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Respise azi', value: stats.rejectedToday, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-[#233554]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#64ffda]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#64ffda]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">BiometFit Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#8892b0] hover:text-[#64ffda] text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Deconectare
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Panou de control</h1>
        <p className="text-[#8892b0] text-sm mb-8">Revizuirea alimentelor și rețetelor adăugate de utilizatori</p>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`bg-[#172a45] rounded-2xl p-5 border ${stat.border} hover:border-opacity-40 transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-[#8892b0] text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            onClick={() => router.push('/dashboard/ingredients')}
            className="group bg-[#172a45] rounded-2xl p-6 border border-[#233554] hover:border-[#64ffda]/40 transition-all text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#64ffda]/10 flex items-center justify-center group-hover:bg-[#64ffda]/20 transition-colors">
                <svg className="w-6 h-6 text-[#64ffda]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Revizuire Alimente</h3>
                <p className="text-[#8892b0] text-sm">{stats.pendingIngredients} în așteptare</p>
              </div>
            </div>
            <p className="text-[#8892b0] text-sm">Aprobă sau respinge alimentele adăugate de utilizatori</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/recipes')}
            className="group bg-[#172a45] rounded-2xl p-6 border border-[#233554] hover:border-[#64ffda]/40 transition-all text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#64ffda]/10 flex items-center justify-center group-hover:bg-[#64ffda]/20 transition-colors">
                <svg className="w-6 h-6 text-[#64ffda]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Revizuire Rețete</h3>
                <p className="text-[#8892b0] text-sm">{stats.pendingRecipes} în așteptare</p>
              </div>
            </div>
            <p className="text-[#8892b0] text-sm">Aprobă sau respinge rețetele create de utilizatori</p>
          </button>
        </div>
      </main>
    </div>
  );
}
