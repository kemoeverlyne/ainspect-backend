// Integration tests for AI defect analysis and lead generation pipeline

import { processInspectionForLeads, analyzePhotosForDefects, analyzeNotesForDefects } from "../ai-defect-analysis";
import { db } from "../db";
import { leads, leadActivities } from "@shared/schema";
import { eq } from "drizzle-orm";

// Mock OpenAI responses for testing
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('AI Defect Analysis Pipeline', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Photo Analysis', () => {
    it('should detect plumbing defects from kitchen leak photo', async () => {
      // Mock OpenAI response for photo analysis
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "plumbing_leak",
                severity: "moderate",
                description: "Water damage visible under sink, likely from supply line leak",
                location: "Kitchen sink area",
                confidence: 0.85
              }
            ])
          }
        }]
      });

      const photos = [{
        url: "data:image/jpeg;base64,test-kitchen-leak-photo",
        description: "Kitchen faucet area with water damage",
        roomType: "kitchen",
        systemType: "plumbing"
      }];

      const defects = await analyzePhotosForDefects(photos, "123 Test St");
      
      expect(defects).toHaveLength(1);
      expect(defects[0].category).toBe("plumbing_leak");
      expect(defects[0].severity).toBe("moderate");
      expect(defects[0].contractorCategory).toBe("plumbing");
      expect(defects[0].supportingEvidence.type).toBe("photo");
      expect(defects[0].confidence).toBe(0.85);
    });

    it('should detect electrical defects from outlet photo', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "electrical_hazard",
                severity: "major",
                description: "Exposed wiring visible at outlet, safety hazard",
                location: "Living room wall outlet",
                confidence: 0.92
              }
            ])
          }
        }]
      });

      const photos = [{
        url: "data:image/jpeg;base64,test-electrical-hazard-photo",
        description: "Living room outlet with exposed wiring",
        roomType: "living_room",
        systemType: "electrical"
      }];

      const defects = await analyzePhotosForDefects(photos, "123 Test St");
      
      expect(defects).toHaveLength(1);
      expect(defects[0].category).toBe("electrical_hazard");
      expect(defects[0].severity).toBe("major");
      expect(defects[0].contractorCategory).toBe("electrical");
      expect(defects[0].urgency).toBe("immediate");
    });
  });

  describe('Notes Analysis', () => {
    it('should detect roof defects from inspection notes', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "roof_damage",
                severity: "moderate",
                description: "Multiple missing shingles noted on south-facing roof section",
                location: "Roof exterior - south side",
                textSnippet: "Several missing shingles on south side, potential for water infiltration",
                confidence: 0.88
              }
            ])
          }
        }]
      });

      const notes = [{
        text: "Several missing shingles on south side, potential for water infiltration. Need roof contractor evaluation.",
        roomType: "exterior",
        systemType: "roofing"
      }];

      const defects = await analyzeNotesForDefects(notes, "123 Test St");
      
      expect(defects).toHaveLength(1);
      expect(defects[0].category).toBe("roof_damage");
      expect(defects[0].contractorCategory).toBe("roofing");
      expect(defects[0].supportingEvidence.type).toBe("note");
      expect(defects[0].supportingEvidence.source).toContain("missing shingles");
    });

    it('should detect HVAC defects from system notes', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "hvac_malfunction",
                severity: "major",
                description: "Furnace not heating properly, requires professional service",
                location: "Basement mechanical room",
                textSnippet: "Furnace blowing cold air only, thermostat set to heat but no warm air",
                confidence: 0.95
              }
            ])
          }
        }]
      });

      const notes = [{
        text: "Furnace blowing cold air only, thermostat set to heat but no warm air. System needs immediate service.",
        roomType: "basement",
        systemType: "hvac"
      }];

      const defects = await analyzeNotesForDefects(notes, "123 Test St");
      
      expect(defects).toHaveLength(1);
      expect(defects[0].category).toBe("hvac_malfunction");
      expect(defects[0].contractorCategory).toBe("hvac");
      expect(defects[0].urgency).toBe("immediate");
    });
  });

  describe('Lead Generation Integration', () => {
    it('should create leads in database for detected defects', async () => {
      // Mock photo analysis
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "plumbing_leak",
                severity: "moderate",
                description: "Kitchen sink leak requires plumber",
                location: "Kitchen",
                confidence: 0.90
              }
            ])
          }
        }]
      });

      // Mock notes analysis
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "roof_damage",
                severity: "major",
                description: "Roof leak causing water damage",
                location: "Attic area",
                textSnippet: "Water stains visible in attic",
                confidence: 0.85
              }
            ])
          }
        }]
      });

      const inspectionData = {
        inspectionId: 1,
        photos: [{
          url: "data:image/jpeg;base64,test-photo",
          description: "Kitchen leak",
          roomType: "kitchen",
          systemType: "plumbing"
        }],
        notes: [{
          text: "Water stains visible in attic, appears to be from roof leak",
          roomType: "attic",
          systemType: "roofing"
        }],
        customerName: "John Smith",
        customerEmail: "john@example.com",
        customerPhone: "(555) 123-4567",
        propertyAddress: "123 Test Street",
        inspectorId: "inspector-123"
      };

      const results = await processInspectionForLeads(inspectionData);

      // Verify results structure
      expect(results.totalDefectsFound).toBe(2);
      expect(results.leadsCreated).toBe(2);
      expect(results.defectsByCategory).toHaveProperty('plumbing');
      expect(results.defectsByCategory).toHaveProperty('roofing');
      expect(results.processingResults).toHaveLength(2);

      // Verify leads were created in database
      const createdLeads = await db.select().from(leads).where(eq(leads.source, 'ai_inspection_analysis'));
      expect(createdLeads.length).toBeGreaterThanOrEqual(2);

      // Verify lead activities were logged
      const activities = await db.select().from(leadActivities);
      const aiActivities = activities.filter(a => a.activityType === 'lead_created');
      expect(aiActivities.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle mixed severity defects correctly', async () => {
      // Mock analysis with mixed severity
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  category: "electrical_hazard",
                  severity: "major",
                  description: "Exposed electrical wire - safety hazard",
                  location: "Basement",
                  confidence: 0.95
                },
                {
                  category: "paint_issues",
                  severity: "minor",
                  description: "Peeling paint on exterior trim",
                  location: "Front porch",
                  confidence: 0.75
                }
              ])
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify([])
            }
          }]
        });

      const results = await processInspectionForLeads({
        inspectionId: 2,
        photos: [{
          url: "data:image/jpeg;base64,mixed-issues",
          description: "Multiple issues visible",
          roomType: "various"
        }],
        notes: [],
        customerName: "Jane Doe",
        propertyAddress: "456 Test Ave",
        inspectorId: "inspector-456"
      });

      expect(results.totalDefectsFound).toBe(2);
      expect(results.defectsByCategory.electrical).toBe(1);
      expect(results.defectsByCategory.general).toBe(1);
      
      // Major severity should create immediate urgency
      const majorDefect = results.processingResults.find(d => d.severity === 'major');
      expect(majorDefect?.urgency).toBe('immediate');
      
      // Minor severity should create medium-term urgency
      const minorDefect = results.processingResults.find(d => d.severity === 'minor');
      expect(minorDefect?.urgency).toBe('medium_term');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('OpenAI API Error'));

      const photos = [{
        url: "data:image/jpeg;base64,test-photo",
        description: "Test photo"
      }];

      const defects = await analyzePhotosForDefects(photos, "123 Test St");
      expect(defects).toEqual([]);
    });

    it('should handle invalid JSON responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: "Invalid JSON response"
          }
        }]
      });

      const notes = [{
        text: "Test note with defects"
      }];

      const defects = await analyzeNotesForDefects(notes, "123 Test St");
      expect(defects).toEqual([]);
    });

    it('should filter out low-confidence defects', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                category: "uncertain_issue",
                severity: "minor",
                description: "Possibly an issue but unclear",
                location: "Somewhere",
                confidence: 0.3  // Below 0.7 threshold
              },
              {
                category: "clear_issue",
                severity: "moderate",
                description: "Definitely a problem",
                location: "Kitchen",
                confidence: 0.9  // Above threshold
              }
            ])
          }
        }]
      });

      const photos = [{
        url: "data:image/jpeg;base64,test-photo",
        description: "Mixed confidence issues"
      }];

      const defects = await analyzePhotosForDefects(photos, "123 Test St");
      
      // Should only return high-confidence defect
      expect(defects).toHaveLength(1);
      expect(defects[0].confidence).toBe(0.9);
      expect(defects[0].description).toBe("Definitely a problem");
    });
  });
});

// Test runner setup
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.ts']
};