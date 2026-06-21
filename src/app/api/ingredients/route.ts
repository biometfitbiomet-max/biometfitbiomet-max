import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const snapshot = await db
      .collection('user_ingredients')
      .where('status', '==', 'pending')
      .get();

    const ingredients = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        unit: data.unit || 'grame',
        userId: data.userId || '',
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching pending ingredients:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea alimentelor' }, { status: 500 });
  }
}
