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
    const userId = payload.userId as number;
    const body = await request.json();

    const { subject, correctCount, totalQuestions } = body;

    if (!subject || typeof correctCount !== 'number' || typeof totalQuestions !== 'number') {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 });
    }

    const percentage = Math.round((correctCount / Math.max(totalQuestions, 1)) * 100);

    await sql`
      INSERT INTO scores (user_id, subject, score)
      VALUES (${userId}, ${subject}, ${percentage})
    `;

    const baseXP = totalQuestions * 10;
    const bonusXP = correctCount * 5;
    const perfectBonus = percentage === 100 ? 50 : 0;
    const xpEarned = baseXP + bonusXP + perfectBonus;

    const existingStats = await sql`
      SELECT * FROM user_stats WHERE user_id = ${userId}
    `;

    if (existingStats.length === 0) {
      await sql`
        INSERT INTO user_stats (
          user_id, 
          total_questions_answered, 
          correct_answers, 
          current_streak, 
          longest_streak,
          last_practice_date, 
          xp_points, 
          level
        )
        VALUES (${userId}, ${totalQuestions}, ${correctCount}, 1, 1, CURRENT_DATE, ${xpEarned}, 1)
      `;
    } else {
      const stats = existingStats[0];
      const today = new Date().toISOString().split('T')[0];
      const lastPracticeDate = stats.last_practice_date 
        ? new Date(stats.last_practice_date).toISOString().split('T')[0]
        : null;

      let newStreak = stats.current_streak;

      if (lastPracticeDate === today) {
        newStreak = stats.current_streak;
      } else if (lastPracticeDate) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (lastPracticeDate === yesterday) {
          newStreak = stats.current_streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, stats.longest_streak);
      const newXP = stats.xp_points + xpEarned;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await sql`
        UPDATE user_stats
        SET 
          total_questions_answered = total_questions_answered + ${totalQuestions},
          correct_answers = correct_answers + ${correctCount},
          current_streak = ${newStreak},
          longest_streak = ${longestStreak},
          last_practice_date = CURRENT_DATE,
          xp_points = ${newXP},
          level = ${newLevel},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;
    }

    await sql`
      INSERT INTO study_sessions (
        user_id,
        subject,
        questions_attempted,
        questions_correct,
        time_spent,
        session_date,
        xp_earned
      )
      VALUES (
        ${userId},
        ${subject},
        ${totalQuestions},
        ${correctCount},
        0,
        CURRENT_DATE,
        ${xpEarned}
      )
    `;

    await checkAndAwardAchievements(sql, userId, {
      totalQuestions: existingStats[0]?.total_questions_answered + totalQuestions || totalQuestions,
      correctAnswers: existingStats[0]?.correct_answers + correctCount || correctCount,
      currentStreak: existingStats[0]?.current_streak || 1,
      perfectSession: percentage === 100,
    });

    return NextResponse.json({ 
      success: true, 
      score: percentage,
      xpEarned,
      message: `Great work! You earned ${xpEarned} XP!`
    });
  } catch (error) {
    console.error('Practice completion error:', error);
    return NextResponse.json(
      { error: 'Failed to save practice score' },
      { status: 500 }
    );
  }
}

interface AchievementStats {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  perfectSession: boolean;
}

async function checkAndAwardAchievements(
  sql: typeof import('@/lib/db').sql, 
  userId: number, 
  stats: AchievementStats
) {
  try {
    const unearnedAchievements = await sql`
      SELECT a.* FROM achievements a
      WHERE a.id NOT IN (
        SELECT achievement_id FROM user_achievements WHERE user_id = ${userId}
      )
    `;

    for (const achievement of unearnedAchievements) {
      let earned = false;

      switch (achievement.requirement_type) {
        case 'total_questions':
          earned = stats.totalQuestions >= achievement.requirement_value;
          break;
        case 'correct_answers':
          earned = stats.correctAnswers >= achievement.requirement_value;
          break;
        case 'streak':
          earned = stats.currentStreak >= achievement.requirement_value;
          break;
        case 'perfect_session':
          earned = stats.perfectSession;
          break;
        case 'sessions':
          const sessionCount = await sql`
            SELECT COUNT(*) as count FROM study_sessions WHERE user_id = ${userId}
          `;
          earned = parseInt(sessionCount[0]?.count || '0') >= achievement.requirement_value;
          break;
      }

      if (earned) {
        await sql`
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (${userId}, ${achievement.id})
          ON CONFLICT DO NOTHING
        `;

        await sql`
          UPDATE user_stats
          SET xp_points = xp_points + ${achievement.xp_reward}
          WHERE user_id = ${userId}
        `;
      }
    }
  } catch (error) {
    console.error('Achievement check error:', error);
  }
}