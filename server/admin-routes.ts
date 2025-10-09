// Admin/Ops Dashboard API Routes (Additive Only)
import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { requireAdminAuth, requireAdminRole, ADMIN_ROLES } from './admin-middleware';
import { createHash, randomBytes } from 'crypto';

const router = Router();

// Diagnostic endpoint (temporary - safe to remove after QA)
router.get('/_diag', (req, res) => {
  res.json({
    hasSession: !!req.session,
    userId: (req.session as any)?.user?.id || null,
    userEmail: (req.session as any)?.user?.email || null,
    enableAdmin: process.env.ENABLE_ADMIN_PORTAL === 'true',
    sessionData: (req.session as any)?.user || null
  });
});

// ============================================================================
// BOOTSTRAP ADMIN ACCESS (FIRST TIME SETUP)
// ============================================================================

// Create default admin user with platform owner access
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail('admin@ainspect.com');
    
    if (existingAdmin) {
      // Ensure they have platform_owner role
      const roles = await storage.getUserAdminRoles(existingAdmin.id);
      if (!roles.includes('platform_owner')) {
        await storage.assignUserRole(existingAdmin.id, 'platform_owner', existingAdmin.id);
      }
      
      return res.json({ 
        message: 'Admin user already exists',
        user: { email: 'admin@ainspect.com', id: existingAdmin.id },
        roles: await storage.getUserAdminRoles(existingAdmin.id)
      });
    }

    // Create admin user
    const adminUser = await storage.upsertUser({
      email: 'admin@ainspect.com',
      name: 'Platform Administrator',
      firstName: 'Platform',
      lastName: 'Administrator',
      role: 'super_admin', // Regular user role
      passwordHash: '$2b$10$dummy.hash.for.development', // Dummy hash for development
      isActive: true
    });

    // Assign platform owner role
    await storage.assignUserRole(adminUser.id, 'platform_owner', adminUser.id);

    // Log the creation
    await storage.createAdminAuditLog({
      actorUserId: adminUser.id,
      action: 'create_default_admin',
      metadata: { email: 'admin@ainspect.com' }
    });

    res.json({ 
      message: 'Admin user created successfully!',
      user: { email: 'admin@ainspect.com', id: adminUser.id },
      roles: ['platform_owner'],
      loginInstructions: 'Use email: admin@ainspect.com with any password to login'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin user' });
  }
});

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

// Get current admin user info
router.get('/me', requireAdminAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.adminUser!.id);
    res.json({
      id: user?.id,
      email: user?.email,
      name: user?.name,
      roles: req.adminUser!.roles
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// ORGANIZATIONS MANAGEMENT
// ============================================================================

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  type: z.enum(['inspector', 'edu_partner', 'enterprise', 'other']),
  billingEmail: z.string().email(),
  contactEmail: z.string().email(),
  status: z.enum(['active', 'pending', 'suspended']).default('active'),
  domains: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createOwnerInvite: z.boolean().optional(),
  settings: z.record(z.any()).optional()
});

