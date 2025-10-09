import OpenAI from 'openai';

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

export interface AIPhotoAnalysisResult {
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'defective';
  confidence: number;
  issues: Array<{
    type: 'critical' | 'major' | 'minor' | 'observation';
    description: string;
    location?: string;
    recommendation?: string;
  }>;
  summary: string;
  technicalNotes: string;
  safetyNotes?: string;
  codeCompliance?: {
    compliant: boolean;
    violations?: string[];
  };
}

export interface AITextAnalysisResult {
  enhancedText: string;
  suggestedCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'defective';
  confidence: number;
  technicalSuggestions: string[];
  safetyFlags: string[];
  complianceNotes: string[];
}

export interface AIReportAnalysisResult {
  complianceScore: number;
  complianceIssues: string[];
  redundancies: Array<{
    items: string[];
    suggestion: string;
  }>;
  accuracyFlags: Array<{
    item: string;
    concern: string;
    suggestion: string;
  }>;
  overallQuality: number;
  recommendations: string[];
}

export async function analyzePhotoWithAI(
  imageBase64: string,
  itemType: string,
  itemName: string
): Promise<AIPhotoAnalysisResult> {
  try {
    const prompt = `You are a professional home inspector analyzing this image of a ${itemName} in the ${itemType} area of a home. 
    
    Please provide a comprehensive analysis including:
    1. Overall condition assessment (excellent, good, fair, poor, or defective)
    2. Confidence level (0-1)
    3. Specific issues found (critical, major, minor, or observation)
    4. Summary of findings
    5. Technical notes for the inspector
    6. Safety concerns if any
    7. Building code compliance assessment

    Focus on:
    - Structural integrity
    - Safety hazards
    - Code compliance issues
    - Wear and deterioration
    - Proper installation
    - Functionality

    Respond with JSON in this exact format:
    {
      "condition": "excellent|good|fair|poor|defective",
      "confidence": 0.95,
      "issues": [
        {
          "type": "critical|major|minor|observation",
          "description": "Detailed description",
          "location": "Specific location if applicable",
          "recommendation": "Professional recommendation"
        }
      ],
      "summary": "Overall assessment summary",
      "technicalNotes": "Technical details for inspector",
      "safetyNotes": "Safety concerns if any",
      "codeCompliance": {
        "compliant": true,
        "violations": ["List of violations if any"]
      }
    }`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AIPhotoAnalysisResult;
  } catch (error) {
    // Error analyzing photo - handle with production logger
    throw new Error('Failed to analyze photo with AI');
  }
}

export async function analyzeTextWithAI(
  text: string,
  itemType: string,
  itemName: string
): Promise<AITextAnalysisResult> {
  try {
    const prompt = `You are a professional home inspector reviewing inspection notes for a ${itemName} in the ${itemType} area.

    Original text: "${text}"

    Please provide:
    1. Enhanced, professional version of the text
    2. Suggested condition assessment based on the text
    3. Confidence in the assessment
    4. Technical suggestions to improve the documentation
    5. Safety flags if any concerns are mentioned
    6. Code compliance notes

    Respond with JSON in this format:
    {
      "enhancedText": "Professional, clear version of the text",
      "suggestedCondition": "excellent|good|fair|poor|defective",
      "confidence": 0.85,
      "technicalSuggestions": ["Suggestions for better documentation"],
      "safetyFlags": ["Safety concerns mentioned"],
      "complianceNotes": ["Code compliance observations"]
    }`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert home inspector and technical writer helping to improve inspection documentation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AITextAnalysisResult;
  } catch (error) {
    // Error analyzing text - handle with production logger
    throw new Error('Failed to analyze text with AI');
  }
}

export async function analyzeCompleteReportWithAI(
  reportData: any
): Promise<AIReportAnalysisResult> {
  try {
    const prompt = `You are a senior home inspector reviewing a complete inspection report for quality assurance.

    Report Data: ${JSON.stringify(reportData, null, 2)}

    Please analyze the report for:
    1. ASHI compliance (score 0-100)
    2. Compliance issues or missing items
    3. Redundant or duplicate findings
    4. Accuracy concerns or contradictions
    5. Overall quality assessment (score 0-100)
    6. Recommendations for improvement

    Respond with JSON in this format:
    {
      "complianceScore": 95,
      "complianceIssues": ["List of compliance issues"],
      "redundancies": [
        {
          "items": ["Item 1", "Item 2"],
          "suggestion": "How to consolidate"
        }
      ],
      "accuracyFlags": [
        {
          "item": "Specific item",
          "concern": "What's concerning",
          "suggestion": "How to fix"
        }
      ],
      "overallQuality": 88,
      "recommendations": ["Overall recommendations for report improvement"]
    }`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a senior home inspector and quality assurance expert reviewing inspection reports for compliance, accuracy, and completeness."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AIReportAnalysisResult;
  } catch (error) {
    // Error analyzing report - handle with production logger
    throw new Error('Failed to analyze report with AI');
  }
}

export async function generateInspectionInsights(
  inspectionData: any
): Promise<{
  marketInsights: string[];
  maintenanceRecommendations: string[];
  priorityActions: string[];
  estimatedCosts: Array<{ item: string; estimatedCost: string; urgency: 'low' | 'medium' | 'high' }>;
}> {
  try {
    const prompt = `You are a home inspection expert providing insights based on inspection findings.

    Inspection Data: ${JSON.stringify(inspectionData, null, 2)}

    Please provide:
    1. Market insights about the property condition
    2. Maintenance recommendations for the homeowner
    3. Priority actions that should be addressed first
    4. Estimated cost ranges for major issues (if any)

    Respond with JSON in this format:
    {
      "marketInsights": ["Insights about property value and marketability"],
      "maintenanceRecommendations": ["Ongoing maintenance suggestions"],
      "priorityActions": ["Most important items to address"],
      "estimatedCosts": [
        {
          "item": "Description of repair/issue",
          "estimatedCost": "$X,XXX - $X,XXX",
          "urgency": "high"
        }
      ]
    }`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a home inspection expert providing practical insights and recommendations to property owners and buyers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    // Error generating insights - handle with production logger
    throw new Error('Failed to generate inspection insights');
  }
}