import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function PATCH(req: NextRequest) {
  try {
    const { id, action, rejectionReason } = await req.json();

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
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 });
  }
}
