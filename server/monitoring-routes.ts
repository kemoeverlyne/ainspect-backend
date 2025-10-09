import { Router } from 'express';
import { db } from './db';
import { 
  systemLogs, 
  jobQueue, 
  supportTickets, 
  supportTicketComments,
  systemAlerts,
  systemMetrics,
  impersonationLogs,
  users
} from '@shared/schema';
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm';
import { appLogger, requestLoggingMiddleware } from './logger';
import { jobManager } from './job-queue';
import { authenticateToken } from './auth';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const router = Router();

// Apply auth and logging middleware
router.use(authenticateToken);
router.use(requestLoggingMiddleware);

// Helper middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Validation schemas
const createSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const createTicketCommentSchema = createInsertSchema(supportTicketComments).omit({
  id: true,
  createdAt: true,
});

const impersonateUserSchema = z.object({
  targetUserId: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().min(5).max(480), // 5 minutes to 8 hours
});

// ====================
// SYSTEM LOGS ENDPOINTS
// ====================

// Get system logs with filtering and pagination
router.get('/logs', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level, 
      source, 
      startDate, 
      endDate,
      userId,
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = db.select().from(systemLogs);
    const conditions = [];

    if (level) conditions.push(eq(systemLogs.level, level as string));
    if (source) conditions.push(eq(systemLogs.source, source as string));
    if (userId) conditions.push(eq(systemLogs.userId, userId as string));
    if (startDate) conditions.push(gte(systemLogs.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(systemLogs.createdAt, new Date(endDate as string)));
    if (search) conditions.push(sql`${systemLogs.message} ILIKE ${`%${search}%`}`);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(systemLogs.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(systemLogs);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    await appLogger.error('Failed to fetch system logs', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get log statistics
router.get('/logs/stats', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const hoursBack = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 24;
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const stats = await db
      .select({
        level: systemLogs.level,
        count: count()
      })
      .from(systemLogs)
      .where(gte(systemLogs.createdAt, startTime))
      .groupBy(systemLogs.level);

    const sourceStats = await db
      .select({
        source: systemLogs.source,
        count: count()
      })
      .from(systemLogs)
      .where(gte(systemLogs.createdAt, startTime))
      .groupBy(systemLogs.source);

    res.json({
      levelStats: stats,
      sourceStats,
      period: `${hoursBack}h`
    });
  } catch (error) {
    await appLogger.error('Failed to fetch log stats', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

// ====================
// JOB QUEUE ENDPOINTS
// ====================

// Get job queue status and statistics
router.get('/jobs', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      name,
      startDate,
      endDate 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = db.select().from(jobQueue);
    const conditions = [];

    if (status) conditions.push(eq(jobQueue.status, status as string));
    if (name) conditions.push(eq(jobQueue.name, name as string));
    if (startDate) conditions.push(gte(jobQueue.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(jobQueue.createdAt, new Date(endDate as string)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const jobs = await query
      .orderBy(desc(jobQueue.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get Bull queue stats
    const queueStats = await jobManager.getJobStats();

    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(jobQueue);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    res.json({
      jobs,
      queueStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    await appLogger.error('Failed to fetch job queue', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to fetch job queue' });
  }
});

// Retry a failed job
router.post('/jobs/:jobId/retry', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const success = await jobManager.retryJob(jobId);
    
    if (success) {
      await appLogger.info(`Job retried by admin: ${jobId}`, {
        source: 'monitoring-api',
        adminId: req.user.id,
        jobId
      });
      res.json({ success: true, message: 'Job retried successfully' });
    } else {
      res.status(400).json({ error: 'Job cannot be retried' });
    }
  } catch (error) {
    await appLogger.error('Failed to retry job', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id,
      jobId: req.params.jobId
    });
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// Cancel a job
router.post('/jobs/:jobId/cancel', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const success = await jobManager.cancelJob(jobId);
    
    if (success) {
      await appLogger.info(`Job cancelled by admin: ${jobId}`, {
        source: 'monitoring-api',
        adminId: req.user.id,
        jobId
      });
      res.json({ success: true, message: 'Job cancelled successfully' });
    } else {
      res.status(400).json({ error: 'Job cannot be cancelled' });
    }
  } catch (error) {
    await appLogger.error('Failed to cancel job', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id,
      jobId: req.params.jobId
    });
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// ====================
// SUPPORT TICKETS ENDPOINTS
// ====================

// Create support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const ticketData = createSupportTicketSchema.parse(req.body);
    
    // Add user context if authenticated
    const ticketWithUser = {
      ...ticketData,
      userId: req.user?.id,
      userEmail: req.user?.email || ticketData.userEmail,
      userName: req.user?.name || req.user?.firstName + ' ' + req.user?.lastName,
      userRole: req.user?.role,
      systemInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        timestamp: new Date().toISOString()
      }
    };

    const [ticket] = await db.insert(supportTickets)
      .values(ticketWithUser)
      .returning();

    await appLogger.info('Support ticket created', {
      source: 'support',
      ticketId: ticket.id,
      userId: req.user?.id,
      category: ticket.category,
      priority: ticket.priority
    });

    res.status(201).json(ticket);
  } catch (error) {
    await appLogger.error('Failed to create support ticket', {
      source: 'support',
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get support tickets (admin only)
router.get('/support/tickets', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      priority,
      category,
      assignedTo 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = db.select().from(supportTickets);
    const conditions = [];

    if (status) conditions.push(eq(supportTickets.status, status as string));
    if (priority) conditions.push(eq(supportTickets.priority, priority as string));
    if (category) conditions.push(eq(supportTickets.category, category as string));
    if (assignedTo) conditions.push(eq(supportTickets.assignedTo, assignedTo as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const tickets = await query
      .orderBy(desc(supportTickets.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(supportTickets);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    await appLogger.error('Failed to fetch support tickets', {
      source: 'support',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Update support ticket (admin only)
router.patch('/support/tickets/:ticketId', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    if (updates.status === 'resolved' && !updates.resolution) {
      return res.status(400).json({ error: 'Resolution required when closing ticket' });
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
      resolvedAt: updates.status === 'resolved' ? new Date() : null
    };

    const [updatedTicket] = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!updatedTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await appLogger.info('Support ticket updated', {
      source: 'support',
      ticketId,
      adminId: req.user.id,
      updates: Object.keys(updates)
    });

    res.json(updatedTicket);
  } catch (error) {
    await appLogger.error('Failed to update support ticket', {
      source: 'support',
      error: error.message,
      userId: req.user.id,
      ticketId: req.params.ticketId
    });
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
});

// ====================
// USER IMPERSONATION ENDPOINTS
// ====================

// Start impersonating a user (super admin only)
router.post('/impersonate', requireRole(['super_admin']), async (req, res) => {
  try {
    const { targetUserId, reason, duration } = impersonateUserSchema.parse(req.body);

    // Verify target user exists
    const [targetUser] = await db.select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Create impersonation log
    const [impersonationLog] = await db.insert(impersonationLogs)
      .values({
        adminId: req.user.id,
        targetUserId,
        targetUserEmail: targetUser.email,
        reason,
        duration,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })
      .returning();

    // Create impersonation token (expires based on duration)
    const impersonationToken = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    // Store impersonation session (you might want to use Redis for this)
    req.session.impersonation = {
      logId: impersonationLog.id,
      targetUserId,
      adminId: req.user.id,
      expiresAt,
      token: impersonationToken
    };

    await appLogger.warn('User impersonation started', {
      source: 'impersonation',
      adminId: req.user.id,
      targetUserId,
      targetUserEmail: targetUser.email,
      reason,
      duration
    });

    res.json({
      success: true,
      impersonationToken,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      },
      expiresAt
    });
  } catch (error) {
    await appLogger.error('Failed to start impersonation', {
      source: 'impersonation',
      error: error.message,
      adminId: req.user.id
    });
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

// Stop impersonating a user
router.post('/impersonate/stop', requireRole(['super_admin']), async (req, res) => {
  try {
    const impersonation = req.session.impersonation;
    
    if (!impersonation) {
      return res.status(400).json({ error: 'No active impersonation session' });
    }

    // Update impersonation log with end time
    await db.update(impersonationLogs)
      .set({
        endedAt: new Date(),
        actions: req.body.actions || []
      })
      .where(eq(impersonationLogs.id, impersonation.logId));

    // Clear impersonation session
    delete req.session.impersonation;

    await appLogger.info('User impersonation ended', {
      source: 'impersonation',
      adminId: impersonation.adminId,
      targetUserId: impersonation.targetUserId,
      logId: impersonation.logId
    });

    res.json({ success: true, message: 'Impersonation ended' });
  } catch (error) {
    await appLogger.error('Failed to stop impersonation', {
      source: 'impersonation',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to stop impersonation' });
  }
});

// ====================
// SYSTEM METRICS ENDPOINTS
// ====================

// Get system metrics
router.get('/metrics', requireRole(['super_admin', 'manager']), async (req, res) => {
  try {
    const { 
      period = '24h',
      metricName,
      startDate,
      endDate 
    } = req.query;

    const hoursBack = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 24;
    const startTime = startDate ? new Date(startDate as string) : new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const endTime = endDate ? new Date(endDate as string) : new Date();

    let query = db.select().from(systemMetrics)
      .where(and(
        gte(systemMetrics.timestamp, startTime),
        lte(systemMetrics.timestamp, endTime)
      ));

    if (metricName) {
      query = query.where(eq(systemMetrics.metricName, metricName as string));
    }

    const metrics = await query.orderBy(desc(systemMetrics.timestamp));

    res.json({
      metrics,
      period: { startTime, endTime }
    });
  } catch (error) {
    await appLogger.error('Failed to fetch metrics', {
      source: 'monitoring-api',
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;