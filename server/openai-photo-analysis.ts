import OpenAI from "openai";

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

export interface OpenAIPhotoAnalysisResult {
  roomType: string;
  roomName: string;
  detectedIssues: Array<{
    systemType: string;
    category: string;
    description: string;
    condition: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'major_concern';
    recommendations: string;
    confidence: number;
  }>;
  roomSuggestions: {
    floor?: string;
    notes?: string;
  };
  analysisConfidence: number;
}

export async function analyzeInspectionPhotoWithOpenAI(
  base64Image: string,
  existingRooms: Array<{ roomType: string; roomName: string; floor?: string }> = []
): Promise<OpenAIPhotoAnalysisResult> {
  try {
    // Validate inputs
    if (!base64Image || base64Image.trim().length === 0) {
      throw new Error('No image data provided');
    }

    console.log(`[OpenAI Photo Analysis] Starting analysis for ${base64Image.length} character base64 image`);

    // Detect image format from base64 header
    let mediaType = 'image/png'; // default
    if (base64Image.startsWith('/9j/') || base64Image.startsWith('/9j4AAQSkZJRgABAQAAAQABAAD')) {
      mediaType = 'image/jpeg';
    } else if (base64Image.startsWith('iVBORw0KGgo')) {
      mediaType = 'image/png';
    } else if (base64Image.startsWith('UklGR')) {
      mediaType = 'image/webp';
    } else if (base64Image.startsWith('R0lGOD')) {
      mediaType = 'image/gif';
    }

    console.log(`[OpenAI Photo Analysis] Detected image format: ${mediaType}`);

    // Create existing rooms context
    const existingRoomsContext = existingRooms.length > 0 
      ? `Existing rooms in this property: ${existingRooms.map(r => `${r.roomName} (${r.roomType})`).join(', ')}`
      : '';

    // Making API call to OpenAI GPT-4 Vision
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // Using GPT-4 Omni for vision capabilities
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI assistant helping realtors assess property conditions through photos. Please analyze this image and provide a detailed property condition assessment in JSON format.

Your analysis should include:
1. Room identification (type and suggested name)
2. Detected condition issues and observations
3. Condition severity classification for realtor reports
4. Professional recommendations for client disclosure

Room Types: bedroom, bathroom, living-room, kitchen, dining-room, garage, basement, attic, office, utility, exterior, roof, electrical-panel, hvac-system

Condition Assessment Categories:
- Exterior: grounds, roof-condition, gutters-drains, siding-paint, windows-doors
- Electrical: panel-access, outlets, fixtures, general-condition
- Plumbing: fixtures, visible-pipes, water-pressure, general-function
- HVAC: heating-cooling, ventilation, filters, general-operation
- Interior: walls-ceilings, flooring, doors-windows, general-condition
- Structural: foundation-visible, walls, ceilings, general-stability

Condition Levels for Home Inspection Reports:
- excellent: Above-average condition, well-maintained
- good: Normal condition, typical wear for age
- fair: Minor issues, cosmetic concerns, normal aging
- needs_attention: Issues affecting function or appearance, recommend addressing
- major_concern: Significant issues requiring professional evaluation or disclosure

${existingRoomsContext}

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Return only the JSON object.

Respond in this exact JSON format:
{
  "roomType": "detected room type",
  "roomName": "suggested room name",
  "detectedIssues": [
    {
      "systemType": "system category",
      "category": "specific category",
      "description": "detailed description of the issue",
      "condition": "severity level",
      "recommendations": "professional recommendation",
      "confidence": 0.85
    }
  ],
  "roomSuggestions": {
    "floor": "suggested floor if determinable",
    "notes": "additional observations"
  },
  "analysisConfidence": 0.92
}

Be thorough but focus on genuine issues. If nothing concerning is visible, return an empty detectedIssues array.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    console.log(`[OpenAI Photo Analysis] Received response from OpenAI`);

    // Extract and validate response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`[OpenAI Photo Analysis] Raw response: ${content.substring(0, 200)}...`);

    // Parse JSON response with robust extraction
    let analysisData;
    try {
      // Extract JSON from the response - try multiple patterns
      let jsonString = '';
      
      // Try different patterns to extract JSON
      const patterns = [
        // Pattern 1: JSON within code blocks
        /```json\s*(\{[\s\S]*?\})\s*```/i,
        // Pattern 2: JSON within code blocks (no language specified)
        /```\s*(\{[\s\S]*?\})\s*```/i,
        // Pattern 3: JSON at the start of response
        /^\s*(\{[\s\S]*?\})\s*$/,
        // Pattern 4: JSON anywhere in response
        /(\{[\s\S]*?\})/,
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          jsonString = match[1] || match[0];
          break;
        }
      }
      
      if (!jsonString) {
        console.error(`[OpenAI Photo Analysis] Could not extract JSON from response:`, content);
        throw new Error('Could not parse JSON from OpenAI response');
      }

      // Clean up the JSON string
      jsonString = jsonString.trim();
      
      // Remove any trailing commas or incomplete JSON
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      analysisData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[OpenAI Photo Analysis] JSON parsing failed:`, parseError);
      console.error(`[OpenAI Photo Analysis] Raw content:`, content);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate and normalize the response structure
    const normalizedResult: OpenAIPhotoAnalysisResult = {
      roomType: analysisData.roomType || 'unknown',
      roomName: analysisData.roomName || 'Unknown Room',
      detectedIssues: Array.isArray(analysisData.detectedIssues) 
        ? analysisData.detectedIssues.map((issue: any) => ({
            systemType: issue.systemType || 'general',
            category: issue.category || 'unknown',
            description: issue.description || 'Issue detected',
            condition: ['excellent', 'good', 'fair', 'needs_attention', 'major_concern'].includes(issue.condition) 
              ? issue.condition 
              : 'fair',
            recommendations: issue.recommendations || 'Professional evaluation recommended',
            confidence: typeof issue.confidence === 'number' ? issue.confidence : 0.5
          }))
        : [],
      roomSuggestions: {
        floor: analysisData.roomSuggestions?.floor || undefined,
        notes: analysisData.roomSuggestions?.notes || undefined
      },
      analysisConfidence: typeof analysisData.analysisConfidence === 'number' 
        ? analysisData.analysisConfidence 
        : 0.5
    };

    console.log(`[OpenAI Photo Analysis] ✅ Analysis completed successfully`);
    console.log(`[OpenAI Photo Analysis] Room: ${normalizedResult.roomName} (${normalizedResult.roomType})`);
    console.log(`[OpenAI Photo Analysis] Issues found: ${normalizedResult.detectedIssues.length}`);
    console.log(`[OpenAI Photo Analysis] Confidence: ${normalizedResult.analysisConfidence}`);

    return normalizedResult;

  } catch (error) {
    console.error(`[OpenAI Photo Analysis] ❌ Analysis failed:`, error);
    throw error;
  }
}

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

export interface OpenAIPhotoAnalysisResult {
  roomType: string;
  roomName: string;
  detectedIssues: Array<{
    systemType: string;
    category: string;
    description: string;
    condition: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'major_concern';
    recommendations: string;
    confidence: number;
  }>;
  roomSuggestions: {
    floor?: string;
    notes?: string;
  };
  analysisConfidence: number;
}

export async function analyzeInspectionPhotoWithOpenAI(
  base64Image: string,
  existingRooms: Array<{ roomType: string; roomName: string; floor?: string }> = []
): Promise<OpenAIPhotoAnalysisResult> {
  try {
    // Validate inputs
    if (!base64Image || base64Image.trim().length === 0) {
      throw new Error('No image data provided');
    }

    console.log(`[OpenAI Photo Analysis] Starting analysis for ${base64Image.length} character base64 image`);

    // Detect image format from base64 header
    let mediaType = 'image/png'; // default
    if (base64Image.startsWith('/9j/') || base64Image.startsWith('/9j4AAQSkZJRgABAQAAAQABAAD')) {
      mediaType = 'image/jpeg';
    } else if (base64Image.startsWith('iVBORw0KGgo')) {
      mediaType = 'image/png';
    } else if (base64Image.startsWith('UklGR')) {
      mediaType = 'image/webp';
    } else if (base64Image.startsWith('R0lGOD')) {
      mediaType = 'image/gif';
    }

    console.log(`[OpenAI Photo Analysis] Detected image format: ${mediaType}`);

    // Create existing rooms context
    const existingRoomsContext = existingRooms.length > 0 
      ? `Existing rooms in this property: ${existingRooms.map(r => `${r.roomName} (${r.roomType})`).join(', ')}`
      : '';

    // Making API call to OpenAI GPT-4 Vision
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // Using GPT-4 Omni for vision capabilities
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI assistant helping realtors assess property conditions through photos. Please analyze this image and provide a detailed property condition assessment in JSON format.

Your analysis should include:
1. Room identification (type and suggested name)
2. Detected condition issues and observations
3. Condition severity classification for realtor reports
4. Professional recommendations for client disclosure

Room Types: bedroom, bathroom, living-room, kitchen, dining-room, garage, basement, attic, office, utility, exterior, roof, electrical-panel, hvac-system

Condition Assessment Categories:
- Exterior: grounds, roof-condition, gutters-drains, siding-paint, windows-doors
- Electrical: panel-access, outlets, fixtures, general-condition
- Plumbing: fixtures, visible-pipes, water-pressure, general-function
- HVAC: heating-cooling, ventilation, filters, general-operation
- Interior: walls-ceilings, flooring, doors-windows, general-condition
- Structural: foundation-visible, walls, ceilings, general-stability

Condition Levels for Home Inspection Reports:
- excellent: Above-average condition, well-maintained
- good: Normal condition, typical wear for age
- fair: Minor issues, cosmetic concerns, normal aging
- needs_attention: Issues affecting function or appearance, recommend addressing
- major_concern: Significant issues requiring professional evaluation or disclosure

${existingRoomsContext}

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Return only the JSON object.

Respond in this exact JSON format:
{
  "roomType": "detected room type",
  "roomName": "suggested room name",
  "detectedIssues": [
    {
      "systemType": "system category",
      "category": "specific category",
      "description": "detailed description of the issue",
      "condition": "severity level",
      "recommendations": "professional recommendation",
      "confidence": 0.85
    }
  ],
  "roomSuggestions": {
    "floor": "suggested floor if determinable",
    "notes": "additional observations"
  },
  "analysisConfidence": 0.92
}

Be thorough but focus on genuine issues. If nothing concerning is visible, return an empty detectedIssues array.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    console.log(`[OpenAI Photo Analysis] Received response from OpenAI`);

    // Extract and validate response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`[OpenAI Photo Analysis] Raw response: ${content.substring(0, 200)}...`);

    // Parse JSON response with robust extraction
    let analysisData;
    try {
      // Extract JSON from the response - try multiple patterns
      let jsonString = '';
      
      // Try different patterns to extract JSON
      const patterns = [
        // Pattern 1: JSON within code blocks
        /```json\s*(\{[\s\S]*?\})\s*```/i,
        // Pattern 2: JSON within code blocks (no language specified)
        /```\s*(\{[\s\S]*?\})\s*```/i,
        // Pattern 3: JSON at the start of response
        /^\s*(\{[\s\S]*?\})\s*$/,
        // Pattern 4: JSON anywhere in response
        /(\{[\s\S]*?\})/,
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          jsonString = match[1] || match[0];
          break;
        }
      }
      
      if (!jsonString) {
        console.error(`[OpenAI Photo Analysis] Could not extract JSON from response:`, content);
        throw new Error('Could not parse JSON from OpenAI response');
      }

      // Clean up the JSON string
      jsonString = jsonString.trim();
      
      // Remove any trailing commas or incomplete JSON
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      analysisData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[OpenAI Photo Analysis] JSON parsing failed:`, parseError);
      console.error(`[OpenAI Photo Analysis] Raw content:`, content);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate and normalize the response structure
    const normalizedResult: OpenAIPhotoAnalysisResult = {
      roomType: analysisData.roomType || 'unknown',
      roomName: analysisData.roomName || 'Unknown Room',
      detectedIssues: Array.isArray(analysisData.detectedIssues) 
        ? analysisData.detectedIssues.map((issue: any) => ({
            systemType: issue.systemType || 'general',
            category: issue.category || 'unknown',
            description: issue.description || 'Issue detected',
            condition: ['excellent', 'good', 'fair', 'needs_attention', 'major_concern'].includes(issue.condition) 
              ? issue.condition 
              : 'fair',
            recommendations: issue.recommendations || 'Professional evaluation recommended',
            confidence: typeof issue.confidence === 'number' ? issue.confidence : 0.5
          }))
        : [],
      roomSuggestions: {
        floor: analysisData.roomSuggestions?.floor || undefined,
        notes: analysisData.roomSuggestions?.notes || undefined
      },
      analysisConfidence: typeof analysisData.analysisConfidence === 'number' 
        ? analysisData.analysisConfidence 
        : 0.5
    };

    console.log(`[OpenAI Photo Analysis] ✅ Analysis completed successfully`);
    console.log(`[OpenAI Photo Analysis] Room: ${normalizedResult.roomName} (${normalizedResult.roomType})`);
    console.log(`[OpenAI Photo Analysis] Issues found: ${normalizedResult.detectedIssues.length}`);
    console.log(`[OpenAI Photo Analysis] Confidence: ${normalizedResult.analysisConfidence}`);

    return normalizedResult;

  } catch (error) {
    console.error(`[OpenAI Photo Analysis] ❌ Analysis failed:`, error);
    throw error;
  }
}


