import { db } from "../db";
import { 
  leadSubmissions,
  leadProfiles,
  partners,
  type LeadSubmission
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Batch submission worker for sending leads to partners
 * Handles retry logic, error handling, and payout tracking
 */
export class SubmissionWorker {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 15 * 60 * 1000) { // Default: 15 minutes
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Submission worker started');
    
    // Run immediately
    this.processQueuedSubmissions();
    
    // Then run on interval
    this.interval = setInterval(() => {
      this.processQueuedSubmissions();
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Submission worker stopped');
  }

  async processQueuedSubmissions() {
    try {
      console.log('📋 Processing queued lead submissions...');
      
      // Get all queued submissions
      const queuedSubmissions = await db
        .select({
          submission: leadSubmissions,
          profile: leadProfiles,
          partner: partners
        })
        .from(leadSubmissions)
        .leftJoin(leadProfiles, eq(leadSubmissions.reportId, leadProfiles.reportId))
        .leftJoin(partners, eq(leadSubmissions.partnerId, partners.id))
        .where(eq(leadSubmissions.status, 'queued'));

      console.log(`Found ${queuedSubmissions.length} queued submissions`);

      for (const item of queuedSubmissions) {
        await this.processSubmission(item.submission, item.profile, item.partner);
        
        // Add small delay between submissions to avoid overwhelming partners
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('❌ Error processing submissions:', error);
    }
  }

  private async processSubmission(
    submission: LeadSubmission, 
    profile: any, 
    partner: any
  ) {
    try {
      console.log(`📤 Submitting lead ${submission.id} to ${partner?.name}`);

      // Build partner-specific payload
      const payload = this.buildPartnerPayload(submission, profile, partner);

      // Attempt submission to partner
      const result = await this.submitToPartner(partner, payload);

      if (result.success) {
        // Update submission as sent
        await db
          .update(leadSubmissions)
          .set({
            status: 'sent',
            externalId: result.externalId,
            updatedAt: new Date()
          })
          .where(eq(leadSubmissions.id, submission.id));

        console.log(`✅ Successfully submitted lead ${submission.id} (external ID: ${result.externalId})`);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error(`❌ Failed to submit lead ${submission.id}:`, error);
      
      // Update retry count and status
      const newRetryCount = (submission.retryCount || 0) + 1;
      const maxRetries = 3;
      
      await db
        .update(leadSubmissions)
        .set({
          status: newRetryCount >= maxRetries ? 'failed' : 'queued',
          retryCount: newRetryCount,
          errorMessage: error instanceof Error ? error.message : String(error),
          updatedAt: new Date()
        })
        .where(eq(leadSubmissions.id, submission.id));

      if (newRetryCount >= maxRetries) {
        console.log(`💀 Lead ${submission.id} marked as failed after ${maxRetries} retries`);
      }
    }
  }

  private buildPartnerPayload(submission: LeadSubmission, profile: any, partner: any) {
    // Build payload specific to partner requirements
    const basePayload = {
      // Lead information
      leadId: submission.id,
      category: submission.categoryKey,
      
      // Customer information (respecting consent)
      customerName: profile?.clientName,
      customerEmail: profile?.clientEmail,
      customerPhone: profile?.clientPhone,
      
      // Property information
      propertyAddress: profile?.address,
      state: profile?.state,
      
      // Inspection findings (filtered by category)
      issues: this.filterIssuesByCategory(profile?.issues || [], submission.categoryKey),
      
      // Source information
      source: 'TREC Inspection',
      submittedAt: new Date().toISOString(),
      
      // Optional: Include photos if allowed by partner
      // photos: profile?.photoUrls
    };

    // Partner-specific customizations
    if (partner?.category === 'solar' && partner?.endpoint?.includes('solarquote')) {
      return {
        ...basePayload,
        roofType: this.extractRoofInfo(profile?.issues),
        estimatedUsage: 'standard'
      };
    }

    if (partner?.category === 'home_warranty' && partner?.endpoint?.includes('warranty')) {
      return {
        ...basePayload,
        systemsInvolved: this.extractSystemsFromIssues(profile?.issues),
        propertyAge: this.estimatePropertyAge(profile?.issues)
      };
    }

    return basePayload;
  }

  private async submitToPartner(partner: any, payload: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    if (!partner?.endpoint) {
      // Mock submission for development
      console.log('📝 Mock submission (no endpoint configured):', {
        partner: partner?.name,
        payload: JSON.stringify(payload, null, 2)
      });
      
      return {
        success: true,
        externalId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      };
    }

    try {
      // Real submission to partner API
      const response = await fetch(partner.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(partner.authConfig?.apiKey && {
            'Authorization': `Bearer ${partner.authConfig.apiKey}`
          })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Partner API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        externalId: result.id || result.leadId || result.externalId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private filterIssuesByCategory(issues: any[], categoryKey: string): any[] {
    // Filter issues relevant to the category
    const categoryKeywords: Record<string, string[]> = {
      'hvac': ['hvac', 'heating', 'cooling', 'air', 'furnace', 'ac'],
      'electrical': ['electrical', 'electric', 'wiring', 'outlet', 'panel'],
      'plumbing': ['plumbing', 'water', 'leak', 'pipe', 'faucet', 'toilet'],
      'roofing': ['roof', 'shingle', 'gutter', 'flashing'],
      'solar': ['roof', 'electrical', 'panel', 'attic'],
      'pest_control': ['pest', 'termite', 'insect', 'rodent', 'damage'],
      // Add more mappings as needed
    };

    const keywords = categoryKeywords[categoryKey] || [];
    if (keywords.length === 0) return issues; // Return all if no specific filter

    return issues.filter(issue => 
      keywords.some((keyword: string) => 
        issue.title?.toLowerCase().includes(keyword) ||
        issue.tags?.some((tag: string) => tag.toLowerCase().includes(keyword))
      )
    );
  }

  private extractRoofInfo(issues: any[]): string {
    // Extract roof-related information for solar submissions
    const roofIssues = issues.filter(issue => 
      issue.title?.toLowerCase().includes('roof') ||
      issue.tags?.includes('roofing')
    );
    
    return roofIssues.length > 0 ? 'needs_inspection' : 'good_condition';
  }

  private extractSystemsFromIssues(issues: any[]): string[] {
    const systems = new Set<string>();
    
    issues.forEach(issue => {
      const title = issue.title?.toLowerCase() || '';
      if (title.includes('hvac') || title.includes('heating') || title.includes('cooling')) {
        systems.add('HVAC');
      }
      if (title.includes('electrical') || title.includes('electric')) {
        systems.add('Electrical');
      }
      if (title.includes('plumbing') || title.includes('water')) {
        systems.add('Plumbing');
      }
      if (title.includes('roof')) {
        systems.add('Roofing');
      }
    });
    
    return Array.from(systems);
  }

  private estimatePropertyAge(issues: any[]): number {
    // Rough estimation based on issues found
    const ageIndicators = issues.filter(issue =>
      issue.title?.toLowerCase().includes('old') ||
      issue.title?.toLowerCase().includes('aging') ||
      issue.title?.toLowerCase().includes('worn')
    );
    
    return ageIndicators.length > 3 ? 25 : 10; // Years
  }
}

// Export singleton instance
export const submissionWorker = new SubmissionWorker();