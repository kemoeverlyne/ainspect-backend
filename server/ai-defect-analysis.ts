// AI Defect Analysis Pipeline - Inspection to Lead Generation
// Analyzes photos and notes to detect defects and automatically create contractor leads

import OpenAI from "openai";
import { db } from "./db";
import { leads, leadActivities, type InsertLead, type InsertLeadActivity } from "@shared/schema";

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export interface DefectAnalysis {
  category: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  location: string;
  supportingEvidence: {
    type: 'photo' | 'note';
    source: string; // photo URL or note snippet
  };
  contractorCategory: ContractorCategory;
  estimatedCost?: string;
  urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  confidence: number; // 0-1 scale
}

export type ContractorCategory = 
  | 'roofing'
  | 'hvac' 
  | 'plumbing'
  | 'electrical'
  | 'structural'
  | 'windows_doors'
  | 'flooring'
  | 'general';

export type HomeownerServiceCategory = 
  | 'pest_control'
  | 'solar_installation'
  | 'home_security'
  | 'professional_cleaning'
  | 'home_insurance'
  | 'auto_insurance'
  | 'landscaping'
  | 'home_warranty'
  | 'internet_cable'
  | 'utilities_setup';

// Mapping defect categories to contractor types
const DEFECT_TO_CONTRACTOR_MAP: Record<string, ContractorCategory> = {
  // Roofing defects
  'roof_leak': 'roofing',
  'missing_shingles': 'roofing',
  'damaged_gutters': 'roofing',
  'flashing_issues': 'roofing',
  'roof_damage': 'roofing',
  
  // HVAC defects
  'hvac_malfunction': 'hvac',
  'ductwork_issues': 'hvac',
  'furnace_problems': 'hvac',
  'ac_issues': 'hvac',
  'ventilation_problems': 'hvac',
  
  // Plumbing defects
  'plumbing_leak': 'plumbing',
  'water_damage': 'plumbing',
  'pipe_corrosion': 'plumbing',
  'drain_issues': 'plumbing',
  'fixture_problems': 'plumbing',
  
  // Electrical defects
  'electrical_hazard': 'electrical',
  'wiring_issues': 'electrical',
  'outlet_problems': 'electrical',
  'panel_issues': 'electrical',
  'electrical_safety': 'electrical',
  
  // Structural defects
  'foundation_crack': 'structural',
  'structural_damage': 'structural',
  'wall_cracks': 'structural',
  'floor_sagging': 'structural',
  'structural_integrity': 'structural',
  
  // Windows/Doors
  'window_damage': 'windows_doors',
  'door_problems': 'windows_doors',
  'seal_failure': 'windows_doors',
  'frame_damage': 'windows_doors',
  
  // Flooring
  'floor_damage': 'flooring',
  'carpet_issues': 'flooring',
  'tile_problems': 'flooring',
  'hardwood_damage': 'flooring',
  
  // General/Other
  'paint_issues': 'general',
  'cosmetic_damage': 'general',
  'maintenance_needed': 'general'
};

/**
 * Analyzes inspection photos for visible defects
 */
export async function analyzePhotosForDefects(
  photos: Array<{ url: string; description?: string; roomType?: string; systemType?: string }>,
  inspectionLocation: string
): Promise<DefectAnalysis[]> {
  const defects: DefectAnalysis[] = [];
  
  for (const photo of photos) {
    try {
      const analysis = await analyzePhotoForDefects(photo, inspectionLocation);
      defects.push(...analysis);
    } catch (error) {
      // Error analyzing photo - continue with other photos
    }
  }
  
  return defects;
}

/**
 * Analyzes a single photo for defects
 */
