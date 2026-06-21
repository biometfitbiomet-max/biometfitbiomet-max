'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Recipe {
  id: string;
  name: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  ingredients: Array<{
    ingredientName: string;
    amount: number;
    unit: string;
  }>;
  createdAt: string;
  userId: string;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch real pending recipes from Firestore
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Recipes error:', data.error);
        } else {
          setRecipes(data);
        }
      })
      .catch((err) => console.error('Failed to fetch recipes:', err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        setRecipes(recipes.filter((recipe) => recipe.id !== id));
      }
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      });
      if (res.ok) {
        setRecipes(recipes.filter((recipe) => recipe.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          ← Înapoi la Panou
        </Button>
        <h1 className="text-2xl font-bold">Revizuire Rețete</h1>
        <div className="w-24" />
      </nav>

      <div className="p-8">
        {recipes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            Nu sunt rețete în așteptare pentru revizuire
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{recipe.name}</h3>
                    <div className="text-gray-400 text-sm">
                      Creat de: {recipe.userId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">
                      {new Date(recipe.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Porții</div>
                    <div className="text-xl font-bold">{recipe.servings}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Timp preparare</div>
                    <div className="text-xl font-bold">{recipe.prepTime} min</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Timp gătire</div>
                    <div className="text-xl font-bold">{recipe.cookTime} min</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Calorii totale</div>
                    <div className="text-xl font-bold">{recipe.totalCalories}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-gray-400 text-sm mb-2">Ingrediente</h4>
                  <div className="space-y-1">
                    {recipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="text-sm">
                        {ing.ingredientName}: {ing.amount} {ing.unit}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Proteine</div>
                    <div className="text-xl font-bold">{recipe.totalProtein}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Carbohidrați</div>
                    <div className="text-xl font-bold">{recipe.totalCarbs}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Grăsimi</div>
                    <div className="text-xl font-bold">{recipe.totalFat}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Cal/Porție</div>
                    <div className="text-xl font-bold">
                      {Math.round(recipe.totalCalories / recipe.servings)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(recipe.id)}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    Aprobă
                  </Button>
                  <Button
                    onClick={() => handleReject(recipe.id)}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    Respinge
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
