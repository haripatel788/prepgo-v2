import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    if (typeof userId !== 'number') {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const conversations = await sql`
      WITH recent_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id 
            ELSE sender_id 
          END
        )
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id 
            ELSE sender_id 
          END as other_user_id,
          message_text,
          created_at,
          sender_id
        FROM chat_messages
        WHERE sender_id = ${userId} OR recipient_id = ${userId}
        ORDER BY 
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id 
            ELSE sender_id 
          END,
          created_at DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as other_user_id,
          COUNT(*) as unread_count
        FROM chat_messages
        WHERE recipient_id = ${userId} AND is_read = FALSE
        GROUP BY sender_id
      )
      SELECT 
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_pic,
        rm.message_text as last_message,
        rm.created_at as last_message_time,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM recent_messages rm
      JOIN users u ON u.id = rm.other_user_id
      LEFT JOIN unread_counts uc ON uc.other_user_id = u.id
      ORDER BY rm.created_at DESC
    `;

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        userId: conv.user_id,
        username: conv.username,
        firstName: conv.first_name,
        lastName: conv.last_name,
        profilePic: conv.profile_pic,
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_time,
        unreadCount: Number(conv.unread_count),
      })),
    });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}