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
    const filter = searchParams.get('filter') || '';

    const db = getDb();

    // ── filter=approved → list user_ingredients with status: approved ──
    if (filter === 'approved') {
      // Fetch all approved (no orderBy to avoid needing a composite index;
      // the number of user-created ingredients is small enough to sort in memory).
      let q: FirebaseFirestore.Query = db
        .collection('user_ingredients')
        .where('status', '==', 'approved')
        .limit(500);

      const snapshot = await q.get();

      let docs = snapshot.docs;
      // Sort in memory by approvedAt desc (most recent first)
      docs = docs.slice().sort((a, b) => {
        const ta = a.data()?.approvedAt?.toMillis?.() ?? 0;
        const tb = b.data()?.approvedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });

      // Apply search filter in memory if provided
      let filtered = docs;
      if (search.trim().length >= 2) {
        const normalised = search
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        filtered = docs.filter((doc) => {
          const data = doc.data();
          const ns = (data?.nameSearch || '') as string;
          const nsEn = (data?.nameSearchEn || '') as string;
          return (
            (ns >= normalised && ns < normalised + '\uf8ff') ||
            (nsEn >= normalised && nsEn < normalised + '\uf8ff')
          );
        });
      }

      // Pagination in memory
      const start = (page - 1) * pageSize;
      const pageDocs = filtered.slice(start, start + pageSize);

      const ingredients = pageDocs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          nameEn: data.nameEn || null,
          category: data.category || '',
          energy: Number.isFinite(data.calories) ? data.calories : 0,
          protein: Number.isFinite(data.protein) ? data.protein : 0,
          carbohydrates: Number.isFinite(data.carbs) ? data.carbs : 0,
          fat: Number.isFinite(data.fat) ? data.fat : 0,
          fiber: data.fiber != null && Number.isFinite(data.fiber) ? data.fiber : null,
          sugar: data.sugar != null && Number.isFinite(data.sugar) ? data.sugar : null,
          saturatedFat: data.saturatedFat != null && Number.isFinite(data.saturatedFat) ? data.saturatedFat : null,
          sodium: data.salt != null && Number.isFinite(data.salt) ? data.salt : null,
          nutriscore: data.nutriscore || null,
          isVegan: data.isVegan ?? null,
          isVegetarian: data.isVegetarian ?? null,
          imageUrl: data.imageUrl || null,
          barcode: data.barcode || null,
          status: 'approved',
          createdBy: data.userId || 'user',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          approvedAt: data.approvedAt?.toDate?.()?.toISOString() || null,
        };
      });

      const totalCount = filtered.length;
      const hasMore = start + pageSize < totalCount;

      return NextResponse.json({
        ingredients,
        nextCursor: null,
        page,
        pageSize,
        totalCount,
        hasMore,
      });
    }

    // ── default: list the official `ingredients` collection ──
    let query: FirebaseFirestore.Query = db.collection('ingredients');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Search by name prefix on BOTH nameSearch (RO) and nameSearchEn (EN)
    if (search.trim().length >= 2) {
      const normalised = search
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let base: FirebaseFirestore.Query = db.collection('ingredients');
      if (category) base = base.where('category', '==', category);

      const [roSnap, enSnap] = await Promise.all([
        base
          .where('nameSearch', '>=', normalised)
          .where('nameSearch', '<', normalised + '\uf8ff')
          .limit(pageSize)
          .get(),
        base
          .where('nameSearchEn', '>=', normalised)
          .where('nameSearchEn', '<', normalised + '\uf8ff')
          .limit(pageSize)
          .get(),
      ]);

      // Merge, dedupe by doc id, keep order
      const seen = new Set<string>();
      const mergedDocs = [...roSnap.docs, ...enSnap.docs].filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

      const ingredients = mergedDocs.slice(0, pageSize).map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          nameEn: data.nameEn || null,
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

      return NextResponse.json({
        ingredients,
        nextCursor: null,
        page,
        pageSize,
        totalCount: null,
        hasMore: mergedDocs.length > pageSize,
      });
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
        nameEn: data.nameEn || null,
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
