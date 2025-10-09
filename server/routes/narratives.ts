import { Router } from 'express';
import { z } from 'zod';
import { narrativeService } from '../services/narratives';
import { extractVariablesForFinding } from '../ai/narrativeVars';
import { db } from '../db';
import { findings, narratives } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Validation schemas
const createNarrativeSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  category: z.enum(['ROOFING', 'HVAC', 'PLUMBING', 'ELECTRICAL', 'EXTERIOR', 'INTERIOR', 'OTHER']),
  component: z.string().optional(),
  severity: z.enum(['MAJOR', 'SAFETY', 'MINOR', 'INFO']).optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().default('en-US'),
});

const updateNarrativeSchema = createNarrativeSchema.partial();

const applyNarrativeSchema = z.object({
  narrativeId: z.string().uuid(),
  variables: z.record(z.any()).optional(),
});

const narrativeSettingsSchema = z.object({
  autoApplyNarratives: z.boolean().optional(),
  autoApplyThreshold: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  component: z.string().optional(),
  tags: z.array(z.string()).optional(),
  severity: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// Middleware to get company ID from user (assuming company-scoped auth)
function getCompanyId(req: any): string {
  // This would need to be implemented based on your auth system
  // For now, we'll use a placeholder - replace with actual implementation
  return req.user?.companyId || req.headers['x-company-id'] || 'default-company';
}

// Create narrative
router.post('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const data = createNarrativeSchema.parse(req.body);
    
    const narrative = await narrativeService.createNarrative({
      ...data,
      companyId,
      createdBy: req.user?.id,
    });
    
    res.json(narrative);
  } catch (error) {
    console.error('Create narrative error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create narrative' });
  }
});

// List narratives with filtering
router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const params = querySchema.parse(req.query);
    
    const result = await narrativeService.listNarratives({
      companyId,
      ...params,
    });
    
    res.json(result);
  } catch (error) {
    console.error('List narratives error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to fetch narratives' });
  }
});

// Update narrative
router.patch('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const data = updateNarrativeSchema.parse(req.body);
    
    const narrative = await narrativeService.updateNarrative(id, companyId, data);
    
    if (!narrative) {
      return res.status(404).json({ error: 'Narrative not found' });
    }
    
    res.json(narrative);
  } catch (error) {
    console.error('Update narrative error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update narrative' });
  }
});

// Delete (deactivate) narrative
router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    
    const success = await narrativeService.deleteNarrative(id, companyId);
    
    if (!success) {
      return res.status(404).json({ error: 'Narrative not found' });
    }
    
    res.json({ message: 'Narrative deactivated successfully' });
  } catch (error) {
    console.error('Delete narrative error:', error);
    res.status(500).json({ error: 'Failed to delete narrative' });
  }
});

// Get narrative suggestions for a finding
router.post('/:findingId/suggest', async (req, res) => {
  try {
    const { findingId } = req.params;
    const companyId = getCompanyId(req);
    
    // Verify finding exists and belongs to company
    const [finding] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, findingId));
      
    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const suggestions = await narrativeService.suggestForFinding(findingId);
    
    res.json(suggestions);
  } catch (error) {
    console.error('Suggest narratives error:', error);
    res.status(500).json({ error: 'Failed to get narrative suggestions' });
  }
});

// Apply narrative to finding
router.post('/:findingId/apply', async (req, res) => {
  try {
    const { findingId } = req.params;
    const data = applyNarrativeSchema.parse(req.body);
    const companyId = getCompanyId(req);
    
    // Verify finding exists
    const [finding] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, findingId));
      
    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    // Verify narrative belongs to company
    const [narrative] = await db
      .select()
      .from(narratives)
      .where(eq(narratives.id, data.narrativeId));
      
    if (!narrative || narrative.companyId !== companyId) {
      return res.status(404).json({ error: 'Narrative not found' });
    }

    const updatedFinding = await narrativeService.applyToFinding({
      findingId,
      narrativeId: data.narrativeId,
      variables: data.variables,
      mode: 'manual',
      userId: req.user?.id,
    });
    
    res.json(updatedFinding);
  } catch (error) {
    console.error('Apply narrative error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to apply narrative' });
  }
});

// Get company narrative settings
router.get('/settings', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const settings = await narrativeService.getNarrativeSettings(companyId);
    res.json(settings);
  } catch (error) {
    console.error('Get narrative settings error:', error);
    res.status(500).json({ error: 'Failed to get narrative settings' });
  }
});

// Update company narrative settings
router.patch('/settings', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const data = narrativeSettingsSchema.parse(req.body);
    
    const settings = await narrativeService.updateNarrativeSettings(companyId, data);
    res.json(settings);
  } catch (error) {
    console.error('Update narrative settings error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update narrative settings' });
  }
});

// Bulk import narratives (for seeding/migration)
router.post('/bulk-import', async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const narrativesData = z.array(createNarrativeSchema).parse(req.body);
    
    await narrativeService.seedNarratives(companyId, narrativesData);
    
    res.json({ message: `Successfully imported ${narrativesData.length} narratives` });
  } catch (error) {
    console.error('Bulk import error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid narratives data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to import narratives' });
  }
});

// Extract variables from text (utility endpoint)
router.post('/extract-variables', async (req, res) => {
  try {
    const { title, summary, sectionName, structuredData } = req.body;
    
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }
    
    const variables = extractVariablesForFinding(title, summary, sectionName, structuredData);
    res.json(variables);
  } catch (error) {
    console.error('Extract variables error:', error);
    res.status(500).json({ error: 'Failed to extract variables' });
  }
});

// Render narrative template (utility endpoint)
router.post('/render', async (req, res) => {
  try {
    const { body, variables } = req.body;
    
    if (!body) {
      return res.status(400).json({ error: 'Template body is required' });
    }
    
    const rendered = narrativeService.renderNarrative(body, variables || {});
    res.json({ rendered });
  } catch (error) {
    console.error('Render narrative error:', error);
    res.status(500).json({ error: 'Failed to render narrative' });
  }
});

export default router;