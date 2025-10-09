import type { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  leadMatrix,
  leadProfiles,
  partners,
  consents,
  leadSubmissions,
  statePartnerMappings,
  leadCategories,
  type InsertLeadSubmission
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * API routes for lead matrix management
 */
export function registerLeadMatrixRoutes(app: Express): void {
  
  // Get lead matrix for a specific report
  app.get('/api/internal/leads/:reportId/matrix', async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;

      // Get lead matrix with partner and consent data
      const matrixData = await db
        .select({
          matrix: leadMatrix,
          partner: partners,
          leadProfile: leadProfiles
        })
        .from(leadMatrix)
        .leftJoin(partners, eq(leadMatrix.partnerId, partners.id))
        .leftJoin(leadProfiles, eq(leadMatrix.reportId, leadProfiles.reportId))
        .where(eq(leadMatrix.reportId, reportId));

      // Get consents for this report
      const consentData = await db
        .select()
        .from(consents)
        .where(eq(consents.reportId, reportId));

      // Get submissions for this report
      const submissionData = await db
        .select()
        .from(leadSubmissions)
        .where(eq(leadSubmissions.reportId, reportId))
        .orderBy(desc(leadSubmissions.createdAt));

      // Transform data for frontend
      const matrix = matrixData.map(item => {
        const categoryConsents = consentData.filter(c => c.categoryKey === item.matrix.categoryKey);
        const categorySubmissions = submissionData.filter(s => s.categoryKey === item.matrix.categoryKey);
        
        // Check if customer set interest (read-only if they opted in via portal)
        const hasCustomerConsent = categoryConsents.length > 0;
        
        // Check if partner can be changed (locked if phone/SMS consent exists)
        const hasPhoneSmsConsent = categoryConsents.some(c => 
          (c.channel === 'phone' || c.channel === 'sms') && !c.isRevoked
        );

        return {
          id: item.matrix.id,
          categoryKey: item.matrix.categoryKey,
          categoryLabel: getCategoryLabel(item.matrix.categoryKey),
          isInterested: item.matrix.isInterested,
          partner: item.partner,
          consents: categoryConsents,
          submissions: categorySubmissions,
          canEditInterest: !hasCustomerConsent, // Admin can edit if customer hasn't opted in
          canChangePartner: !hasPhoneSmsConsent // Can't change if phone/SMS consent exists
        };
      });

      res.json({ matrix });
    } catch (error) {
      console.error('Error fetching matrix:', error);
      res.status(500).json({ error: 'Failed to fetch matrix data' });
    }
  });

  // Update interest for a category
  app.put('/api/internal/leads/:reportId/matrix/:categoryKey/interest', async (req: Request, res: Response) => {
    try {
      const { reportId, categoryKey } = req.params;
      const { isInterested } = req.body;

      // Check if this can be edited (no customer consent exists)
      const existingConsents = await db
        .select()
        .from(consents)
        .where(and(
          eq(consents.reportId, reportId),
          eq(consents.categoryKey, categoryKey)
        ));

      if (existingConsents.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot modify interest - customer consent already captured' 
        });
      }

      await db
        .update(leadMatrix)
        .set({ 
          isInterested,
          updatedAt: new Date()
        })
        .where(and(
          eq(leadMatrix.reportId, reportId),
          eq(leadMatrix.categoryKey, categoryKey)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating interest:', error);
      res.status(500).json({ error: 'Failed to update interest' });
    }
  });

  // Update partner for a category
  app.put('/api/internal/leads/:reportId/matrix/:categoryKey/partner', async (req: Request, res: Response) => {
    try {
      const { reportId, categoryKey } = req.params;
      const { partnerId } = req.body;

      // Check if partner can be changed (no phone/SMS consent exists)
      const phoneConsents = await db
        .select()
        .from(consents)
        .where(and(
          eq(consents.reportId, reportId),
          eq(consents.categoryKey, categoryKey),
          eq(consents.isRevoked, false)
        ));

      const hasPhoneSmsConsent = phoneConsents.some(c => 
        c.channel === 'phone' || c.channel === 'sms'
      );

      if (hasPhoneSmsConsent) {
        return res.status(400).json({ 
          error: 'Cannot change partner - phone/SMS consent exists for current partner' 
        });
      }

      await db
        .update(leadMatrix)
        .set({ 
          partnerId,
          updatedAt: new Date()
        })
        .where(and(
          eq(leadMatrix.reportId, reportId),
          eq(leadMatrix.categoryKey, categoryKey)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating partner:', error);
      res.status(500).json({ error: 'Failed to update partner' });
    }
  });

  // Submit lead to partner
  app.post('/api/internal/leads/:reportId/matrix/:categoryKey/submit', async (req: Request, res: Response) => {
    try {
      const { reportId, categoryKey } = req.params;

      // Check eligibility
      const eligibility = await checkSubmissionEligibility(reportId, categoryKey);
      
      if (!eligibility.eligible) {
        return res.status(400).json({ error: eligibility.reason });
      }

      // Get matrix item with partner
      const matrixItem = await db
        .select({
          matrix: leadMatrix,
          partner: partners
        })
        .from(leadMatrix)
        .leftJoin(partners, eq(leadMatrix.partnerId, partners.id))
        .where(and(
          eq(leadMatrix.reportId, reportId),
          eq(leadMatrix.categoryKey, categoryKey)
        ))
        .limit(1);

      if (matrixItem.length === 0 || !matrixItem[0].partner) {
        return res.status(400).json({ error: 'No partner assigned for this category' });
      }

      const { partner } = matrixItem[0];

      // Create idempotency key
      const idempotencyKey = `${reportId}:${categoryKey}:${partner.id}`;

      // Check for existing submission
      const existingSubmission = await db
        .select()
        .from(leadSubmissions)
        .where(eq(leadSubmissions.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingSubmission.length > 0) {
        return res.status(400).json({ error: 'Lead already submitted for this category' });
      }

      // Create submission record
      const submission: InsertLeadSubmission = {
        reportId,
        categoryKey,
        partnerId: partner.id,
        payload: {
          // TODO: Build partner-specific payload
          reportId,
          category: categoryKey,
          partner: partner.name
        },
        status: 'queued',
        payoutExpected: partner.payoutAmount || null,
        payoutDueDate: getPayoutDueDate(partner.payoutTerms),
        idempotencyKey,
      };

      await db.insert(leadSubmissions).values(submission);

      // TODO: Queue for actual submission to partner
      // await queueSubmissionWorker(submission);

      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting lead:', error);
      res.status(500).json({ error: 'Failed to submit lead' });
    }
  });

  // Get available partners by category
  app.get('/api/internal/partners/by-category', async (req: Request, res: Response) => {
    try {
      const partnersByCategory: Record<string, any[]> = {};

      for (const categoryKey of leadCategories) {
        const categoryPartners = await db
          .select()
          .from(partners)
          .where(and(
            eq(partners.category, categoryKey),
            eq(partners.isActive, true)
          ));

        partnersByCategory[categoryKey] = categoryPartners;
      }

      res.json(partnersByCategory);
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ error: 'Failed to fetch partners' });
    }
  });
}

