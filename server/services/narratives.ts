import { db } from '../db';
import { narratives, findings, narrativeSuggestions, narrativeChoices, narrativeSettings } from '@shared/schema';
import { eq, and, desc, sql, ilike, inArray } from 'drizzle-orm';
import type { 
  Narrative, InsertNarrative, Finding, InsertFinding, 
  NarrativeSuggestion, InsertNarrativeSuggestion,
  NarrativeChoice, InsertNarrativeChoice,
  NarrativeSetting, InsertNarrativeSetting 
} from '@shared/schema';

// Category mapping for section names to lead categories
const SECTION_TO_CATEGORY_MAP: Record<string, string> = {
  'roofing': 'ROOFING',
  'plumbing': 'PLUMBING', 
  'hvac': 'HVAC',
  'electrical': 'ELECTRICAL',
  'exterior': 'EXTERIOR',
  'grounds': 'EXTERIOR',
  'interior': 'INTERIOR',
  'bathroom': 'INTERIOR',
  'kitchen': 'INTERIOR',
  'rooms': 'INTERIOR',
  'bedrooms': 'INTERIOR',
  'garage': 'EXTERIOR'
};

interface NarrativeSearchParams {
  companyId: string;
  search?: string;
  category?: string;
  component?: string;
  tags?: string[];
  severity?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

interface SuggestionResult {
  narrative: Narrative;
  score: number;
  variables: Record<string, any>;
}

export class NarrativeService {
  
  // CRUD Operations
  async createNarrative(data: InsertNarrative): Promise<Narrative> {
    const [narrative] = await db
      .insert(narratives)
      .values({
        ...data,
        placeholders: this.extractPlaceholders(data.body),
      })
      .returning();
    return narrative;
  }

  async updateNarrative(id: string, companyId: string, data: Partial<InsertNarrative>): Promise<Narrative | null> {
    const [narrative] = await db
      .update(narratives)
      .set({
        ...data,
        ...(data.body ? { placeholders: this.extractPlaceholders(data.body) } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(narratives.id, id), eq(narratives.companyId, companyId)))
      .returning();
    return narrative || null;
  }

  async deleteNarrative(id: string, companyId: string): Promise<boolean> {
    const [updated] = await db
      .update(narratives)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(narratives.id, id), eq(narratives.companyId, companyId)))
      .returning();
    return !!updated;
  }

  async listNarratives(params: NarrativeSearchParams): Promise<{ narratives: Narrative[]; total: number }> {
    let query = db.select().from(narratives).where(eq(narratives.companyId, params.companyId));
    
    // Apply filters
    const conditions = [eq(narratives.companyId, params.companyId)];
    
    if (params.isActive !== undefined) {
      conditions.push(eq(narratives.isActive, params.isActive));
    }
    
    if (params.category) {
      conditions.push(eq(narratives.category, params.category));
    }
    
    if (params.component) {
      conditions.push(ilike(narratives.component, `%${params.component}%`));
    }
    
    if (params.severity) {
      conditions.push(eq(narratives.severity, params.severity));
    }
    
    if (params.search) {
      conditions.push(
        sql`(${narratives.title} ILIKE ${`%${params.search}%`} OR ${narratives.body} ILIKE ${`%${params.search}%`})`
      );
    }

    const finalQuery = query
      .where(and(...conditions))
      .orderBy(desc(narratives.updatedAt))
      .limit(params.limit || 50)
      .offset(params.offset || 0);

    const results = await finalQuery;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(narratives)
      .where(and(...conditions));

    return { narratives: results, total: count };
  }

