import { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";
import crypto from "crypto";

const createUserInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["super_admin", "manager", "inspector", "read_only"]).default("inspector"),
  managerId: z.string().optional(),
  branchOfficeId: z.string().optional()
});

const updateUserRoleSchema = z.object({
  role: z.enum(["super_admin", "manager", "inspector", "read_only"]),
  managerId: z.string().optional()
});

const updateUserLicenseSchema = z.object({
  licenseNumber: z.string().min(1)
});

export function registerUserManagementRoutes(app: Express) {
  // Get all users with filtering and pagination
  app.get('/api/user-management/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, role, search } = req.query;
      let users = await storage.getAllUsers();

      // Apply filters
      if (status === 'active') {
        users = users.filter(user => user.isActive);
      } else if (status === 'inactive') {
        users = users.filter(user => !user.isActive);
      }

      if (role && role !== 'all') {
        users = users.filter(user => user.role === role);
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        users = users.filter(user => 
          user.email?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm)
        );
      }

      // For managers, only show their assigned inspectors
      if (currentUser.role === 'manager') {
        users = users.filter(user => 
          user.managerId === currentUser.id || 
          user.id === currentUser.id
        );
      }

      // Remove password hashes from response
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user statistics
  app.get('/api/user-management/stats', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getUserStats();
      const activeUsers = await storage.getActiveUsers();
      const pendingInvites = await storage.getPendingUserInvitations();

      // Calculate online users (those who logged in within last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const onlineUsers = activeUsers.filter(user => 
        user.lastLoginAt && user.lastLoginAt > thirtyMinutesAgo
      );

      res.json({
        totalInspectors: stats.byRole.inspector || 0,
        activeUsers: stats.active,
        onlineNow: onlineUsers.length,
        pendingInvites: pendingInvites.length,
        adminUsers: (stats.byRole.super_admin || 0) + (stats.byRole.manager || 0),
        byRole: stats.byRole
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Create user invitation
  app.post('/api/user-management/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = createUserInvitationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if there's already a pending invitation
      const allInvitations = await storage.getAllUserInvitations();
      const existingInvitation = allInvitations.find(inv => 
        inv.email === validatedData.email && 
        inv.isActive && 
        !inv.acceptedAt
      );
      if (existingInvitation) {
        return res.status(400).json({ message: "Pending invitation already exists for this email" });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await storage.createUserInvitation({
        email: validatedData.email,
        role: validatedData.role,
        invitedBy: currentUser.id,
        managerId: validatedData.managerId || null,
        branchOfficeId: validatedData.branchOfficeId || null,
        token,
        expiresAt,
        isActive: true
      });

      // Log the invitation
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'user_invited',
        entityType: 'invitation',
        entityId: invitation.id,
        details: { 
          email: validatedData.email, 
          role: validatedData.role 
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get all invitations
  app.get('/api/user-management/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      let invitations = await storage.getAllUserInvitations();

      if (status === 'pending') {
        invitations = await storage.getPendingUserInvitations();
      } else if (status === 'accepted') {
        invitations = invitations.filter(inv => inv.acceptedAt !== null);
      } else if (status === 'expired') {
        const now = new Date();
        invitations = invitations.filter(inv => 
          inv.expiresAt < now && !inv.acceptedAt
        );
      }

      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Cancel invitation
  app.delete('/api/user-management/invitations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.cancelUserInvitation(id);

      // Log the cancellation
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'invitation_cancelled',
        entityType: 'invitation',
        entityId: id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Resend invitation
  app.post('/api/user-management/invitations/:id/resend', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const invitation = await storage.resendUserInvitation(id);

      // Log the resend
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'invitation_resent',
        entityType: 'invitation',
        entityId: id,
        details: { email: invitation.email },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      res.json(invitation);
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // Update user role
  app.patch('/api/user-management/users/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can change roles" });
      }

      const { userId } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserRole(userId, validatedData.role, validatedData.managerId);

      // Log the role change
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'role_changed',
        entityType: 'user',
        entityId: userId,
        details: { 
          newRole: validatedData.role, 
          managerId: validatedData.managerId 
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user license
  app.patch('/api/user-management/users/:userId/license', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;
      const validatedData = updateUserLicenseSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserLicense(userId, validatedData.licenseNumber);

      // Log the license update
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'license_updated',
        entityType: 'user',
        entityId: userId,
        details: { licenseNumber: validatedData.licenseNumber },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating license:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update license" });
    }
  });

  // Deactivate user
  app.patch('/api/user-management/users/:userId/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can deactivate users" });
      }

      const { userId } = req.params;
      const deactivatedUser = await storage.deactivateUser(userId);

      // Log the deactivation
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'user_deactivated',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      const { passwordHash, ...userWithoutPassword } = deactivatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Get user activity logs
  app.get('/api/user-management/activity', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId, limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string) : 50;

      let activity;
      if (userId) {
        activity = await storage.getAuditLogsByUser(userId as string, limitNumber);
      } else {
        activity = await storage.getRecentUserActivity(limitNumber);
      }

      // Get user details for each activity log
      const enrichedActivity = await Promise.all(
        activity.map(async (log) => {
          let user = null;
          if (log.userId) {
            user = await storage.getUser(log.userId);
            if (user) {
              const { passwordHash, ...userWithoutPassword } = user;
              user = userWithoutPassword;
            }
          }
          return { ...log, user };
        })
      );

      res.json(enrichedActivity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Get branch offices
  app.get('/api/user-management/branches', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const branches = await storage.getAllBranchOffices();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branch offices" });
    }
  });
}