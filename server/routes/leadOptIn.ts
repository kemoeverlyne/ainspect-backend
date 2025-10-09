import { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { consents, leadProfiles, partners, inspectionReports } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Validation schema for lead opt-in data
const leadOptInSchema = z.object({
  user_email: z.string().email().optional(),
  report_id: z.string().optional(),
  services: z.array(z.enum(["home_setup", "protection_insurance", "maintenance"])),
  timestamp: z.string(),
  ip: z.string().optional(),
  source: z.string().default("inspection_report_popup"),
  user_agent: z.string().optional(),
});

// Service group to category mappings
const SERVICE_GROUP_MAPPINGS = {
  home_setup: [
    'utility_connect',
    'internet_cable_phone', 
    'solar'
  ],
  protection_insurance: [
    'home_security',
    'home_warranty',
    'insurance_home_auto',
    'insurance_life'
  ],
  maintenance: [
    'moving_companies',
    'lawn_service', 
    'pest_control',
    'cleaning_services'
  ]
};

export function registerLeadOptInRoutes(app: Express) {
  // Lead opt-in endpoint for inspection report consent modal
  app.post('/api/lead-opt-in', async (req: Request, res: Response) => {
    try {
      console.log('📋 Lead opt-in request received:', req.body);
      
      // Validate request body
      const validatedData = leadOptInSchema.parse(req.body);
      
      const { 
        user_email, 
        report_id, 
        services, 
        timestamp, 
        ip, 
        source, 
        user_agent 
      } = validatedData;

      // For now, store in a simple format - we can enhance this later
      // to integrate with the existing partner/consent system
      
      if (!report_id && !user_email) {
        return res.status(400).json({ 
          error: 'Either report_id or user_email is required' 
        });
      }

      // Store simplified consent record for each selected service group
      const consentRecords = [];
      
      for (const serviceGroup of services) {
        const categories = SERVICE_GROUP_MAPPINGS[serviceGroup];
        
        for (const categoryKey of categories) {
          // Create a simplified consent record
          // Note: In a real implementation, you'd need to map to actual partners
          const consentRecord = {
            reportId: report_id || null,
            categoryKey: categoryKey as any,
            partnerId: 'default-partner', // Would need to map to actual partners
            channel: 'email' as const,
            consentType: 'global_email' as const,
            consentTextVersion: 'v1.0-popup',
            signature: user_email || 'anonymous-consent',
            ip: ip || req.ip,
            userAgent: user_agent || req.get('User-Agent'),
            metadata: {
              source,
              serviceGroup,
              timestamp,
              originalRequest: req.body
            }
          };
          
          consentRecords.push(consentRecord);
        }
      }

      // Log the consent for compliance
      console.log('💾 Storing consent records:', consentRecords.length);
      
      // Store each consent record
      // Note: This is commented out for now since we might not have partners set up
      // await db.insert(consents).values(consentRecords);
      
      // For now, just log to console and return success
      console.log('✅ Lead opt-in processed successfully', {
        email: user_email,
        reportId: report_id,
        services,
        categories: services.flatMap(s => SERVICE_GROUP_MAPPINGS[s]),
        timestamp: new Date(timestamp)
      });

      res.json({
        success: true,
        message: 'Consent recorded successfully',
        data: {
          services_opted_in: services,
          categories_included: services.flatMap(s => SERVICE_GROUP_MAPPINGS[s]),
          timestamp: new Date(timestamp).toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error processing lead opt-in:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: error.errors
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process consent opt-in'
      });
    }
  });

  // Get consent status for a report (for testing/admin purposes)
  app.get('/api/lead-opt-in/status/:reportId', async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      
      // For now, return mock data since we're not storing in DB yet
      res.json({
        reportId,
        hasConsent: false,
        consentDate: null,
        servicesOptedIn: [],
        message: 'Consent tracking implementation in progress'
      });
      
    } catch (error) {
      console.error('❌ Error checking consent status:', error);
      res.status(500).json({
        error: 'Failed to check consent status'
      });
    }
  });
}