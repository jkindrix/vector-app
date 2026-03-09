import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getAdminUser } from './database';

const COOKIE_NAME = 'token';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function generateToken(payload: { id: string; username: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' });
}

export function verifyToken(token: string): { id: string; username: string } | null {
  try {
    return jwt.verify(token, getSecret()) as { id: string; username: string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<{ id: string; username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function authenticate(username: string, password: string): Promise<{ token: string; user: { id: string; username: string } } | null> {
  const admin = await getAdminUser(username);
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return null;

  const token = generateToken({ id: admin.id, username: admin.username });
  return { token, user: { id: admin.id, username: admin.username } };
}

export function setTokenCookie(token: string): { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: 'strict'; maxAge: number; path: string } {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  };
}

export function clearTokenCookie(): { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: 'strict'; maxAge: number; path: string } {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  };
}
