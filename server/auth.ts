/**
 * Server Authentication and Authorization for QUANG HƯNG.
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, hashSecret } from './db.js';
import type { UserProfile } from '../src/types/index.js';

// In-memory active session tokens
interface SessionData {
  userId: string;
  role: 'teacher' | 'student';
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

// Rate limiting for login attempts: IP / key -> { attempts: number, lockUntil: number }
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

export function checkRateLimit(key: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  if (now > record.lockUntil && record.attempts >= 5) {
    // Reset after cooldown
    loginAttempts.delete(key);
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 5 * 60 * 1000; // 5 minute lockout
  }
  loginAttempts.set(key, record);
}

export function resetAttempts(key: string): void {
  loginAttempts.delete(key);
}

export function createSession(userId: string, role: 'teacher' | 'student'): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    role,
    createdAt: Date.now(),
  });
  return token;
}

export function getSession(token: string): SessionData | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  // Session expiry after 7 days
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function removeSession(token: string): void {
  sessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.qh_session) {
    token = req.cookies.qh_session;
  }

  if (!token) {
    return next();
  }

  const session = getSession(token);
  if (!session) {
    return next();
  }

  const data = db.getData();
  const profile = data.profiles.find((p) => p.id === session.userId);
  if (profile && profile.status === 'active') {
    // Strip sensitive fields
    const { passwordHash, pinHash, ...safeProfile } = profile as any;
    req.user = safeProfile;
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện thao tác này.' });
    return;
  }
  next();
}

export function requireTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'teacher') {
    res.status(403).json({ error: 'Chỉ giáo viên mới có quyền truy cập khu vực này.' });
    return;
  }
  next();
}

export function requireStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'student') {
    res.status(403).json({ error: 'Chỉ học sinh mới có quyền truy cập.' });
    return;
  }
  next();
}
