import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const edits = await req.json();

    if (!edits || Object.keys(edits).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = getDb();
    const docRef = db.collection('ingredients').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (edits.name !== undefined) {
      updateData.name = edits.name;
      updateData.nameSearch = edits.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
    if (edits.category !== undefined) updateData.category = edits.category;
    if (edits.energy !== undefined) updateData.energy = Number(edits.energy);
    if (edits.protein !== undefined) updateData.protein = Number(edits.protein);
    if (edits.carbohydrates !== undefined) updateData.carbohydrates = Number(edits.carbohydrates);
    if (edits.fat !== undefined) updateData.fat = Number(edits.fat);
    if (edits.fiber !== undefined) updateData.fiber = edits.fiber ? Number(edits.fiber) : null;
    if (edits.sugar !== undefined) updateData.sugar = edits.sugar ? Number(edits.sugar) : null;
    if (edits.saturatedFat !== undefined) updateData.saturatedFat = edits.saturatedFat ? Number(edits.saturatedFat) : null;
    if (edits.sodium !== undefined) updateData.sodium = edits.sodium ? Number(edits.sodium) : null;
    if (edits.nutriscore !== undefined) updateData.nutriscore = edits.nutriscore || null;
    if (edits.isVegan !== undefined) updateData.isVegan = edits.isVegan;
    if (edits.isVegetarian !== undefined) updateData.isVegetarian = edits.isVegetarian;
    if (edits.imageUrl !== undefined) updateData.imageUrl = edits.imageUrl || null;
    if (edits.barcode !== undefined) updateData.barcode = edits.barcode || null;

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing ingredient:', error);
    return NextResponse.json({ error: 'Failed to edit ingredient' }, { status: 500 });
  }
}
