import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, real, numeric, date, uniqueIndex } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth with enhanced role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  name: varchar("name"), // Full name field for simpler auth
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["super_admin", "manager", "inspector", "read_only"] }).notNull().default("inspector"),
  licenseNumber: varchar("license_number"),
  managerId: varchar("manager_id"), // For inspectors, references their manager
  branchOfficeId: varchar("branch_office_id"),
  phone: varchar("phone"),
  isActive: boolean("is_active").notNull().default(true),
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at"),
  lastLoginAt: timestamp("last_login_at"),
  // Terms and agreement acceptance tracking
  tosAcceptedAt: timestamp("tos_accepted_at"),
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  optInNonFlaggedAt: timestamp("opt_in_non_flagged_at"),
  digitalSignature: varchar("digital_signature"),
  signatureDate: timestamp("signature_date"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_users_email").on(table.email),
]);

// Branch offices/franchisees table for team hierarchies
export const branchOffices = pgTable("branch_offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: varchar("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  phone: varchar("phone"),
  email: varchar("email"),
  managerId: varchar("manager_id"),
  parentOfficeId: varchar("parent_office_id"), // For hierarchies
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User invitations table for email invites and auto-provisioning
export const userInvitations = pgTable("user_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  role: varchar("role", { enum: ["super_admin", "manager", "inspector", "read_only"] }).default("inspector"),
  invitedBy: varchar("invited_by").notNull(),
  managerId: varchar("manager_id"),
  branchOfficeId: varchar("branch_office_id"),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team hierarchy relationships table
export const teamHierarchies = pgTable("team_hierarchies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentUserId: varchar("parent_user_id").notNull(),
  childUserId: varchar("child_user_id").notNull(),
  hierarchyType: varchar("hierarchy_type", { enum: ["manager", "supervisor", "mentor"] }).default("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Audit Log types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Inspection Status enum
export const inspectionStatuses = [
  'not_started',
  'in_progress', 
  'awaiting_photos',
  'ready_to_review',
  'completed'
] as const;

// Warranty Status enum
export const warrantyStatuses = [
  'pending',
  'queued',
  'sent',
  'confirmed',
  'failed',
  'canceled'
] as const;

// Inspection Reports table with enhanced status tracking
export const inspectionReports = pgTable("inspection_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").references(() => users.id).notNull(),
  managerId: varchar("manager_id").references(() => users.id),
  clientFirstName: varchar("client_first_name").notNull(),
  clientLastName: varchar("client_last_name").notNull(),
  propertyAddress: varchar("property_address").notNull(),
  propertyType: varchar("property_type").notNull(),
  inspectionType: varchar("inspection_type", { enum: ['standard', 'trec'] }).default('standard').notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  status: varchar("status", { enum: inspectionStatuses }).default('not_started').notNull(),
  estimatedDuration: integer("estimated_duration").default(120),
  actualDuration: integer("actual_duration"),
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  notes: text("notes"),
  reportData: jsonb("report_data"),
  photosCount: integer("photos_count").default(0),
  completedSections: jsonb("completed_sections"),
  additionalServices: jsonb("additional_services").$type<string[]>(), // Array of selected additional services
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  isArchived: boolean("is_archived").default(false),
  // Warranty fields for Elite MGA integration
  warrantyOptIn: boolean("warranty_opt_in").notNull().default(false),
  warrantyProvider: text("warranty_provider"), // 'elite_mga' | null
  warrantyStatus: varchar("warranty_status", { enum: warrantyStatuses }).notNull().default('pending'),
  warrantySubmittedAt: timestamp("warranty_submitted_at"),
  warrantyExternalId: text("warranty_external_id"), // Elite's returned ID
  warrantyConsentIp: varchar("warranty_consent_ip"),
  warrantyConsentAt: timestamp("warranty_consent_at"),
  warrantyTermsUrl: text("warranty_terms_url"), // store the info URL used
  warrantyNote: text("warranty_note"), // "Billed by Elite MGA for $12"
  // TREC-specific fields
  inspectorName: varchar("inspector_name"), // Required for TREC inspections
  trecLicenseNumber: varchar("trec_license_number"), // Required for TREC inspections
  sponsorName: varchar("sponsor_name"), // Optional for TREC inspections
  sponsorTrecLicenseNumber: varchar("sponsor_trec_license_number"), // Optional for TREC inspections
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Log table for compliance tracking
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // e.g., "tos_accepted", "privacy_accepted", "signup_completed"
  entityType: varchar("entity_type"), // e.g., "user", "agreement", "terms"
  entityId: varchar("entity_id"),
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Audit Trail table for tracking all report activities
export const reportAuditTrail = pgTable("report_audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // viewed, edited, status_changed, reassigned, signed_off, etc.
  details: jsonb("details"), // additional context about the action
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Report Photos table for tracking inspection photos
export const reportPhotos = pgTable("report_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  section: varchar("section"), // which section of the inspection this photo belongs to
  room: varchar("room"),
  description: text("description"),
  aiAnalysis: jsonb("ai_analysis"),
  isIncluded: boolean("is_included").default(true),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const inspectionReportsRelations = relations(inspectionReports, ({ one, many }) => ({
  inspector: one(users, {
    fields: [inspectionReports.inspectorId],
    references: [users.id],
    relationName: "inspector"
  }),
  manager: one(users, {
    fields: [inspectionReports.managerId],
    references: [users.id],
    relationName: "manager"
  }),
  reviewer: one(users, {
    fields: [inspectionReports.reviewedBy],
    references: [users.id],
    relationName: "reviewer"
  }),
  auditTrail: many(reportAuditTrail),
  photos: many(reportPhotos),
}));

export const reportAuditTrailRelations = relations(reportAuditTrail, ({ one }) => ({
  report: one(inspectionReports, {
    fields: [reportAuditTrail.reportId],
    references: [inspectionReports.id],
  }),
  user: one(users, {
    fields: [reportAuditTrail.userId],
    references: [users.id],
  }),
}));

export const reportPhotosRelations = relations(reportPhotos, ({ one }) => ({
  report: one(inspectionReports, {
    fields: [reportPhotos.reportId],
    references: [inspectionReports.id],
  }),
  uploadedByUser: one(users, {
    fields: [reportPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export type InspectionReport = typeof inspectionReports.$inferSelect;
export type InsertInspectionReport = typeof inspectionReports.$inferInsert;

// Additional Inspection Services
export const additionalInspectionServices = [
  'thermal_imaging',
  'radon_testing', 
  'sewer_scope',
  'pool_spa',
  'drone_inspection',
  'mold_testing',
  'wdo_inspection', // Wood Destroying Organism
  'wind_mitigation',
  'four_point_inspection' // For new construction
] as const;

export type AdditionalInspectionService = typeof additionalInspectionServices[number];
export type ReportAuditTrail = typeof reportAuditTrail.$inferSelect;
export type InsertReportAuditTrail = typeof reportAuditTrail.$inferInsert;
export type ReportPhoto = typeof reportPhotos.$inferSelect;
export type InsertReportPhoto = typeof reportPhotos.$inferInsert;

// ============================================================================
// INSPECTOR SCHEDULING SYSTEM
// ============================================================================

// Inspector availability settings (working hours per day)
export const inexternal_template_availability = pgTable("inspector_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: varchar("start_time").notNull(), // e.g., '09:00'
  endTime: varchar("end_time").notNull(), // e.g., '17:00'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking appointments for inspections
export const inspectorBookings = pgTable("inspector_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email").notNull(),
  clientPhone: varchar("client_phone"),
  propertyAddress: text("property_address").notNull(),
  bookingDate: varchar("booking_date").notNull(), // YYYY-MM-DD format
  bookingTime: varchar("booking_time").notNull(), // HH:MM format
  duration: integer("duration").default(120).notNull(), // minutes
  status: varchar("status", { enum: ["confirmed", "cancelled", "completed", "pending"] }).default("confirmed").notNull(),
  notes: text("notes"),
  publicToken: varchar("public_token").notNull(), // for embed widget access
  googleEventId: varchar("google_event_id"), // for Google Calendar sync
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inspector account settings for scheduling
export const inspectorSettings = pgTable("inspector_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  maxDailyBookings: integer("max_daily_bookings").default(4).notNull(),
  bufferTime: integer("buffer_time").default(30).notNull(), // minutes between appointments
  advanceBookingDays: integer("advance_booking_days").default(30).notNull(),
  googleCalendarId: varchar("google_calendar_id"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  smsNotifications: boolean("sms_notifications").default(false).notNull(),
  embedWidgetEnabled: boolean("embed_widget_enabled").default(true).notNull(),
  publicBookingUrl: varchar("public_booking_url"), // Custom URL slug
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company settings for white-label branding
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(), // One company per user/organization
  
  // Branding & Visual Identity
  companyName: varchar("company_name").notNull().default('AInspect'),
  tagline: text("tagline"),
  logoUrl: varchar("logo_url"), // Path to uploaded logo file
  primaryColor: varchar("primary_color").default('#2563eb'), // Hex color
  secondaryColor: varchar("secondary_color").default('#1e40af'), // Hex color
  
  // Contact Information
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  websiteUrl: varchar("website_url"),
  
  // Email Templates
  emailFromName: varchar("email_from_name"),
  emailFromAddress: varchar("email_from_address"),
  emailHeaderText: text("email_header_text"),
  emailFooterText: text("email_footer_text"),
  
  // Footer Customization
  footerText: text("footer_text").default('© 2025 AInspect – All rights reserved.'),
  
  // Custom Domain (placeholder for future)
  customDomain: varchar("custom_domain"),
  customDomainEnabled: boolean("custom_domain_enabled").default(false),
  
  // PDF Report Branding
  pdfHeaderText: text("pdf_header_text"),
  pdfFooterText: text("pdf_footer_text"),
  pdfUseCompanyColors: boolean("pdf_use_company_colors").default(true),
  pdfIncludeLogo: boolean("pdf_include_logo").default(true),
  
  // Service Configuration
  enabledServices: jsonb("enabled_services").$type<string[]>().default(['thermal_imaging', 'radon_testing', 'sewer_scope', 'pool_spa', 'drone_inspection', 'mold_testing', 'wdo_inspection', 'wind_mitigation', 'four_point_inspection']),
  
  // Pricing Configuration
  pricingTiers: jsonb("pricing_tiers").$type<{
    tiers: Array<{
      minSqFt: number;
      maxSqFt: number;
      basePrice: number; // in cents
    }>;
    incrementPer500SqFt: number; // additional price per 500 sq ft in cents
  }>().default({
    tiers: [
      { minSqFt: 0, maxSqFt: 1500, basePrice: 40000 }, // $400
      { minSqFt: 1501, maxSqFt: 2500, basePrice: 50000 }, // $500  
      { minSqFt: 2501, maxSqFt: 4000, basePrice: 60000 }, // $600
      { minSqFt: 4001, maxSqFt: 999999, basePrice: 70000 } // $700+
    ],
    incrementPer500SqFt: 5000 // $50 per 500 sq ft increment
  }),
  
  // Discount Codes
  discountCodes: jsonb("discount_codes").$type<Array<{
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number; // percentage (0-100) or fixed amount in cents
    isActive: boolean;
    validFrom?: string; // ISO date
    validUntil?: string; // ISO date  
    usageLimit?: number;
    usedCount: number;
    applicableServices?: string[]; // empty means all services
  }>>().default([]),
  
  // Payment Method Settings
  paymentInstructions: jsonb("payment_instructions").$type<{
    checkInstructions: string;
    payAtClosingInstructions: string;
    checkPayableToName: string;
    checkMailingAddress: string;
  }>().default({
    checkInstructions: 'Please bring a check made payable to our company at the time of inspection.',
    payAtClosingInstructions: 'Payment will be collected at closing through your title company or escrow agent.',
    checkPayableToName: 'AInspect Services',
    checkMailingAddress: ''
  }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Operations settings for onboarding - service areas, pricing, hours, inspection types
export const operationsSettings = pgTable("operations_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(), // One operations config per user/organization
  
  // Service Areas
  serviceAreas: jsonb("service_areas").$type<string[]>().default([]), // Array of cities/counties served
  
  // Base Pricing Configuration
  basePricing: jsonb("base_pricing").$type<{
    residential: number;
    commercial: number;
    addon: number;
  }>().default({
    residential: 450,
    commercial: 750,
    addon: 125,
  }),
  
  // Business Hours Configuration
  businessHours: jsonb("business_hours").$type<{
    monday: { enabled: boolean; start: string; end: string; };
    tuesday: { enabled: boolean; start: string; end: string; };
    wednesday: { enabled: boolean; start: string; end: string; };
    thursday: { enabled: boolean; start: string; end: string; };
    friday: { enabled: boolean; start: string; end: string; };
    saturday: { enabled: boolean; start: string; end: string; };
    sunday: { enabled: boolean; start: string; end: string; };
  }>().default({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  }),
  
  // Inspection Types Offered
  inspectionTypes: jsonb("inspection_types").$type<string[]>().default(['General Home Inspection']),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User onboarding progress tracking
export const userOnboardingProgress = pgTable("user_onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Step completion tracking
  companyProfileCompleted: boolean("company_profile_completed").default(false).notNull(),
  operationsSetupCompleted: boolean("operations_setup_completed").default(false).notNull(),
  teamSetupCompleted: boolean("team_setup_completed").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  
  // Step completion timestamps
  companyProfileCompletedAt: timestamp("company_profile_completed_at"),
  operationsSetupCompletedAt: timestamp("operations_setup_completed_at"),
  teamSetupCompletedAt: timestamp("team_setup_completed_at"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  
  // Current step tracking
  currentStep: varchar("current_step", { enum: ["company", "operations", "team", "completed"] }).default("company").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blackout dates (vacations, holidays, etc.)
export const inspectorBlackoutDates = pgTable("inspector_blackout_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: varchar("start_date").notNull(), // YYYY-MM-DD
  endDate: varchar("end_date").notNull(), // YYYY-MM-DD
  reason: text("reason"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// SYSTEM CONFIGURATION & SETTINGS
// ============================================================================

// Service Provider Directory (Lead-Gen Dashboard)
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  specialties: jsonb("specialties").$type<string[]>(), // Array of specialties
  serviceAreas: jsonb("service_areas").$type<string[]>(), // Array of service areas
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inspection Templates (Inspector Dashboard)
export const inspectionTemplates = pgTable("inspection_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  schema: jsonb("schema").$type<object>(), // JSON schema for the template
  isDefault: boolean("is_default").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Settings (All Dashboards)
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dashboard: varchar("dashboard", { enum: ["inspector", "contractor", "leadgen"] }).notNull(),
  triggers: jsonb("triggers").$type<string[]>(), // Array of trigger events
  channels: jsonb("channels").$type<{
    email: boolean;
    sms: boolean;
    webhookUrl?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature Flags (Lead-Gen Dashboard Admin)
export const featureFlags = pgTable("feature_flags", {
  key: varchar("key").primaryKey(),
  description: text("description").notNull(),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types for new configuration models
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = typeof serviceProviders.$inferInsert;
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type InsertInspectionTemplate = typeof inspectionTemplates.$inferInsert;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// ============================================================================
// ADMIN / OPS DASHBOARD SYSTEM (ADDITIVE ONLY)
// ============================================================================

// User roles for RBAC (additive to existing user system)
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { enum: ["platform_owner", "admin", "support"] }).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Organizations / Accounts for multi-tenant management
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  status: text("status").notNull().default('active'), // active | suspended | pending
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization memberships (link existing users to orgs)
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").notNull().default('member'), // owner | admin | member
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys for external integrations
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").notNull(),
  prefix: text("prefix").notNull(), // e.g., "sk_live_"
  scopes: jsonb("scopes").$type<string[]>(), // e.g., ["warranty:write","leads:read"]
  rateLimitPerMin: integer("rate_limit_per_min").default(60),
  status: text("status").notNull().default('active'), // active | revoked
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

// Admin invitation system (separate from existing user invitations)
export const adminInvitations = pgTable("admin_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  role: text("role").notNull().default('member'),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin audit log (separate from existing audit logs for admin actions)
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id), // who did it
  organizationId: varchar("organization_id").references(() => organizations.id),
  action: text("action").notNull(), // "API_KEY_CREATED", "INVITE_SENT", etc.
  targetType: text("target_type"),  // "api_key","organization","user"
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  ip: varchar("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Onboarding checklist system
export const onboardingChecklists = pgTable("onboarding_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  step: text("step").notNull(), // "company_profile","connect_branding","add_users","generate_api_key","warranty_toggle_test"
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for admin system
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  apiKeys: many(apiKeys),
  invitations: many(adminInvitations),
  onboardingSteps: many(onboardingChecklists),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const adminInvitationsRelations = relations(adminInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [adminInvitations.organizationId],
    references: [organizations.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

// Organization settings for feature flags and metadata (additive)
export const organizationSettings = pgTable('organization_settings', {
  organizationId: varchar('organization_id').primaryKey().references(() => organizations.id, { onDelete: 'cascade' }),
  featureFlags: jsonb('feature_flags').$type<Record<string, boolean>>().default({}),
  metadata: jsonb('metadata'), // arbitrary key/vals like domains, branding, etc.
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Webhooks for organization event notifications (additive)
export const webhooks = pgTable('webhooks', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  event: text('event').notNull(), // 'report.created','warranty.sent','warranty.failed'
  url: text('url').notNull(),
  secretHash: text('secret_hash').notNull(),
  status: text('status').notNull().default('enabled'), // enabled | disabled
  lastDeliveryAt: timestamp('last_delivery_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Internal support notes for organizations (additive)
export const orgNotes = pgTable('org_notes', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  authorUserId: varchar('author_user_id').references(() => users.id),
  body: text('body').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for admin system
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type AdminInvitation = typeof adminInvitations.$inferSelect;
export type InsertAdminInvitation = typeof adminInvitations.$inferInsert;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;
export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist = typeof onboardingChecklists.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSettings = typeof organizationSettings.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;
export type OrgNote = typeof orgNotes.$inferSelect;
export type InsertOrgNote = typeof orgNotes.$inferInsert;

// ============================================================================
// TREC INSPECTION SYSTEM (REI 7-6 FORM COMPLIANCE)
// ============================================================================

// TREC Rating system: I = Inspected, NI = Not Inspected, NP = Not Present, D = Deficient
export const trecRatings = ['I', 'NI', 'NP', 'D'] as const;
export type TRECRating = typeof trecRatings[number];

// Main TREC Inspections table (REI 7-6 Header Information)
export const trecInspections = pgTable("trec_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Header Information (Required by TREC)
  clientName: varchar("client_name").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  propertyAddress: text("property_address").notNull(),
  inspectorName: varchar("inspector_name").notNull(),
  trecLicenseNumber: varchar("trec_license_number").notNull(),
  sponsorName: varchar("sponsor_name"), // Optional
  sponsorTrecLicenseNumber: varchar("sponsor_trec_license_number"), // Optional
  
  // System tracking
  inspectorId: varchar("inspector_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ['draft', 'in_progress', 'completed', 'submitted'] }).default('draft').notNull(),
  
  // Completion tracking
  completedSections: jsonb("completed_sections").$type<string[]>(),
  totalPhotos: integer("total_photos").default(0),
  
  // Additional data storage
  companyData: jsonb("company_data").$type<{
    companyName?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    companyAddress?: string;
  }>(),
  warrantyData: jsonb("warranty_data").$type<{
    warrantyOptIn?: boolean;
    warrantyProvider?: string;
    warrantyStatus?: string;
    warrantyTermsUrl?: string;
    warrantyNote?: string;
  }>(),
  inspectionData: jsonb("inspection_data").$type<{
    coverPageData?: any;
    sections?: any;
    currentPhase?: string;
    activeSection?: string;
  }>(),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// TREC Section Items (I. STRUCTURAL through VI. OPTIONAL)
export const trecSectionItems = pgTable("trec_section_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => trecInspections.id, { onDelete: 'cascade' }).notNull(),
  
  // Section identification
  majorSection: varchar("major_section").notNull(), // I, II, III, IV, V, VI
  majorSectionTitle: varchar("major_section_title").notNull(), // e.g., "STRUCTURAL SYSTEMS"
  minorSection: varchar("minor_section").notNull(), // A, B, C, etc.
  minorSectionTitle: varchar("minor_section_title").notNull(), // e.g., "Foundations"
  
  // TREC Rating (I/NI/NP/D)
  rating: varchar("rating", { enum: trecRatings }),
  
  // Additional details specific to each section
  foundationType: varchar("foundation_type"), // For Foundations
  roofTypes: jsonb("roof_types").$type<string[]>(), // For Roof Covering Materials
  viewedFrom: varchar("viewed_from"), // For various sections
  wiringType: varchar("wiring_type"), // For Electrical
  systemTypes: jsonb("system_types").$type<string[]>(), // For HVAC/Plumbing
  energySources: jsonb("energy_sources").$type<string[]>(), // For various systems
  insulationDepth: varchar("insulation_depth"), // For Attics
  waterMeterLocation: varchar("water_meter_location"), // For Plumbing
  mainValveLocation: varchar("main_valve_location"), // For Plumbing
  staticPressureReading: varchar("static_pressure_reading"), // For Plumbing
  supplyPipingType: varchar("supply_piping_type"), // For Plumbing
  drainPipingType: varchar("drain_piping_type"), // For Plumbing
  capacity: varchar("capacity"), // For Water Heating Equipment
  gasMeterlocation: varchar("gas_meter_location"), // For Gas Systems
  gasPipingType: varchar("gas_piping_type"), // For Gas Systems
  constructionType: varchar("construction_type"), // For Pools/Spas
  pumpType: varchar("pump_type"), // For Wells
  storageEquipment: varchar("storage_equipment"), // For Wells
  systemType: varchar("system_type"), // For Sewage Systems
  drainFieldLocation: varchar("drain_field_location"), // For Sewage Systems
  
  // Comments and notes
  comments: text("comments"),
  
  // Photo tracking
  photoCount: integer("photo_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TREC Photos (specific to TREC inspections)
export const trecPhotos = pgTable("trec_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => trecInspections.id, { onDelete: 'cascade' }).notNull(),
  sectionItemId: varchar("section_item_id").references(() => trecSectionItems.id, { onDelete: 'cascade' }),
  
  // File information
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  
  // Organization
  majorSection: varchar("major_section").notNull(), // I, II, III, etc.
  minorSection: varchar("minor_section"), // A, B, C, etc.
  description: text("description"),
  
  // AI Analysis (optional)
  aiAnalysis: jsonb("ai_analysis"),
  
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// TREC Inspection Rooms (dynamic room management)
export const trecRooms = pgTable("trec_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => trecInspections.id, { onDelete: 'cascade' }).notNull(),
  
  // Room identification
  name: varchar("name").notNull(),
  type: varchar("type", { 
    enum: ['bedroom', 'bathroom', 'living-room', 'kitchen', 'garage', 'basement', 'attic', 'office', 'utility', 'exterior', 'roof', 'electrical-panel', 'hvac-system', 'custom'] 
  }).notNull(),
  floor: varchar("floor"), // Ground Floor, First Floor, etc.
  
  // Room details
  notes: text("notes"),
  inspectionItems: jsonb("inspection_items").$type<string[]>(), // Items to inspect in this room
  
  // Status tracking
  isCompleted: boolean("is_completed").default(false),
  photosCount: integer("photos_count").default(0),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TREC Audit Trail (compliance tracking)
export const trecAuditTrail = pgTable("trec_audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => trecInspections.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // section_completed, rating_changed, photo_added, etc.
  section: varchar("section"), // Which section was affected
  details: jsonb("details"), // Additional context
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// TREC Relations
export const trecInspectionsRelations = relations(trecInspections, ({ one, many }) => ({
  inspector: one(users, {
    fields: [trecInspections.inspectorId],
    references: [users.id],
  }),
  sectionItems: many(trecSectionItems),
  photos: many(trecPhotos),
  rooms: many(trecRooms),
  auditTrail: many(trecAuditTrail),
}));

export const trecSectionItemsRelations = relations(trecSectionItems, ({ one, many }) => ({
  inspection: one(trecInspections, {
    fields: [trecSectionItems.inspectionId],
    references: [trecInspections.id],
  }),
  photos: many(trecPhotos),
}));

export const trecPhotosRelations = relations(trecPhotos, ({ one }) => ({
  inspection: one(trecInspections, {
    fields: [trecPhotos.inspectionId],
    references: [trecInspections.id],
  }),
  sectionItem: one(trecSectionItems, {
    fields: [trecPhotos.sectionItemId],
    references: [trecSectionItems.id],
  }),
  uploadedByUser: one(users, {
    fields: [trecPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const trecRoomsRelations = relations(trecRooms, ({ one }) => ({
  inspection: one(trecInspections, {
    fields: [trecRooms.inspectionId],
    references: [trecInspections.id],
  }),
}));

export const trecAuditTrailRelations = relations(trecAuditTrail, ({ one }) => ({
  inspection: one(trecInspections, {
    fields: [trecAuditTrail.inspectionId],
    references: [trecInspections.id],
  }),
  user: one(users, {
    fields: [trecAuditTrail.userId],
    references: [users.id],
  }),
}));

// TREC Types
export type TRECInspection = typeof trecInspections.$inferSelect;
export type InsertTRECInspection = typeof trecInspections.$inferInsert;
export type TRECSectionItem = typeof trecSectionItems.$inferSelect;
export type InsertTRECSectionItem = typeof trecSectionItems.$inferInsert;
export type TRECPhoto = typeof trecPhotos.$inferSelect;
export type InsertTRECPhoto = typeof trecPhotos.$inferInsert;
export type TRECRoom = typeof trecRooms.$inferSelect;
export type InsertTRECRoom = typeof trecRooms.$inferInsert;
export type TRECAuditTrail = typeof trecAuditTrail.$inferSelect;
export type InsertTRECAuditTrail = typeof trecAuditTrail.$inferInsert;

// ============================================================================
// LEAD & REFERRAL MANAGEMENT SYSTEM (IN-HOUSE USE ONLY)
// ============================================================================

// Contractor Categories and Services
export const contractorCategories = [
  'roofing',
  'hvac',
  'electrical',
  'plumbing',
  'foundation',
  'pest_control',
  'home_warranty',
  'insurance',
  'general_contractor',
  'landscaping',
  'flooring',
  'painting',
  'windows_doors'
] as const;

export const leadSources = [
  'inspection_flagged',
  'inspection_referral',
  'direct_inquiry',
  'website',
  'phone_call',
  'partner_referral'
] as const;

export const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'quoted',
  'won',
  'lost',
  'closed'
] as const;

// Contractors table for managing service providers
export const contractors = pgTable("contractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  contactName: varchar("contact_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  address: varchar("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  website: varchar("website"),
  licenseNumber: varchar("license_number"),
  insuranceExpiry: timestamp("insurance_expiry"),
  category: varchar("category", { enum: contractorCategories }).notNull(),
  specialties: jsonb("specialties"), // Array of specific services they provide
  serviceAreas: jsonb("service_areas"), // Array of zip codes or regions they serve
  rating: integer("rating").default(0), // 1-5 star rating
  commissionRate: integer("commission_rate").default(0), // Percentage as integer (e.g., 15 = 15%)
  isActive: boolean("is_active").default(true),
  isPriority: boolean("is_priority").default(false), // For priority distribution
  lastLeadDate: timestamp("last_lead_date"),
  totalLeads: integer("total_leads").default(0),
  convertedLeads: integer("converted_leads").default(0),
  totalCommission: integer("total_commission").default(0), // In cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Generation and Management
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionReportId: varchar("inspection_report_id").references(() => inspectionReports.id),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  propertyAddress: varchar("property_address").notNull(),
  category: varchar("category", { enum: contractorCategories }).notNull(),
  serviceNeeded: varchar("service_needed").notNull(), // Specific service description
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  source: varchar("source", { enum: leadSources }).default('inspection_flagged'),
  status: varchar("status", { enum: leadStatuses }).default('new'),
  isFlagged: boolean("is_flagged").default(true), // true for flagged issues, false for referrals
  estimatedValue: integer("estimated_value"), // In cents
  description: text("description"),
  // New fields for contractor portal
  costPerLead: integer("cost_per_lead").default(2500), // Cost in cents for contractors to purchase
  availableUntil: timestamp("available_until").default(sql`NOW() + INTERVAL '7 days'`), // Lead expiry
  sourceType: varchar("source_type", { enum: ['defect', 'service'] }).default('defect'), // Type of lead
  contractorId: varchar("contractor_id").references(() => contractors.id),
  assignedAt: timestamp("assigned_at"),
  contactedAt: timestamp("contacted_at"),
  quotedAt: timestamp("quoted_at"),
  quoteAmount: integer("quote_amount"), // In cents
  wonAt: timestamp("won_at"),
  commissionAmount: integer("commission_amount"), // In cents
  conversionNotes: text("conversion_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Distribution Rules and Settings
export const leadDistributionRules = pgTable("lead_distribution_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category", { enum: contractorCategories }).notNull(),
  distributionMethod: varchar("distribution_method", { 
    enum: ['round_robin', 'score_based', 'priority_list', 'manual'] 
  }).default('round_robin'),
  maxLeadsPerContractor: integer("max_leads_per_contractor").default(10), // Per month
  requiresApproval: boolean("requires_approval").default(false),
  scoringWeights: jsonb("scoring_weights"), // Factors for score-based distribution
  priorityContractors: jsonb("priority_contractors"), // Array of contractor IDs in priority order
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Activity and Communication Log
export const leadActivities = pgTable("lead_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  contractorId: varchar("contractor_id").references(() => contractors.id),
  activityType: varchar("activity_type").notNull(), // assigned, contacted, quoted, won, lost, note_added
  description: text("description"),
  amount: integer("amount"), // For quotes, commissions, etc.
  scheduledFollowUp: timestamp("scheduled_follow_up"),
  metadata: jsonb("metadata"), // Additional structured data
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission Tracking and Payouts
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  contractorId: varchar("contractor_id").references(() => contractors.id).notNull(),
  amount: integer("amount").notNull(), // In cents
  rate: integer("rate").notNull(), // Percentage as integer
  jobValue: integer("job_value").notNull(), // In cents
  status: varchar("status", { enum: ['pending', 'approved', 'paid', 'disputed'] }).default('pending'),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance Analytics and Reporting
export const contractorMetrics = pgTable("contractor_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").references(() => contractors.id).notNull(),
  period: varchar("period").notNull(), // YYYY-MM format
  leadsReceived: integer("leads_received").default(0),
  leadsContacted: integer("leads_contacted").default(0),
  quotesProvided: integer("quotes_provided").default(0),
  jobsWon: integer("jobs_won").default(0),
  totalRevenue: integer("total_revenue").default(0), // In cents
  avgResponseTime: integer("avg_response_time"), // In hours
  customerRating: integer("customer_rating"), // Average 1-5 rating
  conversionRate: integer("conversion_rate"), // Percentage as integer
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const contractorsRelations = relations(contractors, ({ many }) => ({
  leads: many(leads),
  activities: many(leadActivities),
  commissions: many(commissions),
  metrics: many(contractorMetrics),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  inspectionReport: one(inspectionReports, {
    fields: [leads.inspectionReportId],
    references: [inspectionReports.id],
  }),
  contractor: one(contractors, {
    fields: [leads.contractorId],
    references: [contractors.id],
  }),
  activities: many(leadActivities),
  commissions: many(commissions),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  contractor: one(contractors, {
    fields: [leadActivities.contractorId],
    references: [contractors.id],
  }),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  lead: one(leads, {
    fields: [commissions.leadId],
    references: [leads.id],
  }),
  contractor: one(contractors, {
    fields: [commissions.contractorId],
    references: [contractors.id],
  }),
}));

export const contractorMetricsRelations = relations(contractorMetrics, ({ one }) => ({
  contractor: one(contractors, {
    fields: [contractorMetrics.contractorId],
    references: [contractors.id],
  }),
}));

// Types
export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = typeof contractors.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type LeadDistributionRule = typeof leadDistributionRules.$inferSelect;
export type InsertLeadDistributionRule = typeof leadDistributionRules.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;
export type ContractorMetric = typeof contractorMetrics.$inferSelect;
export type InsertContractorMetric = typeof contractorMetrics.$inferInsert;

// System Logs schema for centralized logging
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: varchar("level", { enum: ["error", "warn", "info", "debug"] }).notNull(),
  message: text("message").notNull(),
  source: varchar("source").notNull(), // e.g., "api", "job-queue", "auth"
  userId: varchar("user_id"),
  requestId: varchar("request_id"),
  method: varchar("method"),
  url: varchar("url"),
  statusCode: integer("status_code"),
  duration: integer("duration"), // in milliseconds
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  stackTrace: text("stack_trace"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_system_logs_level").on(table.level),
  index("IDX_system_logs_source").on(table.source),
  index("IDX_system_logs_created_at").on(table.createdAt),
]);

// Job Queue schema for background job monitoring
export const jobQueue = pgTable("job_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "generate-report", "send-email"
  status: varchar("status", { enum: ["pending", "running", "completed", "failed", "cancelled"] }).notNull().default("pending"),
  priority: integer("priority").default(0),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  nextRetryAt: timestamp("next_retry_at"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_job_queue_status").on(table.status),
  index("IDX_job_queue_name").on(table.name),
  index("IDX_job_queue_created_at").on(table.createdAt),
]);

// Support Tickets schema for user support
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  category: varchar("category", { enum: ["bug", "feature_request", "support", "billing", "technical"] }).notNull(),
  userId: varchar("user_id"),
  userEmail: varchar("user_email").notNull(),
  userName: varchar("user_name"),
  userRole: varchar("user_role"),
  assignedTo: varchar("assigned_to"),
  resolution: text("resolution"),
  attachments: text("attachments").array(),
  systemInfo: jsonb("system_info"),
  logs: jsonb("logs"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_support_tickets_status").on(table.status),
  index("IDX_support_tickets_priority").on(table.priority),
  index("IDX_support_tickets_user_id").on(table.userId),
]);

// Support Ticket Comments schema
export const supportTicketComments = pgTable("support_ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id"),
  userEmail: varchar("user_email").notNull(),
  userName: varchar("user_name"),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_support_ticket_comments_ticket_id").on(table.ticketId),
]);

// System Alerts schema for monitoring and SLA tracking
export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type", { enum: ["error_rate", "response_time", "job_failure", "system_health"] }).notNull(),
  severity: varchar("severity", { enum: ["info", "warning", "critical"] }).notNull(),
  threshold: jsonb("threshold"), // e.g., {"value": 99, "operator": "less_than", "window": "5m"}
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  escalationRules: jsonb("escalation_rules"),
  notificationChannels: text("notification_channels").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_system_alerts_type").on(table.type),
  index("IDX_system_alerts_severity").on(table.severity),
]);

// System Metrics schema for SLA monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  value: integer("value").notNull(),
  unit: varchar("unit"), // e.g., "ms", "count", "percentage"
  tags: jsonb("tags"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("IDX_system_metrics_name").on(table.metricName),
  index("IDX_system_metrics_timestamp").on(table.timestamp),
]);

// User Impersonation Logs schema for audit trails
export const impersonationLogs = pgTable("impersonation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull(),
  targetUserId: varchar("target_user_id").notNull(),
  targetUserEmail: varchar("target_user_email").notNull(),
  reason: text("reason"),
  duration: integer("duration"), // in minutes
  actions: jsonb("actions"), // track what actions were performed
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("IDX_impersonation_logs_admin_id").on(table.adminId),
  index("IDX_impersonation_logs_target_user").on(table.targetUserId),
]);

// Types for monitoring and support
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;
export type JobQueue = typeof jobQueue.$inferSelect;
export type InsertJobQueue = typeof jobQueue.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketComment = typeof supportTicketComments.$inferSelect;
export type InsertSupportTicketComment = typeof supportTicketComments.$inferInsert;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = typeof systemAlerts.$inferInsert;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
export type ImpersonationLog = typeof impersonationLogs.$inferSelect;
export type InsertImpersonationLog = typeof impersonationLogs.$inferInsert;
export type BranchOffice = typeof branchOffices.$inferSelect;
export type InsertBranchOffice = typeof branchOffices.$inferInsert;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = typeof userInvitations.$inferInsert;
export type TeamHierarchy = typeof teamHierarchies.$inferSelect;
export type InsertTeamHierarchy = typeof teamHierarchies.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  inspectorId: varchar("inspector_id").references(() => users.id), // The actual inspector performing the inspection
  clientFirstName: text("client_first_name").notNull(),
  clientLastName: text("client_last_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone").notNull(),
  propertyAddress: text("property_address").notNull(),
  propertyCity: text("property_city").notNull(),
  propertyZipCode: text("property_zip_code").notNull(),
  propertyYearBuilt: integer("property_year_built"),
  propertySqft: integer("property_sqft"),
  propertyType: text("property_type").notNull(),
  inspectionDate: text("inspection_date").notNull(),
  inspectionStartTime: text("inspection_start_time").notNull(),
  inspectionDuration: integer("inspection_duration").notNull(),
  status: text("status").notNull().default("draft"), // draft, in-progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const inspectionSystems = pgTable("inspection_systems", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  systemType: text("system_type").notNull(), // exterior, roof, electrical, plumbing, hvac, interior, garage, etc.
  systemName: text("system_name").notNull(),
  isCompleted: boolean("is_completed").default(false),
});

export const inspectionItems = pgTable("inspection_items", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  systemType: text("system_type").notNull(), // exterior, roof, electrical, plumbing, hvac, interior, etc.
  category: text("category").notNull(), // specific category within system
  description: text("description").notNull(),
  condition: text("condition"), // satisfactory, marginal, poor, major_concern, safety_hazard
  isApplicable: boolean("is_applicable").default(true),
  isChecked: boolean("is_checked").default(false),
  notes: text("notes"),
  photos: text("photos").array().default([]),
  recommendations: text("recommendations"),
  roomId: integer("room_id"),
});

export const businessInfo = pgTable("business_info", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  logo: text("logo"),
});

// User Settings table for storing individual user preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  licenseNumber: varchar("license_number"),
  notifications: jsonb("notifications").$type<{
    email: boolean;
    sms: boolean;
    reportDelivery: boolean;
    scheduling: boolean;
    teamUpdates: boolean;
  }>().default({
    email: true,
    sms: true,
    reportDelivery: true,
    scheduling: true,
    teamUpdates: true
  }),
  preferences: jsonb("preferences").$type<{
    timezone: string;
    dateFormat: string;
    theme: string;
    language: string;
  }>().default({
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    language: 'en'
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_user_settings_user_id").on(table.userId),
]);



export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  roomType: text("room_type").notNull(), // bedroom, bathroom, living-room, etc.
  roomName: text("room_name").notNull(), // Master Bedroom, Guest Bath, etc.
  floor: text("floor"), // First Floor, Second Floor, Basement
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  reportType: text("report_type").notNull(), // summary, full, custom
  reportData: jsonb("report_data"), // Stored report content
  generatedAt: timestamp("generated_at").defaultNow(),
  status: text("status").default("draft"), // draft, final, sent
  // Enhanced fields for dynamic inspection system
  inspectorId: varchar("inspector_id").references(() => users.id),
  propertyAddress: varchar("property_address"),
  clientName: varchar("client_name"),
  dynamicRooms: jsonb("dynamic_rooms"), // Store dynamic room configuration per report
  totalSections: integer("total_sections").default(0),
  totalIssues: integer("total_issues").default(0),
  safetyIssues: integer("safety_issues").default(0),
  majorDefects: integer("major_defects").default(0),
  overallCondition: varchar("overall_condition", { enum: ["excellent", "good", "fair", "poor"] }),
  complianceScore: integer("compliance_score").default(0),
  // Client portal sharing fields
  sharePasscode: varchar("share_passcode"),
  shareExpiresAt: timestamp("share_expires_at"),
  shareCreatedAt: timestamp("share_created_at"),
  sharedByUserId: varchar("shared_by_user_id").references(() => users.id),
});

// Dynamic Inspection Items table for flexible room management
export const dynamicInspectionItems = pgTable("dynamic_inspection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: integer("report_id").notNull().references(() => reports.id, { onDelete: 'cascade' }),
  roomId: varchar("room_id").notNull(),
  roomType: varchar("room_type").notNull(), // bedroom, bathroom, kitchen, etc.
  roomName: varchar("room_name").notNull(),
  itemId: varchar("item_id").notNull(), // external_template_a/external_template_b item ID
  itemTitle: varchar("item_title").notNull(),
  itemDescription: text("item_description"),
  status: varchar("status", { enum: ["pass", "fail", "minor_issue", "not_applicable", "not_tested"] }).default("not_tested"),
  severity: varchar("severity", { enum: ["safety", "high", "medium", "low"] }),
  notes: text("notes"),
  inspectorNotes: text("inspector_notes"),
  recommendations: text("recommendations"),
  photoUrls: jsonb("photo_urls"), // Array of photo URLs
  source: varchar("source", { enum: ["external_template_a", "external_template_b", "ashi_standard", "custom"] }).notNull(),
  sourceItemId: varchar("source_item_id"), // Original ID from external_template_a/external_template_b
  isRequired: boolean("is_required").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_dynamic_items_report").on(table.reportId),
  index("IDX_dynamic_items_room").on(table.roomId),
]);

// external_template_a/external_template_b master items cache
export const thirdPartyInspectionItems = pgTable("third_party_inspection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { enum: ["external_template_a", "external_template_b"] }).notNull(),
  sourceItemId: varchar("source_item_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // electrical, plumbing, etc.
  roomType: varchar("room_type"), // bedroom, bathroom, kitchen, etc.
  isRequired: boolean("is_required").default(true),
  severity: varchar("severity", { enum: ["safety", "high", "medium", "low"] }),
  ashiCompliance: boolean("ashi_compliance").default(true),
  metadata: jsonb("metadata"), // Additional data from API
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_third_party_items_source").on(table.source),
  index("IDX_third_party_items_room_type").on(table.roomType),
  index("IDX_third_party_items_category").on(table.category),
]);

// API Integration Settings for external_template_a/external_template_b
export const apiIntegrations = pgTable("api_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider", { enum: ["external_template_a", "external_template_b"] }).notNull(),
  apiKey: varchar("api_key").notNull(), // Encrypted
  apiSecret: varchar("api_secret"), // Encrypted if needed
  baseUrl: varchar("base_url").notNull(),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { enum: ["success", "failed", "in_progress"] }),
  errorMessage: text("error_message"),
  itemCount: integer("item_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
});

export const insertInspectionSystemSchema = createInsertSchema(inspectionSystems).omit({
  id: true,
});

export const insertInspectionItemSchema = createInsertSchema(inspectionItems).omit({
  id: true,
});

export const insertBusinessInfoSchema = createInsertSchema(businessInfo).omit({
  id: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertDynamicInspectionItemSchema = createInsertSchema(dynamicInspectionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThirdPartyInspectionItemSchema = createInsertSchema(thirdPartyInspectionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Contractor Portal Tables
export const contractorPortal = pgTable("contractor_portal", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  companyName: varchar("company_name").notNull(),
  phone: varchar("phone"),
  website: varchar("website"),
  licenseNumber: varchar("license_number"),
  serviceAreas: jsonb("service_areas"), // Array of cities/zip codes
  isActive: boolean("is_active").default(true),
  creditsBalance: integer("credits_balance").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_contractor_portal_email").on(table.email),
]);

export const contractorAds = pgTable("contractor_ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").references(() => contractorPortal.id).notNull(),
  name: varchar("name").notNull(),
  targetingParams: jsonb("targeting_params").notNull(), // { categories: [], locations: [], maxCostPerLead: number }
  budget: integer("budget").notNull(), // Total budget in cents
  costPerLead: integer("cost_per_lead").notNull(), // Cost per lead in cents
  status: varchar("status", { enum: ["active", "paused", "inactive"] }).default("active"),
  totalLeadsPurchased: integer("total_leads_purchased").default(0),
  totalSpent: integer("total_spent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractorPayments = pgTable("contractor_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").references(() => contractorPortal.id).notNull(),
  amount: integer("amount").notNull(), // Amount in cents  
  currency: varchar("currency").default("usd"),
  stripeChargeId: varchar("stripe_charge_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status", { enum: ["pending", "succeeded", "failed", "canceled"] }).default("pending"),
  creditsAdded: integer("credits_added").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractorLeadPurchases = pgTable("contractor_lead_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").references(() => contractorPortal.id).notNull(),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  adId: varchar("ad_id").references(() => contractorAds.id),
  costPaid: integer("cost_paid").notNull(), // Cost paid in cents
  purchasedAt: timestamp("purchased_at").defaultNow(),
  contactedAt: timestamp("contacted_at"),
  convertedAt: timestamp("converted_at"),
  status: varchar("status", { enum: ["purchased", "contacted", "converted", "declined"] }).default("purchased"),
});

// Contractor Portal Relations
export const contractorPortalRelations = relations(contractorPortal, ({ many }) => ({
  ads: many(contractorAds),
  payments: many(contractorPayments),
  leadPurchases: many(contractorLeadPurchases),
}));

export const contractorAdsRelations = relations(contractorAds, ({ one, many }) => ({
  contractor: one(contractorPortal, {
    fields: [contractorAds.contractorId],
    references: [contractorPortal.id],
  }),
  leadPurchases: many(contractorLeadPurchases),
}));

export const contractorPaymentsRelations = relations(contractorPayments, ({ one }) => ({
  contractor: one(contractorPortal, {
    fields: [contractorPayments.contractorId],
    references: [contractorPortal.id],
  }),
}));

export const contractorLeadPurchasesRelations = relations(contractorLeadPurchases, ({ one }) => ({
  contractor: one(contractorPortal, {
    fields: [contractorLeadPurchases.contractorId],
    references: [contractorPortal.id],
  }),
  lead: one(leads, {
    fields: [contractorLeadPurchases.leadId],
    references: [leads.id],
  }),
  ad: one(contractorAds, {
    fields: [contractorLeadPurchases.adId],
    references: [contractorAds.id],
  }),
}));

// Contractor Portal Types
export type ContractorPortal = typeof contractorPortal.$inferSelect;
export type InsertContractorPortal = typeof contractorPortal.$inferInsert;
export type ContractorAd = typeof contractorAds.$inferSelect;
export type InsertContractorAd = typeof contractorAds.$inferInsert;
export type ContractorPayment = typeof contractorPayments.$inferSelect;
export type InsertContractorPayment = typeof contractorPayments.$inferInsert;
export type ContractorLeadPurchase = typeof contractorLeadPurchases.$inferSelect;
export type InsertContractorLeadPurchase = typeof contractorLeadPurchases.$inferInsert;

// Create insert schemas
export const insertContractorPortalSchema = createInsertSchema(contractorPortal).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractorAdSchema = createInsertSchema(contractorAds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractorPaymentSchema = createInsertSchema(contractorPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractorLeadPurchaseSchema = createInsertSchema(contractorLeadPurchases).omit({
  id: true,
  purchasedAt: true,
});

// User and Company Settings Zod schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  licenseNumber: z.string().max(50).optional(),
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export const insertCompanySettingsSchema = createInsertSchema(companySettings, {
  companyName: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Operations Settings Schemas
export const insertOperationsSettingsSchema = createInsertSchema(operationsSettings, {
  serviceAreas: z.array(z.string()).min(1, 'At least one service area is required'),
  basePricing: z.object({
    residential: z.number().min(0, 'Price must be positive'),
    commercial: z.number().min(0, 'Price must be positive'),
    addon: z.number().min(0, 'Price must be positive'),
  }),
  businessHours: z.object({
    monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  }),
  inspectionTypes: z.array(z.string()).min(1, 'At least one inspection type is required'),
}).omit({ id: true, createdAt: true, updatedAt: true });

// User Onboarding Progress Schemas
export const insertUserOnboardingProgressSchema = createInsertSchema(userOnboardingProgress).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertUserSettingsInput = z.infer<typeof insertUserSettingsSchema>;
export type InsertCompanySettingsInput = z.infer<typeof insertCompanySettingsSchema>;
export type InsertOperationsSettingsInput = z.infer<typeof insertOperationsSettingsSchema>;
export type InsertUserOnboardingProgressInput = z.infer<typeof insertUserOnboardingProgressSchema>;

// Company Settings Types
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

// Operations Settings Types
export type OperationsSettings = typeof operationsSettings.$inferSelect;
export type InsertOperationsSettings = typeof operationsSettings.$inferInsert;

// User Onboarding Progress Types
export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;
export type InsertUserOnboardingProgress = typeof userOnboardingProgress.$inferInsert;

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspectionSystem = z.infer<typeof insertInspectionSystemSchema>;
export type InspectionSystem = typeof inspectionSystems.$inferSelect;
export type InsertInspectionItem = z.infer<typeof insertInspectionItemSchema>;
export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertBusinessInfo = z.infer<typeof insertBusinessInfoSchema>;
export type BusinessInfo = typeof businessInfo.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// New backend types for dynamic inspection system
export type InsertDynamicInspectionItem = z.infer<typeof insertDynamicInspectionItemSchema>;
export type DynamicInspectionItem = typeof dynamicInspectionItems.$inferSelect;
export type InsertThirdPartyInspectionItem = z.infer<typeof insertThirdPartyInspectionItemSchema>;
export type ThirdPartyInspectionItem = typeof thirdPartyInspectionItems.$inferSelect;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;

// Scheduling System Types
export type Inexternal_template_availability = typeof inexternal_template_availability.$inferSelect;
export type InsertInexternal_template_availability = typeof inexternal_template_availability.$inferInsert;
export type InspectorBooking = typeof inspectorBookings.$inferSelect;
export type InsertInspectorBooking = typeof inspectorBookings.$inferInsert;
export type InspectorSettings = typeof inspectorSettings.$inferSelect;
export type InsertInspectorSettings = typeof inspectorSettings.$inferInsert;
export type InspectorBlackoutDate = typeof inspectorBlackoutDates.$inferSelect;
export type InsertInspectorBlackoutDate = typeof inspectorBlackoutDates.$inferInsert;

// Relations - defined at the end to avoid circular dependencies

export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: "manager_inspectors"
  }),
  inspectors: many(users, {
    relationName: "manager_inspectors"
  }),
  inspections: many(inspections),
  assignedInspections: many(inspections, {
    relationName: "inspector_inspections"
  }),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  user: one(users, {
    fields: [inspections.userId],
    references: [users.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
    relationName: "inspector_inspections"
  }),
}));

// Narratives table for per-company stock verbiage
export const narratives = pgTable("narratives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  title: varchar("title").notNull(),
  body: text("body").notNull(), // Template text with {{variables}}
  category: varchar("category", { enum: ["ROOFING", "HVAC", "PLUMBING", "ELECTRICAL", "EXTERIOR", "INTERIOR", "OTHER"] }).notNull(),
  component: varchar("component"), // e.g. "Shingles", "Service Panel", "Sink Trap"
  severity: varchar("severity", { enum: ["MAJOR", "SAFETY", "MINOR", "INFO"] }),
  tags: jsonb("tags").$type<string[]>().default([]),
  placeholders: jsonb("placeholders").$type<string[]>().default([]), // Variables like ["location", "condition"]
  language: varchar("language").default("en-US"),
  isActive: boolean("is_active").default(true),
  embedding: text("embedding"), // Optional ML embeddings for search (stored as base64)
  createdBy: varchar("created_by"),
  useCount: integer("use_count").default(0),
  skipCount: integer("skip_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_narratives_company_category").on(table.companyId, table.category, table.component),
  index("IDX_narratives_active").on(table.companyId, table.isActive),
]);

// Findings table for inspection items that need narratives
export const findings = pgTable("findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").notNull(),
  sectionName: varchar("section_name"),
  title: varchar("title").notNull(),
  severity: varchar("severity", { enum: ["MAJOR", "SAFETY", "MINOR", "INFO"] }).notNull(),
  summary: text("summary").notNull(),
  aiSource: boolean("ai_source").default(true),
  photoIds: jsonb("photo_ids").$type<string[]>().default([]),
  narrativeId: varchar("narrative_id"),
  narrativeText: text("narrative_text"), // Final rendered text
  variables: jsonb("variables").$type<Record<string, any>>().default({}),
  confidence: real("confidence"), // Auto-apply confidence score
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_findings_inspection").on(table.inspectionId),
  index("IDX_findings_narrative").on(table.narrativeId),
]);

// Narrative suggestions for findings
export const narrativeSuggestions = pgTable("narrative_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  findingId: varchar("finding_id").notNull(),
  narrativeId: varchar("narrative_id").notNull(),
  score: real("score").notNull(),
  variables: jsonb("variables").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_narrative_suggestions_finding").on(table.findingId),
]);

// Narrative choice feedback for learning
export const narrativeChoices = pgTable("narrative_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  findingId: varchar("finding_id").notNull(),
  narrativeId: varchar("narrative_id").notNull(),
  chosen: boolean("chosen").notNull(),
  score: real("score").notNull(),
  edited: boolean("edited").default(false),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_narrative_choices_finding").on(table.findingId),
  index("IDX_narrative_choices_narrative").on(table.narrativeId),
]);

// Enhanced company settings to include narrative preferences
export const narrativeSettings = pgTable("narrative_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().unique(),
  autoApplyNarratives: boolean("auto_apply_narratives").default(false),
  autoApplyThreshold: real("auto_apply_threshold").default(0.72),
  language: varchar("language").default("en-US"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add narrative types
export type Narrative = typeof narratives.$inferSelect;
export type InsertNarrative = typeof narratives.$inferInsert;
export type Finding = typeof findings.$inferSelect;
export type InsertFinding = typeof findings.$inferInsert;
export type NarrativeSuggestion = typeof narrativeSuggestions.$inferSelect;
export type InsertNarrativeSuggestion = typeof narrativeSuggestions.$inferInsert;
export type NarrativeChoice = typeof narrativeChoices.$inferSelect;
export type InsertNarrativeChoice = typeof narrativeChoices.$inferInsert;
export type NarrativeSetting = typeof narrativeSettings.$inferSelect;
export type InsertNarrativeSetting = typeof narrativeSettings.$inferInsert;

// ============================================================================
// ENHANCED LEAD MANAGEMENT SYSTEM (Based on compliance requirements)
// ============================================================================

// Lead categories for the consent matrix
export const leadCategories = [
  'utility_connect',
  'internet_cable_phone', 
  'home_warranty',
  'home_security',
  'insurance_home_auto',
  'insurance_life',
  'solar',
  'ev_charger',
  'pest_control',
  'moving_companies',
  'cleaning_services',
  'lawn_service'
] as const;

// Lead profiles auto-created from finalized inspection reports
export const leadProfiles = pgTable("lead_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull().unique(),
  address: text("address"),
  state: varchar("state").notNull(),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  issues: jsonb("issues").$type<Array<{title: string; severity?: string; tags?: string[]}>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assets linked to lead profiles (photos, documents)
export const leadAssets = pgTable("lead_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadProfileId: varchar("lead_profile_id").references(() => leadProfiles.id).notNull(),
  kind: varchar("kind").notNull(), // 'photo' | 'doc'
  url: text("url").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Partners/vendors for lead submissions
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category", { enum: leadCategories }).notNull(),
  state: varchar("state").notNull(),
  endpoint: text("endpoint"),
  authType: varchar("auth_type"), // 'api_key' | 'oauth' | 'basic'
  authConfig: jsonb("auth_config"),
  allowedChannels: jsonb("allowed_channels").$type<string[]>(), // ['email', 'phone', 'sms']
  payoutAmount: numeric("payout_amount", { precision: 10, scale: 2 }),
  payoutTerms: varchar("payout_terms"), // 'net_30' | 'net_60' | 'net_90'
  consentTextVersion: varchar("consent_text_version"),
  dedupeWindowDays: integer("dedupe_window_days").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrix of interest per category per report (one row per category per report)
export const leadMatrix = pgTable("lead_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull(),
  categoryKey: varchar("category_key", { enum: leadCategories }).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id), // pre-selected by state map; can override
  isInterested: boolean("is_interested").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqReportCategory: uniqueIndex("uniq_report_category").on(t.reportId, t.categoryKey)
}));

// Consent tracking with full compliance logging
export const consents = pgTable("consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull(),
  categoryKey: varchar("category_key", { enum: leadCategories }).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id).notNull(), // IMPORTANT: name the seller at capture time
  channel: varchar("channel", { enum: ["email", "phone", "sms"] }).notNull(),         // 'email' | 'phone' | 'sms'
  consentType: varchar("consent_type", { enum: ["global_email", "one_to_one"] }).notNull(), // 'global_email' | 'one_to_one'
  consentTextVersion: varchar("consent_text_version").notNull(),
  signature: text("signature"),               // typed name or checkbox attestation
  ip: varchar("ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timezone: varchar("timezone"),
  gpcSignal: boolean("gpc_signal").default(false),
  portalSessionId: varchar("portal_session_id"),
  isRevoked: boolean("is_revoked").default(false),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead submissions to partners with payout tracking
export const leadSubmissions = pgTable("lead_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => inspectionReports.id).notNull(),
  categoryKey: varchar("category_key", { enum: leadCategories }).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id).notNull(),
  payload: jsonb("payload"),
  status: varchar("status", { enum: ["queued", "sent", "failed", "paid"] }).default("queued"),
  externalId: varchar("external_id"),
  payoutExpected: numeric("payout_expected", { precision: 10, scale: 2 }),
  payoutDueDate: date("payout_due_date"),
  payoutReceived: numeric("payout_received", { precision: 10, scale: 2 }),
  payoutReceivedDate: date("payout_received_date"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  idempotencyKey: varchar("idempotency_key").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consent revocations for compliance
export const revocations = pgTable("revocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consentId: varchar("consent_id").references(() => consents.id).notNull(),
  revokedAt: timestamp("revoked_at").defaultNow(),
  reason: text("reason"),
  method: varchar("method"), // 'unsubscribe_link' | 'opt_out_request' | 'admin_action'
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

// State-to-partner mappings for default assignments
export const statePartnerMappings = pgTable("state_partner_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: varchar("state").notNull(),
  categoryKey: varchar("category_key", { enum: leadCategories }).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id).notNull(),
  priority: integer("priority").default(1), // for multiple partners per state/category
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqStateCategoryPriority: uniqueIndex("uniq_state_category_priority").on(t.state, t.categoryKey, t.priority)
}));

// Relations for lead management system
export const leadProfilesRelations = relations(leadProfiles, ({ one, many }) => ({
  report: one(inspectionReports, {
    fields: [leadProfiles.reportId],
    references: [inspectionReports.id],
  }),
  assets: many(leadAssets),
  matrix: many(leadMatrix),
  consents: many(consents),
  submissions: many(leadSubmissions),
}));

export const leadAssetsRelations = relations(leadAssets, ({ one }) => ({
  leadProfile: one(leadProfiles, {
    fields: [leadAssets.leadProfileId],
    references: [leadProfiles.id],
  }),
}));

export const partnersRelations = relations(partners, ({ many }) => ({
  matrix: many(leadMatrix),
  consents: many(consents),
  submissions: many(leadSubmissions),
  mappings: many(statePartnerMappings),
}));

export const leadMatrixRelations = relations(leadMatrix, ({ one }) => ({
  report: one(inspectionReports, {
    fields: [leadMatrix.reportId],
    references: [inspectionReports.id],
  }),
  partner: one(partners, {
    fields: [leadMatrix.partnerId],
    references: [partners.id],
  }),
}));

export const consentsRelations = relations(consents, ({ one, many }) => ({
  report: one(inspectionReports, {
    fields: [consents.reportId],
    references: [inspectionReports.id],
  }),
  partner: one(partners, {
    fields: [consents.partnerId],
    references: [partners.id],
  }),
  revocations: many(revocations),
}));

export const leadSubmissionsRelations = relations(leadSubmissions, ({ one }) => ({
  report: one(inspectionReports, {
    fields: [leadSubmissions.reportId],
    references: [inspectionReports.id],
  }),
  partner: one(partners, {
    fields: [leadSubmissions.partnerId],
    references: [partners.id],
  }),
}));

export const revocationsRelations = relations(revocations, ({ one }) => ({
  consent: one(consents, {
    fields: [revocations.consentId],
    references: [consents.id],
  }),
}));

export const statePartnerMappingsRelations = relations(statePartnerMappings, ({ one }) => ({
  partner: one(partners, {
    fields: [statePartnerMappings.partnerId],
    references: [partners.id],
  }),
}));

// Types for lead management
export type LeadProfile = typeof leadProfiles.$inferSelect;
export type InsertLeadProfile = typeof leadProfiles.$inferInsert;
export type LeadAsset = typeof leadAssets.$inferSelect;
export type InsertLeadAsset = typeof leadAssets.$inferInsert;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;
export type LeadMatrix = typeof leadMatrix.$inferSelect;
export type InsertLeadMatrix = typeof leadMatrix.$inferInsert;
export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;
export type LeadSubmission = typeof leadSubmissions.$inferSelect;
export type InsertLeadSubmission = typeof leadSubmissions.$inferInsert;
export type Revocation = typeof revocations.$inferSelect;
export type InsertRevocation = typeof revocations.$inferInsert;
export type StatePartnerMapping = typeof statePartnerMappings.$inferSelect;
export type InsertStatePartnerMapping = typeof statePartnerMappings.$inferInsert;

// Zod schemas for validation
export const insertLeadProfileSchema = createInsertSchema(leadProfiles);
export const insertLeadAssetSchema = createInsertSchema(leadAssets);
export const insertPartnerSchema = createInsertSchema(partners);
export const insertLeadMatrixSchema = createInsertSchema(leadMatrix);
export const insertConsentSchema = createInsertSchema(consents);
export const insertLeadSubmissionSchema = createInsertSchema(leadSubmissions);
export const insertRevocationSchema = createInsertSchema(revocations);
export const insertStatePartnerMappingSchema = createInsertSchema(statePartnerMappings);

// ============================================================================
// SCHEDULING FORM TYPES & VALIDATION
// ============================================================================

// Zod schemas for the scheduling form steps
export const propertyInfoSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),  
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  squareFootage: z.string().min(1, "Square footage is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  yearBuilt: z.string().min(4, "Year built is required"),
  propertyType: z.enum(['Single Family', 'Townhouse', 'Condo', 'Multi-Family', 'Mobile Home', 'Commercial']).default('Single Family')
});

export const clientInfoSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  preferredContact: z.enum(['email', 'phone', 'text']).default('email')
});

export const realtorInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional()
});

export const inspectionDetailsSchema = z.object({
  type: z.enum(['Pre-Purchase Inspection', 'Annual Inspection', 'Pre-Listing Inspection', 'Warranty Inspection', 'Insurance Inspection', 'Maintenance Inspection']).default('Pre-Purchase Inspection'),
  estimatedDuration: z.number().min(60).max(480).default(180),
  specialInstructions: z.string().optional(),
  urgentRequest: z.boolean().default(false)
});

export const schedulingPreferencesSchema = z.object({
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  alternativeDate: z.string().optional(),
  alternativeTime: z.string().optional()
});

// Complete scheduling form schema
export const schedulingFormSchema = z.object({
  property: propertyInfoSchema,
  client: clientInfoSchema,
  realtor: realtorInfoSchema,
  inspection: inspectionDetailsSchema,
  scheduling: schedulingPreferencesSchema
});

// TypeScript types for the scheduling form
export type PropertyInfo = z.infer<typeof propertyInfoSchema>;
export type ClientInfo = z.infer<typeof clientInfoSchema>;
export type RealtorInfo = z.infer<typeof realtorInfoSchema>;
export type InspectionDetails = z.infer<typeof inspectionDetailsSchema>;
export type SchedulingPreferences = z.infer<typeof schedulingPreferencesSchema>;
export type SchedulingFormData = z.infer<typeof schedulingFormSchema>;

// ============================================================================
// SERVICE MARKETPLACE SYSTEM
// ============================================================================

// Services table for additional inspection services
export const services = pgTable('services', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name').notNull(),
  description: text('description').notNull(),
  category: varchar('category').notNull(), // 'safety', 'diagnostics', 'specialized', 'maintenance', 'consultation'
  basePrice: integer('base_price').notNull(), // Price in cents
  duration: integer('duration').notNull(), // Duration in minutes
  requirements: text('requirements'), // JSON string of requirements
  isActive: boolean('is_active').default(true),
  isPopular: boolean('is_popular').default(false),
  icon: varchar('icon'), // Icon name for UI
  color: varchar('color'), // Color theme for UI
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Inspector service preferences
export const inspectorServices = pgTable('inspector_services', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  inspectorId: varchar('inspector_id').notNull().references(() => users.id),
  serviceId: varchar('service_id').notNull().references(() => services.id),
  customPrice: integer('custom_price'), // Override base price
  isEnabled: boolean('is_enabled').default(true),
  isRecommended: boolean('is_recommended').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Inspection services (services added to specific inspections)
export const inspectionServices = pgTable('inspection_services', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar('inspection_id').notNull().references(() => inspectionReports.id),
  serviceId: varchar('service_id').notNull().references(() => services.id),
  price: integer('price').notNull(), // Final price charged
  status: varchar('status').default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Service Relations
export const servicesRelations = relations(services, ({ many }) => ({
  inspectorServices: many(inspectorServices),
  inspectionServices: many(inspectionServices),
}));

export const inspectorServicesRelations = relations(inspectorServices, ({ one }) => ({
  inspector: one(users, {
    fields: [inspectorServices.inspectorId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [inspectorServices.serviceId],
    references: [services.id],
  }),
}));

export const inspectionServicesRelations = relations(inspectionServices, ({ one }) => ({
  inspection: one(inspectionReports, {
    fields: [inspectionServices.inspectionId],
    references: [inspectionReports.id],
  }),
  service: one(services, {
    fields: [inspectionServices.serviceId],
    references: [services.id],
  }),
}));

// Service Types
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type InspectorService = typeof inspectorServices.$inferSelect;
export type InsertInspectorService = typeof inspectorServices.$inferInsert;
export type InspectionService = typeof inspectionServices.$inferSelect;
export type InsertInspectionService = typeof inspectionServices.$inferInsert;

