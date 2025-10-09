import type { Express } from "express";
import express from "express";
import { db } from "./db";
import { 
  contractorPortal, 
  contractorAds, 
  contractorPayments, 
  contractorLeadPurchases,
  leads,
  insertContractorPortalSchema,
  insertContractorAdSchema,
  insertContractorPaymentSchema,
  insertContractorLeadPurchaseSchema
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  validateContractorEmail,
  validateContractorPassword,
  hashContractorPassword,
  compareContractorPassword,
  generateContractorToken,
  getContractorByEmail,
  getContractorById,
  createContractor,
  authenticateContractorToken,
  type ContractorAuthenticatedRequest
} from "./contractor-auth";

export function registerContractorRoutes(app: Express) {
  
  // ============================================================================
  // CONTRACTOR AUTHENTICATION ROUTES
  // ============================================================================

  // Contractor registration
  app.post('/api/contractors/register', async (req, res) => {
    try {
      const { name, email, password, companyName, phone, website, licenseNumber } = req.body;

      // Validate required fields
      if (!name || !email || !password || !companyName) {
        return res.status(400).json({ 
          message: 'Name, email, password, and company name are required' 
        });
      }

      // Validate email format
      if (!validateContractorEmail(email)) {
        return res.status(400).json({ 
          message: 'Invalid email format' 
        });
      }

      // Validate password strength
      const passwordValidation = validateContractorPassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Password validation failed',
          errors: passwordValidation.errors 
        });
      }

      // Check if contractor already exists
      const existingContractor = await getContractorByEmail(email);
      if (existingContractor) {
        return res.status(409).json({ 
          message: 'Contractor with this email already exists' 
        });
      }

      // Hash password and create contractor
      const passwordHash = await hashContractorPassword(password);
      const contractor = await createContractor({
        name,
        email,
        passwordHash,
        companyName,
        phone,
        website,
        licenseNumber
      });

      // Generate JWT token
      const token = generateContractorToken(contractor.id, contractor.email);

      // Set secure cookie
      res.cookie('contractorToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        message: 'Contractor registered successfully',
        contractor: {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          companyName: contractor.companyName,
          creditsBalance: contractor.creditsBalance,
          isActive: contractor.isActive
        }
      });

    } catch (error) {
      console.error('Contractor registration error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  });

  // Contractor login
  app.post('/api/contractors/login', express.json(), async (req, res) => {
    try {
      // Log the request body for debugging
      console.log('Contractor login request body:', req.body);
      
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          message: 'Invalid JSON payload' 
        });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email and password are required' 
        });
      }

      // Find contractor by email
      const contractor = await getContractorByEmail(email);
      if (!contractor) {
        return res.status(401).json({ 
          message: 'Invalid email or password' 
        });
      }

      // Check if contractor is active
      if (!contractor.isActive) {
        return res.status(403).json({ 
          message: 'Contractor account is inactive' 
        });
      }

      // Verify password
      const passwordMatch = await compareContractorPassword(password, contractor.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ 
          message: 'Invalid email or password' 
        });
      }

      // Generate JWT token
      const token = generateContractorToken(contractor.id, contractor.email);

      // Set secure cookie
      res.cookie('contractorToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        message: 'Login successful',
        contractor: {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          companyName: contractor.companyName,
          creditsBalance: contractor.creditsBalance,
          isActive: contractor.isActive
        }
      });

    } catch (error) {
      console.error('Contractor login error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  });

  // Contractor logout
  app.post('/api/contractors/logout', (req, res) => {
    res.clearCookie('contractorToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Get contractor profile
  app.get('/api/contractors/me', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const contractor = await getContractorById(req.contractor!.id);
      if (!contractor) {
        return res.status(404).json({ message: 'Contractor not found' });
      }

      res.json({
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        companyName: contractor.companyName,
        phone: contractor.phone,
        website: contractor.website,
        licenseNumber: contractor.licenseNumber,
        serviceAreas: contractor.serviceAreas,
        creditsBalance: contractor.creditsBalance,
        isActive: contractor.isActive,
        createdAt: contractor.createdAt
      });

    } catch (error) {
      console.error('Get contractor profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // ============================================================================
  // CONTRACTOR ADS MANAGEMENT ROUTES
  // ============================================================================

  // Get contractor's ads
  app.get('/api/contractors/ads', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const ads = await db.select()
        .from(contractorAds)
        .where(eq(contractorAds.contractorId, req.contractor!.id))
        .orderBy(desc(contractorAds.createdAt));

      res.json(ads);

    } catch (error) {
      console.error('Get contractor ads error:', error);
      res.status(500).json({ message: 'Failed to fetch ads' });
    }
  });

  // Create contractor ad
  app.post('/api/contractors/ads', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const { name, targetingParams, budget, costPerLead } = req.body;

      // Validate required fields
      if (!name || !targetingParams || !budget || !costPerLead) {
        return res.status(400).json({ 
          message: 'Name, targeting parameters, budget, and cost per lead are required' 
        });
      }

      // Validate budget and cost per lead are positive integers
      if (budget <= 0 || costPerLead <= 0) {
        return res.status(400).json({ 
          message: 'Budget and cost per lead must be positive values' 
        });
      }

      // Check if contractor has sufficient credits for the budget
      const contractor = await getContractorById(req.contractor!.id);
      if (!contractor) {
        return res.status(404).json({ message: 'Contractor not found' });
      }

      if (contractor.creditsBalance < budget) {
        return res.status(400).json({ 
          message: 'Insufficient credits balance for this budget' 
        });
      }

      // Create the ad
      const adData = {
        contractorId: req.contractor!.id,
        name,
        targetingParams,
        budget,
        costPerLead,
        status: 'active' as const
      };

      const ads = await db.insert(contractorAds).values(adData).returning();
      const ad = ads[0];

      res.status(201).json(ad);

    } catch (error) {
      console.error('Create contractor ad error:', error);
      res.status(500).json({ message: 'Failed to create ad' });
    }
  });

  // Update contractor ad
  app.put('/api/contractors/ads/:id', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name, targetingParams, budget, costPerLead, status } = req.body;

      // Verify the ad belongs to the contractor
      const existingAds = await db.select()
        .from(contractorAds)
        .where(and(
          eq(contractorAds.id, id),
          eq(contractorAds.contractorId, req.contractor!.id)
        ));

      if (existingAds.length === 0) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      // Update the ad
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (targetingParams !== undefined) updateData.targetingParams = targetingParams;
      if (budget !== undefined) updateData.budget = budget;
      if (costPerLead !== undefined) updateData.costPerLead = costPerLead;
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = new Date();

      const updatedAds = await db.update(contractorAds)
        .set(updateData)
        .where(eq(contractorAds.id, id))
        .returning();

      res.json(updatedAds[0]);

    } catch (error) {
      console.error('Update contractor ad error:', error);
      res.status(500).json({ message: 'Failed to update ad' });
    }
  });

  // Delete contractor ad
  app.delete('/api/contractors/ads/:id', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Verify the ad belongs to the contractor
      const existingAds = await db.select()
        .from(contractorAds)
        .where(and(
          eq(contractorAds.id, id),
          eq(contractorAds.contractorId, req.contractor!.id)
        ));

      if (existingAds.length === 0) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      // Deactivate the ad instead of deleting
      await db.update(contractorAds)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(contractorAds.id, id));

      res.json({ message: 'Ad deactivated successfully' });

    } catch (error) {
      console.error('Delete contractor ad error:', error);
      res.status(500).json({ message: 'Failed to deactivate ad' });
    }
  });

  // ============================================================================
  // CONTRACTOR PAYMENTS ROUTES
  // ============================================================================

  // Get contractor's payment history
  app.get('/api/contractors/payments', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const payments = await db.select()
        .from(contractorPayments)
        .where(eq(contractorPayments.contractorId, req.contractor!.id))
        .orderBy(desc(contractorPayments.createdAt));

      res.json(payments);

    } catch (error) {
      console.error('Get contractor payments error:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  // Create payment intent (Stripe integration placeholder)
  app.post('/api/contractors/pay', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          message: 'Valid amount is required' 
        });
      }

      // For now, simulate successful payment
      // In production, this would integrate with Stripe
      const paymentData = {
        contractorId: req.contractor!.id,
        amount,
        currency,
        status: 'succeeded' as const,
        creditsAdded: amount, // 1:1 ratio for simplicity
        stripePaymentIntentId: `pi_mock_${Date.now()}`
      };

      const payments = await db.insert(contractorPayments).values(paymentData).returning();
      const payment = payments[0];

      // Update contractor's credits balance
      await db.update(contractorPortal)
        .set({ 
          creditsBalance: sql`${contractorPortal.creditsBalance} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(contractorPortal.id, req.contractor!.id));

      res.status(201).json({
        payment,
        message: 'Payment processed successfully',
        creditsAdded: amount
      });

    } catch (error) {
      console.error('Process contractor payment error:', error);
      res.status(500).json({ message: 'Failed to process payment' });
    }
  });

  // ============================================================================
  // CONTRACTOR LEADS ROUTES
  // ============================================================================

  // Get contractor's purchased leads
  app.get('/api/contractors/leads', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const purchasedLeads = await db.select({
        id: contractorLeadPurchases.id,
        leadId: contractorLeadPurchases.leadId,
        costPaid: contractorLeadPurchases.costPaid,
        purchasedAt: contractorLeadPurchases.purchasedAt,
        contactedAt: contractorLeadPurchases.contactedAt,
        convertedAt: contractorLeadPurchases.convertedAt,
        status: contractorLeadPurchases.status,
        // Lead details
        lead: {
          id: leads.id,
          customerName: leads.customerName,
          customerEmail: leads.customerEmail,
          customerPhone: leads.customerPhone,
          propertyAddress: leads.propertyAddress,
          category: leads.category,
          priority: leads.priority,
          description: leads.description,
          estimatedValue: leads.estimatedValue,
          createdAt: leads.createdAt
        }
      })
      .from(contractorLeadPurchases)
      .innerJoin(leads, eq(contractorLeadPurchases.leadId, leads.id))
      .where(eq(contractorLeadPurchases.contractorId, req.contractor!.id))
      .orderBy(desc(contractorLeadPurchases.purchasedAt))
      .limit(limit)
      .offset(offset);

      // Get total count for pagination
      const totalCount = await db.select({ count: sql`count(*)` })
        .from(contractorLeadPurchases)
        .where(eq(contractorLeadPurchases.contractorId, req.contractor!.id));

      res.json({
        leads: purchasedLeads,
        pagination: {
          page,
          limit,
          total: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / limit)
        }
      });

    } catch (error) {
      console.error('Get contractor leads error:', error);
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  });

  // Update lead status (contacted, converted)
  app.put('/api/contractors/leads/:id/status', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['contacted', 'converted', 'declined'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be: contacted, converted, or declined' 
        });
      }

      // Verify the lead purchase belongs to the contractor
      const existingPurchases = await db.select()
        .from(contractorLeadPurchases)
        .where(and(
          eq(contractorLeadPurchases.id, id),
          eq(contractorLeadPurchases.contractorId, req.contractor!.id)
        ));

      if (existingPurchases.length === 0) {
        return res.status(404).json({ message: 'Lead purchase not found' });
      }

      // Update the status and timestamp
      const updateData: any = { status };
      if (status === 'contacted') {
        updateData.contactedAt = new Date();
      } else if (status === 'converted') {
        updateData.convertedAt = new Date();
        if (!existingPurchases[0].contactedAt) {
          updateData.contactedAt = new Date();
        }
      }

      const updatedPurchases = await db.update(contractorLeadPurchases)
        .set(updateData)
        .where(eq(contractorLeadPurchases.id, id))
        .returning();

      res.json(updatedPurchases[0]);

    } catch (error) {
      console.error('Update lead status error:', error);
      res.status(500).json({ message: 'Failed to update lead status' });
    }
  });

  // ============================================================================
  // CONTRACTOR DASHBOARD STATS
  // ============================================================================

  // Get contractor dashboard statistics
  app.get('/api/contractors/stats', authenticateContractorToken, async (req: ContractorAuthenticatedRequest, res) => {
    try {
      const contractorId = req.contractor!.id;

      // Get basic stats
      const [
        totalLeadsPurchased,
        activeAdsCount,
        totalSpent,
        leadsContacted,
        leadsConverted
      ] = await Promise.all([
        db.select({ count: sql`count(*)` })
          .from(contractorLeadPurchases)
          .where(eq(contractorLeadPurchases.contractorId, contractorId)),
        
        db.select({ count: sql`count(*)` })
          .from(contractorAds)
          .where(and(
            eq(contractorAds.contractorId, contractorId),
            eq(contractorAds.status, 'active')
          )),
        
        db.select({ total: sql`sum(${contractorLeadPurchases.costPaid})` })
          .from(contractorLeadPurchases)
          .where(eq(contractorLeadPurchases.contractorId, contractorId)),
        
        db.select({ count: sql`count(*)` })
          .from(contractorLeadPurchases)
          .where(and(
            eq(contractorLeadPurchases.contractorId, contractorId),
            eq(contractorLeadPurchases.status, 'contacted')
          )),
        
        db.select({ count: sql`count(*)` })
          .from(contractorLeadPurchases)
          .where(and(
            eq(contractorLeadPurchases.contractorId, contractorId),
            eq(contractorLeadPurchases.status, 'converted')
          ))
      ]);

      res.json({
        totalLeadsPurchased: Number(totalLeadsPurchased[0].count),
        activeAdsCount: Number(activeAdsCount[0].count),
        totalSpent: Number(totalSpent[0].total || 0),
        leadsContacted: Number(leadsContacted[0].count),
        leadsConverted: Number(leadsConverted[0].count),
        creditsBalance: req.contractor!.creditsBalance,
        conversionRate: Number(totalLeadsPurchased[0].count) > 0 
          ? (Number(leadsConverted[0].count) / Number(totalLeadsPurchased[0].count) * 100).toFixed(1)
          : '0.0'
      });

    } catch (error) {
      console.error('Get contractor stats error:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });
}