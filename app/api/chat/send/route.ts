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
    const { recipientId, messageText } = body;

    if (!recipientId || !messageText || !messageText.trim()) {
      return NextResponse.json({ error: 'Invalid message data' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO chat_messages (sender_id, recipient_id, message_text, is_read, created_at)
      VALUES (${userId}, ${recipientId}, ${messageText.trim()}, FALSE, CURRENT_TIMESTAMP)
      RETURNING id, sender_id, recipient_id, message_text, is_read, created_at
    `;

    const message = result[0];

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderId: message.sender_id,
        recipientId: message.recipient_id,
        messageText: message.message_text,
        isRead: message.is_read,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}