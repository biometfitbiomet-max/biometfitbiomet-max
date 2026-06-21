import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const [ingredientsSnapshot, recipesSnapshot] = await Promise.all([
      db.collection('user_ingredients').where('status', '==', 'pending').get(),
      db.collection('user_recipes').where('status', '==', 'pending').get(),
    ]);

    const pendingIngredients = ingredientsSnapshot.size;
    const pendingRecipes = recipesSnapshot.size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [approvedIngredients, rejectedIngredients, approvedRecipes, rejectedRecipes] = await Promise.all([
      db.collection('user_ingredients')
        .where('status', '==', 'approved')
        .where('approvedAt', '>=', today)
        .get(),
      db.collection('user_ingredients')
        .where('status', '==', 'rejected')
        .where('updatedAt', '>=', today)
        .get(),
      db.collection('user_recipes')
        .where('status', '==', 'approved')
        .where('approvedAt', '>=', today)
        .get(),
      db.collection('user_recipes')
        .where('status', '==', 'rejected')
        .where('updatedAt', '>=', today)
        .get(),
    ]);

    return NextResponse.json({
      pendingIngredients,
      pendingRecipes,
      approvedToday: approvedIngredients.size + approvedRecipes.size,
      rejectedToday: rejectedIngredients.size + rejectedRecipes.size,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
