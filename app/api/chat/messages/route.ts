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

    const { searchParams } = new URL(request.url);
    const otherUserId = parseInt(searchParams.get('userId') || '0');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const messages = await sql`
      SELECT 
        cm.id,
        cm.sender_id,
        cm.recipient_id,
        cm.message_text,
        cm.is_read,
        cm.created_at,
        u.first_name as sender_name,
        u.profile_pic as sender_pic
      FROM chat_messages cm
      JOIN users u ON u.id = cm.sender_id
      WHERE 
        (cm.sender_id = ${userId} AND cm.recipient_id = ${otherUserId})
        OR
        (cm.sender_id = ${otherUserId} AND cm.recipient_id = ${userId})
      ORDER BY cm.created_at ASC
    `;

    await sql`
      UPDATE chat_messages
      SET is_read = TRUE
      WHERE recipient_id = ${userId} AND sender_id = ${otherUserId} AND is_read = FALSE
    `;

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        messageText: msg.message_text,
        isRead: msg.is_read,
        createdAt: msg.created_at,
        senderName: msg.sender_name,
        senderPic: msg.sender_pic,
      })),
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}