import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

type DbQuestion = {
  id: number;
  question_text: string;
  subject: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  hint: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await jwtVerify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject')?.toLowerCase() || 'reading-writing';
    const limitParam = Number(searchParams.get('limit') || '10');
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(20, Math.floor(limitParam)))
      : 10;

    let questions: DbQuestion[] = [];

    if (subject === 'math') {
      questions = await sql`
        SELECT id, question_text, subject, option_a, option_b, option_c, option_d, correct_answer, explanation, hint
        FROM questions
        WHERE LOWER(subject) = 'math'
        ORDER BY RANDOM()
        LIMIT ${limit}
      ` as DbQuestion[];
    } else {
      questions = await sql`
        SELECT id, question_text, subject, option_a, option_b, option_c, option_d, correct_answer, explanation, hint
        FROM questions
        WHERE LOWER(subject) IN ('reading', 'writing', 'reading/writing', 'reading-writing')
        ORDER BY RANDOM()
        LIMIT ${limit}
      ` as DbQuestion[];
    }

    return NextResponse.json({
      questions: questions.map((question) => ({
        id: question.id,
        questionText: question.question_text,
        subject: question.subject,
        options: [
          { label: 'A', text: question.option_a },
          { label: 'B', text: question.option_b },
          { label: 'C', text: question.option_c },
          { label: 'D', text: question.option_d },
        ],
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        hint: question.hint,
      })),
    });
  } catch (error) {
    console.error('Practice questions error:', error);
    return NextResponse.json(
      { error: 'Failed to load practice questions' },
      { status: 500 }
    );
  }
}
