import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {
      nameRo: body.nameRo,
      nameEn: body.nameEn,
      description: body.description,
      instructions: body.instructions || [],
      category: body.category || '',
      muscles: body.muscles || [],
      musclesSecondary: body.musclesSecondary || [],
      equipment: body.equipment || [],
      difficulty: body.difficulty || '',
      updatedAt: new Date(),
    };

    await db.collection('exercises').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json({ error: 'Eroare la actualizarea exercițiului' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();

    const newExercise = {
      id: body.id || Date.now(),
      nameRo: body.nameRo || '',
      nameEn: body.nameEn || '',
      description: body.description || '',
      instructions: body.instructions || [],
      category: body.category || '',
      muscles: body.muscles || [],
      musclesSecondary: body.musclesSecondary || [],
      equipment: body.equipment || [],
      difficulty: body.difficulty || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('exercises').add(newExercise);

    return NextResponse.json({ success: true, docId: docRef.id });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Eroare la crearea exercițiului' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    await db.collection('exercises').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json({ error: 'Eroare la ștergerea exercițiului' }, { status: 500 });
  }
}
