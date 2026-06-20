import { NextRequest, NextResponse } from 'next/server';
import { setAdminSession, clearAdminSession, verifyAdminPassword } from '@/lib/admin-auth';

interface LoginRequestBody {
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json()) as LoginRequestBody;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    await setAdminSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}