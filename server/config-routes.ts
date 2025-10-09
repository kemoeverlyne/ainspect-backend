import { Express } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  serviceProviders, 
  inspectionTemplates, 
  notificationSettings, 
  featureFlags,
  inspectionReports,
  users,
  type ServiceProvider,
  type InspectionTemplate,
  type NotificationSetting,
  type FeatureFlag
} from "../shared/schema";
import { authenticateToken, type AuthenticatedRequest } from "./auth";

// Role-based middleware
const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export function registerConfigRoutes(app: Express) {
  
  // ============================================================================
  // SERVICE PROVIDER DIRECTORY (Lead-Gen Dashboard - Admin Only)
  // ============================================================================
  
  app.get('/api/admin/providers', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const providers = await db.select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt));
      res.json(providers);
    } catch (error) {
      console.error('Error fetching service providers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/providers', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const { name, email, phone, specialties, serviceAreas } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      const [newProvider] = await db.insert(serviceProviders).values({
        name,
        email,
        phone,
        specialties: specialties || [],
        serviceAreas: serviceAreas || []
      }).returning();

      res.status(201).json(newProvider);
    } catch (error) {
      console.error('Error creating service provider:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/providers/:id', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, specialties, serviceAreas } = req.body;

      const [updatedProvider] = await db.update(serviceProviders)
        .set({ 
          name, 
          email, 
          phone, 
          specialties: specialties || [], 
          serviceAreas: serviceAreas || [],
          updatedAt: new Date()
        })
        .where(eq(serviceProviders.id, id))
        .returning();

      if (!updatedProvider) {
        return res.status(404).json({ message: 'Service provider not found' });
      }

      res.json(updatedProvider);
    } catch (error) {
      console.error('Error updating service provider:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/providers/:id', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedProvider] = await db.delete(serviceProviders)
        .where(eq(serviceProviders.id, id))
        .returning();

      if (!deletedProvider) {
        return res.status(404).json({ message: 'Service provider not found' });
      }

      res.json({ message: 'Service provider deleted successfully' });
    } catch (error) {
      console.error('Error deleting service provider:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ============================================================================
  // INSPECTION TEMPLATES (Inspector Dashboard)
  // ============================================================================
  
  app.get('/api/inspector/templates', authenticateToken, async (req, res) => {
    try {
      const templates = await db.select().from(inspectionTemplates).orderBy(desc(inspectionTemplates.createdAt));
      res.json(templates);
    } catch (error) {
      console.error('Error fetching inspection templates:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/inspector/templates', authenticateToken, async (req, res) => {
    try {
      const { name, schema } = req.body;
      
      if (!name || !schema) {
        return res.status(400).json({ message: 'Name and schema are required' });
      }

      const [newTemplate] = await db.insert(inspectionTemplates).values({
        name,
        schema,
        createdBy: req.user!.id
      }).returning();

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error('Error creating inspection template:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/inspector/templates/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, schema } = req.body;

      const [updatedTemplate] = await db.update(inspectionTemplates)
        .set({ 
          name, 
          schema,
          updatedAt: new Date()
        })
        .where(eq(inspectionTemplates.id, id))
        .returning();

      if (!updatedTemplate) {
        return res.status(404).json({ message: 'Inspection template not found' });
      }

      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating inspection template:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ============================================================================
  // NOTIFICATION SETTINGS (All Dashboards)
  // ============================================================================
  
  app.get('/api/:dashboard/notification-settings', authenticateToken, async (req, res) => {
    try {
      const { dashboard } = req.params;
      
      if (!['inspector', 'contractor', 'leadgen'].includes(dashboard)) {
        return res.status(400).json({ message: 'Invalid dashboard type' });
      }

      const [settings] = await db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, req.user!.id))
        .where(eq(notificationSettings.dashboard, dashboard as any));

      if (!settings) {
        // Create default settings if none exist
        const [defaultSettings] = await db.insert(notificationSettings).values({
          userId: req.user!.id,
          dashboard: dashboard as any,
          triggers: [],
          emailEnabled: true,
          smsEnabled: false
        }).returning();
        
        return res.json(defaultSettings);
      }

      res.json(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/:dashboard/notification-settings', authenticateToken, async (req, res) => {
    try {
      const { dashboard } = req.params;
      const { triggers, emailEnabled, smsEnabled, webhookUrl } = req.body;
      
      if (!['inspector', 'contractor', 'leadgen'].includes(dashboard)) {
        return res.status(400).json({ message: 'Invalid dashboard type' });
      }

      const [updatedSettings] = await db.update(notificationSettings)
        .set({ 
          triggers: triggers || [],
          emailEnabled,
          smsEnabled,
          webhookUrl,
          updatedAt: new Date()
        })
        .where(eq(notificationSettings.userId, req.user!.id))
        .where(eq(notificationSettings.dashboard, dashboard as any))
        .returning();

      if (!updatedSettings) {
        // Create new settings if none exist
        const [newSettings] = await db.insert(notificationSettings).values({
          userId: req.user!.id,
          dashboard: dashboard as any,
          triggers: triggers || [],
          emailEnabled,
          smsEnabled,
          webhookUrl
        }).returning();
        
        return res.json(newSettings);
      }

      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ============================================================================
  // FEATURE FLAGS (Lead-Gen Dashboard - Admin Only)
  // ============================================================================
  
  app.get('/api/admin/feature-flags', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const flags = await db.select().from(featureFlags).orderBy(featureFlags.key);
      res.json(flags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/feature-flags/:key', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const { key } = req.params;
      const { enabled } = req.body;

      const [updatedFlag] = await db.update(featureFlags)
        .set({ 
          enabled,
          updatedAt: new Date()
        })
        .where(eq(featureFlags.key, key))
        .returning();

      if (!updatedFlag) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }

      res.json(updatedFlag);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ============================================================================
  // ADMIN WARRANTY MANAGEMENT
  // ============================================================================
  
  app.get('/api/admin/warranties', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const warranties = await db
        .select({
          reportId: inspectionReports.id,
          clientName: sql<string>`${inspectionReports.clientFirstName} || ' ' || ${inspectionReports.clientLastName}`,
          propertyAddress: inspectionReports.propertyAddress,
          inspectionDate: inspectionReports.inspectionDate,
          warrantyOptIn: inspectionReports.warrantyOptIn,
          warrantyProvider: inspectionReports.warrantyProvider,
          warrantyStatus: inspectionReports.warrantyStatus,
          warrantySubmittedAt: inspectionReports.warrantySubmittedAt,
          warrantyExternalId: inspectionReports.warrantyExternalId,
          warrantyNote: inspectionReports.warrantyNote,
          inspectorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
        })
        .from(inspectionReports)
        .innerJoin(users, eq(inspectionReports.inspectorId, users.id))
        .where(eq(inspectionReports.warrantyOptIn, true))
        .orderBy(desc(inspectionReports.warrantySubmittedAt));

      res.json(warranties);
    } catch (error) {
      console.error('Error fetching warranties:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/warranty-stats', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const stats = await db
        .select({
          totalReports: sql<number>`count(*)`,
          totalWithWarranty: sql<number>`sum(case when ${inspectionReports.warrantyOptIn} then 1 else 0 end)`,
          warrantyPending: sql<number>`sum(case when ${inspectionReports.warrantyOptIn} and ${inspectionReports.warrantyStatus} = 'pending' then 1 else 0 end)`,
          warrantyActive: sql<number>`sum(case when ${inspectionReports.warrantyOptIn} and ${inspectionReports.warrantyStatus} = 'active' then 1 else 0 end)`,
          warrantyFailed: sql<number>`sum(case when ${inspectionReports.warrantyOptIn} and ${inspectionReports.warrantyStatus} = 'failed' then 1 else 0 end)`,
          totalRevenue: sql<number>`sum(case when ${inspectionReports.warrantyOptIn} and ${inspectionReports.warrantyStatus} = 'active' then 12 else 0 end)`
        })
        .from(inspectionReports);

      res.json(stats[0]);
    } catch (error) {
      console.error('Error fetching warranty stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/warranties/:reportId', authenticateToken, requireRole(['super_admin', 'manager']), async (req, res) => {
    try {
      const { reportId } = req.params;
      const { warrantyStatus, warrantyNote } = req.body;

      const [updatedReport] = await db.update(inspectionReports)
        .set({
          warrantyStatus,
          warrantyNote,
          updatedAt: new Date()
        })
        .where(eq(inspectionReports.id, reportId))
        .returning();

      if (!updatedReport) {
        return res.status(404).json({ message: 'Report not found' });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error('Error updating warranty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}