// Enhanced AI analysis for professional home inspection software
// Trained on real inspection reports for accurate professional language

import OpenAI from "openai";
import { INSPECTION_CONDITIONS, PROFESSIONAL_LANGUAGE_PATTERNS, ROOM_SPECIFIC_INSPECTION_ITEMS, SYSTEM_SPECIFIC_INSPECTION_ITEMS, PROFESSIONAL_CONTRACTORS } from "../shared/professional-inspection-standards";

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

export interface InspectionAnalysis {
  condition: keyof typeof INSPECTION_CONDITIONS;
  confidence: number;
  issues: InspectionIssue[];
  summary: string;
  professionalNotes: string;
  recommendations: string[];
  contractorType?: keyof typeof PROFESSIONAL_CONTRACTORS;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedCost?: string;
  timeframe?: string;
}

export interface InspectionIssue {
  type: 'safety_hazard' | 'major_concern' | 'repair_needed' | 'monitoring' | 'cosmetic';
  description: string;
  location?: string;
  recommendation: string;
  urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface ComprehensiveReportAnalysis {
  overallAssessment: {
    houseAge: string;
    generalCondition: string;
    maintenanceLevel: string;
    majorSystemsStatus: string;
  };
  prioritizedIssues: {
    safetyHazards: InspectionIssue[];
    majorConcerns: InspectionIssue[];
    standardRepairs: InspectionIssue[];
    deferredItems: InspectionIssue[];
  };
  complianceChecks: {
    ashiCompliant: boolean;
    missingItems: string[];
    duplicateFindings: string[];
    inconsistencies: string[];
  };
  professionalSummary: string;
  clientCommunication: {
    keyTakeaways: string[];
    negotiationPoints: string[];
    immediateActions: string[];
  };
}

// AI Photo Analysis trained on inspection report patterns
export async function analyzeInspectionPhoto(
  base64Image: string,
  itemType: string,
  itemName: string,
  roomContext?: string
): Promise<InspectionAnalysis> {
  try {
    const systemContext = SYSTEM_SPECIFIC_INSPECTION_ITEMS[itemType as keyof typeof SYSTEM_SPECIFIC_INSPECTION_ITEMS];
    const roomContext_data = roomContext ? ROOM_SPECIFIC_INSPECTION_ITEMS[roomContext as keyof typeof ROOM_SPECIFIC_INSPECTION_ITEMS] : null;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional home inspector with ASHI certification analyzing inspection photos. Use professional inspection language and follow standard inspection practices.

INSPECTION CONDITIONS:
- Satisfactory: Functionally consistent with original purpose, normal wear
- Marginal: Will probably require repair within five years  
- Poor: Needs repair or replacement now or very near future
- Major Concern: Significantly deficient or unsafe
- Safety Hazard: Unsafe condition requiring prompt attention

Use professional language patterns like:
- "Recommend repair" / "Should be repaired"
- "Recommend a qualified [trade] contractor review"
- "Monitor for further movement/leaks"
- "Recommend replacement" / "Needs to be replaced"

Focus on specific, actionable findings using terminology from real inspection reports.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${itemType} inspection photo for ${itemName}${roomContext ? ` in ${roomContext}` : ''}. 

Provide professional inspection analysis in JSON format:
{
  "condition": "satisfactory|marginal|poor|major_concern|safety_hazard",
  "confidence": 0.95,
  "issues": [
    {
      "type": "safety_hazard|major_concern|repair_needed|monitoring|cosmetic",
      "description": "Professional description of issue found",
      "location": "Specific location if applicable", 
      "recommendation": "Professional recommendation using standard language",
      "urgency": "immediate|short_term|medium_term|long_term"
    }
  ],
  "summary": "Brief professional summary of findings",
  "professionalNotes": "Detailed notes suitable for inspection report",
  "recommendations": ["Specific actionable recommendations"],
  "contractorType": "HVAC|electrical|plumbing|roofing|structural|chimney|siding|foundation|window",
  "priority": 1-5,
  "estimatedCost": "Cost range if applicable",
  "timeframe": "When to address"
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      condition: analysis.condition || 'satisfactory',
      confidence: analysis.confidence || 0.5,
      issues: analysis.issues || [],
      summary: analysis.summary || 'No significant issues observed',
      professionalNotes: analysis.professionalNotes || '',
      recommendations: analysis.recommendations || [],
      contractorType: analysis.contractorType,
      priority: analysis.priority || 1,
      estimatedCost: analysis.estimatedCost,
      timeframe: analysis.timeframe
    };

  } catch (error) {
    console.error('Error analyzing inspection photo:', error);
    return {
      condition: 'satisfactory',
      confidence: 0.0,
      issues: [],
      summary: 'Unable to analyze photo automatically',
      professionalNotes: 'Manual inspection required',
      recommendations: ['Review manually during inspection'],
      priority: 1
    };
  }
}

// AI Text Analysis for inspection notes
export async function analyzeInspectionText(
  text: string,
  itemType: string,
  itemName: string,
  context?: { roomType?: string; systemType?: string }
): Promise<InspectionAnalysis> {
  try {
    const contextInfo = context?.roomType ? `Room: ${context.roomType}` : 
                       context?.systemType ? `System: ${context.systemType}` : '';

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: `You are a professional home inspector analyzing inspection notes. Use standard ASHI-compliant language and professional terminology.

PROFESSIONAL LANGUAGE PATTERNS:
- Repair: "Recommend repair", "Should be repaired", "Needs repair"
- Replacement: "Recommend replacement", "Needs to be replaced" 
- Professional: "Recommend a qualified [trade] contractor review"
- Monitoring: "Recommend monitoring", "Monitor for further movement"
- Safety: "Recommend repair ASAP", "Requires prompt attention"

COMMON INSPECTION ISSUES BY CATEGORY:
Electrical: reverse polarity, open ground, GFCI issues, exposed wiring
Plumbing: leaking, loose fixtures, corrosion, flex tube issues  
Roofing: missing shingles, flashing leaks, deterioration
HVAC: filter issues, ductwork loose, venting problems
Structural: cracking, movement, settlement, bracing needed`
        },
        {
          role: "user",
          content: `Analyze this inspection text for professional home inspection report:

Text: "${text}"
Item: ${itemName} (${itemType})
${contextInfo}

Provide analysis in JSON format:
{
  "condition": "satisfactory|marginal|poor|major_concern|safety_hazard",
  "confidence": 0.95,
  "issues": [
    {
      "type": "safety_hazard|major_concern|repair_needed|monitoring|cosmetic",
      "description": "Professional description",
      "recommendation": "Professional recommendation",
      "urgency": "immediate|short_term|medium_term|long_term"
    }
  ],
  "summary": "Professional summary",
  "professionalNotes": "Report-ready notes",
  "recommendations": ["Actionable recommendations"],
  "contractorType": "trade if applicable",
  "priority": 1-5
}`
        }
      ],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      condition: analysis.condition || 'satisfactory',
      confidence: analysis.confidence || 0.5,
      issues: analysis.issues || [],
      summary: analysis.summary || 'Analysis completed',
      professionalNotes: analysis.professionalNotes || '',
      recommendations: analysis.recommendations || [],
      contractorType: analysis.contractorType,
      priority: analysis.priority || 1
    };

  } catch (error) {
    console.error('Error analyzing inspection text:', error);
    return {
      condition: 'satisfactory',
      confidence: 0.0,
      issues: [],
      summary: 'Analysis unavailable',
      professionalNotes: 'Manual review required',
      recommendations: ['Review manually'],
      priority: 1
    };
  }
}

