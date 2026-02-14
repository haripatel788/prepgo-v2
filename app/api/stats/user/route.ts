import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;


    const existingStats = await sql`
      SELECT * FROM user_stats WHERE user_id = ${userId}
    `;

    if (existingStats.length === 0) {

      await sql`
        INSERT INTO user_stats (user_id, total_questions_answered, correct_answers, current_streak, xp_points, level)
        VALUES (${userId}, 0, 0, 0, 0, 1)
      `;
    }

    const questionCount = await sql`
      SELECT COUNT(*) as count FROM scores WHERE user_id = ${userId}
    `;
    const questionsAnswered = parseInt(questionCount[0]?.count || '0');

    const avgScore = await sql`
      SELECT AVG(score) as avg FROM scores WHERE user_id = ${userId}
    `;
    const averageScore = Math.round(parseFloat(avgScore[0]?.avg || '0'));

    const userStats = await sql`
      SELECT 
        current_streak,
        xp_points,
        level,
        last_practice_date
      FROM user_stats
      WHERE user_id = ${userId}
    `;

    const stats = userStats[0] || {
      current_streak: 0,
      xp_points: 0,
      level: 1,
      last_practice_date: null,
    };

    const today = new Date().toISOString().split('T')[0];
    const lastPracticeDate = stats.last_practice_date 
      ? new Date(stats.last_practice_date).toISOString().split('T')[0]
      : null;

    let currentStreak = stats.current_streak;

    if (lastPracticeDate) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastPracticeDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff > 1) {
        currentStreak = 0;
        await sql`
          UPDATE user_stats 
          SET current_streak = 0 
          WHERE user_id = ${userId}
        `;
      }
    }

    return NextResponse.json({
      stats: {
        questionsAnswered,
        averageScore,
        currentStreak,
        xpPoints: stats.xp_points,
        level: stats.level,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}