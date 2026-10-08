import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

/// Resolves an ingredient doc by id across `ingredients` and `user_ingredients`.
/// Returns the doc ref + the collection name, or null if not found.
async function resolveIngredient(id: string) {
  const db = getDb();
  const mainRef = db.collection('ingredients').doc(id);
  const mainDoc = await mainRef.get();
  if (mainDoc.exists) return { ref: mainRef, collection: 'ingredients' as const };

  const userRef = db.collection('user_ingredients').doc(id);
  const userDoc = await userRef.get();
  if (userDoc.exists) return { ref: userRef, collection: 'user_ingredients' as const };

  return null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resolved = await resolveIngredient(id);
    if (!resolved) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    await resolved.ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 });
  }
}

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

    const resolved = await resolveIngredient(id);
    if (!resolved) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    const { ref, collection } = resolved;
    const isUserIngredient = collection === 'user_ingredients';
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (edits.name !== undefined) {
      updateData.name = edits.name;
      updateData.nameSearch = edits.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
    if (edits.nameEn !== undefined) {
      const en = String(edits.nameEn).trim();
      if (en) {
        updateData.nameEn = en;
        updateData.nameSearchEn = en
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      } else {
        updateData.nameEn = null;
        updateData.nameSearchEn = null;
      }
    }
    if (edits.category !== undefined) updateData.category = edits.category;

    // Numeric fields — sanitize NaN/Infinity to 0
    const safeNum = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    if (isUserIngredient) {
      // user_ingredients uses calories/carbs/salt instead of energy/carbohydrates/sodium
      if (edits.energy !== undefined) updateData.calories = safeNum(edits.energy);
      if (edits.protein !== undefined) updateData.protein = safeNum(edits.protein);
      if (edits.carbohydrates !== undefined) updateData.carbs = safeNum(edits.carbohydrates);
      if (edits.fat !== undefined) updateData.fat = safeNum(edits.fat);
      if (edits.fiber !== undefined) updateData.fiber = edits.fiber ? safeNum(edits.fiber) : null;
      if (edits.sugar !== undefined) updateData.sugar = edits.sugar ? safeNum(edits.sugar) : null;
      if (edits.saturatedFat !== undefined) updateData.saturatedFat = edits.saturatedFat ? safeNum(edits.saturatedFat) : null;
      if (edits.sodium !== undefined) updateData.salt = edits.sodium ? safeNum(edits.sodium) : null;
    } else {
      if (edits.energy !== undefined) updateData.energy = safeNum(edits.energy);
      if (edits.protein !== undefined) updateData.protein = safeNum(edits.protein);
      if (edits.carbohydrates !== undefined) updateData.carbohydrates = safeNum(edits.carbohydrates);
      if (edits.fat !== undefined) updateData.fat = safeNum(edits.fat);
      if (edits.fiber !== undefined) updateData.fiber = edits.fiber ? safeNum(edits.fiber) : null;
      if (edits.sugar !== undefined) updateData.sugar = edits.sugar ? safeNum(edits.sugar) : null;
      if (edits.saturatedFat !== undefined) updateData.saturatedFat = edits.saturatedFat ? safeNum(edits.saturatedFat) : null;
      if (edits.sodium !== undefined) updateData.sodium = edits.sodium ? safeNum(edits.sodium) : null;
    }

    if (edits.nutriscore !== undefined) updateData.nutriscore = edits.nutriscore || null;
    if (edits.isVegan !== undefined) updateData.isVegan = edits.isVegan;
    if (edits.isVegetarian !== undefined) updateData.isVegetarian = edits.isVegetarian;
    if (edits.imageUrl !== undefined) updateData.imageUrl = edits.imageUrl || null;
    if (edits.barcode !== undefined) updateData.barcode = edits.barcode || null;

    await ref.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing ingredient:', error);
    return NextResponse.json({ error: 'Failed to edit ingredient' }, { status: 500 });
  }
}
