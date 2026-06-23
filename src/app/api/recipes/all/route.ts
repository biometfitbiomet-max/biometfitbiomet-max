import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const status = searchParams.get('status') || '';

    const db = getDb();
    let query: FirebaseFirestore.Query = db.collection('user_recipes');

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Search by name prefix
    if (search.trim().length >= 2) {
      const normalised = search
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      query = query
        .where('nameSearch', '>=', normalised)
        .where('nameSearch', '<', normalised + '\uf8ff')
        .limit(pageSize);
    } else {
      query = query.orderBy('createdAt', 'desc').limit(pageSize);

      const cursor = searchParams.get('cursor');
      if (cursor && page > 1) {
        const cursorDoc = await db.collection('user_recipes').doc(cursor).get();
        if (cursorDoc.exists) {
          const cursorCreatedAt = cursorDoc.data()?.createdAt;
          query = query.startAfter(cursorCreatedAt);
        }
      }
    }

    const snapshot = await query.get();

    const recipes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        imageUrl: data.imageUrl || null,
        servings: data.servings || 1,
        prepTime: data.prepTime || 0,
        cookTime: data.cookTime || 0,
        totalWeight: data.totalWeight || null,
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFat: data.totalFat || 0,
        caloriesPerServing: data.caloriesPerServing || 0,
        proteinPerServing: data.proteinPerServing || 0,
        carbsPerServing: data.carbsPerServing || 0,
        fatPerServing: data.fatPerServing || 0,
        ingredients: data.ingredients || [],
        status: data.status || 'pending',
        isPublic: data.isPublic || false,
        userId: data.userId || '',
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
      };
    });

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const nextCursor = lastDoc ? lastDoc.id : null;

    let totalCount = null;
    if (page === 1 && !search && !status) {
      const countSnapshot = await db.collection('user_recipes').count().get();
      totalCount = countSnapshot.data().count;
    }

    return NextResponse.json({
      recipes,
      nextCursor,
      page,
      pageSize,
      totalCount,
      hasMore: snapshot.docs.length === pageSize,
    });
  } catch (error) {
    console.error('Error fetching all recipes:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea rețetelor' }, { status: 500 });
  }
}
