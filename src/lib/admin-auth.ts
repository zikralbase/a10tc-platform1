import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'a10tc_admin_session';

function buildSessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || 'a10tc';
  return crypto.createHash('sha256').update(`${secret}:${salt}`).digest('hex');
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, buildSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token === buildSessionToken() && Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}