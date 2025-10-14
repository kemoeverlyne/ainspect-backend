import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  contractors,
  leads,
  leadDistributionRules,
  leadActivities,
  commissions,
  contractorMetrics,
  inspectionReports,
  type Contractor,
  type InsertContractor,
  type Lead,
  type InsertLead,
  type InsertLeadActivity,
  type InsertCommission
} from "@shared/schema";
import { eq, desc, and, or, sql, gte, lte, count, sum, avg } from "drizzle-orm";

// Lead distribution algorithms
class LeadDistributor {
  
  // Round Robin Distribution
  static async distributeRoundRobin(category: string, serviceAreas: string[]): Promise<string | null> {
    const availableContractors = await db
      .select()
      .from(contractors)
      .where(
        and(
          sql`${contractors.category} = ${category}`,
          eq(contractors.isActive, true)
        )
      )
      .orderBy(contractors.lastLeadDate); // Oldest lead date first
    
    if (availableContractors.length === 0) return null;
    
    // Filter by service area if provided
    const eligibleContractors = serviceAreas.length > 0 
      ? availableContractors.filter(contractor => {
          const areas = contractor.serviceAreas as string[] || [];
          return serviceAreas.some(area => areas.includes(area));
        })
      : availableContractors;
    
    return eligibleContractors.length > 0 ? eligibleContractors[0].id : null;
  }
  
  // Score-based Distribution
  static async distributeScoreBased(category: string, serviceAreas: string[]): Promise<string | null> {
    const rule = await db
      .select()
      .from(leadDistributionRules)
      .where(
        and(
          sql`${leadDistributionRules.category} = ${category}`,
          eq(leadDistributionRules.distributionMethod, 'score_based'),
          eq(leadDistributionRules.isActive, true)
        )
      )
      .limit(1);
    
    if (rule.length === 0) return this.distributeRoundRobin(category, serviceAreas);
    
    const weights = rule[0].scoringWeights as any || {
      rating: 0.3,
      conversionRate: 0.4,
      responseTime: 0.2,
      availability: 0.1
    };
    
    const availableContractors = await db
      .select()
      .from(contractors)
      .where(
        and(
          sql`${contractors.category} = ${category}`,
          eq(contractors.isActive, true)
        )
      );
    
    // Calculate scores for each contractor
    const scoredContractors = availableContractors.map(contractor => {
      const totalLeads = contractor.totalLeads ?? 0;
      const convertedLeads = contractor.convertedLeads ?? 0;
      const conversionRate = totalLeads > 0 
        ? (convertedLeads / totalLeads) * 100 
        : 0;
      
      const rating = contractor.rating ?? 0;
      const score = 
        (rating / 5) * weights.rating +
        (conversionRate / 100) * weights.conversionRate +
        (contractor.isPriority ? 1 : 0) * weights.availability;
      
      return { ...contractor, score };
    });
    
    // Sort by score descending
    scoredContractors.sort((a, b) => b.score - a.score);
    
    return scoredContractors.length > 0 ? scoredContractors[0].id : null;
  }
  
  // Priority List Distribution
  static async distributePriorityList(category: string): Promise<string | null> {
    const rule = await db
      .select()
      .from(leadDistributionRules)
      .where(
        and(
          sql`${leadDistributionRules.category} = ${category}`,
          eq(leadDistributionRules.distributionMethod, 'priority_list'),
          eq(leadDistributionRules.isActive, true)
        )
      )
      .limit(1);
    
    if (rule.length === 0) return this.distributeRoundRobin(category, []);
    
    const priorityIds = rule[0].priorityContractors as string[] || [];
    
    for (const contractorId of priorityIds) {
      const contractor = await db
        .select()
        .from(contractors)
        .where(
          and(
            eq(contractors.id, contractorId),
            eq(contractors.isActive, true)
          )
        )
        .limit(1);
      
      if (contractor.length > 0) {
        return contractor[0].id;
      }
    }
    
    return null;
  }
}