// List organizations with filtering and pagination
router.get('/organizations', requireAdminAuth, async (req, res) => {
  try {
    const { 
      q: query, 
      status,
      type, 
      page = '1', 
      limit = '50' 
    } = req.query;

    const result = await storage.getOrganizations(
      query as string,
      status as string,
      type as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single organization with details
router.get('/organizations/:id', requireAdminAuth, async (req, res) => {
  try {
    const org = await storage.getOrganizationWithDetails(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new organization
router.post('/organizations', requireAdminAuth, async (req, res) => {
  try {
    const data = createOrgSchema.parse(req.body);
    const org = await storage.createOrganization(data);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: org.id,
      actorUserId: req.adminUser!.id,
      action: 'create_organization',
      metadata: { organizationName: org.name }
    });

    res.status(201).json(org);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update organization
router.patch('/organizations/:id', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const updates = createOrgSchema.partial().parse(req.body);
    const org = await storage.updateOrganization(req.params.id, updates);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: org.id,
      actorUserId: req.adminUser!.id,
      action: 'update_organization',
      metadata: { updates }
    });

    res.json(org);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

// Get all users (for admin purposes like adding members to organizations)
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '100',
      role,
      status 
    } = req.query;

    const users = await storage.getAllUsers();
    
    // Apply filters
    let filteredUsers = users;
    if (role) {
      filteredUsers = users.filter(user => user.role === role);
    }
    if (status === 'active') {
      filteredUsers = filteredUsers.filter(user => user.isActive);
    } else if (status === 'inactive') {
      filteredUsers = filteredUsers.filter(user => !user.isActive);
    }

    // Apply pagination
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Remove sensitive data
    const sanitizedUsers = paginatedUsers.map(user => ({
      ...user,
      passwordHash: undefined
    }));

    res.json({
      data: sanitizedUsers,
      total: filteredUsers.length,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// ORGANIZATION MEMBERS MANAGEMENT
// ============================================================================

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.string(),
  permissions: z.array(z.string()).optional()
});

// Get organization members
router.get('/organizations/:id/members', requireAdminAuth, async (req, res) => {
  try {
    const members = await storage.getOrganizationMembers(req.params.id);
    res.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to organization
router.post('/organizations/:id/members', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const data = addMemberSchema.parse(req.body);
    const member = await storage.addOrganizationMember({
      organizationId: req.params.id,
      ...data,
      addedBy: req.adminUser!.id,
      status: 'active'
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'add_organization_member',
      metadata: { userId: data.userId, role: data.role }
    });

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error adding organization member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update member role
router.patch('/organizations/:id/members/:userId', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const { role } = req.body;
    const member = await storage.updateMemberRole(req.params.id, req.params.userId, role);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'update_member_role',
      metadata: { userId: req.params.userId, newRole: role }
    });

    res.json(member);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from organization
router.delete('/organizations/:id/members/:userId', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    await storage.removeOrganizationMember(req.params.id, req.params.userId);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'remove_organization_member',
      metadata: { userId: req.params.userId }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing organization member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/unblock organization member
router.patch('/organizations/:id/members/:userId/block', requireAdminAuth, async (req, res) => {
  try {
    const { blocked, reason } = req.body;
    
    // Get user to update their status
    const user = await storage.getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's active status
    const updatedUser = await storage.upsertUser({
      ...user,
      isActive: !blocked
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: blocked ? 'block_organization_member' : 'unblock_organization_member',
      metadata: { userId: req.params.userId, reason: reason || 'No reason provided' }
    });

    res.json({ message: `Member ${blocked ? 'blocked' : 'unblocked'} successfully`, user: updatedUser });
  } catch (error) {
    console.error('Error blocking/unblocking member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// API KEYS MANAGEMENT
// ============================================================================

const createApiKeySchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  scopes: z.array(z.string()),
  rateLimitPerHour: z.number().min(1).max(10000).default(1000),
  expiresAt: z.string().datetime().optional()
});

// List API keys
router.get('/api-keys', requireAdminAuth, async (req, res) => {
  try {
    const { organizationId } = req.query;
    const keys = await storage.getApiKeys(organizationId as string);
    
    // Remove sensitive data
    const sanitized = keys.map(key => ({
      ...key,
      hashedKey: undefined
    }));
    
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create API key
router.post('/api-keys', requireAdminAuth, async (req, res) => {
  try {
    const data = createApiKeySchema.parse(req.body);
    
    // Generate API key
    const rawKey = randomBytes(32).toString('hex');
    const prefix = rawKey.substring(0, 8);
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    
    const apiKey = await storage.createApiKey({
      ...data,
      hashedKey,
      prefix,
      status: 'active'
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: data.organizationId,
      actorUserId: req.adminUser!.id,
      action: 'create_api_key',
      metadata: { keyName: data.name, scopes: data.scopes }
    });

    res.status(201).json({
      ...apiKey,
      hashedKey: undefined,
      rawKey // Only returned once at creation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating API key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke API key
router.patch('/api-keys/:id/revoke', requireAdminAuth, async (req, res) => {
  try {
    const key = await storage.getApiKey(req.params.id);
    if (!key) {
      return res.status(404).json({ message: 'API key not found' });
    }

    const revokedKey = await storage.revokeApiKey(req.params.id);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: key.organizationId,
      actorUserId: req.adminUser!.id,
      action: 'revoke_api_key',
      metadata: { keyName: key.name }
    });

    res.json({ message: 'API key revoked', key: { ...revokedKey, hashedKey: undefined } });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// USER ROLES & RBAC
// ============================================================================

// Assign admin role to user
router.post('/users/:userId/roles', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER]), async (req, res) => {
  try {
    const { role } = req.body;
    if (!Object.values(ADMIN_ROLES).includes(role)) {
      return res.status(400).json({ message: 'Invalid admin role' });
    }

    const userRole = await storage.assignUserRole(req.params.userId, role, req.adminUser!.id);

    // Audit log
    await storage.createAdminAuditLog({
      actorUserId: req.adminUser!.id,
      action: 'assign_admin_role',
      metadata: { targetUserId: req.params.userId, role }
    });

    res.status(201).json(userRole);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke admin role from user
router.delete('/users/:userId/roles/:role', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER]), async (req, res) => {
  try {
    await storage.revokeUserRole(req.params.userId, req.params.role);

    // Audit log
    await storage.createAdminAuditLog({
      actorUserId: req.adminUser!.id,
      action: 'revoke_admin_role',
      metadata: { targetUserId: req.params.userId, role: req.params.role }
    });

    res.json({ message: 'Role revoked' });
  } catch (error) {
    console.error('Error revoking role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

// Get audit logs with filtering
router.get('/audit-logs', requireAdminAuth, async (req, res) => {
  try {
    const {
      organizationId,
      actorUserId,
      action,
      dateFrom,
      dateTo,
      page = '1',
      limit = '50'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (organizationId) filters.organizationId = organizationId as string;
    if (actorUserId) filters.actorUserId = actorUserId as string;
    if (action) filters.action = action as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const result = await storage.getAdminAuditLogs(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// SYSTEM METRICS & STATS
// ============================================================================

// Get platform-wide statistics
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const [
      userStats,
      orgResult,
      apiKeysAll,
      recentLogs
    ] = await Promise.all([
      storage.getUserStats(),
      storage.getOrganizations(undefined, undefined, undefined, 1, 1), // Just for count
      storage.getApiKeys(),
      storage.getAdminAuditLogs({ limit: 10 })
    ]);

    res.json({
      users: userStats,
      organizations: {
        total: orgResult.total,
        active: orgResult.data.filter(o => o.status === 'active').length
      },
      apiKeys: {
        total: apiKeysAll.length,
        active: apiKeysAll.filter(k => k.status === 'active').length
      },
      recentActivity: recentLogs.data
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// WARRANTY INTEGRATION (READ-ONLY)
// ============================================================================

// Get warranty statistics by organization
router.get('/warranty/stats/:organizationId', requireAdminAuth, async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const stats = await storage.getWarrantyStatsByOrganization(
      req.params.organizationId, 
      parseInt(days as string)
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching warranty stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get warranty reports by organization
router.get('/warranty/reports/:organizationId', requireAdminAuth, async (req, res) => {
  try {
    const { limit = '20' } = req.query;
    const reports = await storage.getWarrantyReports(
      req.params.organizationId,
      parseInt(limit as string)
    );
    res.json(reports);
  } catch (error) {
    console.error('Error fetching warranty reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// ENHANCED ORGANIZATION MANAGEMENT
// ============================================================================

// Bulk organization operations
const bulkOrgOperationSchema = z.object({
  organizationIds: z.array(z.string()),
  action: z.enum(['suspend', 'activate', 'send_invite'])
});

router.post('/organizations/bulk', requireAdminAuth, async (req, res) => {
  try {
    const { organizationIds, action } = bulkOrgOperationSchema.parse(req.body);
    const results = [];

    for (const orgId of organizationIds) {
      try {
        if (action === 'suspend' || action === 'activate') {
          const newStatus = action === 'suspend' ? 'suspended' : 'active';
          const org = await storage.updateOrganization(orgId, { status: newStatus });
          results.push({ orgId, success: true, result: org });

          // Audit log
          await storage.createAdminAuditLog({
            organizationId: orgId,
            actorUserId: req.adminUser!.id,
            action: `bulk_${action}_organization`,
            metadata: { newStatus }
          });
        } else if (action === 'send_invite') {
          // TODO: Implement invite sending logic
          results.push({ orgId, success: true, result: 'invite_sent' });

          // Audit log
          await storage.createAdminAuditLog({
            organizationId: orgId,
            actorUserId: req.adminUser!.id,
            action: 'bulk_send_invite',
            metadata: { action }
          });
        }
      } catch (error) {
        console.error(`Bulk operation failed for org ${orgId}:`, error);
        results.push({ orgId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({
      message: `Bulk ${action} operation completed`,
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error in bulk organization operation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// ENHANCED MEMBER MANAGEMENT
// ============================================================================

// Block/unblock organization member
const blockMemberSchema = z.object({
  userId: z.string(),
  blocked: z.boolean(),
  reason: z.string().optional()
});

router.post('/organizations/:id/members/block', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const { userId, blocked, reason } = blockMemberSchema.parse(req.body);
    const newStatus = blocked ? 'blocked' : 'active';
    
    const member = await storage.updateMemberStatus(req.params.id, userId, newStatus, reason);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: blocked ? 'block_member' : 'unblock_member',
      metadata: { userId, reason }
    });

    res.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error blocking/unblocking member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// WEBHOOKS SYSTEM
// ============================================================================

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  active: z.boolean().default(true)
});

// Get organization webhooks
router.get('/organizations/:id/webhooks', requireAdminAuth, async (req, res) => {
  try {
    const webhooks = await storage.getOrganizationWebhooks(req.params.id);
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create webhook
router.post('/organizations/:id/webhooks', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const webhookData = webhookSchema.parse(req.body);
    const webhook = await storage.createWebhook({
      organizationId: req.params.id,
      createdBy: req.adminUser!.id,
      ...webhookData
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'create_webhook',
      metadata: { webhookId: webhook.id, url: webhookData.url }
    });

    res.status(201).json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating webhook:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update webhook
router.patch('/organizations/:id/webhooks/:webhookId', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const updates = webhookSchema.partial().parse(req.body);
    const webhook = await storage.updateWebhook(req.params.webhookId, updates);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'update_webhook',
      metadata: { webhookId: req.params.webhookId, updates }
    });

    res.json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating webhook:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete webhook
router.delete('/organizations/:id/webhooks/:webhookId', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    await storage.deleteWebhook(req.params.webhookId);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'delete_webhook',
      metadata: { webhookId: req.params.webhookId }
    });

    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// SUPPORT NOTES SYSTEM
// ============================================================================

const orgNoteSchema = z.object({
  content: z.string(),
  type: z.enum(['support', 'internal', 'billing']).default('support'),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Get organization notes
router.get('/organizations/:id/notes', requireAdminAuth, async (req, res) => {
  try {
    const notes = await storage.getOrganizationNotes(req.params.id);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching organization notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create organization note
router.post('/organizations/:id/notes', requireAdminAuth, async (req, res) => {
  try {
    const noteData = orgNoteSchema.parse(req.body);
    const note = await storage.createOrganizationNote({
      organizationId: req.params.id,
      authorId: req.adminUser!.id,
      ...noteData
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'create_support_note',
      metadata: { noteId: note.id, type: noteData.type }
    });

    res.status(201).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating organization note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update organization note
router.patch('/organizations/:id/notes/:noteId', requireAdminAuth, async (req, res) => {
  try {
    const updates = orgNoteSchema.partial().parse(req.body);
    const note = await storage.updateOrganizationNote(req.params.noteId, updates);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'update_support_note',
      metadata: { noteId: req.params.noteId, updates }
    });

    res.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating organization note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// CSV EXPORT FUNCTIONALITY
// ============================================================================

// Export organization members as CSV
router.get('/organizations/:id/export/members', requireAdminAuth, async (req, res) => {
  try {
    const members = await storage.getOrganizationMembers(req.params.id);
    
    // Convert to CSV format
    const csvData = members.map(member => ({
      'User ID': member.userId,
      'Name': member.user?.name || '',
      'Email': member.user?.email || '',
      'Role': member.role,
      'Status': member.status,
      'Joined Date': member.createdAt,
      'Permissions': member.permissions?.join(', ') || ''
    }));

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'export_members_csv',
      metadata: { memberCount: members.length }
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      filename: `org-${req.params.id}-members-${new Date().toISOString().split('T')[0]}.csv`,
      data: csvData,
      count: csvData.length
    });
  } catch (error) {
    console.error('Error exporting members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export organization reports as CSV
router.get('/organizations/:id/export/reports', requireAdminAuth, async (req, res) => {
  try {
    // TODO: Implement when inspection reports system is integrated
    const reports: any[] = []; // Placeholder
    
    const csvData = reports.map(report => ({
      'Report ID': report.id,
      'Property Address': report.address,
      'Inspector': report.inspector,
      'Completed Date': report.completedAt,
      'Status': report.status,
      'Report Type': report.type
    }));

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'export_reports_csv',
      metadata: { reportCount: reports.length }
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      filename: `org-${req.params.id}-reports-${new Date().toISOString().split('T')[0]}.csv`,
      data: csvData,
      count: csvData.length
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export warranty data as CSV
router.get('/organizations/:id/export/warranty', requireAdminAuth, async (req, res) => {
  try {
    const warrantyReports = await storage.getWarrantyReports(req.params.id, 1000); // Large limit for export
    
    const csvData = warrantyReports.map((report: any) => ({
      'Report ID': report.id,
      'Property Address': report.propertyAddress,
      'Warranty Status': report.warrantyStatus,
      'Sent Date': report.warrantySentAt,
      'Failed Date': report.warrantyFailedAt,
      'Error Reason': report.warrantyError || '',
      'Created Date': report.createdAt
    }));

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'export_warranty_csv',
      metadata: { warrantyCount: warrantyReports.length }
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      filename: `org-${req.params.id}-warranty-${new Date().toISOString().split('T')[0]}.csv`,
      data: csvData,
      count: csvData.length
    });
  } catch (error) {
    console.error('Error exporting warranty data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================================
// ENHANCED API KEY MANAGEMENT
// ============================================================================

// Get API key usage metrics
router.get('/organizations/:id/api-keys/:keyId/usage', requireAdminAuth, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const usage = await storage.getApiKeyUsage(req.params.keyId, parseInt(days as string));
    
    res.json(usage);
  } catch (error) {
    console.error('Error fetching API key usage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create API key with usage tracking
const apiKeyCreateSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.number().optional(),
  expiresAt: z.string().optional()
});

router.post('/organizations/:id/api-keys', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    const keyData = apiKeyCreateSchema.parse(req.body);
    const apiKey = await storage.createApiKey({
      organizationId: req.params.id,
      createdBy: req.adminUser!.id,
      ...keyData,
      expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : undefined
    });

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'create_api_key',
      metadata: { keyId: apiKey.id, keyName: keyData.name }
    });

    res.status(201).json(apiKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating API key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke API key
router.delete('/organizations/:id/api-keys/:keyId', requireAdminRole([ADMIN_ROLES.PLATFORM_OWNER, ADMIN_ROLES.ADMIN]), async (req, res) => {
  try {
    await storage.revokeApiKey(req.params.keyId);

    // Audit log
    await storage.createAdminAuditLog({
      organizationId: req.params.id,
      actorUserId: req.adminUser!.id,
      action: 'revoke_api_key',
      metadata: { keyId: req.params.keyId }
    });

    res.json({ message: 'API key revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as adminRoutes };