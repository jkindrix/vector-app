import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';
import { Database } from '../database';

const COOKIE_NAME = 'token';
const IS_PROD = process.env.NODE_ENV === 'production';

function setTokenCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: '/',
  });
}

function clearTokenCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
  });
}

export function authRouter(db: Database) {
  const router = Router();

  // Login endpoint
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      // Get admin user from database
      const admin = await db.getAdminUser(username);
      if (!admin) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const token = generateToken({ id: admin.id, username: admin.username });

      setTokenCookie(res, token);

      res.json({
        token,
        user: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verify token endpoint
  router.get('/verify', (req: Request, res: Response): void => {
    const cookieToken = req.cookies?.[COOKIE_NAME];
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const token = cookieToken || headerToken;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }
      const decoded = jwt.verify(token, secret);
      res.json({ valid: true, user: decoded });
    } catch (error) {
      res.status(403).json({ valid: false, error: 'Invalid token' });
    }
  });

  // Logout endpoint
  router.post('/logout', (_req: Request, res: Response): void => {
    clearTokenCookie(res);
    res.json({ success: true });
  });

  return router;
}
