import type { Express, Request, Response } from "express";
import { eq, count, sql } from "drizzle-orm";
import { 
  companySettings, 
  users, 
  userInvitations,
  branchOffices,
  operationsSettings,
  userOnboardingProgress,
  insertCompanySettingsSchema,
  insertOperationsSettingsSchema,
  insertUserOnboardingProgressSchema,
  type User
} from "@shared/schema";
import { authenticateToken, getUserByEmail } from "./auth";
import multer from "multer";
import path from "path";

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export function setupOnboardingRoutes(app: Express) {
  // ============================================================================
  // ONBOARDING STATUS CHECK
  // ============================================================================
  
  app.get('/api/onboarding/status', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Get user-specific onboarding progress
      const progress = await db
        .select()
        .from(userOnboardingProgress)
        .where(eq(userOnboardingProgress.userId, userId))
        .limit(1);
      
      // Get user's company settings
      const userCompanySettings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, userId))
        .limit(1);
      
      // Get user's operations settings
      const userOperationsSettings = await db
        .select()
        .from(operationsSettings)
        .where(eq(operationsSettings.userId, userId))
        .limit(1);
      
      // Check if user needs to be elevated to super_admin (first user)
      const superAdminCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'super_admin'));
      
      const needsElevation = superAdminCount[0]?.count === 0;
      
      // Determine completion status based on actual data
      const hasCompanyProfile = userCompanySettings.length > 0;
      const hasOperationsSetup = userOperationsSettings.length > 0;
      
      let currentStep = 'company';
      let completed = false;
      
      if (progress.length > 0) {
        const userProgress = progress[0];
        completed = userProgress.onboardingCompleted;
        currentStep = userProgress.currentStep;
      } else {
        // Infer current step from existing data
        if (hasCompanyProfile && hasOperationsSetup) {
          currentStep = 'team';
        } else if (hasCompanyProfile) {
          currentStep = 'operations';
        } else {
          currentStep = 'company';
        }
      }
      
      res.json({
        completed,
        needsElevation,
        currentStep,
        progress: {
          companyProfileCompleted: hasCompanyProfile,
          operationsSetupCompleted: hasOperationsSetup,
          teamSetupCompleted: progress[0]?.teamSetupCompleted || false,
        }
      });
      
      console.log('[ONBOARDING STATUS] Response:', {
        userId,
        completed,
        currentStep,
        hasCompanyProfile,
        hasOperationsSetup,
        progressRecord: progress[0]
      });
    } catch (error) {
      console.error('Onboarding status error:', error);
      res.status(500).json({ message: 'Failed to check onboarding status' });
    }
  });

  // ============================================================================
  // COMPANY PROFILE SETUP (Step 1)
  // ============================================================================
  
  // Get company profile
  app.get('/api/onboarding/company', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      const company = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, userId))
        .limit(1);

      if (company.length === 0) {
        // Return default company settings if none exist
        const defaultCompany = {
          userId,
          companyName: '',
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
        return res.json(defaultCompany);
      }

      res.json(company[0]);
    } catch (error) {
      console.error('Get company profile error:', error);
      res.status(500).json({ message: 'Failed to retrieve company profile' });
    }
  });
  
  app.put('/api/onboarding/company', authenticateToken, async (req: any, res: Response) => {
    try {
      // Ensure user is authenticated and exists in database
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentication required for company setup' });
      }
      
      const userId = req.user.id;
      
      // Verify user exists in database
      try {
        await getUserByEmail(req.user.email);
      } catch (error) {
        console.error('User validation failed:', error);
        return res.status(401).json({ message: 'Invalid user - please re-authenticate' });
      }
      
      // Validate request body
      const companyData = insertCompanySettingsSchema.parse({
        ...req.body,
        userId
      });
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Check if company settings already exist
      const existing = await db
        .select()
        .from(companySettings)
        .limit(1);
      
      let result;
      
      if (existing.length === 0) {
        // Create new company settings
        result = await db
          .insert(companySettings)
          .values(companyData)
          .returning();
      } else {
        // Update existing company settings
        result = await db
          .update(companySettings)
          .set({
            ...companyData,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.id, existing[0].id))
          .returning();
      }
      
      // Update onboarding progress
      await db
        .insert(userOnboardingProgress)
        .values({
          userId,
          companyProfileCompleted: true,
          companyProfileCompletedAt: new Date(),
          currentStep: 'operations',
        })
        .onConflictDoUpdate({
          target: userOnboardingProgress.userId,
          set: {
            companyProfileCompleted: true,
            companyProfileCompletedAt: new Date(),
            currentStep: sql`CASE WHEN ${userOnboardingProgress.operationsSetupCompleted} THEN (CASE WHEN ${userOnboardingProgress.teamSetupCompleted} THEN 'completed' ELSE 'team' END) ELSE 'operations' END`,
            updatedAt: new Date(),
          }
        });
      
      res.json(result[0]);
    } catch (error) {
      console.error('Company setup error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid company data', details: error.message });
      }
      res.status(500).json({ message: 'Failed to save company settings' });
    }
  });

  // Logo upload endpoint
  app.post('/api/onboarding/logo', authenticateToken, upload.single('logo'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file uploaded' });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Update company settings with logo URL
      const existing = await db
        .select()
        .from(companySettings)
        .limit(1);
      
      if (existing.length > 0) {
        await db
          .update(companySettings)
          .set({
            logoUrl,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.id, existing[0].id));
      }
      
      res.json({ logoUrl });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  });

  // ============================================================================
  // OPERATIONS SETUP (Step 2)
  // ============================================================================
  
  // Get operations settings
  app.get('/api/onboarding/operations', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      const operations = await db
        .select()
        .from(operationsSettings)
        .where(eq(operationsSettings.userId, userId))
        .limit(1);

      if (operations.length === 0) {
        // Return default operations settings if none exist
        const defaultOperations = {
          userId,
          serviceAreas: [],
          basePricing: {
            residential: 450,
            commercial: 750,
            addon: 125,
          },
          businessHours: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' },
          },
          inspectionTypes: ['General Home Inspection'],
        };
        return res.json(defaultOperations);
      }

      res.json(operations[0]);
    } catch (error) {
      console.error('Get operations error:', error);
      res.status(500).json({ message: 'Failed to retrieve operations settings' });
    }
  });

  // Save/update operations settings
  app.put('/api/onboarding/operations', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const operationsData = insertOperationsSettingsSchema.parse({
        ...req.body,
        userId
      });
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Check if operations settings already exist
      const existing = await db
        .select()
        .from(operationsSettings)
        .where(eq(operationsSettings.userId, userId))
        .limit(1);
      
      let result;
      
      if (existing.length === 0) {
        // Create new operations settings
        result = await db
          .insert(operationsSettings)
          .values(operationsData)
          .returning();
      } else {
        // Update existing operations settings
        result = await db
          .update(operationsSettings)
          .set({
            ...operationsData,
            updatedAt: new Date(),
          })
          .where(eq(operationsSettings.id, existing[0].id))
          .returning();
      }
      
      // Update onboarding progress
      await db
        .insert(userOnboardingProgress)
        .values({
          userId,
          operationsSetupCompleted: true,
          operationsSetupCompletedAt: new Date(),
          currentStep: 'team',
        })
        .onConflictDoUpdate({
          target: userOnboardingProgress.userId,
          set: {
            operationsSetupCompleted: true,
            operationsSetupCompletedAt: new Date(),
            currentStep: sql`CASE WHEN ${userOnboardingProgress.teamSetupCompleted} THEN 'completed' ELSE 'team' END`,
            updatedAt: new Date(),
          }
        });
      
      res.json(result[0]);
    } catch (error) {
      console.error('Operations setup error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid operations data', details: error.message });
      }
      res.status(500).json({ message: 'Failed to save operations settings' });
    }
  });

  // ============================================================================
  // TEAM SETUP (Step 3)
  // ============================================================================
  
  app.post('/api/onboarding/invite', authenticateToken, async (req: any, res: Response) => {
    try {
      const { email, role, managerId, branchOfficeId } = req.body;
      const invitedBy = req.user!.id;
      
      if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required' });
      }
      
      // Import db and crypto
      const { db } = await import('./db');
      const crypto = await import('crypto');
      
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      
      // Check if invitation already exists
      const existingInvitation = await db
        .select()
        .from(userInvitations)
        .where(eq(userInvitations.email, email.toLowerCase()))
        .limit(1);
      
      if (existingInvitation.length > 0) {
        return res.status(409).json({ message: 'Invitation already sent to this email' });
      }
      
      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Create invitation
      const invitation = await db
        .insert(userInvitations)
        .values({
          email: email.toLowerCase(),
          role,
          invitedBy,
          managerId,
          branchOfficeId,
          token,
          expiresAt,
        })
        .returning();
      
      // TODO: Send invitation email
      // For now, just return the invitation details
      
      res.json({
        ...invitation[0],
        inviteUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/invite/${token}`
      });
    } catch (error) {
      console.error('Team invite error:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  });

  // ============================================================================
  // COMPLETE ONBOARDING
  // ============================================================================
  
  app.post('/api/onboarding/complete', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Validate all required steps are completed
      
      // 1. Check company profile exists
      const userCompanySettings = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.userId, userId))
        .limit(1);
      
      if (userCompanySettings.length === 0) {
        return res.status(400).json({ 
          message: 'Company profile setup is required before completing onboarding',
          missingStep: 'company'
        });
      }
      
      // 2. Check operations settings exist and are valid
      const userOperationsSettings = await db
        .select()
        .from(operationsSettings)
        .where(eq(operationsSettings.userId, userId))
        .limit(1);
      
      if (userOperationsSettings.length === 0) {
        return res.status(400).json({ 
          message: 'Operations setup is required before completing onboarding',
          missingStep: 'operations'
        });
      }
      
      // Validate operations settings have minimum required data
      const operations = userOperationsSettings[0];
      if (!operations.serviceAreas || operations.serviceAreas.length === 0) {
        return res.status(400).json({ 
          message: 'At least one service area is required in operations setup',
          missingStep: 'operations'
        });
      }
      
      if (!operations.inspectionTypes || operations.inspectionTypes.length === 0) {
        return res.status(400).json({ 
          message: 'At least one inspection type is required in operations setup',
          missingStep: 'operations'
        });
      }
      
      // Validate company settings have minimum required data
      const company = userCompanySettings[0];
      if (!company.companyName || company.companyName.trim().length === 0) {
        return res.status(400).json({ 
          message: 'Company name is required before completing onboarding',
          missingStep: 'company'
        });
      }
      
      // Check if user should be elevated to super_admin (first user completing onboarding)
      const superAdminCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'super_admin'));
      
      if (superAdminCount[0]?.count === 0) {
        // Elevate this user to super_admin
        await db
          .update(users)
          .set({
            role: 'super_admin',
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
      
      // Mark onboarding as completed in progress tracking
      await db
        .insert(userOnboardingProgress)
        .values({
          userId,
          companyProfileCompleted: true,
          operationsSetupCompleted: true,
          teamSetupCompleted: true,
          onboardingCompleted: true,
          companyProfileCompletedAt: new Date(),
          operationsSetupCompletedAt: new Date(),
          teamSetupCompletedAt: new Date(),
          onboardingCompletedAt: new Date(),
          currentStep: 'completed',
        })
        .onConflictDoUpdate({
          target: userOnboardingProgress.userId,
          set: {
            companyProfileCompleted: true,
            operationsSetupCompleted: true,
            teamSetupCompleted: true,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            currentStep: 'completed',
            updatedAt: new Date(),
          }
        });
      
      res.json({ 
        message: 'Onboarding completed successfully',
        redirectTo: '/dashboard',
        userRole: superAdminCount[0]?.count === 0 ? 'super_admin' : req.user?.role
      });
    } catch (error) {
      console.error('Complete onboarding error:', error);
      res.status(500).json({ message: 'Failed to complete onboarding' });
    }
  });

  // ============================================================================
  // TEAM SETUP COMPLETION
  // ============================================================================
  
  // Mark team setup as completed
  app.post('/api/onboarding/team-complete', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      // Update onboarding progress to mark team setup as completed
      await db
        .insert(userOnboardingProgress)
        .values({
          userId,
          teamSetupCompleted: true,
          teamSetupCompletedAt: new Date(),
          currentStep: 'operations',
        })
        .onConflictDoUpdate({
          target: userOnboardingProgress.userId,
          set: {
            teamSetupCompleted: true,
            teamSetupCompletedAt: new Date(),
            currentStep: sql`CASE WHEN ${userOnboardingProgress.operationsSetupCompleted} THEN 'completed' ELSE 'operations' END`,
            updatedAt: new Date(),
          }
        });
      
      res.json({ 
        message: 'Team setup completed successfully',
        currentStep: 'operations'
      });
    } catch (error) {
      console.error('Team setup completion error:', error);
      res.status(500).json({ message: 'Failed to complete team setup' });
    }
  });

  // ============================================================================
  // BRANCH OFFICE MANAGEMENT
  // ============================================================================
  
  app.get('/api/onboarding/branches', authenticateToken, async (req: any, res: Response) => {
    try {
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      const branches = await db
        .select()
        .from(branchOffices)
        .where(eq(branchOffices.isActive, true));
      
      res.json(branches);
    } catch (error) {
      console.error('Get branches error:', error);
      res.status(500).json({ message: 'Failed to retrieve branches' });
    }
  });
  
  app.post('/api/onboarding/branches', authenticateToken, async (req: any, res: Response) => {
    try {
      const { name, address, city, state, zipCode, phone, email } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Branch name is required' });
      }
      
      // Import db directly to avoid circular dependency
      const { db } = await import('./db');
      
      const branch = await db
        .insert(branchOffices)
        .values({
          name,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          managerId: req.user!.id, // Current user becomes manager
        })
        .returning();
      
      res.json(branch[0]);
    } catch (error) {
      console.error('Create branch error:', error);
      res.status(500).json({ message: 'Failed to create branch office' });
    }
  });
}