  // Suggestion and matching logic
  async suggestForFinding(findingId: string): Promise<SuggestionResult[]> {
    const [finding] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, findingId));
    
    if (!finding) {
      throw new Error('Finding not found');
    }

    // Determine category from section name
    const category = SECTION_TO_CATEGORY_MAP[finding.sectionName?.toLowerCase() || ''] || 'OTHER';
    
    // Build search candidates
    const candidates = await db
      .select()
      .from(narratives)
      .where(and(
        eq(narratives.isActive, true),
        eq(narratives.category, category)
      ))
      .orderBy(desc(narratives.useCount));

    // Score each candidate
    const scored = candidates.map(narrative => {
      const score = this.calculateScore(finding, narrative);
      const variables = this.extractVariablesFromFinding(finding);
      return { narrative, score, variables };
    });

    // Sort by score and return top 5
    return scored
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private calculateScore(finding: Finding, narrative: Narrative): number {
    let score = 0.0;
    
    // Base keyword matching
    const findingText = `${finding.title} ${finding.summary}`.toLowerCase();
    const narrativeText = `${narrative.title} ${narrative.body}`.toLowerCase();
    
    // Simple keyword overlap
    const findingWords = new Set(findingText.split(/\s+/));
    const narrativeWords = new Set(narrativeText.split(/\s+/));
    const intersection = new Set([...findingWords].filter(x => narrativeWords.has(x)));
    const keywordScore = intersection.size / Math.max(findingWords.size, narrativeWords.size);
    score += keywordScore * 0.6;

    // Component match boost
    if (narrative.component && findingText.includes(narrative.component.toLowerCase())) {
      score += 0.2;
    }

    // Severity match boost
    if (narrative.severity === finding.severity) {
      score += 0.1;
    }

    // Tag overlap boost (if tags are implemented)
    if (narrative.tags && Array.isArray(narrative.tags)) {
      const tagMatches = narrative.tags.filter(tag => 
        findingText.includes(tag.toLowerCase())
      ).length;
      score += Math.min(tagMatches * 0.05, 0.2);
    }

    // Use count boost (popular narratives get slight preference)
    score += Math.min((narrative.useCount || 0) * 0.01, 0.1);

    return Math.min(score, 1.0);
  }

  // Variable extraction from findings
  private extractVariablesFromFinding(finding: Finding): Record<string, any> {
    const text = `${finding.title} ${finding.summary}`.toLowerCase();
    const variables: Record<string, any> = {};

    // Location extraction
    const locationMatch = text.match(/(north|south|east|west|nw|ne|sw|se|front|rear|garage|master|primary|bedroom\s*\d+|bathroom\s*\d+)/i);
    if (locationMatch) {
      variables.location = locationMatch[1];
    }

    // Quantity extraction
    const quantityMatch = text.match(/(\d+)\s*(tiles|shingles|vents|outlets|ft|feet|in|inches)/i);
    if (quantityMatch) {
      variables.quantity = quantityMatch[1];
      variables.unit = quantityMatch[2];
    }

    // Condition keywords
    const conditionMatch = text.match(/(damaged|missing|loose|leaking|improper|corroded|cracked|worn|deteriorated)/i);
    if (conditionMatch) {
      variables.condition = conditionMatch[1];
    }

    // Component from section name
    if (finding.sectionName) {
      variables.component = finding.sectionName;
    }

    // Default fallbacks
    if (!variables.location) variables.location = 'the area';
    if (!variables.condition) variables.condition = 'deficient';
    if (!variables.component) variables.component = 'component';

    return variables;
  }

  // Template rendering
  renderNarrative(body: string, variables: Record<string, any>): string {
    let rendered = body;
    
    // Simple mustache-style template rendering
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      rendered = rendered.replace(regex, String(value));
    });
    
    // Clean up any remaining unreplaced placeholders
    rendered = rendered.replace(/{{[^}]+}}/g, '[unresolved]');
    
    return rendered;
  }

  // Apply narrative to finding
  async applyToFinding(params: {
    findingId: string;
    narrativeId: string;
    variables?: Record<string, any>;
    mode: 'auto' | 'manual';
    confidence?: number;
    userId?: string;
  }): Promise<Finding> {
    const { findingId, narrativeId, variables = {}, mode, confidence, userId } = params;
    
    const [narrative] = await db
      .select()
      .from(narratives)
      .where(eq(narratives.id, narrativeId));
      
    if (!narrative) {
      throw new Error('Narrative not found');
    }

    // Extract variables if not provided
    const finalVariables = Object.keys(variables).length > 0 
      ? variables 
      : this.extractVariablesFromFinding(await this.getFinding(findingId));

    // Render the narrative
    const narrativeText = this.renderNarrative(narrative.body, finalVariables);

    // Update the finding
    const [updatedFinding] = await db
      .update(findings)
      .set({
        narrativeId,
        narrativeText,
        variables: finalVariables,
        confidence: confidence || null,
      })
      .where(eq(findings.id, findingId))
      .returning();

    // Increment usage count
    await db
      .update(narratives)
      .set({ 
        useCount: sql`${narratives.useCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(narratives.id, narrativeId));

    // Record choice for learning
    if (userId) {
      await db.insert(narrativeChoices).values({
        findingId,
        narrativeId,
        chosen: true,
        score: confidence || 0,
        edited: mode === 'manual',
        userId,
      });
    }

    return updatedFinding;
  }

  private async getFinding(findingId: string): Promise<Finding> {
    const [finding] = await db
      .select()
      .from(findings)
      .where(eq(findings.id, findingId));
    
    if (!finding) {
      throw new Error('Finding not found');
    }
    
    return finding;
  }

  // Extract placeholders from template body
  private extractPlaceholders(body: string): string[] {
    const matches = body.match(/{{([^}]+)}}/g) || [];
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];
  }

  // Company narrative settings
  async getNarrativeSettings(companyId: string): Promise<NarrativeSetting> {
    const [settings] = await db
      .select()
      .from(narrativeSettings)
      .where(eq(narrativeSettings.companyId, companyId));

    if (settings) {
      return settings;
    }

    // Create default settings if none exist
    const [defaultSettings] = await db
      .insert(narrativeSettings)
      .values({
        companyId,
        autoApplyNarratives: false,
        autoApplyThreshold: 0.72,
        language: 'en-US'
      })
      .returning();

    return defaultSettings;
  }

  async updateNarrativeSettings(
    companyId: string, 
    updates: Partial<InsertNarrativeSetting>
  ): Promise<NarrativeSetting> {
    const [settings] = await db
      .update(narrativeSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(narrativeSettings.companyId, companyId))
      .returning();

    return settings;
  }

  // Bulk operations for seeding
  async seedNarratives(companyId: string, narrativeData: InsertNarrative[]): Promise<void> {
    const narrativesToInsert = narrativeData.map(narrative => ({
      ...narrative,
      companyId,
      placeholders: this.extractPlaceholders(narrative.body),
    }));

    await db.insert(narratives).values(narrativesToInsert);
  }
}

export const narrativeService = new NarrativeService();