export function registerLeadManagementRoutes(app: Express) {
  
  // ============================================================================
  // CONTRACTOR MANAGEMENT
  // ============================================================================
  
  // Get all contractors with filtering and pagination
  app.get('/api/internal/contractors', async (req: Request, res: Response) => {
    try {
      const { category, active, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = db.select().from(contractors);
      
      const conditions = [];
      if (category) conditions.push(sql`${contractors.category} = ${category}`);
      if (active !== undefined) conditions.push(eq(contractors.isActive, active === 'true'));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const contractorList = await query
        .orderBy(desc(contractors.createdAt))
        .limit(Number(limit))
        .offset(offset);
      
      const total = await db
        .select({ count: count() })
        .from(contractors)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      res.json({
        contractors: contractorList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total[0].count,
          pages: Math.ceil(total[0].count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching contractors:', error);
      res.status(500).json({ message: 'Failed to fetch contractors' });
    }
  });
  
  // Create new contractor
  app.post('/api/internal/contractors', async (req: Request, res: Response) => {
    try {
      const contractorData = req.body as InsertContractor;
      
      const [newContractor] = await db
        .insert(contractors)
        .values(contractorData)
        .returning();
      
      res.status(201).json(newContractor);
    } catch (error) {
      console.error('Error creating contractor:', error);
      res.status(500).json({ message: 'Failed to create contractor' });
    }
  });
  
  // Update contractor
  app.patch('/api/internal/contractors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date();
      
      const [updatedContractor] = await db
        .update(contractors)
        .set(updates)
        .where(eq(contractors.id, id))
        .returning();
      
      if (!updatedContractor) {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      
      res.json(updatedContractor);
    } catch (error) {
      console.error('Error updating contractor:', error);
      res.status(500).json({ message: 'Failed to update contractor' });
    }
  });
  
  // Get contractor performance metrics
  app.get('/api/internal/contractors/:id/metrics', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { period } = req.query; // YYYY-MM format
      
      const metricsConditions = [eq(contractorMetrics.contractorId, id)];
      if (period) {
        metricsConditions.push(sql`${contractorMetrics.period} = ${period}`);
      }
      
      const metricsQuery = db
        .select()
        .from(contractorMetrics)
        .where(and(...metricsConditions));
      
      const metrics = await metricsQuery.orderBy(desc(contractorMetrics.period));
      
      // Get current period summary
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentMetrics = metrics.find(m => m.period === currentPeriod);
      
      // Get recent leads for this contractor
      const recentLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.contractorId, id))
        .orderBy(desc(leads.createdAt))
        .limit(10);
      
      res.json({
        contractor: await db.select().from(contractors).where(eq(contractors.id, id)).limit(1),
        currentMetrics,
        historicalMetrics: metrics,
        recentLeads
      });
    } catch (error) {
      console.error('Error fetching contractor metrics:', error);
      res.status(500).json({ message: 'Failed to fetch contractor metrics' });
    }
  });
  
  // ============================================================================
  // LEAD MANAGEMENT
  // ============================================================================
  
  // Get leads grouped by property
  app.get('/api/internal/leads/by-property', async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        category, 
        archived = 'false',
        page = 1, 
        limit = 20 
      } = req.query;
      
      const conditions = [];
      if (status && status !== 'all') conditions.push(sql`${leads.status} = ${status}`);
      if (category && category !== 'all') conditions.push(sql`${leads.category} = ${category}`);
      if (archived === 'true') {
        conditions.push(sql`${leads.status} = 'archived'`);
      } else {
        conditions.push(sql`${leads.status} != 'archived'`);
      }
      
      // Get leads with property grouping
      const leadsByProperty = await db
        .select({
          lead: leads,
          contractor: {
            id: contractors.id,
            companyName: contractors.companyName,
            contactName: contractors.contactName,
            email: contractors.email,
            phone: contractors.phone
          },
          inspection: {
            id: inspectionReports.id,
            propertyAddress: inspectionReports.propertyAddress,
            inspectionDate: inspectionReports.inspectionDate,
            inspectorName: inspectionReports.inspectorName
          }
        })
        .from(leads)
        .leftJoin(contractors, eq(leads.contractorId, contractors.id))
        .leftJoin(inspectionReports, eq(leads.inspectionReportId, inspectionReports.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(leads.createdAt));
      
      // Group by property
      const groupedByProperty = leadsByProperty.reduce((acc, item) => {
        const propertyKey = item.inspection?.propertyAddress || 'Unknown Property';
        if (!acc[propertyKey]) {
          acc[propertyKey] = {
            propertyAddress: propertyKey,
            inspectionId: item.inspection?.id,
            inspectionDate: item.inspection?.inspectionDate,
            inspectorName: item.inspection?.inspectorName,
            leads: [],
            totalValue: 0,
            categories: new Set()
          };
        }
        acc[propertyKey].leads.push({
          ...item.lead,
          contractor: item.contractor
        });
        acc[propertyKey].totalValue += item.lead.quoteAmount || 0;
        acc[propertyKey].categories.add(item.lead.category);
        return acc;
      }, {} as any);
      
      // Convert to array and add category counts
      const propertiesArray = Object.values(groupedByProperty).map((property: any) => ({
        ...property,
        categories: Array.from(property.categories),
        leadCount: property.leads.length
      }));
      
      res.json({
        properties: propertiesArray,
        totalProperties: propertiesArray.length
      });
    } catch (error) {
      console.error('Error fetching leads by property:', error);
      res.status(500).json({ message: 'Failed to fetch leads by property' });
    }
  });

  // Get all leads with filtering
  app.get('/api/internal/leads', async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        category, 
        contractor, 
        source, 
        flagged,
        archived = 'false',
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = db
        .select({
          lead: leads,
          contractor: {
            id: contractors.id,
            companyName: contractors.companyName,
            contactName: contractors.contactName,
            email: contractors.email,
            phone: contractors.phone
          }
        })
        .from(leads)
        .leftJoin(contractors, eq(leads.contractorId, contractors.id));
      
      const conditions = [];
      if (status && status !== 'all') conditions.push(sql`${leads.status} = ${status}`);
      if (category && category !== 'all') conditions.push(sql`${leads.category} = ${category}`);
      if (contractor) conditions.push(eq(leads.contractorId, contractor as string));
      if (source) conditions.push(eq(leads.source, source as string));
      if (flagged !== undefined) conditions.push(eq(leads.isFlagged, flagged === 'true'));
      if (archived === 'true') {
        conditions.push(sql`${leads.status} = 'archived'`);
      } else {
        conditions.push(sql`${leads.status} != 'archived'`);
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const sortColumn = leads[sortBy as keyof typeof leads];
      const leadsList = await query
        .orderBy(sortOrder === 'asc' ? sortColumn : desc(sortColumn))
        .limit(Number(limit))
        .offset(offset);
      
      const total = await db
        .select({ count: count() })
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      res.json({
        leads: leadsList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total[0].count,
          pages: Math.ceil(total[0].count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  });

  // Get leads by category across all properties
  app.get('/api/internal/leads/by-category', async (req: Request, res: Response) => {
    try {
      const { 
        category,
        archived = 'false',
        page = 1, 
        limit = 50 
      } = req.query;
      
      if (!category || category === 'all') {
        return res.status(400).json({ message: 'Category parameter is required' });
      }
      
      const conditions = [sql`${leads.category} = ${category}`];
      if (archived === 'true') {
        conditions.push(sql`${leads.status} = 'archived'`);
      } else {
        conditions.push(sql`${leads.status} != 'archived'`);
      }
      
      const categoryLeads = await db
        .select({
          lead: leads,
          contractor: {
            id: contractors.id,
            companyName: contractors.companyName,
            contactName: contractors.contactName,
            email: contractors.email,
            phone: contractors.phone
          },
          inspection: {
            id: inspectionReports.id,
            propertyAddress: inspectionReports.propertyAddress,
            inspectionDate: inspectionReports.inspectionDate,
            inspectorName: inspectionReports.inspectorName
          }
        })
        .from(leads)
        .leftJoin(contractors, eq(leads.contractorId, contractors.id))
        .leftJoin(inspectionReports, eq(leads.inspectionReportId, inspectionReports.id))
        .where(and(...conditions))
        .orderBy(desc(leads.createdAt))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
      
      const formattedLeads = categoryLeads.map(item => ({
        ...item.lead,
        contractor: item.contractor,
        inspection: item.inspection
      }));
      
      res.json({
        category: category,
        leads: formattedLeads,
        total: formattedLeads.length
      });
    } catch (error) {
      console.error('Error fetching leads by category:', error);
      res.status(500).json({ message: 'Failed to fetch leads by category' });
    }
  });

  // Batch process leads for auto-archiving
  app.post('/api/internal/leads/batch-process', async (req: Request, res: Response) => {
    try {
      const { action = 'auto_archive', daysOld = 30 } = req.body;
      
      if (action === 'auto_archive') {
        const cutoffDate = new Date(Date.now() - Number(daysOld) * 24 * 60 * 60 * 1000);
        
        // Find leads older than cutoff that are in 'won' status
        const leadsToArchive = await db
          .select()
          .from(leads)
          .where(
            and(
              sql`${leads.status} = 'won'`,
              lte(leads.createdAt, cutoffDate)
            )
          );
        
        if (leadsToArchive.length > 0) {
          // Update leads to archived status
          await db
            .update(leads)
            .set({ 
              status: 'archived',
              updatedAt: new Date()
            })
            .where(
              and(
                sql`${leads.status} = 'won'`,
                lte(leads.createdAt, cutoffDate)
              )
            );
          
          // Create audit log for batch archiving
          for (const lead of leadsToArchive) {
            await db.insert(leadActivities).values({
              leadId: lead.id,
              action: 'auto_archived',
              description: `Lead automatically archived after ${daysOld} days`,
              performedBy: 'system',
              performedAt: new Date()
            });
          }
        }
        
        res.json({
          message: `Successfully archived ${leadsToArchive.length} leads`,
          archivedCount: leadsToArchive.length,
          cutoffDate: cutoffDate
        });
      } else {
        res.status(400).json({ message: 'Invalid batch action' });
      }
    } catch (error) {
      console.error('Error in batch processing:', error);
      res.status(500).json({ message: 'Failed to process batch operation' });
    }
  });
  
  // Create new lead from inspection flag
  app.post('/api/internal/leads/from-inspection', async (req: Request, res: Response) => {
    try {
      const {
        inspectionReportId,
        category,
        serviceNeeded,
        priority = 'medium',
        description,
        estimatedValue
      } = req.body;
      
      // Get inspection details for customer info
      const [inspection] = await db
        .select()
        .from(inspectionReports)
        .where(eq(inspectionReports.id, inspectionReportId));
      
      if (!inspection) {
        return res.status(404).json({ message: 'Inspection report not found' });
      }
      
      // Create lead
      const leadData: InsertLead = {
        inspectionReportId,
        customerName: `${inspection.clientFirstName} ${inspection.clientLastName}`,
        propertyAddress: inspection.propertyAddress,
        category,
        serviceNeeded,
        priority,
        source: 'inspection_flagged',
        isFlagged: true,
        description,
        estimatedValue: estimatedValue ? Math.round(estimatedValue * 100) : undefined, // Convert to cents
        status: 'new'
      };
      
      const [newLead] = await db
        .insert(leads)
        .values(leadData)
        .returning();
      
      // Auto-assign contractor based on distribution rules
      const assignedContractorId = await LeadDistributor.distributeRoundRobin(
        category, 
        [inspection.propertyAddress.split(',').pop()?.trim() || ''] // Extract zip/area
      );
      
      if (assignedContractorId) {
        await db
          .update(leads)
          .set({ 
            contractorId: assignedContractorId, 
            assignedAt: new Date(),
            status: 'contacted'
          })
          .where(eq(leads.id, newLead.id));
        
        // Update contractor's last lead date and count
        await db
          .update(contractors)
          .set({ 
            lastLeadDate: new Date(),
            totalLeads: sql`${contractors.totalLeads} + 1`
          })
          .where(eq(contractors.id, assignedContractorId));
        
        // Log activity
        await db.insert(leadActivities).values({
          leadId: newLead.id,
          contractorId: assignedContractorId,
          activityType: 'assigned',
          description: `Lead automatically assigned via ${category} distribution`
        });
      }
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error('Error creating lead from inspection:', error);
      res.status(500).json({ message: 'Failed to create lead' });
    }
  });
  
  // Create referral lead (non-flagged)
  app.post('/api/internal/leads/referral', async (req: Request, res: Response) => {
    try {
      const leadData = req.body as InsertLead;
      leadData.isFlagged = false;
      leadData.source = 'inspection_referral';
      
      const [newLead] = await db
        .insert(leads)
        .values(leadData)
        .returning();
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error('Error creating referral lead:', error);
      res.status(500).json({ message: 'Failed to create referral lead' });
    }
  });
  
  // Update lead status and track conversion
  app.patch('/api/internal/leads/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date();
      
      // Handle status changes with timestamps
      if (updates.status) {
        switch (updates.status) {
          case 'contacted':
            updates.contactedAt = new Date();
            break;
          case 'quoted':
            updates.quotedAt = new Date();
            break;
          case 'won':
            updates.wonAt = new Date();
            break;
        }
      }
      
      const [updatedLead] = await db
        .update(leads)
        .set(updates)
        .where(eq(leads.id, id))
        .returning();
      
      if (!updatedLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      // If lead is won, create commission record
      if (updates.status === 'won' && updates.quoteAmount && updatedLead.contractorId) {
        const contractor = await db
          .select()
          .from(contractors)
          .where(eq(contractors.id, updatedLead.contractorId))
          .limit(1);
        
        if (contractor.length > 0) {
          const commissionAmount = Math.round(
            (updates.quoteAmount * contractor[0].commissionRate) / 100
          );
          
          await db.insert(commissions).values({
            leadId: id,
            contractorId: updatedLead.contractorId,
            amount: commissionAmount,
            rate: contractor[0].commissionRate,
            jobValue: updates.quoteAmount,
            status: 'pending',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          });
          
          // Update contractor's converted leads count
          await db
            .update(contractors)
            .set({ 
              convertedLeads: sql`${contractors.convertedLeads} + 1`,
              totalCommission: sql`${contractors.totalCommission} + ${commissionAmount}`
            })
            .where(eq(contractors.id, updatedLead.contractorId));
        }
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'Failed to update lead' });
    }
  });
  
  // Get lead activities and communication log
  app.get('/api/internal/leads/:id/activities', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const activities = await db
        .select({
          activity: leadActivities,
          contractor: {
            companyName: contractors.companyName,
            contactName: contractors.contactName
          }
        })
        .from(leadActivities)
        .leftJoin(contractors, eq(leadActivities.contractorId, contractors.id))
        .where(eq(leadActivities.leadId, id))
        .orderBy(desc(leadActivities.createdAt));
      
      res.json(activities);
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      res.status(500).json({ message: 'Failed to fetch lead activities' });
    }
  });
  
  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================
  
  // Get lead generation analytics dashboard
  app.get('/api/internal/analytics/dashboard', async (req: Request, res: Response) => {
    try {
      const { period = '30' } = req.query; // days
      const periodDate = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);
      
      // Lead statistics
      const leadStats = await db
        .select({
          total: count(),
          flagged: sum(sql`CASE WHEN is_flagged = true THEN 1 ELSE 0 END`),
          referrals: sum(sql`CASE WHEN is_flagged = false THEN 1 ELSE 0 END`),
          won: sum(sql`CASE WHEN status = 'won' THEN 1 ELSE 0 END`),
          totalValue: sum(leads.quoteAmount)
        })
        .from(leads)
        .where(gte(leads.createdAt, periodDate));
      
      // Category breakdown
      const categoryBreakdown = await db
        .select({
          category: leads.category,
          count: count(),
          won: sum(sql`CASE WHEN status = 'won' THEN 1 ELSE 0 END`),
          totalValue: sum(leads.quoteAmount)
        })
        .from(leads)
        .where(gte(leads.createdAt, periodDate))
        .groupBy(leads.category);
      
      // Top performing contractors
      const topContractors = await db
        .select({
          contractor: contractors.companyName,
          leadsReceived: count(),
          conversionRate: sql<number>`(SUM(CASE WHEN ${leads.status} = 'won' THEN 1 ELSE 0 END) * 100.0 / COUNT(*))`,
          totalCommission: sum(commissions.amount)
        })
        .from(contractors)
        .leftJoin(leads, eq(contractors.id, leads.contractorId))
        .leftJoin(commissions, eq(leads.id, commissions.leadId))
        .where(gte(leads.createdAt, periodDate))
        .groupBy(contractors.id, contractors.companyName)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);
      
      // Conversion funnel
      const conversionFunnel = await db
        .select({
          status: leads.status,
          count: count()
        })
        .from(leads)
        .where(gte(leads.createdAt, periodDate))
        .groupBy(leads.status);
      
      res.json({
        leadStats: leadStats[0],
        categoryBreakdown,
        topContractors,
        conversionFunnel,
        period: Number(period)
      });
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });
  
  // Get commission summary
  app.get('/api/internal/analytics/commissions', async (req: Request, res: Response) => {
    try {
      const { status = 'all', period = '30' } = req.query;
      const periodDate = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);
      
      let query = db
        .select({
          commission: commissions,
          contractor: {
            companyName: contractors.companyName,
            contactName: contractors.contactName
          },
          lead: {
            customerName: leads.customerName,
            category: leads.category,
            serviceNeeded: leads.serviceNeeded
          }
        })
        .from(commissions)
        .leftJoin(contractors, eq(commissions.contractorId, contractors.id))
        .leftJoin(leads, eq(commissions.leadId, leads.id))
        .where(gte(commissions.createdAt, periodDate));
      
      if (status !== 'all') {
        query = query.where(eq(commissions.status, status as string));
      }
      
      const commissionList = await query.orderBy(desc(commissions.createdAt));
      
      // Summary statistics
      const summary = await db
        .select({
          total: count(),
          pending: sum(sql`CASE WHEN status = 'pending' THEN amount ELSE 0 END`),
          approved: sum(sql`CASE WHEN status = 'approved' THEN amount ELSE 0 END`),
          paid: sum(sql`CASE WHEN status = 'paid' THEN amount ELSE 0 END`),
          totalAmount: sum(commissions.amount)
        })
        .from(commissions)
        .where(gte(commissions.createdAt, periodDate));
      
      res.json({
        commissions: commissionList,
        summary: summary[0]
      });
    } catch (error) {
      console.error('Error fetching commission data:', error);
      res.status(500).json({ message: 'Failed to fetch commission data' });
    }
  });
}