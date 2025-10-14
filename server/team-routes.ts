import { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { createInvitationEmail, sendEmail } from "./email";
import crypto from "crypto";
import multer from "multer";
import Papa from "papaparse";

// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function registerTeamRoutes(app: Express) {
  // Branch Offices
  app.get('/api/admin/branches', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const branches = await storage.getAllBranchOffices();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.post('/api/admin/branches/create', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can create branch offices" });
      }

      const { name, address, city, state, zipCode, phone, email, managerId } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Branch name is required" });
      }

      const branch = await storage.createBranchOffice({
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        managerId
      });

      res.json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch office" });
    }
  });

  // User Invitations
  app.get('/api/admin/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitations = await storage.getAllUserInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post('/api/admin/users/invite', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { email, role, managerId, branchOfficeId } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const invitation = await storage.createUserInvitation({
        email,
        role,
        invitedBy: currentUser.id,
        managerId,
        branchOfficeId,
        token,
        expiresAt
      });

      // Send invitation email
      const invitationUrl = `${req.protocol}://${req.hostname}/accept-invitation?token=${token}`;
      const emailTemplate = createInvitationEmail({
        recipientEmail: email,
        inviterName: `${currentUser.firstName} ${currentUser.lastName}`,
        role,
        companyName: "AInspect Professional",
        invitationToken: token,
        invitationUrl,
        expiresAt
      });

      const emailSent = await sendEmail(emailTemplate);
      
      if (!emailSent) {
        console.warn("Email failed to send, but invitation was created");
      }

      res.json({ 
        ...invitation, 
        emailSent,
        message: emailSent ? "Invitation sent successfully" : "Invitation created, but email failed to send" 
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Accept invitation endpoint
  app.get('/api/invitations/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getUserInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }

      if (invitation.acceptedAt) {
        return res.status(400).json({ message: "Invitation already accepted" });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post('/api/invitations/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName } = req.body;
      
      const invitation = await storage.getUserInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }

      if (invitation.acceptedAt) {
        return res.status(400).json({ message: "Invitation already accepted" });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Create user account
      const userId = `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.upsertUser({
        id: userId,
        email: invitation.email,
        firstName,
        lastName,
        role: invitation.role || 'inspector',
        managerId: invitation.managerId,
        branchOfficeId: invitation.branchOfficeId,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        isActive: true
      });

      // Mark invitation as accepted
      await storage.acceptUserInvitation(token);

      res.json({ 
        user: newUser,
        message: "Account created successfully" 
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Bulk Import Users
  app.post('/api/admin/users/bulk-import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can bulk import users" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      const parsed = Papa.parse(fileContent, { 
        header: true, 
        skipEmptyLines: true 
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({ 
          message: "CSV parsing failed", 
          errors: parsed.errors 
        });
      }

      let imported = 0;
      let errors = 0;
      const results = [];

      for (const row of parsed.data) {
        try {
          const { email, firstName, lastName, role, licenseNumber, managerId, branchOfficeId } = row as any;
          
          if (!email || !firstName || !lastName) {
            errors++;
            results.push({ row, error: "Missing required fields" });
            continue;
          }

          const userId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await storage.upsertUser({
            id: userId,
            email,
            firstName,
            lastName,
            role: role || 'inspector',
            licenseNumber,
            managerId,
            branchOfficeId,
            isActive: true
          });

          imported++;
        } catch (error) {
          errors++;
          results.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.json({ 
        imported, 
        errors, 
        results: errors > 0 ? results.filter(r => r.error) : [] 
      });
    } catch (error) {
      console.error("Error importing users:", error);
      res.status(500).json({ message: "Failed to import users" });
    }
  });

  // Export Users
  app.get('/api/admin/users/export', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      
      const csvData = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        licenseNumber: user.licenseNumber || '',
        managerId: user.managerId || '',
        branchOfficeId: user.branchOfficeId || '',
        isActive: user.isActive,
        createdAt: user.createdAt?.toISOString() || '',
        lastLoginAt: user.lastLoginAt?.toISOString() || ''
      }));

      const csv = Papa.unparse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  // Team Hierarchies
  app.get('/api/admin/team-hierarchy/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;
      const childHierarchies = await storage.getTeamHierarchiesByParent(userId);
      const parentHierarchies = await storage.getTeamHierarchiesByChild(userId);

      res.json({ 
        children: childHierarchies, 
        parents: parentHierarchies 
      });
    } catch (error) {
      console.error("Error fetching team hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch team hierarchy" });
    }
  });

  app.post('/api/admin/team-hierarchy', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { parentUserId, childUserId, hierarchyType } = req.body;
      
      if (!parentUserId || !childUserId) {
        return res.status(400).json({ message: "Parent and child user IDs are required" });
      }

      const hierarchy = await storage.createTeamHierarchy({
        parentUserId,
        childUserId,
        hierarchyType: hierarchyType || 'manager'
      });

      res.json(hierarchy);
    } catch (error) {
      console.error("Error creating team hierarchy:", error);
      res.status(500).json({ message: "Failed to create team hierarchy" });
    }
  });
}