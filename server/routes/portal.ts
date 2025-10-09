import type { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  inspectionReports,
  leadProfiles, 
  leadMatrix,
  consents,
  partners,
  statePartnerMappings,
  type InsertConsent,
  leadCategories
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Customer portal routes for lead opt-in and consent management
 */
export function registerPortalRoutes(app: Express): void {
  
  // Customer report viewing route with consent modal
  app.get('/portal/report/:id', (req: Request, res: Response) => {
    // For now, serve a simple HTML page that loads the React app
    // In production, this would be server-side rendered or redirect to the app
    const { id } = req.params;
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Inspection Report - AInspect</title>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Pass report ID to the React app
          window.__REPORT_ID__ = "${id}";
          window.__INITIAL_ROUTE__ = "/customer-report/${id}";
        </script>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
    `;
    
    res.send(html);
  });
  
  // Get default partners for a report's categories
  app.get('/api/portal/reports/:id/partners', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get report to determine state
      const report = await db
        .select({ state: leadProfiles.state })
        .from(leadProfiles)
        .where(eq(leadProfiles.reportId, id))
        .limit(1);

      if (report.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const state = report[0].state;
      const partnersData: Record<string, any> = {};

      // For each category, get the default partner
      for (const categoryKey of leadCategories) {
        const mapping = await db
          .select({
            partner: {
              id: partners.id,
              name: partners.name,
              category: partners.category,
              allowedChannels: partners.allowedChannels
            }
          })
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

        if (mapping.length > 0) {
          partnersData[categoryKey] = mapping[0].partner;
        }
      }

      res.json(partnersData);
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ error: 'Failed to fetch partners' });
    }
  });

  // Save customer opt-in preferences
  app.post('/api/portal/reports/:id/optin', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { categoryKey, partnerId, emailOptIn, phoneSmsOptIn, signature } = req.body;

      // Validate input
      if (!categoryKey || !partnerId || !signature) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get report info
      const report = await db
        .select()
        .from(inspectionReports)
        .where(eq(inspectionReports.id, id))
        .limit(1);

      if (report.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Update interest in lead matrix
      await db
        .update(leadMatrix)
        .set({ 
          isInterested: emailOptIn || phoneSmsOptIn,
          partnerId: partnerId,
          updatedAt: new Date()
        })
        .where(and(
          eq(leadMatrix.reportId, id),
          eq(leadMatrix.categoryKey, categoryKey)
        ));

      // Capture consent with full compliance logging
      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers['referer'] || '',
        timezone: req.headers['timezone'] || 'UTC',
        gpcSignal: req.headers['sec-gpc'] === '1',
        portalSessionId: req.sessionID || ''
      };

      const consentsToSave: InsertConsent[] = [];

      // Email consent (global_email type)
      if (emailOptIn) {
        consentsToSave.push({
          reportId: id,
          categoryKey: categoryKey,
          partnerId: partnerId,
          channel: 'email',
          consentType: 'global_email',
          consentTextVersion: 'v1.0', // TODO: Make this dynamic
          signature,
          ip: meta.ip,
          userAgent: meta.userAgent,
          referrer: meta.referrer,
          timezone: meta.timezone,
          gpcSignal: meta.gpcSignal,
          portalSessionId: meta.portalSessionId
        });
      }

      // Phone/SMS consent (one_to_one type - partner specific)
      if (phoneSmsOptIn) {
        for (const channel of ['phone', 'sms']) {
          consentsToSave.push({
            reportId: id,
            categoryKey: categoryKey,
            partnerId: partnerId,
            channel: channel as 'phone' | 'sms',
            consentType: 'one_to_one',
            consentTextVersion: 'v1.0', // TODO: Make this dynamic
            signature,
            ip: meta.ip,
            userAgent: meta.userAgent,
            referrer: meta.referrer,
            timezone: meta.timezone,
            gpcSignal: meta.gpcSignal,
            portalSessionId: meta.portalSessionId
          });
        }
      }

      // Save consents
      if (consentsToSave.length > 0) {
        await db.insert(consents).values(consentsToSave);
      }

      // TODO: Queue submission if eligible
      // await maybeQueueSubmission(id, categoryKey, partnerId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving opt-in:', error);
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  });

  // Get report for customer portal (secure access)
  app.get('/api/portal/reports/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query; // Secure access token

      // TODO: Validate access token
      // For now, just return the report if it exists

      const reportWithProfile = await db
        .select({
          report: inspectionReports,
          profile: leadProfiles
        })
        .from(inspectionReports)
        .leftJoin(leadProfiles, eq(leadProfiles.reportId, inspectionReports.id))
        .where(eq(inspectionReports.id, id))
        .limit(1);

      if (reportWithProfile.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const { report, profile } = reportWithProfile[0];

      res.json({
        report,
        profile,
        hasOptedIn: !!profile // Whether they've been through the opt-in flow
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });

  // Revoke consent (unsubscribe endpoint)
  app.post('/api/portal/unsubscribe', async (req: Request, res: Response) => {
    try {
      const { consentId, reason } = req.body;

      if (!consentId) {
        return res.status(400).json({ error: 'Consent ID required' });
      }

      // Mark consent as revoked
      await db
        .update(consents)
        .set({ 
          isRevoked: true, 
          revokedAt: new Date() 
        })
        .where(eq(consents.id, consentId));

      // TODO: Create revocation record
      // await db.insert(revocations).values({
      //   consentId,
      //   reason: reason || 'User request',
      //   method: 'unsubscribe_link',
      //   ipAddress: req.ip,
      //   userAgent: req.headers['user-agent']
      // });

      res.json({ success: true });
    } catch (error) {
      console.error('Error revoking consent:', error);
      res.status(500).json({ error: 'Failed to revoke consent' });
    }
  });
}