import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const category = searchParams.get('category') || '';

    const db = getDb();
    let query: FirebaseFirestore.Query = db.collection('ingredients');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Search by name prefix (using nameSearch field)
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
      // Pagination with cursor — orderBy nameSearch for consistent ordering
      query = query.orderBy('nameSearch').limit(pageSize);

      // Cursor-based pagination: use startAfter with last document's nameSearch
      const cursor = searchParams.get('cursor');
      if (cursor && page > 1) {
        // Fetch the cursor document to get its nameSearch value
        const cursorDoc = await db.collection('ingredients').doc(cursor).get();
        if (cursorDoc.exists) {
          const cursorNameSearch = cursorDoc.data()?.nameSearch || '';
          query = query.startAfter(cursorNameSearch);
        }
      }
    }

    const snapshot = await query.get();

    const ingredients = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        category: data.category || '',
        energy: data.energy || 0,
        protein: data.protein || 0,
        carbohydrates: data.carbohydrates || 0,
        fat: data.fat || 0,
        fiber: data.fiber || null,
        sugar: data.sugar || null,
        saturatedFat: data.saturatedFat || null,
        sodium: data.sodium || null,
        nutriscore: data.nutriscore || null,
        isVegan: data.isVegan || null,
        isVegetarian: data.isVegetarian || null,
        imageUrl: data.imageUrl || null,
        barcode: data.barcode || null,
        status: data.status || 'approved',
        createdBy: data.createdBy || 'admin',
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
      };
    });

    // Get last document for pagination cursor
    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const nextCursor = lastDoc ? lastDoc.id : null;

    // Get total count (only on first page without search)
    let totalCount = null;
    if (page === 1 && !search) {
      const countSnapshot = await db.collection('ingredients').count().get();
      totalCount = countSnapshot.data().count;
    }

    return NextResponse.json({
      ingredients,
      nextCursor,
      page,
      pageSize,
      totalCount,
      hasMore: snapshot.docs.length === pageSize,
    });
  } catch (error) {
    console.error('Error fetching all ingredients:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea alimentelor' }, { status: 500 });
  }
}
