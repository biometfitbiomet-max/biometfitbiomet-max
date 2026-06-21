import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingIngredientsSnap, pendingRecipesSnap, ingredientsSnap, recipesSnap] = await Promise.all([
      db.collection('user_ingredients').where('status', '==', 'pending').get(),
      db.collection('user_recipes').where('status', '==', 'pending').get(),
      db.collection('user_ingredients').where('status', '==', 'approved').get(),
      db.collection('user_recipes').where('status', '==', 'rejected').get(),
    ]);

    let approvedToday = 0;
    let rejectedToday = 0;

    ingredientsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const approvedAt = data.approvedAt?.toDate?.();
      if (approvedAt && approvedAt >= today) approvedToday++;
    });

    recipesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.();
      if (updatedAt && updatedAt >= today) rejectedToday++;
    });

    const rejectedIngredientsSnap = await db.collection('user_ingredients').where('status', '==', 'rejected').get();
    rejectedIngredientsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.();
      if (updatedAt && updatedAt >= today) rejectedToday++;
    });

    const approvedRecipesSnap = await db.collection('user_recipes').where('status', '==', 'approved').get();
    approvedRecipesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const approvedAt = data.approvedAt?.toDate?.();
      if (approvedAt && approvedAt >= today) approvedToday++;
    });

    return NextResponse.json({
      pendingIngredients: pendingIngredientsSnap.size,
      pendingRecipes: pendingRecipesSnap.size,
      approvedToday,
      rejectedToday,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
