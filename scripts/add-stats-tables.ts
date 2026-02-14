import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function addStatsTables() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🗄️  Adding stats system tables...\n');

    console.log('Creating user_stats table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_questions_answered INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_practice_time INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_practice_date DATE,
        xp_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ User stats table created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_stats_xp ON user_stats(xp_points DESC)
    `;
    console.log('Creating achievements table...');
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        xp_reward INTEGER DEFAULT 0,
        requirement_type VARCHAR(50),
        requirement_value INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Achievements table created');

    console.log('Creating user_achievements table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `;
    console.log('✅ User achievements table created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)
    `;

    console.log('Creating chat_messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Chat messages table created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_recipient ON chat_messages(recipient_id, is_read, created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages(sender_id, recipient_id, created_at DESC)
    `;

    console.log('Creating study_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(50),
        questions_attempted INTEGER,
        questions_correct INTEGER,
        time_spent INTEGER,
        session_date DATE DEFAULT CURRENT_DATE,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Study sessions table created');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, session_date DESC)
    `;

    console.log('\n🏆 Creating default achievements...');
    
    const achievements = [
      { name: 'First Steps', description: 'Complete your first practice session', icon: '🎯', xp_reward: 50, requirement_type: 'sessions', requirement_value: 1 },
      { name: 'Quick Learner', description: 'Answer 10 questions correctly', icon: '💡', xp_reward: 100, requirement_type: 'correct_answers', requirement_value: 10 },
      { name: 'Dedicated Student', description: 'Maintain a 3-day practice streak', icon: '🔥', xp_reward: 150, requirement_type: 'streak', requirement_value: 3 },
      { name: 'Week Warrior', description: 'Maintain a 7-day practice streak', icon: '⚡', xp_reward: 300, requirement_type: 'streak', requirement_value: 7 },
      { name: 'Perfect Score', description: 'Get 100% on a practice session', icon: '🌟', xp_reward: 200, requirement_type: 'perfect_session', requirement_value: 1 },
      { name: 'Century Club', description: 'Answer 100 questions', icon: '💯', xp_reward: 500, requirement_type: 'total_questions', requirement_value: 100 },
      { name: 'Math Master', description: 'Get 90%+ average in Math', icon: '🧮', xp_reward: 400, requirement_type: 'subject_mastery', requirement_value: 90 },
      { name: 'Verbal Virtuoso', description: 'Get 90%+ average in Reading/Writing', icon: '📚', xp_reward: 400, requirement_type: 'subject_mastery', requirement_value: 90 },
    ];

    for (const achievement of achievements) {
      await sql`
        INSERT INTO achievements (name, description, icon, xp_reward, requirement_type, requirement_value)
        VALUES (${achievement.name}, ${achievement.description}, ${achievement.icon}, ${achievement.xp_reward}, ${achievement.requirement_type}, ${achievement.requirement_value})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log('✅ Default achievements created');

    console.log('\n🎉 Stats system tables added successfully!\n');
    console.log('New tables created:');
    console.log('  ✅ user_stats');
    console.log('  ✅ achievements');
    console.log('  ✅ user_achievements');
    console.log('  ✅ chat_messages');
    console.log('  ✅ study_sessions');
    console.log('\nYour existing tables (users, scores, posts, questions) were not modified.');
    console.log('');
  } catch (error) {
    console.error('❌ Error adding tables:', error);
    process.exit(1);
  }
}

addStatsTables();