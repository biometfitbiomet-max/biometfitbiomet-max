import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection('exercises').orderBy('id').get();

    const exercises = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        docId: doc.id,
        id: data.id || 0,
        nameRo: data.nameRo || '',
        nameEn: data.nameEn || '',
        description: data.description || '',
        instructions: data.instructions || [],
        category: data.category || '',
        muscles: data.muscles || [],
        musclesSecondary: data.musclesSecondary || [],
        equipment: data.equipment || [],
        difficulty: data.difficulty || '',
      };
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea exercițiilor' }, { status: 500 });
  }
}
