import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const body = await request.json();

    const { subject, correctCount, totalQuestions } = body;

    if (!subject || typeof correctCount !== 'number' || typeof totalQuestions !== 'number') {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 });
    }

    const percentage = Math.round((correctCount / Math.max(totalQuestions, 1)) * 100);

    await sql`
      INSERT INTO scores (user_id, subject, score)
      VALUES (${payload.userId as number}, ${subject}, ${percentage})
    `;

    return NextResponse.json({ success: true, score: percentage });
  } catch (error) {
    console.error('Practice completion error:', error);
    return NextResponse.json(
      { error: 'Failed to save practice score' },
      { status: 500 }
    );
  }
}
