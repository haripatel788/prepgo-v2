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

    await jwtVerify(token, JWT_SECRET);

    const users = await sql`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        profile_pic
      FROM users
      ORDER BY first_name, last_name
    `;

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePic: user.profile_pic,
      })),
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}