async function analyzePhotoForDefects(
  photo: { url: string; description?: string; roomType?: string; systemType?: string },
  location: string
): Promise<DefectAnalysis[]> {
  
  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional home inspector analyzing photos for defects that require contractor attention.

INSTRUCTIONS:
1. Examine the image carefully for visible defects, damage, or issues
2. Only identify defects that are clearly visible and would require professional repair
3. Categorize each defect using one of these categories: ${Object.keys(DEFECT_TO_CONTRACTOR_MAP).join(', ')}
4. Rate severity as minor, moderate, or major
5. Provide confidence score (0.0-1.0) for each finding
6. Return results as JSON array

Focus on defects that would generate legitimate contractor leads:
- Structural damage (cracks, sagging, deterioration)
- Water damage or leaks
- Electrical hazards or code violations  
- HVAC system issues
- Roofing problems
- Plumbing issues
- Window/door damage requiring repair

RESPONSE FORMAT (JSON Array):
[
  {
    "category": "defect_category",
    "severity": "minor|moderate|major",
    "description": "Clear description of the defect",
    "location": "Specific location in room/area",
    "confidence": 0.85
  }
]

Return empty array [] if no clear defects are visible.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this inspection photo for defects. Context: ${photo.description || 'No description'}, Room: ${photo.roomType || 'Unknown'}, System: ${photo.systemType || 'Unknown'}`
          },
          {
            type: "image_url",
            image_url: {
              url: photo.url
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.1
  });

  try {
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [];
    
    const rawDefects = JSON.parse(content);
    if (!Array.isArray(rawDefects)) return [];
    
    return rawDefects
      .filter(defect => defect.confidence >= 0.7) // Only high-confidence defects
      .map(defect => ({
        category: defect.category,
        severity: defect.severity,
        description: defect.description,
        location: defect.location || location,
        supportingEvidence: {
          type: 'photo' as const,
          source: photo.url
        },
        contractorCategory: DEFECT_TO_CONTRACTOR_MAP[defect.category] || 'general',
        urgency: defect.severity === 'major' ? 'immediate' : 
                defect.severity === 'moderate' ? 'short_term' : 'medium_term',
        confidence: defect.confidence
      }));
  } catch (error) {
    // Error parsing photo analysis response
    return [];
  }
}

/**
 * Analyzes inspection notes for text-based defect mentions
 */
export async function analyzeNotesForDefects(
  notes: Array<{ text: string; roomType?: string; systemType?: string }>,
  inspectionLocation: string
): Promise<DefectAnalysis[]> {
  
  if (notes.length === 0) return [];
  
  const combinedNotes = notes.map(note => 
    `${note.roomType || 'General'} - ${note.systemType || 'General'}: ${note.text}`
  ).join('\n');
  
  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o", 
    messages: [
      {
        role: "system",
        content: `You are a professional home inspector analyzing inspection notes for defects that require contractor attention.

INSTRUCTIONS:
1. Parse the notes for mentions of defects, problems, or issues requiring professional repair
2. Only identify issues that would realistically need contractor services
3. Categorize each defect using one of these categories: ${Object.keys(DEFECT_TO_CONTRACTOR_MAP).join(', ')}
4. Rate severity based on description (minor, moderate, major)
5. Extract the specific text snippet that mentions the issue

Focus on contractor-worthy issues mentioned in notes:
- Damage requiring repair
- Safety hazards
- System malfunctions
- Code violations
- Structural concerns
- Water damage/leaks
- Equipment failures

RESPONSE FORMAT (JSON Array):
[
  {
    "category": "defect_category",
    "severity": "minor|moderate|major", 
    "description": "Clear description extracted from notes",
    "location": "Location mentioned in notes",
    "textSnippet": "Original text from notes that identified this issue",
    "confidence": 0.85
  }
]

Return empty array [] if no defects requiring contractors are mentioned.`
      },
      {
        role: "user",
        content: `Analyze these inspection notes for defects requiring contractor attention:\n\n${combinedNotes}`
      }
    ],
    max_tokens: 1000,
    temperature: 0.1
  });

  try {
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [];
    
    const rawDefects = JSON.parse(content);
    if (!Array.isArray(rawDefects)) return [];
    
    return rawDefects
      .filter(defect => defect.confidence >= 0.7)
      .map(defect => ({
        category: defect.category,
        severity: defect.severity,
        description: defect.description,
        location: defect.location || inspectionLocation,
        supportingEvidence: {
          type: 'note' as const,
          source: defect.textSnippet
        },
        contractorCategory: DEFECT_TO_CONTRACTOR_MAP[defect.category] || 'general',
        urgency: defect.severity === 'major' ? 'immediate' : 
                defect.severity === 'moderate' ? 'short_term' : 'medium_term',
        confidence: defect.confidence
      }));
  } catch (error) {
    // Error parsing notes analysis response
    return [];
  }
}

/**
 * Creates contractor leads from detected defects
 */
export async function createLeadsFromDefects(
  defects: DefectAnalysis[],
  inspectionData: {
    inspectionId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    propertyAddress: string;
    inspectorId: string;
  }
): Promise<void> {
  
  for (const defect of defects) {
    try {
      // Create lead in database
      const [newLead] = await db.insert(leads).values({
        category: defect.contractorCategory as any,
        customerName: inspectionData.customerName,
        customerEmail: inspectionData.customerEmail,
        customerPhone: inspectionData.customerPhone,
        propertyAddress: inspectionData.propertyAddress,
        serviceNeeded: defect.category,
        description: `Inspection Defect: ${defect.description}`,
        priority: defect.severity === 'major' ? 'high' : 
                 defect.severity === 'moderate' ? 'medium' : 'low',
        source: 'ai_inspection_analysis',
        value: estimateLeadValue(defect),
        metadata: {
          inspectionId: inspectionData.inspectionId,
          defectCategory: defect.category,
          severity: defect.severity,
          urgency: defect.urgency,
          confidence: defect.confidence,
          supportingEvidence: defect.supportingEvidence,
          detectedBy: 'ai_analysis'
        }
      }).returning();

      // Log lead creation activity
      await db.insert(leadActivities).values({
        leadId: newLead.id,
        activityType: 'lead_created',
        description: `Lead automatically created from AI inspection analysis. Defect: ${defect.description}`,
        metadata: {
          source: 'ai_inspection_analysis',
          defectCategory: defect.category,
          severity: defect.severity,
          confidence: defect.confidence
        }
      });

      // Lead created successfully for defect
      
    } catch (error) {
      // Error creating lead for defect - handle gracefully
    }
  }
}

/**
 * Estimates lead value based on defect type and severity
 */
function estimateLeadValue(defect: DefectAnalysis): number {
  const baseValues: Record<ContractorCategory, number> = {
    roofing: 5000,
    hvac: 3000, 
    plumbing: 1500,
    electrical: 2000,
    structural: 8000,
    windows_doors: 1200,
    flooring: 2500,
    general: 800
  };
  
  const severityMultipliers = {
    minor: 0.5,
    moderate: 1.0,
    major: 2.0
  };
  
  const baseValue = baseValues[defect.contractorCategory] || 1000;
  const multiplier = severityMultipliers[defect.severity];
  
  return Math.round(baseValue * multiplier);
}

/**
 * Creates universal homeowner service leads for every inspection
 */
export async function createUniversalHomeownerLeads(
  inspectionData: {
    inspectionId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    propertyAddress: string;
    inspectorId: string;
  }
): Promise<number> {
  
  const homeownerServices: Array<{
    category: HomeownerServiceCategory;
    serviceType: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedValue: number;
  }> = [
    {
      category: 'pest_control',
      serviceType: 'pest_control_inspection',
      description: 'Comprehensive pest control inspection and prevention services for new homeowners',
      priority: 'medium',
      estimatedValue: 300
    },
    {
      category: 'solar_installation',
      serviceType: 'solar_consultation',
      description: 'Solar energy consultation and installation assessment for residential property',
      priority: 'medium',
      estimatedValue: 15000
    },
    {
      category: 'home_security',
      serviceType: 'security_system_installation',
      description: 'Home security system consultation and installation for new homeowners',
      priority: 'high',
      estimatedValue: 2000
    },
    {
      category: 'professional_cleaning',
      serviceType: 'move_in_cleaning',
      description: 'Professional deep cleaning service for move-in preparation',
      priority: 'high',
      estimatedValue: 400
    },
    {
      category: 'home_insurance',
      serviceType: 'homeowners_insurance_quote',
      description: 'Homeowners insurance coverage evaluation and competitive quote',
      priority: 'high',
      estimatedValue: 1200
    },
    {
      category: 'auto_insurance',
      serviceType: 'auto_insurance_quote',
      description: 'Auto insurance review and competitive quote for new address',
      priority: 'medium',
      estimatedValue: 800
    },
    {
      category: 'landscaping',
      serviceType: 'landscaping_consultation',
      description: 'Landscaping and lawn care services for new homeowners',
      priority: 'low',
      estimatedValue: 1500
    },
    {
      category: 'home_warranty',
      serviceType: 'home_warranty_coverage',
      description: 'Home warranty coverage for appliances and systems protection',
      priority: 'medium',
      estimatedValue: 600
    },
    {
      category: 'internet_cable',
      serviceType: 'internet_setup',
      description: 'Internet and cable TV setup services for new residence',
      priority: 'high',
      estimatedValue: 100
    },
    {
      category: 'utilities_setup',
      serviceType: 'utility_connection',
      description: 'Utility connection and setup assistance for new homeowners',
      priority: 'high',
      estimatedValue: 200
    }
  ];

  let leadsCreated = 0;

  for (const service of homeownerServices) {
    try {
      // Create homeowner service lead in database
      const [newLead] = await db.insert(leads).values({
        category: service.category as any,
        customerName: inspectionData.customerName,
        customerEmail: inspectionData.customerEmail,
        customerPhone: inspectionData.customerPhone,
        propertyAddress: inspectionData.propertyAddress,
        serviceNeeded: service.serviceType,
        description: service.description,
        priority: service.priority,
        source: 'universal_homeowner_services',
        value: service.estimatedValue,
        metadata: {
          inspectionId: inspectionData.inspectionId,
          serviceCategory: service.category,
          leadType: 'universal_homeowner_service',
          generatedBy: 'automated_pipeline'
        }
      }).returning();

      // Log lead creation activity
      await db.insert(leadActivities).values({
        leadId: newLead.id,
        activityType: 'lead_created',
        description: `Universal homeowner service lead created: ${service.serviceType}`,
        metadata: {
          source: 'universal_homeowner_services',
          serviceCategory: service.category,
          leadType: 'universal_homeowner_service'
        }
      });

      leadsCreated++;
      // Created universal homeowner lead successfully
      
    } catch (error) {
      // Error creating homeowner service lead - handle gracefully
    }
  }

  return leadsCreated;
}

/**
 * Main pipeline function - analyzes inspection data and creates leads
 */
export async function processInspectionForLeads(inspectionData: {
  inspectionId: number;
  photos: Array<{ url: string; description?: string; roomType?: string; systemType?: string }>;
  notes: Array<{ text: string; roomType?: string; systemType?: string }>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  propertyAddress: string;
  inspectorId: string;
}): Promise<{
  totalDefectsFound: number;
  defectLeadsCreated: number;
  homeownerLeadsCreated: number;
  totalLeadsCreated: number;
  defectsByCategory: Record<ContractorCategory, number>;
  homeownerServicesByCategory: Record<HomeownerServiceCategory, number>;
  processingResults: DefectAnalysis[];
}> {
  
  // Starting AI defect analysis for inspection
  
  // Analyze photos for defects
  const photoDefects = await analyzePhotosForDefects(
    inspectionData.photos, 
    inspectionData.propertyAddress
  );
  
  // Analyze notes for defects
  const noteDefects = await analyzeNotesForDefects(
    inspectionData.notes,
    inspectionData.propertyAddress
  );
  
  // Combine and deduplicate defects
  const allDefects = [...photoDefects, ...noteDefects];
  const uniqueDefects = deduplicateDefects(allDefects);
  
  // Create leads from defects
  await createLeadsFromDefects(uniqueDefects, inspectionData);
  
  // Create universal homeowner service leads (always generated regardless of defects)
  const homeownerLeadsCreated = await createUniversalHomeownerLeads(inspectionData);
  
  // Generate summary statistics
  const defectsByCategory = uniqueDefects.reduce((acc, defect) => {
    acc[defect.contractorCategory] = (acc[defect.contractorCategory] || 0) + 1;
    return acc;
  }, {} as Record<ContractorCategory, number>);
  
  // Generate homeowner services statistics
  const homeownerServicesByCategory: Record<HomeownerServiceCategory, number> = {
    pest_control: 1,
    solar_installation: 1,
    home_security: 1,
    professional_cleaning: 1,
    home_insurance: 1,
    auto_insurance: 1,
    landscaping: 1,
    home_warranty: 1,
    internet_cable: 1,
    utilities_setup: 1
  };
  
  const totalLeadsCreated = uniqueDefects.length + homeownerLeadsCreated;
  
  // AI analysis complete with defects and leads created
  
  return {
    totalDefectsFound: uniqueDefects.length,
    defectLeadsCreated: uniqueDefects.length,
    homeownerLeadsCreated,
    totalLeadsCreated,
    defectsByCategory,
    homeownerServicesByCategory,
    processingResults: uniqueDefects
  };
}

/**
 * Remove duplicate defects based on category and location
 */
function deduplicateDefects(defects: DefectAnalysis[]): DefectAnalysis[] {
  const seen = new Set<string>();
  return defects.filter(defect => {
    const key = `${defect.category}-${defect.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}