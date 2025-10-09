import { storage } from "./storage";
import { seedDefaultNarratives } from "./seed/narratives";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function seedDevelopmentData() {
  try {
    console.log("🌱 Seeding development data...");

    // Create super admin user
    const superAdminId = "super_admin_001";
    await storage.upsertUser({
      id: superAdminId,
      email: "admin@ainspect.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      firstName: "Super",
      lastName: "Admin", 
      name: "Super Admin",
      role: "super_admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create manager users
    const manager1Id = "manager_001";
    await storage.upsertUser({
      id: manager1Id,
      email: "manager@ainspect.com",
      passwordHash: await bcrypt.hash("manager123", 10),
      firstName: "Sarah",
      lastName: "Johnson",
      name: "Sarah Johnson",
      role: "manager",
      licenseNumber: "MGR-2024-001",
      isActive: true,
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      updatedAt: new Date()
    });

    const manager2Id = "manager_002";
    await storage.upsertUser({
      id: manager2Id,
      email: "david.manager@ainspect.com",
      passwordHash: await bcrypt.hash("manager123", 10),
      firstName: "David",
      lastName: "Chen",
      name: "David Chen",
      role: "manager",
      licenseNumber: "MGR-2024-002",
      isActive: true,
      lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      updatedAt: new Date()
    });

    // Create inspector users
    const inspectorIds = [];
    const inspectorData = [
      { firstName: "John", lastName: "Smith", email: "john.smith@ainspect.com", license: "INS-TX-001", managerId: manager1Id, lastLogin: 15 },
      { firstName: "Emily", lastName: "Davis", email: "emily.davis@ainspect.com", license: "INS-TX-002", managerId: manager1Id, lastLogin: 30 },
      { firstName: "Michael", lastName: "Wilson", email: "michael.wilson@ainspect.com", license: "INS-CA-001", managerId: manager2Id, lastLogin: 45 },
      { firstName: "Jessica", lastName: "Brown", email: "jessica.brown@ainspect.com", license: "INS-CA-002", managerId: manager2Id, lastLogin: 60 },
      { firstName: "Robert", lastName: "Taylor", email: "robert.taylor@ainspect.com", license: "INS-TX-003", managerId: manager1Id, lastLogin: 120 },
      { firstName: "Lisa", lastName: "Anderson", email: "lisa.anderson@ainspect.com", license: "INS-FL-001", managerId: manager2Id, lastLogin: 180 },
      { firstName: "Christopher", lastName: "Martinez", email: "chris.martinez@ainspect.com", license: "INS-FL-002", managerId: manager1Id, lastLogin: 300 },
      { firstName: "Amanda", lastName: "Thompson", email: "amanda.thompson@ainspect.com", license: "INS-NY-001", managerId: manager2Id, lastLogin: 480 },
      { firstName: "Daniel", lastName: "Garcia", email: "daniel.garcia@ainspect.com", license: "INS-TX-004", managerId: manager1Id, lastLogin: 600 },
      { firstName: "Michelle", lastName: "Rodriguez", email: "michelle.rodriguez@ainspect.com", license: "INS-CA-003", managerId: manager2Id, lastLogin: 720 },
      { firstName: "Kevin", lastName: "Lee", email: "kevin.lee@ainspect.com", license: "INS-WA-001", managerId: manager1Id, lastLogin: 1440 },
      { firstName: "Rachel", lastName: "White", email: "rachel.white@ainspect.com", license: "INS-OR-001", managerId: manager2Id, lastLogin: 2880 },
      { firstName: "Brandon", lastName: "Hall", email: "brandon.hall@ainspect.com", license: "INS-NV-001", managerId: manager1Id, lastLogin: 4320 },
      { firstName: "Nicole", lastName: "Lewis", email: "nicole.lewis@ainspect.com", license: "INS-AZ-001", managerId: manager2Id, lastLogin: 7200 },
      { firstName: "Jonathan", lastName: "Clark", email: "jonathan.clark@ainspect.com", license: "INS-CO-001", managerId: manager1Id, lastLogin: 10080 }
    ];

    for (let i = 0; i < inspectorData.length; i++) {
      const inspector = inspectorData[i];
      const inspectorId = `inspector_${String(i + 1).padStart(3, '0')}`;
      inspectorIds.push(inspectorId);

      await storage.upsertUser({
        id: inspectorId,
        email: inspector.email,
        passwordHash: await bcrypt.hash("inspector123", 10),
        firstName: inspector.firstName,
        lastName: inspector.lastName,
        name: `${inspector.firstName} ${inspector.lastName}`,
        role: "inspector",
        licenseNumber: inspector.license,
        managerId: inspector.managerId,
        isActive: true,
        lastLoginAt: new Date(Date.now() - inspector.lastLogin * 60 * 1000), // minutes ago
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // random within 90 days
        updatedAt: new Date()
      });
    }

    // Create some inactive users
    const inactiveIds = [];
    for (let i = 0; i < 3; i++) {
      const inactiveId = `inactive_${String(i + 1).padStart(3, '0')}`;
      inactiveIds.push(inactiveId);

      await storage.upsertUser({
        id: inactiveId,
        email: `inactive${i + 1}@ainspect.com`,
        passwordHash: await bcrypt.hash("inactive123", 10),
        firstName: "Inactive",
        lastName: `User ${i + 1}`,
        name: `Inactive User ${i + 1}`,
        role: "inspector",
        managerId: i % 2 === 0 ? manager1Id : manager2Id,
        isActive: false,
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    // Create pending invitations
    const pendingInvites = [
      { email: "new.inspector1@example.com", role: "inspector", managerId: manager1Id },
      { email: "new.inspector2@example.com", role: "inspector", managerId: manager2Id },
      { email: "new.manager@example.com", role: "manager" }
    ];

    for (const invite of pendingInvites) {
      await storage.createUserInvitation({
        email: invite.email,
        role: invite.role as any,
        invitedBy: superAdminId,
        managerId: invite.managerId || null,
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      });
    }

    // Create audit logs for recent activity
    const auditActions = [
      { action: 'login', userId: inspectorIds[0], hours: 1 },
      { action: 'login', userId: inspectorIds[1], hours: 2 },
      { action: 'inspection_created', userId: inspectorIds[2], hours: 3 },
      { action: 'report_generated', userId: inspectorIds[0], hours: 4 },
      { action: 'user_invited', userId: manager1Id, hours: 5 },
      { action: 'role_changed', userId: superAdminId, hours: 6 },
      { action: 'login', userId: manager1Id, hours: 7 },
      { action: 'license_updated', userId: manager2Id, hours: 8 },
      { action: 'inspection_completed', userId: inspectorIds[3], hours: 12 },
      { action: 'login', userId: inspectorIds[4], hours: 24 }
    ];

    for (const audit of auditActions) {
      await storage.createAuditLog({
        userId: audit.userId,
        action: audit.action,
        entityType: audit.action.includes('user') ? 'user' : audit.action.includes('inspection') ? 'inspection' : 'system',
        entityId: audit.userId,
        details: { action: audit.action },
        timestamp: new Date(Date.now() - audit.hours * 60 * 60 * 1000),
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    // Seed narrative templates
    try {
      await seedDefaultNarratives();
    } catch (error) {
      console.log('📝 Narrative templates may already exist, continuing...');
    }

    console.log("✅ Development data seeded successfully!");
    console.log(`
📊 Created:
   - 1 Super Admin (admin@ainspect.com / admin123)
   - 2 Managers (manager@ainspect.com / manager123)
   - 15 Active Inspectors (*.inspector123) 
   - 3 Inactive Users
   - 3 Pending Invitations
   - 10 Recent Activity Logs
   - Sample Narrative Templates
    `);

  } catch (error) {
    console.error("❌ Error seeding development data:", error);
    throw error;
  }
}