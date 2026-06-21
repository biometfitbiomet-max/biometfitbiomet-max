import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const [pendingIngredientsSnap, pendingRecipesSnap, approvedIngredientsSnap, rejectedIngredientsSnap, approvedRecipesSnap, rejectedRecipesSnap] = await Promise.all([
      db.collection('user_ingredients').where('status', '==', 'pending').get(),
      db.collection('user_recipes').where('status', '==', 'pending').get(),
      db.collection('user_ingredients').where('status', '==', 'approved').get(),
      db.collection('user_ingredients').where('status', '==', 'rejected').get(),
      db.collection('user_recipes').where('status', '==', 'approved').get(),
      db.collection('user_recipes').where('status', '==', 'rejected').get(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countToday = (snapshot: any, dateField: string) => {
      return snapshot.docs.filter((doc: any) => {
        const dateValue = doc.data()[dateField];
        if (!dateValue) return false;
        const docDate = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return docDate >= today;
      }).length;
    };

    const approvedToday = countToday(approvedIngredientsSnap, 'approvedAt') + countToday(approvedRecipesSnap, 'approvedAt');
    const rejectedToday = countToday(rejectedIngredientsSnap, 'updatedAt') + countToday(rejectedRecipesSnap, 'updatedAt');

    return NextResponse.json({
      pendingIngredients: pendingIngredientsSnap.size,
      pendingRecipes: pendingRecipesSnap.size,
      approvedToday,
      rejectedToday,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea statisticilor' }, { status: 500 });
  }
}