// Comprehensive Report Analysis for compliance and quality 
export async function analyzeCompleteInspectionReport(reportData: {
  inspection: any;
  systems: any[];
  rooms: any[];
  items: any[];
}): Promise<ComprehensiveReportAnalysis> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a senior home inspector reviewing a complete inspection report for quality, compliance, and professional standards.

REVIEW CRITERIA:
1. ASHI Standards compliance 
2. Proper categorization (Safety Hazards, Major Concerns, Standard Repairs)
3. Professional language and terminology
4. Duplicate findings detection
5. Missing critical items
6. Inconsistent condition ratings
7. Client communication recommendations

Analyze the complete report and provide comprehensive feedback for professional quality assurance.`
        },
        {
          role: "user",
          content: `Review this complete inspection report:

Inspection: ${JSON.stringify(reportData.inspection)}
Systems: ${reportData.systems.length} systems inspected
Rooms: ${reportData.rooms.length} rooms inspected  
Items: ${reportData.items.length} items documented

Provide comprehensive analysis in JSON format:
{
  "overallAssessment": {
    "houseAge": "age category and condition relationship",
    "generalCondition": "well maintained | needs maintenance | significant issues",
    "maintenanceLevel": "assessment of property maintenance",
    "majorSystemsStatus": "status of major home systems"
  },
  "prioritizedIssues": {
    "safetyHazards": [{"description": "", "recommendation": "", "urgency": ""}],
    "majorConcerns": [{"description": "", "recommendation": "", "urgency": ""}], 
    "standardRepairs": [{"description": "", "recommendation": "", "urgency": ""}],
    "deferredItems": [{"description": "", "recommendation": "", "urgency": ""}]
  },
  "complianceChecks": {
    "ashiCompliant": true/false,
    "missingItems": ["items not addressed"],
    "duplicateFindings": ["duplicate items found"],
    "inconsistencies": ["inconsistent ratings or descriptions"]
  },
  "professionalSummary": "Executive summary for inspector review",
  "clientCommunication": {
    "keyTakeaways": ["main points for client"],
    "negotiationPoints": ["items affecting home value"],
    "immediateActions": ["urgent items needing attention"]
  }
}`
        }
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');

  } catch (error) {
    console.error('Error analyzing complete report:', error);
    return {
      overallAssessment: {
        houseAge: 'Unable to determine',
        generalCondition: 'Review required',
        maintenanceLevel: 'Manual assessment needed',
        majorSystemsStatus: 'Systems review required'
      },
      prioritizedIssues: {
        safetyHazards: [],
        majorConcerns: [],
        standardRepairs: [],
        deferredItems: []
      },
      complianceChecks: {
        ashiCompliant: false,
        missingItems: ['Unable to verify compliance'],
        duplicateFindings: [],
        inconsistencies: []
      },
      professionalSummary: 'Comprehensive analysis unavailable - manual review required',
      clientCommunication: {
        keyTakeaways: ['Manual review required'],
        negotiationPoints: ['Unable to determine'],
        immediateActions: ['Review inspection manually']
      }
    };
  }
}

// Generate Professional Inspection Insights
export async function generateInspectionInsights(inspectionData: {
  inspection: any;
  systems: any[];
  rooms: any[];
  items: any[];
}): Promise<{
  insights: string[];
  patterns: string[];
  recommendations: string[];
  marketImpact: string[];
  maintenancePlan: string[];
}> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a master home inspector providing professional insights based on inspection findings. Generate actionable insights for both the inspector and client education.

Focus on:
1. Professional observations and patterns
2. Preventive maintenance recommendations  
3. Cost-effective repair strategies
4. Market impact considerations
5. Long-term maintenance planning

Use professional inspection language and provide value-added insights beyond basic findings.`
        },
        {
          role: "user",
          content: `Generate professional insights for this inspection:

Property: ${inspectionData.inspection.propertyAddress}
Systems: ${inspectionData.systems.length} inspected
Items: ${inspectionData.items.length} documented

Provide insights in JSON format:
{
  "insights": ["Professional observations about property condition"],
  "patterns": ["Common issues or maintenance patterns observed"],
  "recommendations": ["Strategic repair and maintenance recommendations"],
  "marketImpact": ["Items that may impact property value or marketability"],
  "maintenancePlan": ["Long-term maintenance planning suggestions"]
}`
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');

  } catch (error) {
    console.error('Error generating inspection insights:', error);
    return {
      insights: ['Manual insights generation required'],
      patterns: ['Pattern analysis unavailable'],
      recommendations: ['Standard maintenance recommendations apply'],
      marketImpact: ['Market impact assessment needed'],
      maintenancePlan: ['Develop maintenance plan manually']
    };
  }
}