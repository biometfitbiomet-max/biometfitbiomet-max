import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function PATCH(req: NextRequest) {
  try {
    const { id, action, rejectionReason, edits } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const docRef = db.collection('user_ingredients').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await docRef.update({
        status: 'approved',
        isPublic: true,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (action === 'reject') {
      await docRef.update({
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by admin',
        updatedAt: new Date(),
      });
    } else if (action === 'edit') {
      if (!edits) {
        return NextResponse.json({ error: 'Missing edits' }, { status: 400 });
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (edits.name !== undefined) {
        updateData.name = edits.name;
        updateData.nameSearch = edits.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      if (edits.calories !== undefined) updateData.calories = Number(edits.calories);
      if (edits.protein !== undefined) updateData.protein = Number(edits.protein);
      if (edits.carbs !== undefined) updateData.carbs = Number(edits.carbs);
      if (edits.fat !== undefined) updateData.fat = Number(edits.fat);
      if (edits.saturatedFat !== undefined) updateData.saturatedFat = Number(edits.saturatedFat);
      if (edits.sugar !== undefined) updateData.sugar = Number(edits.sugar);
      if (edits.fiber !== undefined) updateData.fiber = Number(edits.fiber);
      if (edits.salt !== undefined) updateData.salt = Number(edits.salt);
      if (edits.unit !== undefined) updateData.unit = edits.unit;
      if (edits.portionSize !== undefined) updateData.portionSize = edits.portionSize ? Number(edits.portionSize) : null;
      if (edits.description !== undefined) updateData.description = edits.description || null;

      await docRef.update(updateData);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 });
  }
}
