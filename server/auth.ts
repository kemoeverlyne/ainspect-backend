import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Define User type for SQLite
export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
  role: string;
  licenseNumber?: string | null;
  managerId?: string | null;
  branchOfficeId?: string | null;
  phone?: string | null;
  isActive: boolean;
  invitedBy?: string | null;
  invitedAt?: Date | null;
  lastLoginAt?: Date | null;
  tosAcceptedAt?: Date | null;
  privacyAcceptedAt?: Date | null;
  optInNonFlaggedAt?: Date | null;
  digitalSignature?: string | null;
  signatureDate?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Use the same JWT secret as API Gateway for compatibility
// Force the exact same secret as API Gateway
export const JWT_SECRET = '9cd6d69f6f2b4849bb6be1c521745c991cbdedf5ce3c75f1404767cdfd70010661c4c0e23e3d65a32ed1c89719784312cd8f8963a9b837c9296c7570dc551bda';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Debug: Log the JWT secret being used
console.log(`[AUTH] Backend JWT_SECRET: ${JWT_SECRET.substring(0, 20)}...`);
const SALT_ROUNDS = 10;

// AuthenticatedRequest is now just Request with the user property from module augmentation
export type AuthenticatedRequest = Request;

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Generate password hash (alias for hashPassword for consistency)
export async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userData: { id: string; email?: string; role?: string }): string {
  const payload = {
    userId: userData.id,
    id: userData.id, // Include both for compatibility
    email: userData.email || '',
    role: userData.role || 'inspector'
  };
  
  const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: '7d' });
  
  console.log(`[TOKEN GENERATION] Created token for user:`, {
    userId: userData.id,
    email: userData.email,
    role: userData.role,
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + '...',
    expiresIn: '7d',
    createdAt: new Date().toISOString()
  });
  
  return token;
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as any;
    console.log(`[AUTH] Token payload structure:`, { 
      hasUserId: !!payload.userId, 
      hasId: !!payload.id, 
      keys: Object.keys(payload),
      payload: payload 
    });
    
    // Handle both token formats: API Gateway format (id) and Backend format (userId)
    if (payload.userId) {
      return { userId: payload.userId };
    } else if (payload.id) {
      return { userId: payload.id };
    }
    
    console.log(`[AUTH] No valid userId found in token payload`);
    return null;
  } catch (error) {
    console.log(`[AUTH] Token verification failed:`, error.message);
    return null;
  }
}

// Authentication middleware - TEMPORARILY DISABLED FOR DEVELOPMENT
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Debug headers received by backend
    console.log(`[AUTH DEBUG] Headers received by backend for ${req.path}:`, {
      authorization: req.headers['authorization'],
      authLength: req.headers['authorization']?.length || 'N/A',
      authPreview: req.headers['authorization']?.substring(0, 50) + '...' || 'NONE',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log(`[AUTH] No token provided for ${req.path}`);
      return res.status(401).json({ message: 'Access token required' });
    }

    // Debug token structure and content
    console.log(`[AUTH DEBUG] Token analysis for ${req.path}:`, {
      tokenLength: token.length,
      tokenParts: token.split('.').length,
      tokenHeader: token.split('.')[0]?.substring(0, 20) + '...',
      tokenPreview: token.substring(0, 50) + '...',
      tokenEnding: '...' + token.substring(token.length - 20),
      jwtSecretLength: JWT_SECRET.length,
      jwtSecretPreview: JWT_SECRET.substring(0, 20) + '...'
    });
    
    // Try to decode without verification first to see structure
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log(`[AUTH ERROR] Token has ${parts.length} parts, expected 3`);
        return res.status(401).json({ message: 'Invalid token format' });
      }

      // Decode header and payload without verification
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log(`[AUTH DEBUG] Token structure:`, { 
        header, 
        payload: { 
          userId: payload.userId, 
          id: payload.id, 
          email: payload.email,
          exp: payload.exp,
          iat: payload.iat
        }
      });

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log(`[AUTH ERROR] Token expired: exp=${new Date(payload.exp * 1000)}, now=${new Date()}`);
        return res.status(401).json({ message: 'Token expired' });
      }

    } catch (decodeError) {
      console.log(`[AUTH ERROR] Token decode failed:`, decodeError);
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Verify JWT token with our secret
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[AUTH SUCCESS] Token verified:`, { decoded });
      
      // Create User object from decoded token (handle both userId and id fields)
      const userPayload: any = decoded;
      const userId = userPayload.userId || userPayload.id;
      
      if (!userId) {
        console.log(`[AUTH ERROR] Token missing user ID:`, { 
          payload: userPayload, 
          hasUserId: !!userPayload.userId, 
          hasId: !!userPayload.id 
        });
        return res.status(401).json({ message: 'Invalid token: missing user ID' });
      }
      
      // Create proper User object for request
      req.user = {
        id: userId,
        email: userPayload.email || '',
        role: userPayload.role || 'inspector',
        ...userPayload
      } as User;
      
      console.log(`[AUTH COMPLETE] User authenticated:`, { 
        userId, 
        email: req.user.email, 
        role: req.user.role 
      });
      next();
    } catch (jwtError) {
      console.log(`[AUTH ERROR] JWT verification failed for ${req.path}:`, {
        error: jwtError.message,
        tokenPreview: token.substring(0, 30) + '...',
        secretLength: JWT_SECRET.length
      });
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// Optional authentication middleware (for routes that can work with or without auth)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.cookies?.auth_token;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1);

        if (user && user.isActive) {
          req.user = user as User;
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user as User || null;
}

// Create new user with agreement tracking
export async function createUser(userData: {
  email: string;
  password: string;
  name?: string;
  role?: string;
  tosAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  optInNonFlaggedAt?: Date | null;
  digitalSignature?: string;
  signatureDate?: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<User> {
  const passwordHash = await hashPassword(userData.password);
  const id = randomUUID();
  const now = new Date();

  const [newUser] = await db
    .insert(users)
    .values({
      id,
      email: userData.email,
      passwordHash,
      name: userData.name || null,
      role: (userData.role || 'inspector') as any,
      tosAcceptedAt: userData.tosAcceptedAt || null,
      privacyAcceptedAt: userData.privacyAcceptedAt || null,
      optInNonFlaggedAt: userData.optInNonFlaggedAt || null,
      digitalSignature: userData.digitalSignature || null,
      signatureDate: userData.signatureDate || null,
      ipAddress: userData.ipAddress || null,
      userAgent: userData.userAgent || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return newUser as User;
}