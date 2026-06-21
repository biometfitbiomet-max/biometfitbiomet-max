'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  createdAt: string;
  userId: string;
}

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch real pending ingredients from Firestore
    fetch('/api/ingredients')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Ingredients error:', data.error);
        } else {
          setIngredients(data);
        }
      })
      .catch((err) => console.error('Failed to fetch ingredients:', err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/ingredients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        setIngredients(ingredients.filter((ing) => ing.id !== id));
      }
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/ingredients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      });
      if (res.ok) {
        setIngredients(ingredients.filter((ing) => ing.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    }
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
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          ← Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Review Ingredients</h1>
        <div className="w-24" />
      </nav>

      <div className="p-8">
        {ingredients.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No pending ingredients to review
          </div>
        ) : (
          <div className="space-y-4">
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{ingredient.name}</h3>
                    <div className="text-gray-400 text-sm">
                      Created by: {ingredient.userId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">
                      {new Date(ingredient.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Calories</div>
                    <div className="text-xl font-bold">{ingredient.calories}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Protein</div>
                    <div className="text-xl font-bold">{ingredient.protein}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Carbs</div>
                    <div className="text-xl font-bold">{ingredient.carbs}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Fat</div>
                    <div className="text-xl font-bold">{ingredient.fat}g</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(ingredient.id)}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(ingredient.id)}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
