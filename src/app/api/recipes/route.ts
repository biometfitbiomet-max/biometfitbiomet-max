import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const snapshot = await db
      .collection('user_recipes')
      .where('status', '==', 'pending')
      .get();

    const recipes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        servings: data.servings || 1,
        prepTime: data.prepTime || 0,
        cookTime: data.cookTime || 0,
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFat: data.totalFat || 0,
        ingredients: data.ingredients || [],
        userId: data.userId || '',
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching pending recipes:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea rețetelor' }, { status: 500 });
  }
}
