import { db } from "../db";
import { 
  leadProfiles, 
  leadAssets, 
  leadMatrix, 
  statePartnerMappings,
  leadCategories,
  type InsertLeadProfile,
  type InsertLeadAsset,
  type InsertLeadMatrix,
  partners
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface ReportFinalizedEvent {
  reportId: string;
  address: string;
  state: string;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  issues: Array<{
    title: string;
    severity?: string;
    tags?: string[];
  }>;
  photoUrls: string[];
}

/**
 * Event handler for when an inspection report is finalized
 * Auto-creates lead profile and seeds interest matrix
 */
export async function onReportFinalized(event: ReportFinalizedEvent): Promise<void> {
  console.log(`Processing report finalization for ${event.reportId}`);
  
  try {
    // 1. Upsert lead profile from the report
    const leadProfile = await upsertLeadProfile(event);
    
    // 2. Pre-seed empty interest rows for every category
    await seedLeadMatrix(event.reportId, event.state);
    
    // 3. Attach assets (photos and documents)
    await attachAssets(leadProfile.id, event.photoUrls);
    
    console.log(`Successfully processed report finalization for ${event.reportId}`);
  } catch (error) {
    console.error(`Error processing report finalization for ${event.reportId}:`, error);
    throw error;
  }
}

/**
 * Create or update lead profile from report data
 */
async function upsertLeadProfile(event: ReportFinalizedEvent): Promise<{ id: string }> {
  const leadProfileData: InsertLeadProfile = {
    reportId: event.reportId,
    address: event.address,
    state: event.state,
    clientName: event.client.name,
    clientEmail: event.client.email,
    clientPhone: event.client.phone,
    issues: event.issues,
  };

  // Check if lead profile already exists
  const existing = await db
    .select()
    .from(leadProfiles)
    .where(eq(leadProfiles.reportId, event.reportId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const [updated] = await db
      .update(leadProfiles)
      .set({
        address: leadProfileData.address,
        state: leadProfileData.state,
        clientName: leadProfileData.clientName,
        clientEmail: leadProfileData.clientEmail,
        clientPhone: leadProfileData.clientPhone,
        issues: leadProfileData.issues,
      })
      .where(eq(leadProfiles.reportId, event.reportId))
      .returning({ id: leadProfiles.id });
    
    return updated;
  } else {
    // Create new
    const [created] = await db
      .insert(leadProfiles)
      .values(leadProfileData)
      .returning({ id: leadProfiles.id });
    
    return created;
  }
}

/**
 * Seed lead matrix with all 12 categories and default partners
 */
async function seedLeadMatrix(reportId: string, state: string): Promise<void> {
  for (const categoryKey of leadCategories) {
    // Check if matrix entry already exists
    const existing = await db
      .select()
      .from(leadMatrix)
      .where(and(
        eq(leadMatrix.reportId, reportId),
        eq(leadMatrix.categoryKey, categoryKey)
      ))
      .limit(1);

    if (existing.length === 0) {
      // Get default partner for this state/category
      const defaultPartner = await getDefaultPartner(state, categoryKey);
      
      const matrixData: InsertLeadMatrix = {
        reportId,
        categoryKey,
        partnerId: defaultPartner?.id || null,
        isInterested: false, // User will opt-in via portal
      };

      await db.insert(leadMatrix).values(matrixData);
    }
  }
}

/**
 * Get default partner for state/category combination
 */
async function getDefaultPartner(state: string, categoryKey: string): Promise<{ id: string } | null> {
  const mapping = await db
    .select({ partnerId: statePartnerMappings.partnerId })
    .from(statePartnerMappings)
    .innerJoin(partners, eq(statePartnerMappings.partnerId, partners.id))
    .where(and(
      eq(statePartnerMappings.state, state),
      eq(statePartnerMappings.categoryKey, categoryKey),
      eq(statePartnerMappings.isActive, true),
      eq(partners.isActive, true)
    ))
    .orderBy(statePartnerMappings.priority)
    .limit(1);

  return mapping.length > 0 ? { id: mapping[0].partnerId } : null;
}

/**
 * Attach photos and documents as lead assets
 */
async function attachAssets(leadProfileId: string, photoUrls: string[]): Promise<void> {
  if (photoUrls.length === 0) return;

  const assetData: InsertLeadAsset[] = photoUrls.map(url => ({
    leadProfileId,
    kind: 'photo', // Could extend to detect doc vs photo by extension
    url,
    meta: {
      originalSource: 'inspection_report'
    }
  }));

  // Remove existing assets and add new ones
  await db
    .delete(leadAssets)
    .where(eq(leadAssets.leadProfileId, leadProfileId));

  if (assetData.length > 0) {
    await db.insert(leadAssets).values(assetData);
  }
}

/**
 * Check if lead submission is eligible for sending
 */
export async function checkSubmissionEligibility(
  reportId: string, 
  categoryKey: string
): Promise<{
  eligible: boolean;
  reason?: string;
  emailConsent?: boolean;
  phoneConsent?: boolean;
}> {
  // Implementation will be added when we create the consent system
  return {
    eligible: false,
    reason: 'Consent system not yet implemented'
  };
}