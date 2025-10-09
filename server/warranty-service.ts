import { storage } from "./storage";
import type { InspectionReport } from "../shared/schema";

// Elite MGA API configuration
const ELITE_MGA_API_URL = process.env.ELITE_MGA_API_URL || 'https://api.elitemga.com/v1';
const ELITE_MGA_API_KEY = process.env.ELITE_MGA_API_KEY || 'sandbox-key'; // Will need real API key

interface WarrantySubmissionData {
  clientEmail: string;
  clientPhone: string;
  propertyAddress: string;
  inspectionDate: string;
  inspectorInfo: {
    name: string;
    email: string;
    license: string;
  };
}

interface EliteMGAResponse {
  success: boolean;
  warrantyId?: string;
  error?: string;
  chargeId?: string;
}

/**
 * Process warranty submission to Elite MGA API
 * This function handles the background job of submitting warranty data to Elite MGA
 */
export async function processWarrantySubmission(
  report: InspectionReport, 
  submissionData: WarrantySubmissionData
): Promise<void> {
  try {
    console.log(`Processing warranty submission for report ${report.id}`);
    
    // Prepare Elite MGA payload
    const eliteMGAPayload = {
      // Property information
      property: {
        address: submissionData.propertyAddress,
        inspectionDate: submissionData.inspectionDate,
        reportId: report.id
      },
      
      // Client information
      client: {
        email: submissionData.clientEmail,
        phone: submissionData.clientPhone,
        name: report.clientFirstName + ' ' + report.clientLastName
      },
      
      // Inspector information
      inspector: {
        name: submissionData.inspectorInfo.name,
        email: submissionData.inspectorInfo.email,
        license: submissionData.inspectorInfo.license,
        inspectorId: report.inspectorId
      },
      
      // Warranty details
      warranty: {
        type: '90-day-home-inspection',
        coverage: 'Standard Home Inspection Warranty',
        duration: 90, // days
        cost: 12.00, // USD
        terms: 'https://www.elitemga.com/home-inspection-warranty/'
      },
      
      // Metadata
      metadata: {
        submittedAt: new Date().toISOString(),
        source: 'AInspect Platform',
        version: '1.0'
      }
    };

    // Submit to Elite MGA API
    const response = await submitToEliteMGA(eliteMGAPayload);
    
    if (response.success && response.warrantyId) {
      // Update report with warranty confirmation
      await storage.updateInspectionReport(report.id, {
        warrantyStatus: 'active',
        warrantyExternalId: response.warrantyId,
        warrantyNote: `Elite MGA warranty activated. ID: ${response.warrantyId}. Charge ID: ${response.chargeId || 'N/A'}`
      });
      
      console.log(`Warranty successfully activated for report ${report.id}. Elite MGA ID: ${response.warrantyId}`);
    } else {
      // Update report with error status
      await storage.updateInspectionReport(report.id, {
        warrantyStatus: 'failed',
        warrantyNote: `Elite MGA submission failed: ${response.error || 'Unknown error'}`
      });
      
      console.error(`Warranty submission failed for report ${report.id}: ${response.error}`);
    }
    
  } catch (error) {
    console.error(`Error processing warranty submission for report ${report.id}:`, error);
    
    // Update report with error status
    try {
      await storage.updateInspectionReport(report.id, {
        warrantyStatus: 'failed',
        warrantyNote: `Warranty processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } catch (updateError) {
      console.error(`Failed to update report status after warranty error:`, updateError);
    }
  }
}

/**
 * Submit warranty data to Elite MGA API
 */
async function submitToEliteMGA(payload: any): Promise<EliteMGAResponse> {
  try {
    // For development/sandbox mode, simulate API response
    if (ELITE_MGA_API_KEY === 'sandbox-key' || process.env.NODE_ENV === 'development') {
      console.log('SANDBOX MODE: Simulating Elite MGA API response');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful response
      return {
        success: true,
        warrantyId: `EMGA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chargeId: `CHG-${Date.now()}`
      };
    }
    
    // Real API call to Elite MGA
    const response = await fetch(`${ELITE_MGA_API_URL}/warranties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELITE_MGA_API_KEY}`,
        'X-API-Version': '1.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Elite MGA API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      warrantyId: result.warrantyId,
      chargeId: result.chargeId
    };
    
  } catch (error) {
    console.error('Elite MGA API submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown API error'
    };
  }
}

/**
 * Get warranty status for a report
 */
export async function getWarrantyStatus(reportId: string): Promise<{
  hasWarranty: boolean;
  status?: string;
  warrantyId?: string;
  note?: string;
}> {
  try {
    const report = await storage.getInspectionReportById(reportId);
    
    if (!report || !report.warrantyOptIn) {
      return { hasWarranty: false };
    }
    
    return {
      hasWarranty: true,
      status: report.warrantyStatus || 'pending',
      warrantyId: report.warrantyExternalId || undefined,
      note: report.warrantyNote || undefined
    };
    
  } catch (error) {
    console.error(`Error getting warranty status for report ${reportId}:`, error);
    return { hasWarranty: false };
  }
}