// Helper functions
function getCategoryLabel(categoryKey: string): string {
  const labels = {
    'utility_connect': 'Utility Connect',
    'internet_cable_phone': 'Internet/Cable/Phone',
    'home_warranty': 'Home Warranty',
    'home_security': 'Home Security',
    'insurance_home_auto': 'Home & Auto Insurance',
    'insurance_life': 'Life Insurance',
    'solar': 'Solar Installation',
    'ev_charger': 'EV Charger Installation',
    'pest_control': 'Pest Control',
    'moving_companies': 'Moving Services',
    'cleaning_services': 'Cleaning Services',
    'lawn_service': 'Lawn & Landscaping'
  };
  return labels[categoryKey] || categoryKey;
}

async function checkSubmissionEligibility(reportId: string, categoryKey: string): Promise<{
  eligible: boolean;
  reason?: string;
}> {
  // Get matrix item
  const matrix = await db
    .select()
    .from(leadMatrix)
    .where(and(
      eq(leadMatrix.reportId, reportId),
      eq(leadMatrix.categoryKey, categoryKey)
    ))
    .limit(1);

  if (matrix.length === 0 || !matrix[0].isInterested) {
    return { eligible: false, reason: 'No interest indicated for this category' };
  }

  if (!matrix[0].partnerId) {
    return { eligible: false, reason: 'No partner assigned for this category' };
  }

  // Check consents
  const consents = await db
    .select()
    .from(consents)
    .where(and(
      eq(consents.reportId, reportId),
      eq(consents.categoryKey, categoryKey),
      eq(consents.isRevoked, false)
    ));

  const hasEmailConsent = consents.some(c => c.channel === 'email');
  const hasPhoneConsent = consents.some(c => c.channel === 'phone');
  const hasSmsConsent = consents.some(c => c.channel === 'sms');

  // Need either email consent OR both phone and SMS consent
  if (!hasEmailConsent && !(hasPhoneConsent && hasSmsConsent)) {
    return { 
      eligible: false, 
      reason: 'Insufficient consent - need email OR phone+SMS consent' 
    };
  }

  return { eligible: true };
}

function getPayoutDueDate(payoutTerms: string | null): string | null {
  if (!payoutTerms) return null;
  
  const days = payoutTerms === 'net_30' ? 30 : 
               payoutTerms === 'net_60' ? 60 : 
               payoutTerms === 'net_90' ? 90 : 30;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  
  return dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}