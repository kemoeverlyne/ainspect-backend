import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  inspectionReports, 
  reportAuditTrail, 
  reportPhotos,
  users,
  type InspectionReport,
  type InsertInspectionReport,
  type InsertReportAuditTrail
} from "@shared/schema";
import { eq, desc, and, or, isNull, not, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Utility function to create audit trail entries
async function createAuditEntry(
  reportId: string,
  userId: string,
  action: string,
  details?: any,
  previousValue?: string,
  newValue?: string,
  req?: Request
) {
  const auditEntry: InsertReportAuditTrail = {
    reportId,
    userId,
    action,
    details: details ? JSON.stringify(details) : null,
    previousValue,
    newValue,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('User-Agent') || null,
  };

  await db.insert(reportAuditTrail).values(auditEntry);
}

export function registerInspectionOversightRoutes(app: Express) {

  // Get all inspectors for reassignment dropdown
  app.get('/api/inspectors', isAuthenticated, async (req: any, res: Response) => {
    try {
      const inspectors = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          licenseNumber: users.licenseNumber
        })
        .from(users)
        .where(eq(users.role, 'inspector'));
      
      res.json(inspectors);
    } catch (error) {
      console.error('Error fetching inspectors:', error);
      res.status(500).json({ message: 'Failed to fetch inspectors' });
    }
  });
  
  // Get live queue of all inspections with filtering and sorting
  app.get('/api/inspections/queue', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status, inspector, priority, sortBy = 'assignedAt', sortOrder = 'desc' } = req.query;
      const currentUser = req.user;

      let query = db
        .select({
          report: inspectionReports,
          inspector: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            licenseNumber: users.licenseNumber
          }
        })
        .from(inspectionReports)
        .leftJoin(users, eq(inspectionReports.inspectorId, users.id))
        .where(eq(inspectionReports.isArchived, false));

      // Apply role-based filtering
      if (currentUser.role === 'inspector') {
        query = query.where(eq(inspectionReports.inspectorId, currentUser.claims.sub));
      } else if (currentUser.role === 'manager') {
        query = query.where(
          or(
            eq(inspectionReports.managerId, currentUser.claims.sub),
            eq(inspectionReports.inspectorId, currentUser.claims.sub)
          )
        );
      }

      // Apply filters
      if (status) {
        query = query.where(eq(inspectionReports.status, status));
      }
      if (inspector) {
        query = query.where(eq(inspectionReports.inspectorId, inspector));
      }
      if (priority) {
        query = query.where(eq(inspectionReports.priority, priority));
      }

      // Apply sorting
      const sortColumn = inspectionReports[sortBy as keyof typeof inspectionReports];
      if (sortColumn) {
        query = sortOrder === 'asc' 
          ? query.orderBy(sortColumn) 
          : query.orderBy(desc(sortColumn));
      }

      const reports = await query;
      
      // Create audit entries for viewing reports
      for (const report of reports) {
        await createAuditEntry(
          report.report.id,
          currentUser.claims.sub,
          'queue_viewed',
          { filters: { status, inspector, priority } },
          undefined,
          undefined,
          req
        );
      }

      res.json(reports);
    } catch (error) {
      console.error('Error fetching inspection queue:', error);
      res.status(500).json({ message: 'Failed to fetch inspection queue' });
    }
  });

  // Get detailed report with audit trail
  app.get('/api/inspections/:id/details', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Get report details with related data
      const [reportData] = await db
        .select({
          report: inspectionReports,
          inspector: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            licenseNumber: users.licenseNumber
          }
        })
        .from(inspectionReports)
        .leftJoin(users, eq(inspectionReports.inspectorId, users.id))
        .where(eq(inspectionReports.id, id));

      if (!reportData) {
        return res.status(404).json({ message: 'Report not found' });
      }

      // Get audit trail
      const auditTrail = await db
        .select({
          audit: reportAuditTrail,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(reportAuditTrail)
        .leftJoin(users, eq(reportAuditTrail.userId, users.id))
        .where(eq(reportAuditTrail.reportId, id))
        .orderBy(desc(reportAuditTrail.timestamp));

      // Get photos
      const photos = await db
        .select()
        .from(reportPhotos)
        .where(eq(reportPhotos.reportId, id))
        .orderBy(desc(reportPhotos.uploadedAt));

      // Create audit entry for viewing report details
      await createAuditEntry(
        id,
        currentUser.claims.sub,
        'report_viewed',
        { section: 'details' },
        undefined,
        undefined,
        req
      );

      res.json({
        report: reportData.report,
        inspector: reportData.inspector,
        auditTrail,
        photos,
        photosCount: photos.length
      });
    } catch (error) {
      console.error('Error fetching report details:', error);
      res.status(500).json({ message: 'Failed to fetch report details' });
    }
  });

  // Update inspection status
  app.post('/api/inspections/:id/status', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const currentUser = req.user;

      // Get current report to track changes
      const [currentReport] = await db
        .select()
        .from(inspectionReports)
        .where(eq(inspectionReports.id, id));

      if (!currentReport) {
        return res.status(404).json({ message: 'Report not found' });
      }

      const previousStatus = currentReport.status;
      const updateData: any = { 
        status, 
        updatedAt: new Date()
      };

      // Set timestamps based on status
      if (status === 'in_progress' && !currentReport.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === 'completed' && !currentReport.completedAt) {
        updateData.completedAt = new Date();
        updateData.actualDuration = currentReport.startedAt 
          ? Math.floor((new Date().getTime() - new Date(currentReport.startedAt).getTime()) / (1000 * 60))
          : null;
      } else if (status === 'ready_to_review' && currentUser.role !== 'inspector') {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = currentUser.claims.sub;
      }

      if (notes) {
        updateData.notes = notes;
      }

      // Update the report
      await db
        .update(inspectionReports)
        .set(updateData)
        .where(eq(inspectionReports.id, id));

      // Create audit entry
      await createAuditEntry(
        id,
        currentUser.claims.sub,
        'status_changed',
        { notes, reason: 'Manual status update' },
        previousStatus,
        status,
        req
      );

      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  // Reassign inspection to different inspector
  app.post('/api/inspections/:id/reassign', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { newInspectorId, reason } = req.body;
      const currentUser = req.user;

      // Only managers and super_admins can reassign
      if (!['manager', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Insufficient permissions to reassign inspections' });
      }

      // Get current report
      const [currentReport] = await db
        .select()
        .from(inspectionReports)
        .where(eq(inspectionReports.id, id));

      if (!currentReport) {
        return res.status(404).json({ message: 'Report not found' });
      }

      const previousInspectorId = currentReport.inspectorId;

      // Update the assignment
      await db
        .update(inspectionReports)
        .set({ 
          inspectorId: newInspectorId,
          managerId: currentUser.claims.sub,
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(inspectionReports.id, id));

      // Create audit entry
      await createAuditEntry(
        id,
        currentUser.claims.sub,
        'reassigned',
        { reason, newInspectorId },
        previousInspectorId,
        newInspectorId,
        req
      );

      res.json({ message: 'Inspection reassigned successfully' });
    } catch (error) {
      console.error('Error reassigning inspection:', error);
      res.status(500).json({ message: 'Failed to reassign inspection' });
    }
  });

  // Reopen completed inspection for corrections
  app.post('/api/inspections/:id/reopen', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, corrections } = req.body;
      const currentUser = req.user;

      // Only managers and super_admins can reopen inspections
      if (!['manager', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Insufficient permissions to reopen inspections' });
      }

      // Get current report
      const [currentReport] = await db
        .select()
        .from(inspectionReports)
        .where(eq(inspectionReports.id, id));

      if (!currentReport) {
        return res.status(404).json({ message: 'Report not found' });
      }

      const previousStatus = currentReport.status;

      // Reopen the inspection
      await db
        .update(inspectionReports)
        .set({ 
          status: 'in_progress',
          reviewedAt: null,
          reviewedBy: null,
          completedAt: null,
          notes: corrections ? `${currentReport.notes || ''}\n\nCorrections needed: ${corrections}` : currentReport.notes,
          updatedAt: new Date()
        })
        .where(eq(inspectionReports.id, id));

      // Create audit entry
      await createAuditEntry(
        id,
        currentUser.claims.sub,
        'reopened',
        { reason, corrections },
        previousStatus,
        'in_progress',
        req
      );

      res.json({ message: 'Inspection reopened successfully' });
    } catch (error) {
      console.error('Error reopening inspection:', error);
      res.status(500).json({ message: 'Failed to reopen inspection' });
    }
  });

  // Get audit trail for a specific report
  app.get('/api/inspections/:id/audit', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      const auditTrail = await db
        .select({
          audit: reportAuditTrail,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: users.role
          }
        })
        .from(reportAuditTrail)
        .leftJoin(users, eq(reportAuditTrail.userId, users.id))
        .where(eq(reportAuditTrail.reportId, id))
        .orderBy(desc(reportAuditTrail.timestamp));

      // Create audit entry for viewing audit trail
      await createAuditEntry(
        id,
        currentUser.claims.sub,
        'audit_viewed',
        {},
        undefined,
        undefined,
        req
      );

      res.json(auditTrail);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });

  // Get inspection statistics for dashboard
  app.get('/api/inspections/stats', isAuthenticated, async (req: any, res: Response) => {
    try {
      const currentUser = req.user;

      let baseQuery = db.select().from(inspectionReports);
      
      // Apply role-based filtering
      if (currentUser.role === 'inspector') {
        baseQuery = baseQuery.where(eq(inspectionReports.inspectorId, currentUser.claims.sub));
      } else if (currentUser.role === 'manager') {
        baseQuery = baseQuery.where(
          or(
            eq(inspectionReports.managerId, currentUser.claims.sub),
            eq(inspectionReports.inspectorId, currentUser.claims.sub)
          )
        );
      }

      const reports = await baseQuery;

      const stats = {
        total: reports.length,
        notStarted: reports.filter(r => r.status === 'not_started').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        awaitingPhotos: reports.filter(r => r.status === 'awaiting_photos').length,
        readyToReview: reports.filter(r => r.status === 'ready_to_review').length,
        completed: reports.filter(r => r.status === 'completed').length,
        avgDuration: reports.filter(r => r.actualDuration).reduce((acc, r) => acc + (r.actualDuration || 0), 0) / reports.filter(r => r.actualDuration).length || 0,
        priorityBreakdown: {
          low: reports.filter(r => r.priority === 'low').length,
          medium: reports.filter(r => r.priority === 'medium').length,
          high: reports.filter(r => r.priority === 'high').length,
          urgent: reports.filter(r => r.priority === 'urgent').length,
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching inspection stats:', error);
      res.status(500).json({ message: 'Failed to fetch inspection statistics' });
    }
  });

  // Create new inspection report
  app.post('/api/inspections/reports', isAuthenticated, async (req: any, res: Response) => {
    try {
      const currentUser = req.user;
      const reportData = req.body as InsertInspectionReport;

      // Set defaults
      reportData.inspectorId = reportData.inspectorId || currentUser.claims.sub;
      if (currentUser.role === 'manager') {
        reportData.managerId = currentUser.claims.sub;
      }

      const [newReport] = await db
        .insert(inspectionReports)
        .values(reportData)
        .returning();

      // Create audit entry
      await createAuditEntry(
        newReport.id,
        currentUser.claims.sub,
        'report_created',
        { reportData },
        undefined,
        undefined,
        req
      );

      res.status(201).json(newReport);
    } catch (error) {
      console.error('Error creating inspection report:', error);
      res.status(500).json({ message: 'Failed to create inspection report' });
    }
  });
}