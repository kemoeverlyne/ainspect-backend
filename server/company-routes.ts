import { Express } from 'express';
import { storage } from './storage';
import { companySettings, users } from '../shared/schema';
import { insertCompanySettingsSchema } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateToken, type AuthenticatedRequest } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/logos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, GIF) are allowed'));
    }
  }
});

export function setupCompanyRoutes(app: Express) {
  // Get company settings for the authenticated user
  app.get('/api/admin/company', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only allow super_admin and manager roles to access company settings
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      // Import db directly from db module
      const { db } = await import('./db');
      
      const settings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, req.user!.id))
        .limit(1);

      if (settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          userId: req.user!.id,
          companyName: 'AInspect',
          tagline: '',
          logoUrl: '',
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          address: '',
          phone: '',
          email: '',
          websiteUrl: '',
          emailFromName: '',
          emailFromAddress: '',
          emailHeaderText: '',
          emailFooterText: '',
          footerText: '© 2025 AInspect – All rights reserved.',
          customDomain: '',
          customDomainEnabled: false,
          pdfHeaderText: '',
          pdfFooterText: '',
          pdfUseCompanyColors: true,
          pdfIncludeLogo: true,
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
  app.put('/api/admin/company', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only allow super_admin and manager roles to update company settings
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const settingsData = insertCompanySettingsSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if settings already exist
      const { db } = await import('./db');
      
      const existingSettings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, req.user!.id))
        .limit(1);

      let result;
      if (existingSettings.length === 0) {
        // Create new settings
        [result] = await db
          .insert(companySettings)
          .values(settingsData)
          .returning();
      } else {
        // Update existing settings
        [result] = await db
          .update(companySettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.userId, req.user!.id))
          .returning();
      }

      res.json(result);
    } catch (error) {
      console.error('Update company settings error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid company settings data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update company settings' });
    }
  });

  // Upload company logo
  app.post('/api/admin/company/logo', authenticateToken, upload.single('logo'), async (req: AuthenticatedRequest, res) => {
    try {
      // Only allow super_admin and manager roles to upload logos
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get or create company settings to update logo URL
      const logoUrl = `/uploads/logos/${req.file.filename}`;

      const { db } = await import('./db');
      
      const existingSettings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, req.user!.id))
        .limit(1);

      if (existingSettings.length === 0) {
        // Create new settings with logo
        await db
          .insert(companySettings)
          .values({
            userId: req.user!.id,
            logoUrl,
            companyName: 'AInspect',
            primaryColor: '#2563eb',
            secondaryColor: '#1e40af',
            footerText: '© 2025 AInspect – All rights reserved.',
            pdfUseCompanyColors: true,
            pdfIncludeLogo: true,
          });
      } else {
        // Delete old logo file if it exists
        if (existingSettings[0].logoUrl) {
          const oldLogoPath = path.join(process.cwd(), existingSettings[0].logoUrl);
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
          }
        }

        // Update existing settings with new logo
        await db
          .update(companySettings)
          .set({
            logoUrl,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.userId, req.user!.id));
      }

      res.json({
        logoUrl,
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  });

  // Delete company logo
  app.delete('/api/admin/company/logo', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only allow super_admin and manager roles to delete logos
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const { db } = await import('./db');
      
      const existingSettings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, req.user!.id))
        .limit(1);

      if (existingSettings.length > 0 && existingSettings[0].logoUrl) {
        // Delete logo file
        const logoPath = path.join(process.cwd(), existingSettings[0].logoUrl);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }

        // Update settings to remove logo URL
        await db
          .update(companySettings)
          .set({
            logoUrl: null,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.userId, req.user!.id));
      }

      res.json({ message: 'Logo deleted successfully' });
    } catch (error) {
      console.error('Logo deletion error:', error);
      res.status(500).json({ message: 'Failed to delete logo' });
    }
  });

  // Get company settings for any user (for white-label display)
  app.get('/api/company/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const { db } = await import('./db');
      
      const settings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        // Return default branding
        return res.json({
          companyName: 'AInspect',
          tagline: '',
          logoUrl: '',
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          footerText: '© 2025 AInspect – All rights reserved.',
        });
      }

      // Only return public-facing branding info (not sensitive settings)
      const publicSettings = {
        companyName: settings[0].companyName,
        tagline: settings[0].tagline,
        logoUrl: settings[0].logoUrl,
        primaryColor: settings[0].primaryColor,
        secondaryColor: settings[0].secondaryColor,
        footerText: settings[0].footerText,
        websiteUrl: settings[0].websiteUrl,
        phone: settings[0].phone,
        email: settings[0].email,
        address: settings[0].address,
      };

      res.json(publicSettings);
    } catch (error) {
      console.error('Get public company settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve company settings' });
    }
  });
}