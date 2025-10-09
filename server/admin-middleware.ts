// Admin middleware for RBAC (additive only - no changes to existing auth)
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { verifyToken } from './auth';

// Extend Request interface to include admin user info
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

// Session user type (matching existing auth)
interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

// Admin role hierarchy
export const ADMIN_ROLES = {
  PLATFORM_OWNER: 'platform_owner',
  ADMIN: 'admin',
  SUPPORT: 'support',
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

// Check if user has admin privileges
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for session-based auth first (super admin)
    if (req.session?.user) {
      const user = req.session.user as SessionUser;
      if (user.email === 'admin@ainspect.com') {
        req.adminUser = {
          id: user.id,
          email: user.email,
          roles: ['platform_owner']
        };
        return next();
      }
    }
    
    // Get JWT token from cookie (regular auth system)
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    // Verify JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    // Get user from storage
    const user = await storage.getUser(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const userId = user.id;
    
    // Special case: If this is the super admin user, grant platform owner access
    if (user.email === 'admin@ainspect.com') {
      // Ensure they have platform owner role in database
      const adminRoles = await storage.getUserAdminRoles(userId);
      if (!adminRoles.includes('platform_owner')) {
        await storage.assignUserRole(userId, 'platform_owner', userId);
      }
      
      // Attach admin user info to request
      req.adminUser = {
        id: userId,
        email: user.email,
        roles: ['platform_owner']
      };
      return next();
    }
    
    // Get user's admin roles
    const userRoles = await storage.getUserAdminRoles(userId);
    
    if (!userRoles || userRoles.length === 0) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Attach admin user info to request
    req.adminUser = {
      id: userId,
      email: user.email,
      roles: userRoles
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Check specific admin role
export function requireAdminRole(requiredRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const hasRequiredRole = requiredRoles.some(role => 
      req.adminUser!.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        message: `Requires one of: ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
}

// Log admin action to audit trail
export async function logAdminAction(
  actorUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: any,
  organizationId?: string,
  ip?: string
) {
  try {
    await storage.createAdminAuditLog({
      actorUserId,
      action,
      targetType,
      targetId,
      metadata,
      organizationId,
      ip
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - audit logging failure shouldn't break the operation
  }
}

// Middleware to automatically log admin actions
export function auditAction(action: string, getTargetInfo?: (req: Request) => { type?: string; id?: string; orgId?: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log action after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const targetInfo = getTargetInfo ? getTargetInfo(req) : {};
          logAdminAction(
            req.adminUser!.id,
            action,
            targetInfo.type,
            targetInfo.id,
            {
              method: req.method,
              url: req.url,
              body: req.body,
              params: req.params,
              query: req.query
            },
            targetInfo.orgId,
            req.ip
          );
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
}