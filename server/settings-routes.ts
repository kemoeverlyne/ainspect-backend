import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { 
  userSettings, 
  companySettings, 
  insertUserSettingsSchema, 
  insertCompanySettingsSchema,
  type UserSettings,
  type CompanySettings,
  type User
} from "@shared/schema";
import { authenticateToken, type AuthenticatedRequest } from "./auth";

export function setupSettingsRoutes(app: Express) {
  // ============================================================================
  // USER SETTINGS ROUTES
  // ============================================================================

  // Get user settings
  app.get('/api/settings/user', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        // Return default user settings if none exist
        const defaultSettings: Partial<UserSettings> = {
          userId,
          firstName: req.user?.firstName || '',
          lastName: req.user?.lastName || '',
          email: req.user?.email || '',
          phone: req.user?.phone || '',
          licenseNumber: req.user?.licenseNumber || '',
          notifications: {
            email: true,
            sms: true,
            reportDelivery: true,
            scheduling: true,
            teamUpdates: true
          },
          preferences: {
            timezone: 'America/Chicago',
            dateFormat: 'MM/DD/YYYY',
            theme: 'light',
            language: 'en'
          }
        };
        return res.json(defaultSettings);
      }

      res.json(settings[0]);
    } catch (error) {
      console.error('Get user settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve user settings' });
    }
  });

  // Update user settings
  app.put('/api/settings/user', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const settingsData = insertUserSettingsSchema.parse(req.body);
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');

      // Check if user settings exist
      const existingSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      if (existingSettings.length === 0) {
        // Create new user settings
        const newSettings = await db
          .insert(userSettings)
          .values({
            ...settingsData,
            userId,
          })
          .returning();
        
        return res.json(newSettings[0]);
      }

      // Update existing user settings
      const updatedSettings = await db
        .update(userSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      res.json(updatedSettings[0]);
    } catch (error) {
      console.error('Update user settings error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid settings data', details: error.message });
      }
      res.status(500).json({ message: 'Failed to update user settings' });
    }
  });

  // ============================================================================
  // COMPANY SETTINGS ROUTES (Admin Only)
  // ============================================================================

  // Get company settings
  app.get('/api/settings/company', authenticateToken, async (req: any, res: Response) => {
    try {
      // Only allow super_admin and manager roles to access company settings
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Get the first company settings record (assuming single-tenant for now)
      const settings = await db
        .select()
        .from(companySettings)
        .limit(1);

      if (settings.length === 0) {
        // Return default company settings if none exist
        const defaultSettings: Partial<CompanySettings> = {
          companyName: 'AInspect',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          email: '',
          website: '',
          logoUrl: '',
          brandColors: {
            primary: '#3B82F6',
            secondary: '#1E40AF'
          },
          reportFooter: 'Professional home inspection services',
          customization: {
            showLogo: true,
            showCompanyName: true,
            showAddress: true,
            showPhone: true,
            showWebsite: true,
            headerLayout: 'standard',
            fontFamily: 'Inter'
          },
          isActive: true
        };
        return res.json(defaultSettings);
      }

      res.json(settings[0]);
    } catch (error) {
      console.error('Get company settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve company settings' });
    }
  });

  // Update company settings
  app.put('/api/settings/company', authenticateToken, async (req: any, res: Response) => {
    try {
      // Only allow super_admin and manager roles to modify company settings
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      
      // Validate request body
      const settingsData = insertCompanySettingsSchema.parse(req.body);
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');

      // Check if company settings exist
      const existingSettings = await db
        .select()
        .from(companySettings)
        .limit(1);

      if (existingSettings.length === 0) {
        // Create new company settings
        const newSettings = await db
          .insert(companySettings)
          .values({
            ...settingsData,
          })
          .returning();
        
        return res.json(newSettings[0]);
      }

      // Update existing company settings
      const updatedSettings = await db
        .update(companySettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(companySettings.id, existingSettings[0].id))
        .returning();

      res.json(updatedSettings[0]);
    } catch (error) {
      console.error('Update company settings error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid settings data', details: error.message });
      }
      res.status(500).json({ message: 'Failed to update company settings' });
    }
  });

  // ============================================================================
  // PASSWORD CHANGE ROUTE
  // ============================================================================

  // Change user password
  app.put('/api/settings/user/password', authenticateToken, async (req: any, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      // Import auth functions
      const { comparePassword, generatePasswordHash } = await import('./auth');
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');

      // Get user's current password hash
      const user = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (user.length === 0 || !user[0].passwordHash) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user[0].passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await generatePasswordHash(newPassword);

      // Update password
      await db
        .update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user!.id));

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });
}