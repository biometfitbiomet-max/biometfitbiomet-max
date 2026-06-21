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
    // Check authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch real stats from Firestore
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Stats error:', data.error);
        } else {
          setStats(data);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">BiometFit Admin</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </nav>

      <div className="p-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 mb-2">Pending Ingredients</h3>
            <p className="text-4xl font-bold text-yellow-400">{stats.pendingIngredients}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 mb-2">Pending Recipes</h3>
            <p className="text-4xl font-bold text-yellow-400">{stats.pendingRecipes}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 mb-2">Approved Today</h3>
            <p className="text-4xl font-bold text-green-400">{stats.approvedToday}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 mb-2">Rejected Today</h3>
            <p className="text-4xl font-bold text-red-400">{stats.rejectedToday}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            onClick={() => router.push('/dashboard/ingredients')}
            className="bg-blue-600 hover:bg-blue-700 h-32 text-xl"
          >
            Review Ingredients
          </Button>
          <Button
            onClick={() => router.push('/dashboard/recipes')}
            className="bg-purple-600 hover:bg-purple-700 h-32 text-xl"
          >
            Review Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}
