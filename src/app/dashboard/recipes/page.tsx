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

    // Mock data - replace with Firestore fetch
    setRecipes([
      {
        id: '1',
        name: 'Omletă cu legume',
        servings: 2,
        prepTime: 10,
        cookTime: 15,
        totalCalories: 340,
        totalProtein: 27.8,
        totalCarbs: 13,
        totalFat: 19.6,
        ingredients: [
          { ingredientName: 'Ou de găină', amount: 200, unit: 'grame' },
          { ingredientName: 'Roșii', amount: 150, unit: 'grame' },
        ],
        createdAt: new Date().toISOString(),
        userId: 'user123',
      },
    ]);
    setLoading(false);
  }, [router]);

  const handleApprove = async (id: string) => {
    // Implement Firestore update: status = 'approved', isPublic = true
    console.log('Approve recipe:', id);
    setRecipes(recipes.filter((recipe) => recipe.id !== id));
  };

  const handleReject = async (id: string) => {
    // Implement Firestore update: status = 'rejected'
    console.log('Reject recipe:', id);
    setRecipes(recipes.filter((recipe) => recipe.id !== id));
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
        <h1 className="text-2xl font-bold">Review Recipes</h1>
        <div className="w-24" />
      </nav>

      <div className="p-8">
        {recipes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No pending recipes to review
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
                      Created by: {recipe.userId}
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
                    <div className="text-gray-400 text-sm">Servings</div>
                    <div className="text-xl font-bold">{recipe.servings}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Prep Time</div>
                    <div className="text-xl font-bold">{recipe.prepTime} min</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Cook Time</div>
                    <div className="text-xl font-bold">{recipe.cookTime} min</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Total Calories</div>
                    <div className="text-xl font-bold">{recipe.totalCalories}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-gray-400 text-sm mb-2">Ingredients</h4>
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
                    <div className="text-gray-400 text-sm">Protein</div>
                    <div className="text-xl font-bold">{recipe.totalProtein}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Carbs</div>
                    <div className="text-xl font-bold">{recipe.totalCarbs}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Fat</div>
                    <div className="text-xl font-bold">{recipe.totalFat}g</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Cal/Serving</div>
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
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(recipe.id)}
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
