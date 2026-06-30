import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection('program_overrides').get();

    const programs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
      };
    });

    programs.sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching program overrides:', error);
    return NextResponse.json({ error: 'Eroare la încărcarea programelor' }, { status: 500 });
  }
}
