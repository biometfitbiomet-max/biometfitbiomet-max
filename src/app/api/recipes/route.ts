import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const snapshot = await db
      .collection('user_recipes')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const recipes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching pending recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
