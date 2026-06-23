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
    const docRef = db.collection('user_recipes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (edits.name !== undefined) {
      updateData.name = edits.name;
      updateData.nameSearch = edits.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
    if (edits.servings !== undefined) updateData.servings = Number(edits.servings);
    if (edits.prepTime !== undefined) updateData.prepTime = Number(edits.prepTime);
    if (edits.cookTime !== undefined) updateData.cookTime = Number(edits.cookTime);
    if (edits.totalWeight !== undefined) updateData.totalWeight = edits.totalWeight ? Number(edits.totalWeight) : null;
    if (edits.imageUrl !== undefined) updateData.imageUrl = edits.imageUrl || null;
    if (edits.isPublic !== undefined) updateData.isPublic = edits.isPublic;

    // Recalculate per-serving nutrition if servings changed
    if (edits.servings !== undefined) {
      const data = doc.data()!;
      const servings = Number(edits.servings);
      const totalCalories = data.totalCalories || 0;
      const totalProtein = data.totalProtein || 0;
      const totalCarbs = data.totalCarbs || 0;
      const totalFat = data.totalFat || 0;
      const s = servings > 0 ? servings : 1;
      updateData.caloriesPerServing = totalCalories / s;
      updateData.proteinPerServing = totalProtein / s;
      updateData.carbsPerServing = totalCarbs / s;
      updateData.fatPerServing = totalFat / s;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing recipe:', error);
    return NextResponse.json({ error: 'Failed to edit recipe' }, { status: 500 });
  }
}
