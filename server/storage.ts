import { 
  users,
  branchOffices,
  userInvitations,
  teamHierarchies,
  auditLogs,
  inspectionReports,
  reportAuditTrail,
  trecInspections,
  trecSectionItems,
  trecPhotos,
  trecRooms,
  trecAuditTrail,
  // Admin system imports (additive)
  userRoles,
  organizations,
  organizationMembers,
  organizationSettings,
  webhooks,
  orgNotes,
  apiKeys,
  adminInvitations,
  adminAuditLogs,
  onboardingChecklists,
  type User,
  type UpsertUser,
  type InsertUser,
  type BranchOffice,
  type InsertBranchOffice,
  type UserInvitation,
  type InsertUserInvitation,
  type TeamHierarchy,
  type InsertTeamHierarchy,
  type AuditLog,
  type InsertAuditLog,
  type InspectionReport,
  type InsertInspectionReport,
  type ReportAuditTrail,
  type InsertReportAuditTrail,
  type TRECInspection,
  type InsertTRECInspection,
  type TRECSectionItem,
  type InsertTRECSectionItem,
  type TRECPhoto,
  type InsertTRECPhoto,
  type TRECRoom,
  type InsertTRECRoom,
  type TRECAuditTrail,
  type InsertTRECAuditTrail,
  // Admin system types (additive)
  type UserRole,
  type InsertUserRole,
  type Organization,
  type InsertOrganization,
  type OrganizationMember,
  type InsertOrganizationMember,
  type ApiKey,
  type InsertApiKey,
  type AdminInvitation,
  type InsertAdminInvitation,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  type OnboardingChecklist,
  type InsertOnboardingChecklist,
  companySettings,
  // Service marketplace types
  type Service,
  type InsertService,
  type InspectorService,
  type InsertInspectorService,
  type InspectionService,
  type InsertInspectionService,
  // Service marketplace tables
  services,
  inspectorServices,
  inspectionServices
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, isNull, count, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  getUsersByManagerId(managerId: string): Promise<User[]>;
  updateUserRole(userId: string, role: string, managerId?: string): Promise<User>;
  updateUserLicense(userId: string, licenseNumber: string): Promise<User>;
  updateUserLastLogin(userId: string): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  getUserStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }>;
  
  // Branch Offices
  createBranchOffice(branch: InsertBranchOffice): Promise<BranchOffice>;
  getAllBranchOffices(): Promise<BranchOffice[]>;
  getBranchOffice(id: string): Promise<BranchOffice | undefined>;
  updateBranchOffice(id: string, branch: Partial<InsertBranchOffice>): Promise<BranchOffice>;
  
  // User Invitations
  createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getAllUserInvitations(): Promise<UserInvitation[]>;
  getPendingUserInvitations(): Promise<UserInvitation[]>;
  getUserInvitation(token: string): Promise<UserInvitation | undefined>;
  getUserInvitationById(id: string): Promise<UserInvitation | undefined>;
  acceptUserInvitation(token: string): Promise<UserInvitation>;
  cancelUserInvitation(id: string): Promise<void>;
  resendUserInvitation(id: string): Promise<UserInvitation>;
  
  // Team Hierarchies
  createTeamHierarchy(hierarchy: InsertTeamHierarchy): Promise<TeamHierarchy>;
  getTeamHierarchiesByParent(parentUserId: string): Promise<TeamHierarchy[]>;
  getTeamHierarchiesByChild(childUserId: string): Promise<TeamHierarchy[]>;
  
  // Audit Logs & User Activity
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByAction(action: string): Promise<AuditLog[]>;
  getRecentUserActivity(limit?: number): Promise<AuditLog[]>;
  
  // Inspection Reports
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  saveInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  getInspectionReport(id: string): Promise<InspectionReport | undefined>;
  getInspectionReportById(id: string): Promise<InspectionReport | undefined>;
  getAllInspectionReports(): Promise<InspectionReport[]>;
  getUserInspectionReports(userId: string): Promise<InspectionReport[]>;
  getInspectionReportsByInspector(inspectorId: string): Promise<InspectionReport[]>;
  updateInspectionReport(id: string, report: Partial<InsertInspectionReport>): Promise<InspectionReport>;
  deleteInspectionReport(id: string): Promise<void>;
  
  // Report Audit Trail
  createReportAuditEntry(entry: InsertReportAuditTrail): Promise<ReportAuditTrail>;
  getReportAuditTrail(reportId: string): Promise<ReportAuditTrail[]>;
  
  // TREC Inspections
  createTRECInspection(inspection: InsertTRECInspection): Promise<TRECInspection>;
  getTRECInspection(id: string): Promise<TRECInspection | undefined>;
  getAllTRECInspections(): Promise<TRECInspection[]>;
  getUserTRECInspections(userId: string): Promise<TRECInspection[]>;
  updateTRECInspection(id: string, inspection: Partial<InsertTRECInspection>): Promise<TRECInspection>;
  deleteTRECInspection(id: string): Promise<void>;
  
  // TREC Section Items
  createTRECSectionItem(sectionItem: InsertTRECSectionItem): Promise<TRECSectionItem>;
  getTRECSectionItems(inspectionId: string): Promise<TRECSectionItem[]>;
  getTRECSectionItem(id: string): Promise<TRECSectionItem | undefined>;
  updateTRECSectionItem(id: string, sectionItem: Partial<InsertTRECSectionItem>): Promise<TRECSectionItem>;
  deleteTRECSectionItem(id: string): Promise<void>;
  
  // TREC Photos
  createTRECPhoto(photo: InsertTRECPhoto): Promise<TRECPhoto>;
  getTRECPhotos(inspectionId: string): Promise<TRECPhoto[]>;
  getTRECPhoto(id: string): Promise<TRECPhoto | undefined>;
  deleteTRECPhoto(id: string): Promise<void>;

  // TREC Rooms
  createTRECRoom(room: InsertTRECRoom): Promise<TRECRoom>;
  getTRECRooms(inspectionId: string): Promise<TRECRoom[]>;
  updateTRECRoom(id: string, room: Partial<InsertTRECRoom>): Promise<TRECRoom>;
  deleteTRECRoom(id: string): Promise<void>;
  deleteTRECRoomsByInspection(inspectionId: string): Promise<void>;
  
  // TREC Audit Trail
  createTRECAuditEntry(entry: InsertTRECAuditTrail): Promise<TRECAuditTrail>;
  getTRECAuditTrail(inspectionId: string): Promise<TRECAuditTrail[]>;
  
  // Company Settings
  getCompanySettings(): Promise<any>;
  upsertCompanySettings(settings: any): Promise<any>;
  
  // Service Marketplace
  getAllServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  getInspectorServices(inspectorId: string): Promise<InspectorService[]>;
  updateInspectorService(inspectorId: string, serviceUpdate: Partial<InsertInspectorService>): Promise<InspectorService>;
  addServicesToInspection(inspectionId: string, serviceIds: string[]): Promise<InspectionService[]>;
  getInspectionServices(inspectionId: string): Promise<InspectionService[]>;
  updateInspectionServiceStatus(inspectionId: string, serviceId: string, status: string, notes?: string): Promise<InspectionService>;
  removeServiceFromInspection(inspectionId: string, serviceId: string): Promise<void>;
  getServiceRecommendations(criteria: { propertyType?: string; squareFootage?: number; yearBuilt?: number }): Promise<Service[]>;
  
  // ============================================================================
  // ADMIN / OPS DASHBOARD METHODS (ADDITIVE ONLY)
  // ============================================================================
  
  // User Roles (RBAC)
  getUserAdminRoles(userId: string): Promise<string[]>;
  assignUserRole(userId: string, role: string, assignedBy: string): Promise<UserRole>;
  revokeUserRole(userId: string, role: string): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Organizations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizations(query?: string, status?: string, page?: number, limit?: number): Promise<{ data: Organization[]; total: number }>;
  getOrganization(id: string): Promise<Organization | undefined>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization>;
  getOrganizationWithDetails(id: string): Promise<Organization & { members?: OrganizationMember[]; apiKeys?: ApiKey[]; warrantyStats?: any }>;
  
  // Organization Members
  addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>;
  removeOrganizationMember(organizationId: string, userId: string): Promise<void>;
  updateMemberRole(organizationId: string, userId: string, role: string): Promise<OrganizationMember>;
  updateMemberStatus(organizationId: string, userId: string, status: string, reason?: string): Promise<OrganizationMember>;
  
  // API Keys
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeys(organizationId?: string): Promise<ApiKey[]>;
  getApiKey(id: string): Promise<ApiKey | undefined>;
  revokeApiKey(id: string): Promise<ApiKey>;
  rotateApiKey(id: string, newHashedKey: string, newPrefix: string): Promise<ApiKey>;
  updateApiKeyUsage(id: string): Promise<void>;
  getApiKeyUsage(keyId: string, days?: number): Promise<{ calls: number; errors: number; lastUsed?: Date }>;
  
  // Admin Invitations
  createAdminInvitation(invitation: InsertAdminInvitation): Promise<AdminInvitation>;
  getAdminInvitations(organizationId?: string): Promise<AdminInvitation[]>;
  getAdminInvitation(tokenHash: string): Promise<AdminInvitation | undefined>;
  acceptAdminInvitation(tokenHash: string): Promise<AdminInvitation>;
  resendAdminInvitation(id: string): Promise<AdminInvitation>;
  
  // Admin Audit Logs
  createAdminAuditLog(log: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(filters?: {
    organizationId?: string;
    actorUserId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminAuditLog[]; total: number }>;
  
  // Onboarding Checklists
  getOnboardingSteps(organizationId: string): Promise<OnboardingChecklist[]>;
  createOnboardingStep(step: InsertOnboardingChecklist): Promise<OnboardingChecklist>;
  markOnboardingStepComplete(organizationId: string, step: string, notes?: string): Promise<OnboardingChecklist>;
  
  // Webhooks System  
  getOrganizationWebhooks(organizationId: string): Promise<any[]>;
  createWebhook(webhook: any): Promise<any>;
  updateWebhook(webhookId: string, updates: any): Promise<any>;
  deleteWebhook(webhookId: string): Promise<void>;
  
  // Organization Notes
  getOrganizationNotes(organizationId: string): Promise<any[]>;
  createOrganizationNote(note: any): Promise<any>;
  updateOrganizationNote(noteId: string, updates: any): Promise<any>;

  // Warranty Integration (read-only)
  getWarrantyStatsByOrganization(organizationId: string, days?: number): Promise<{
    pending: number;
    queued: number;
    sent: number;
    confirmed: number;
    failed: number;
    lastUpdated?: Date;
  }>;
  getWarrantyReports(organizationId: string, limit?: number): Promise<InspectionReport[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getActiveUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true)).orderBy(desc(users.lastLoginAt));
  }

  async getUsersByManagerId(managerId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.managerId, managerId));
  }

  async updateUserRole(userId: string, role: string, managerId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        role: role as any,
        managerId: managerId || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserLicense(userId: string, licenseNumber: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        licenseNumber,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
    const allUsers = await db.select().from(users);
    const activeUsers = allUsers.filter(u => u.isActive);
    
    const byRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allUsers.length,
      active: activeUsers.length,
      byRole
    };
  }

  // Branch Offices
  async createBranchOffice(branch: InsertBranchOffice): Promise<BranchOffice> {
    const [office] = await db.insert(branchOffices).values(branch).returning();
    return office;
  }

  async getAllBranchOffices(): Promise<BranchOffice[]> {
    return await db.select().from(branchOffices);
  }

  async getBranchOffice(id: string): Promise<BranchOffice | undefined> {
    const [office] = await db.select().from(branchOffices).where(eq(branchOffices.id, id));
    return office;
  }

  async updateBranchOffice(id: string, branch: Partial<InsertBranchOffice>): Promise<BranchOffice> {
    const [office] = await db
      .update(branchOffices)
      .set({ ...branch, updatedAt: new Date() })
      .where(eq(branchOffices.id, id))
      .returning();
    return office;
  }

  // User Invitations
  async createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [inv] = await db.insert(userInvitations).values(invitation).returning();
    return inv;
  }

  async getAllUserInvitations(): Promise<UserInvitation[]> {
    return await db.select().from(userInvitations).orderBy(desc(userInvitations.createdAt));
  }

  async getPendingUserInvitations(): Promise<UserInvitation[]> {
    return await db.select()
      .from(userInvitations)
      .where(and(
        eq(userInvitations.isActive, true),
        isNull(userInvitations.acceptedAt)
      ))
      .orderBy(desc(userInvitations.createdAt));
  }

  async getUserInvitation(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return invitation;
  }

  async getUserInvitationById(id: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.id, id));
    return invitation;
  }

  async acceptUserInvitation(token: string): Promise<UserInvitation> {
    const [invitation] = await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token))
      .returning();
    return invitation;
  }

  async cancelUserInvitation(id: string): Promise<void> {
    await db
      .update(userInvitations)
      .set({ isActive: false })
      .where(eq(userInvitations.id, id));
  }

  async resendUserInvitation(id: string): Promise<UserInvitation> {
    const [invitation] = await db
      .update(userInvitations)
      .set({ 
        token: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .where(eq(userInvitations.id, id))
      .returning();
    return invitation;
  }

  // Team Hierarchies
  async createTeamHierarchy(hierarchy: InsertTeamHierarchy): Promise<TeamHierarchy> {
    const [team] = await db.insert(teamHierarchies).values(hierarchy).returning();
    return team;
  }

  async getTeamHierarchiesByParent(parentUserId: string): Promise<TeamHierarchy[]> {
    return await db.select().from(teamHierarchies).where(eq(teamHierarchies.parentUserId, parentUserId));
  }

  async getTeamHierarchiesByChild(childUserId: string): Promise<TeamHierarchy[]> {
    return await db.select().from(teamHierarchies).where(eq(teamHierarchies.childUserId, childUserId));
  }

  // Audit Logs & User Activity
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(auditLog).returning();
    return log;
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  async getAuditLogsByAction(action: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.action, action)).orderBy(desc(auditLogs.timestamp));
  }

  async getRecentUserActivity(limit: number = 100): Promise<AuditLog[]> {
    return await db.select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Inspection Reports
  async createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport> {
    const [inspectionReport] = await db.insert(inspectionReports).values(report).returning();
    return inspectionReport;
  }

  async getInspectionReport(id: string): Promise<InspectionReport | undefined> {
    const [report] = await db.select().from(inspectionReports).where(eq(inspectionReports.id, id));
    return report;
  }

  async getAllInspectionReports(): Promise<InspectionReport[]> {
    return await db.select().from(inspectionReports).orderBy(desc(inspectionReports.createdAt));
  }

  async getUserInspectionReports(userId: string): Promise<InspectionReport[]> {
    return await db.select()
      .from(inspectionReports)
      .where(eq(inspectionReports.inspectorId, userId))
      .orderBy(desc(inspectionReports.createdAt));
  }

  async updateInspectionReport(id: string, report: Partial<InsertInspectionReport>): Promise<InspectionReport> {
    const [updated] = await db
      .update(inspectionReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(inspectionReports.id, id))
      .returning();
    return updated;
  }

  // Additional inspection report methods - enhanced with transaction safety
  async saveInspectionReport(report: InsertInspectionReport & { id?: string }): Promise<InspectionReport> {
    try {
      console.log('[STORAGE] saveInspectionReport called');
      console.log('[STORAGE] Report ID:', report.id || 'NEW');
      console.log('[STORAGE] Inspector ID:', report.inspectorId);
      console.log('[STORAGE] Inspection Type:', report.inspectionType);
      console.log('[STORAGE] Client:', report.clientFirstName, report.clientLastName);
      console.log('[STORAGE] Property Address:', report.propertyAddress);
      
      // Log TREC-specific fields if it's a TREC inspection
      if (report.inspectionType === 'trec') {
        console.log('[STORAGE] === TREC INSPECTION STORAGE LOG ===');
        console.log('[STORAGE] Inspector Name:', report.inspectorName);
        console.log('[STORAGE] TREC License Number:', report.trecLicenseNumber);
        console.log('[STORAGE] Sponsor Name:', report.sponsorName);
        console.log('[STORAGE] Sponsor License:', report.sponsorTrecLicenseNumber);
        console.log('[STORAGE] Status:', report.status);
        console.log('[STORAGE] Inspection Date:', report.inspectionDate);
        console.log('[STORAGE] Completed Sections:', report.completedSections);
        console.log('[STORAGE] Total Photos:', report.photosCount);
        
        // Log report data structure
        if (report.reportData) {
          console.log('[STORAGE] Report Data Keys:', Object.keys(report.reportData));
          if (report.reportData.companyData) {
            console.log('[STORAGE] Company Data Keys:', Object.keys(report.reportData.companyData));
          }
          if (report.reportData.warrantyData) {
            console.log('[STORAGE] Warranty Data Keys:', Object.keys(report.reportData.warrantyData));
          }
          if (report.reportData.inspectionData?.sections) {
            console.log('[STORAGE] Inspection Sections:', Object.keys(report.reportData.inspectionData.sections));
          }
        }
        console.log('[STORAGE] === END TREC INSPECTION STORAGE LOG ===');
      }
      
      // CRITICAL FIX: Check if we have an existing ID to update
      if (report.id) {
        console.log('[storage] Updating existing report:', report.id);
        
        // Remove the ID from the update data (PostgreSQL doesn't allow updating primary keys)
        const { id, ...updateData } = report;
        
        // Update the existing report
        const [inspectionReport] = await db.transaction(async (tx) => {
          return await tx
            .update(inspectionReports)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(inspectionReports.id, id))
            .returning();
        });
        
        if (!inspectionReport) {
          throw new Error(`Report with ID ${id} not found for update`);
        }
        
        console.log('[storage] Report updated successfully', {
          id: inspectionReport.id,
          inspectorId: inspectionReport.inspectorId
        });
        
        return inspectionReport;
      } else {
        console.log('[storage] Creating new report');
        
        // Create new report (original logic)
        const [inspectionReport] = await db.transaction(async (tx) => {
          return await tx.insert(inspectionReports).values(report).returning();
        });
        
        console.log('[storage] Report saved successfully', { 
          id: inspectionReport.id, 
          inspectorId: inspectionReport.inspectorId 
        });
        
        // Log where data was saved and what fields
        console.log('[STORAGE] === DATABASE SAVE LOCATION ===');
        console.log('[STORAGE] Table: inspection_reports');
        console.log('[STORAGE] Report ID:', inspectionReport.id);
        console.log('[STORAGE] Database fields saved:', Object.keys(inspectionReport));
        
        if (report.inspectionType === 'trec') {
          console.log('[STORAGE] TREC-specific fields saved:');
          console.log('[STORAGE]   - inspectionType:', inspectionReport.inspectionType);
          console.log('[STORAGE]   - inspectorName:', inspectionReport.inspectorName);
          console.log('[STORAGE]   - trecLicenseNumber:', inspectionReport.trecLicenseNumber);
          console.log('[STORAGE]   - sponsorName:', inspectionReport.sponsorName);
          console.log('[STORAGE]   - sponsorTrecLicenseNumber:', inspectionReport.sponsorTrecLicenseNumber);
          console.log('[STORAGE]   - reportData (JSONB):', inspectionReport.reportData ? 'Present' : 'Missing');
          console.log('[STORAGE]   - completedSections:', inspectionReport.completedSections);
          console.log('[STORAGE]   - photosCount:', inspectionReport.photosCount);
          
          // Log detailed reportData structure
          if (inspectionReport.reportData) {
            console.log('[STORAGE] === REPORT DATA STRUCTURE SAVED ===');
            console.log('[STORAGE] ReportData keys:', Object.keys(inspectionReport.reportData));
            
            if (inspectionReport.reportData.inspectionData?.sections) {
              const sections = inspectionReport.reportData.inspectionData.sections;
              console.log('[STORAGE] Sections in database:', Object.keys(sections));
              
              // Show sample section data structure
              const firstSection = Object.keys(sections)[0];
              if (firstSection) {
                console.log(`[STORAGE] Sample section ${firstSection} structure:`, {
                  itemCount: Object.keys(sections[firstSection]).length,
                  sampleItem: Object.keys(sections[firstSection])[0],
                  sampleItemData: sections[firstSection][Object.keys(sections[firstSection])[0]]
                });
              }
            }
            
            if (inspectionReport.reportData.companyData) {
              console.log('[STORAGE] Company data saved:', Object.keys(inspectionReport.reportData.companyData));
            }
            
            if (inspectionReport.reportData.warrantyData) {
              console.log('[STORAGE] Warranty data saved:', Object.keys(inspectionReport.reportData.warrantyData));
            }
            
            console.log('[STORAGE] === END REPORT DATA STRUCTURE SAVED ===');
          }
        }
        console.log('[STORAGE] === END DATABASE SAVE LOCATION ===');
        
        return inspectionReport;
      }
    } catch (error: any) {
      console.error('[storage] Failed to save report', { 
        code: error?.code, 
        message: error?.message,
        inspectorId: report.inspectorId 
      });
      throw error;
    }
  }

  async getInspectionReportById(id: string): Promise<InspectionReport | undefined> {
    return await this.getInspectionReport(id);
  }

  async getInspectionReportsByInspector(inspectorId: string): Promise<InspectionReport[]> {
    return await this.getUserInspectionReports(inspectorId);
  }

  async deleteInspectionReport(id: string): Promise<void> {
    await db.delete(inspectionReports).where(eq(inspectionReports.id, id));
  }

  // Report Audit Trail
  async createReportAuditEntry(entry: InsertReportAuditTrail): Promise<ReportAuditTrail> {
    const [auditEntry] = await db.insert(reportAuditTrail).values(entry).returning();
    return auditEntry;
  }

  async getReportAuditTrail(reportId: string): Promise<ReportAuditTrail[]> {
    return await db.select()
      .from(reportAuditTrail)
      .where(eq(reportAuditTrail.reportId, reportId))
      .orderBy(desc(reportAuditTrail.timestamp));
  }

  // ============================================================================
  // TREC INSPECTIONS
  // ============================================================================

  async createTRECInspection(inspection: InsertTRECInspection): Promise<TRECInspection> {
    console.log('[STORAGE] Creating TREC inspection with data:', JSON.stringify(inspection, null, 2));
    try {
      const [trecInspection] = await db.insert(trecInspections).values(inspection).returning();
      console.log('[STORAGE] TREC inspection created successfully:', trecInspection.id);
      return trecInspection;
    } catch (error) {
      console.error('[STORAGE] Error creating TREC inspection:', error);
      throw error;
    }
  }

  async getTRECInspection(id: string): Promise<TRECInspection | undefined> {
    try {
      // Try to select all columns first
      const [inspection] = await db.select().from(trecInspections).where(eq(trecInspections.id, id));
      return inspection;
    } catch (error) {
      // If there's a column error, try with only existing columns
      console.warn('Column error in getTRECInspection, trying with existing columns:', error);
      try {
        const [inspection] = await db.select({
          id: trecInspections.id,
          clientName: trecInspections.clientName,
          inspectionDate: trecInspections.inspectionDate,
          propertyAddress: trecInspections.propertyAddress,
          inspectorName: trecInspections.inspectorName,
          trecLicenseNumber: trecInspections.trecLicenseNumber,
          sponsorName: trecInspections.sponsorName,
          sponsorTrecLicenseNumber: trecInspections.sponsorTrecLicenseNumber,
          inspectorId: trecInspections.inspectorId,
          status: trecInspections.status,
          completedSections: trecInspections.completedSections,
          totalPhotos: trecInspections.totalPhotos,
          createdAt: trecInspections.createdAt,
          updatedAt: trecInspections.updatedAt,
          completedAt: trecInspections.completedAt
        }).from(trecInspections).where(eq(trecInspections.id, id));
        
        // Add null values for missing columns
        return inspection ? {
          ...inspection,
          companyData: null,
          warrantyData: null,
          inspectionData: null
        } : undefined;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error; // Re-throw original error
      }
    }
  }

  async getAllInspectionReports(): Promise<InspectionReport[]> {
    try {
      return await db.select().from(inspectionReports).orderBy(desc(inspectionReports.createdAt));
    } catch (error) {
      console.error('Error fetching all inspection reports:', error);
      throw error;
    }
  }

  async getAllTRECInspections(): Promise<TRECInspection[]> {
    try {
      // Use the unified inspection_reports table for TREC inspections
      const inspections = await db.select()
        .from(inspectionReports)
        .where(eq(inspectionReports.inspectionType, 'trec'))
        .orderBy(desc(inspectionReports.createdAt));
      
      // Transform to TRECInspection format
      return inspections.map(inspection => ({
        id: inspection.id,
        clientName: `${inspection.clientFirstName} ${inspection.clientLastName}`,
        inspectionDate: inspection.inspectionDate,
        propertyAddress: inspection.propertyAddress,
        inspectorName: inspection.inspectorName || '',
        trecLicenseNumber: inspection.trecLicenseNumber || '',
        sponsorName: inspection.sponsorName || null,
        sponsorTrecLicenseNumber: inspection.sponsorTrecLicenseNumber || null,
        inspectorId: inspection.inspectorId,
        status: inspection.status,
        completedSections: inspection.completedSections || [],
        totalPhotos: inspection.photosCount || 0,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
        completedAt: inspection.completedAt,
        // Extract TREC-specific data from reportData JSONB
        companyData: inspection.reportData?.companyData || null,
        warrantyData: inspection.reportData?.warrantyData || null,
        inspectionData: inspection.reportData?.inspectionData || null
      }));
    } catch (error) {
      console.error('Error fetching all TREC inspections:', error);
      throw error;
    }
  }

  async getUserTRECInspections(userId: string): Promise<TRECInspection[]> {
    try {
      // Use the unified inspection_reports table for TREC inspections
      const inspections = await db.select()
        .from(inspectionReports)
        .where(and(
          eq(inspectionReports.inspectorId, userId),
          eq(inspectionReports.inspectionType, 'trec')
        ))
        .orderBy(desc(inspectionReports.createdAt));
      
      // Transform to TRECInspection format
      return inspections.map(inspection => ({
        id: inspection.id,
        clientName: `${inspection.clientFirstName} ${inspection.clientLastName}`,
        inspectionDate: inspection.inspectionDate,
        propertyAddress: inspection.propertyAddress,
        inspectorName: inspection.inspectorName || '',
        trecLicenseNumber: inspection.trecLicenseNumber || '',
        sponsorName: inspection.sponsorName || null,
        sponsorTrecLicenseNumber: inspection.sponsorTrecLicenseNumber || null,
        inspectorId: inspection.inspectorId,
        status: inspection.status,
        completedSections: inspection.completedSections || [],
        totalPhotos: inspection.photosCount || 0,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
        completedAt: inspection.completedAt,
        // Extract TREC-specific data from reportData JSONB
        companyData: inspection.reportData?.companyData || null,
        warrantyData: inspection.reportData?.warrantyData || null,
        inspectionData: inspection.reportData?.inspectionData || null
      }));
    } catch (error) {
      console.error('Error fetching user TREC inspections:', error);
      throw error;
    }
  }

  async updateTRECInspection(id: string, inspection: Partial<InsertTRECInspection>): Promise<TRECInspection> {
    const [updated] = await db
      .update(trecInspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(trecInspections.id, id))
      .returning();
    return updated;
  }

  async deleteTRECInspection(id: string): Promise<void> {
    await db.delete(trecInspections).where(eq(trecInspections.id, id));
  }

  // ============================================================================
  // TREC SECTION ITEMS
  // ============================================================================

  async createTRECSectionItem(sectionItem: InsertTRECSectionItem): Promise<TRECSectionItem> {
    const [item] = await db.insert(trecSectionItems).values(sectionItem).returning();
    return item;
  }

  async getTRECSectionItems(inspectionId: string): Promise<TRECSectionItem[]> {
    return await db.select()
      .from(trecSectionItems)
      .where(eq(trecSectionItems.inspectionId, inspectionId))
      .orderBy(trecSectionItems.majorSection, trecSectionItems.minorSection);
  }

  async getTRECSectionItem(id: string): Promise<TRECSectionItem | undefined> {
    const [item] = await db.select().from(trecSectionItems).where(eq(trecSectionItems.id, id));
    return item;
  }

  async updateTRECSectionItem(id: string, sectionItem: Partial<InsertTRECSectionItem>): Promise<TRECSectionItem> {
    const [updated] = await db
      .update(trecSectionItems)
      .set({ ...sectionItem, updatedAt: new Date() })
      .where(eq(trecSectionItems.id, id))
      .returning();
    return updated;
  }

  async deleteTRECSectionItem(id: string): Promise<void> {
    await db.delete(trecSectionItems).where(eq(trecSectionItems.id, id));
  }

  // ============================================================================
  // TREC PHOTOS
  // ============================================================================

  async createTRECPhoto(photo: InsertTRECPhoto): Promise<TRECPhoto> {
    const [trecPhoto] = await db.insert(trecPhotos).values(photo).returning();
    return trecPhoto;
  }

  async getTRECPhotos(inspectionId: string): Promise<TRECPhoto[]> {
    return await db.select()
      .from(trecPhotos)
      .where(eq(trecPhotos.inspectionId, inspectionId))
      .orderBy(desc(trecPhotos.uploadedAt));
  }

  async getTRECPhoto(id: string): Promise<TRECPhoto | undefined> {
    const [photo] = await db.select().from(trecPhotos).where(eq(trecPhotos.id, id));
    return photo;
  }

  async deleteTRECPhoto(id: string): Promise<void> {
    await db.delete(trecPhotos).where(eq(trecPhotos.id, id));
  }

  // ============================================================================
  // TREC ROOMS
  // ============================================================================

  async createTRECRoom(room: InsertTRECRoom): Promise<TRECRoom> {
    const [trecRoom] = await db.insert(trecRooms).values(room).returning();
    return trecRoom;
  }

  async getTRECRooms(inspectionId: string): Promise<TRECRoom[]> {
    return await db.select()
      .from(trecRooms)
      .where(eq(trecRooms.inspectionId, inspectionId))
      .orderBy(trecRooms.name);
  }

  async updateTRECRoom(id: string, room: Partial<InsertTRECRoom>): Promise<TRECRoom> {
    const [updated] = await db
      .update(trecRooms)
      .set({ ...room, updatedAt: new Date() })
      .where(eq(trecRooms.id, id))
      .returning();
    return updated;
  }

  async deleteTRECRoom(id: string): Promise<void> {
    await db.delete(trecRooms).where(eq(trecRooms.id, id));
  }

  async deleteTRECRoomsByInspection(inspectionId: string): Promise<void> {
    await db.delete(trecRooms).where(eq(trecRooms.inspectionId, inspectionId));
  }

  // ============================================================================
  // TREC AUDIT TRAIL
  // ============================================================================

  async createTRECAuditEntry(entry: InsertTRECAuditTrail): Promise<TRECAuditTrail> {
    const [auditEntry] = await db.insert(trecAuditTrail).values(entry).returning();
    return auditEntry;
  }

  async getTRECAuditTrail(inspectionId: string): Promise<TRECAuditTrail[]> {
    return await db.select()
      .from(trecAuditTrail)
      .where(eq(trecAuditTrail.inspectionId, inspectionId))
      .orderBy(desc(trecAuditTrail.timestamp));
  }

  // ============================================================================
  // COMPANY SETTINGS
  // ============================================================================

  async getCompanySettings(): Promise<any> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings || null;
  }

  async upsertCompanySettings(settingsData: any): Promise<any> {
    const [settings] = await db
      .insert(companySettings)
      .values(settingsData)
      .onConflictDoUpdate({
        target: companySettings.id,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // ============================================================================
  // SERVICE MARKETPLACE IMPLEMENTATIONS
  // ============================================================================

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true));
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db.select().from(services).where(and(eq(services.category, category), eq(services.isActive, true)));
  }

  async getInspectorServices(inspectorId: string): Promise<InspectorService[]> {
    return await db.select().from(inspectorServices).where(eq(inspectorServices.inspectorId, inspectorId));
  }

  async updateInspectorService(inspectorId: string, serviceUpdate: Partial<InsertInspectorService>): Promise<InspectorService> {
    const [inspectorService] = await db
      .insert(inspectorServices)
      .values({
        inspectorId,
        ...serviceUpdate
      })
      .onConflictDoUpdate({
        target: [inspectorServices.inspectorId, inspectorServices.serviceId],
        set: {
          ...serviceUpdate,
          updatedAt: new Date(),
        },
      })
      .returning();
    return inspectorService;
  }

  async addServicesToInspection(inspectionId: string, serviceIds: string[]): Promise<InspectionService[]> {
    const services = await this.getAllServices();
    const inspectionServices = serviceIds.map(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return {
        inspectionId,
        serviceId,
        price: service?.basePrice || 0,
        status: 'pending'
      };
    });

    return await db.insert(inspectionServices).values(inspectionServices).returning();
  }

  async getInspectionServices(inspectionId: string): Promise<InspectionService[]> {
    return await db.select().from(inspectionServices).where(eq(inspectionServices.inspectionId, inspectionId));
  }

  async updateInspectionServiceStatus(inspectionId: string, serviceId: string, status: string, notes?: string): Promise<InspectionService> {
    const [inspectionService] = await db
      .update(inspectionServices)
      .set({
        status,
        notes,
        completedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(and(eq(inspectionServices.inspectionId, inspectionId), eq(inspectionServices.serviceId, serviceId)))
      .returning();
    return inspectionService;
  }

  async removeServiceFromInspection(inspectionId: string, serviceId: string): Promise<void> {
    await db
      .delete(inspectionServices)
      .where(and(eq(inspectionServices.inspectionId, inspectionId), eq(inspectionServices.serviceId, serviceId)));
  }

  async getServiceRecommendations(criteria: { propertyType?: string; squareFootage?: number; yearBuilt?: number }): Promise<Service[]> {
    let query = db.select().from(services).where(eq(services.isActive, true));

    // Add property type specific recommendations
    if (criteria.propertyType) {
      // Add logic for property type specific recommendations
      // For now, return popular services
      query = query.where(eq(services.isPopular, true));
    }

    // Add age-based recommendations
    if (criteria.yearBuilt && criteria.yearBuilt < 1990) {
      // Older homes might need more services
      query = query.where(eq(services.category, 'safety'));
    }

    return await query;
  }

  // ============================================================================
  // ADMIN / OPS DASHBOARD IMPLEMENTATIONS (ADDITIVE ONLY)
  // ============================================================================

  // User Roles (RBAC)
  async getUserAdminRoles(userId: string): Promise<string[]> {
    const roles = await db.select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)));
    return roles.map(r => r.role);
  }

  async assignUserRole(userId: string, role: string, assignedBy: string): Promise<UserRole> {
    const [userRole] = await db.insert(userRoles).values({
      userId,
      role: role as any,
      assignedBy,
      isActive: true
    }).returning();
    return userRole;
  }

  async revokeUserRole(userId: string, role: string): Promise<void> {
    await db.update(userRoles)
      .set({ isActive: false })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db.select({ users })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(and(eq(userRoles.role, role as any), eq(userRoles.isActive, true)));
    return result.map(r => r.users);
  }

  // Organizations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async getOrganizations(query?: string, status?: string, type?: string, page = 1, limit = 50): Promise<{ data: Organization[]; total: number }> {
    let conditions = [];
    if (status) conditions.push(eq(organizations.status, status));
    if (type) conditions.push(eq(organizations.type, type));
    if (query) conditions.push(ilike(organizations.name, `%${query}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [data, [{ total }]] = await Promise.all([
      db.select().from(organizations)
        .where(where)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(organizations.createdAt)),
      db.select({ total: count() }).from(organizations).where(where)
    ]);

    return { data, total: Number(total) };
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [updated] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async getOrganizationWithDetails(id: string): Promise<Organization & { members?: OrganizationMember[]; apiKeys?: ApiKey[]; warrantyStats?: any }> {
    const org = await this.getOrganization(id);
    if (!org) throw new Error('Organization not found');

    const [members, keys, warrantyStats] = await Promise.all([
      this.getOrganizationMembers(id),
      this.getApiKeys(id),
      this.getWarrantyStatsByOrganization(id, 7)
    ]);

    return { ...org, members, apiKeys: keys, warrantyStats };
  }

  // Organization Members
  async addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember> {
    const [orgMember] = await db.insert(organizationMembers).values(member).returning();
    return orgMember;
  }

  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(organizationMembers.createdAt);
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    await db.delete(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ));
  }

  async updateMemberRole(organizationId: string, userId: string, role: string): Promise<OrganizationMember> {
    const [updated] = await db
      .update(organizationMembers)
      .set({ role })
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .returning();
    return updated;
  }

  // API Keys
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(apiKey).returning();
    return key;
  }

  async getApiKeys(organizationId?: string): Promise<ApiKey[]> {
    const query = db.select().from(apiKeys);
    if (organizationId) {
      query.where(eq(apiKeys.organizationId, organizationId));
    }
    return await query.orderBy(desc(apiKeys.createdAt));
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return key;
  }

  async revokeApiKey(id: string): Promise<ApiKey> {
    const [revoked] = await db
      .update(apiKeys)
      .set({ status: 'revoked' })
      .where(eq(apiKeys.id, id))
      .returning();
    return revoked;
  }

  async rotateApiKey(id: string, newHashedKey: string, newPrefix: string): Promise<ApiKey> {
    const [rotated] = await db
      .update(apiKeys)
      .set({ hashedKey: newHashedKey, prefix: newPrefix })
      .where(eq(apiKeys.id, id))
      .returning();
    return rotated;
  }

  async updateApiKeyUsage(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  // Admin Invitations
  async createAdminInvitation(invitation: InsertAdminInvitation): Promise<AdminInvitation> {
    const [invite] = await db.insert(adminInvitations).values(invitation).returning();
    return invite;
  }

  async getAdminInvitations(organizationId?: string): Promise<AdminInvitation[]> {
    const query = db.select().from(adminInvitations);
    if (organizationId) {
      query.where(eq(adminInvitations.organizationId, organizationId));
    }
    return await query.orderBy(desc(adminInvitations.createdAt));
  }

  async getAdminInvitation(tokenHash: string): Promise<AdminInvitation | undefined> {
    const [invite] = await db.select().from(adminInvitations).where(eq(adminInvitations.tokenHash, tokenHash));
    return invite;
  }

  async acceptAdminInvitation(tokenHash: string): Promise<AdminInvitation> {
    const [accepted] = await db
      .update(adminInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(adminInvitations.tokenHash, tokenHash))
      .returning();
    return accepted;
  }

  async resendAdminInvitation(id: string): Promise<AdminInvitation> {
    const [resent] = await db.select().from(adminInvitations).where(eq(adminInvitations.id, id));
    return resent;
  }

  // Admin Audit Logs
  async createAdminAuditLog(log: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [auditLog] = await db.insert(adminAuditLogs).values(log).returning();
    return auditLog;
  }

  async getAdminAuditLogs(filters: {
    organizationId?: string;
    actorUserId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: AdminAuditLog[]; total: number }> {
    const { page = 1, limit = 50, ...filterFields } = filters;
    
    let conditions = [];
    if (filterFields.organizationId) conditions.push(eq(adminAuditLogs.organizationId, filterFields.organizationId));
    if (filterFields.actorUserId) conditions.push(eq(adminAuditLogs.actorUserId, filterFields.actorUserId));
    if (filterFields.action) conditions.push(eq(adminAuditLogs.action, filterFields.action));
    if (filterFields.dateFrom) conditions.push(sql`${adminAuditLogs.createdAt} >= ${filterFields.dateFrom}`);
    if (filterFields.dateTo) conditions.push(sql`${adminAuditLogs.createdAt} <= ${filterFields.dateTo}`);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select().from(adminAuditLogs)
        .where(where)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(adminAuditLogs.createdAt)),
      db.select({ total: count() }).from(adminAuditLogs).where(where)
    ]);

    return { data, total: Number(total) };
  }

  // Onboarding Checklists
  async getOnboardingSteps(organizationId: string): Promise<OnboardingChecklist[]> {
    return await db.select()
      .from(onboardingChecklists)
      .where(eq(onboardingChecklists.organizationId, organizationId))
      .orderBy(onboardingChecklists.createdAt);
  }

  async createOnboardingStep(step: InsertOnboardingChecklist): Promise<OnboardingChecklist> {
    const [onboardingStep] = await db.insert(onboardingChecklists).values(step).returning();
    return onboardingStep;
  }

  async markOnboardingStepComplete(organizationId: string, step: string, notes?: string): Promise<OnboardingChecklist> {
    const [updated] = await db
      .update(onboardingChecklists)
      .set({ completed: true, completedAt: new Date(), notes })
      .where(and(
        eq(onboardingChecklists.organizationId, organizationId),
        eq(onboardingChecklists.step, step)
      ))
      .returning();
    return updated;
  }

  // Warranty Integration (read-only)
  async getWarrantyStatsByOrganization(organizationId: string, days = 7): Promise<{
    pending: number;
    queued: number;
    sent: number;
    confirmed: number;
    failed: number;
    lastUpdated?: Date;
  }> {
    // Query inspection reports for warranty statistics
    // This is read-only integration with existing warranty system
    const dateFilter = sql`${inspectionReports.createdAt} >= NOW() - INTERVAL '${days} days'`;
    
    const stats = await db.select({
      status: inspectionReports.warrantyStatus,
      count: count()
    })
    .from(inspectionReports)
    .where(and(
      eq(inspectionReports.warrantyOptIn, true),
      dateFilter
    ))
    .groupBy(inspectionReports.warrantyStatus);

    const result = {
      pending: 0,
      queued: 0,
      sent: 0,
      confirmed: 0,
      failed: 0,
      lastUpdated: new Date()
    };

    stats.forEach(stat => {
      const status = stat.status as keyof typeof result;
      if (status !== 'lastUpdated') {
        result[status] = Number(stat.count);
      }
    });

    return result;
  }

  async getWarrantyReports(organizationId: string, limit = 20): Promise<InspectionReport[]> {
    // Read-only access to warranty reports
    return await db.select()
      .from(inspectionReports)
      .where(eq(inspectionReports.warrantyOptIn, true))
      .limit(limit)
      .orderBy(desc(inspectionReports.createdAt));
  }

  // Enhanced Organization Member Management
  async updateMemberStatus(organizationId: string, userId: string, status: string, reason?: string): Promise<OrganizationMember> {
    const [member] = await db
      .update(organizationMembers)
      .set({
        status: status as any,
        blockedReason: reason,
        updatedAt: new Date(),
      })
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .returning();
    return member;
  }

  // Enhanced API Key Management
  async getApiKeyUsage(keyId: string, days = 30): Promise<{ calls: number; errors: number; lastUsed?: Date }> {
    // TODO: Implement usage tracking when API key usage logging is added
    // For now, return mock data
    return {
      calls: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
      lastUsed: new Date()
    };
  }

  // Webhooks System
  async getOrganizationWebhooks(organizationId: string): Promise<any[]> {
    return await db.select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId))
      .orderBy(desc(webhooks.createdAt));
  }

  async createWebhook(webhook: any): Promise<any> {
    const [newWebhook] = await db.insert(webhooks).values({
      organizationId: webhook.organizationId,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      active: webhook.active ?? true,
      createdBy: webhook.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newWebhook;
  }

  async updateWebhook(webhookId: string, updates: any): Promise<any> {
    const [webhook] = await db
      .update(webhooks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, webhookId))
      .returning();
    return webhook;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  }

  // Organization Notes System
  async getOrganizationNotes(organizationId: string): Promise<any[]> {
    return await db.select()
      .from(orgNotes)
      .where(eq(orgNotes.organizationId, organizationId))
      .orderBy(desc(orgNotes.createdAt));
  }

  async createOrganizationNote(note: any): Promise<any> {
    const [newNote] = await db.insert(orgNotes).values({
      organizationId: note.organizationId,
      authorId: note.authorId,
      content: note.content,
      type: note.type ?? 'support',
      priority: note.priority ?? 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newNote;
  }

  async updateOrganizationNote(noteId: string, updates: any): Promise<any> {
    const [note] = await db
      .update(orgNotes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(orgNotes.id, noteId))
      .returning();
    return note;
  }
}

export const storage = new DatabaseStorage();
