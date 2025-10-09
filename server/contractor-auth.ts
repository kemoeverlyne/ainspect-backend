import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { contractorPortal } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.CONTRACTOR_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CONTRACTOR_JWT_SECRET environment variable is required');
}
const SALT_ROUNDS = 10;

export interface ContractorAuthenticatedRequest extends Request {
  contractor?: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    creditsBalance: number;
    isActive: boolean;
  };
}

// Validate email format
export function validateContractorEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validateContractorPassword(password: string): { isValid: boolean; errors: string[] } {
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
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Hash password
export async function hashContractorPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
export async function compareContractorPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateContractorToken(contractorId: string, email: string): string {
  return jwt.sign(
    { contractorId, email, type: 'contractor' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyContractorToken(token: string): { contractorId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'contractor') {
      return null;
    }
    return { contractorId: decoded.contractorId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

// Get contractor by email
export async function getContractorByEmail(email: string) {
  const contractors = await db.select().from(contractorPortal).where(eq(contractorPortal.email, email));
  return contractors[0] || null;
}

// Get contractor by ID
export async function getContractorById(id: string) {
  const contractors = await db.select().from(contractorPortal).where(eq(contractorPortal.id, id));
  return contractors[0] || null;
}

// Create contractor
export async function createContractor(contractorData: {
  name: string;
  email: string;
  passwordHash: string;
  companyName: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
}) {
  const contractors = await db.insert(contractorPortal).values(contractorData).returning();
  return contractors[0];
}

// Authenticate contractor token middleware
export async function authenticateContractorToken(
  req: ContractorAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.contractorToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = verifyContractorToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const contractor = await getContractorById(decoded.contractorId);
    if (!contractor) {
      return res.status(401).json({ message: 'Contractor not found' });
    }

    if (!contractor.isActive) {
      return res.status(403).json({ message: 'Contractor account is inactive' });
    }

    req.contractor = {
      id: contractor.id,
      name: contractor.name,
      email: contractor.email,
      companyName: contractor.companyName,
      creditsBalance: contractor.creditsBalance,
      isActive: contractor.isActive,
    };

    next();
  } catch (error) {
    console.error('Contractor token authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

// Optional contractor auth middleware
export async function optionalContractorAuth(
  req: ContractorAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.contractorToken;
    
    if (token) {
      const decoded = verifyContractorToken(token);
      if (decoded) {
        const contractor = await getContractorById(decoded.contractorId);
        if (contractor && contractor.isActive) {
          req.contractor = {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            companyName: contractor.companyName,
            creditsBalance: contractor.creditsBalance,
            isActive: contractor.isActive,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional contractor auth error:', error);
    next();
  }
}