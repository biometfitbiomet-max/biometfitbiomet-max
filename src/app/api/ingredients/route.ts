import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const snapshot = await db
      .collection('user_ingredients')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const ingredients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching pending ingredients:', error);
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 });
  }
}
