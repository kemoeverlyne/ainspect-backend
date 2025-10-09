import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
// Guard against missing API key so we fail clearly rather than sending an invalid header
const rawAnthropicKey = process.env.ANTHROPIC_API_KEY;
if (!rawAnthropicKey || rawAnthropicKey.trim().length === 0) {
  // Surface a descriptive error at runtime; route will relay this message to the client
  throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY in the backend environment.');
}

// Log a masked version once per process for easier debugging
try {
  const masked = rawAnthropicKey.length > 10
    ? `${rawAnthropicKey.slice(0, 6)}â€¦${rawAnthropicKey.slice(-4)}`
    : '***';
  // eslint-disable-next-line no-console
  console.log(`[AI] Using Anthropic key: ${masked} (masked)`);
} catch { /* noop */ }

const anthropic = new Anthropic({
  apiKey: rawAnthropicKey,
});

export interface PhotoAnalysisResult {
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

export async function analyzeInspectionPhoto(
  base64Image: string,
  existingRooms: Array<{ roomType: string; roomName: string; floor?: string }> = []
): Promise<PhotoAnalysisResult> {
  try {
    // Validate inputs
    if (!base64Image || base64Image.trim().length === 0) {
      throw new Error('No image data provided');
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Image)) {
      throw new Error('Invalid base64 image format');
    }

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

    console.log(`[AI] Detected image format: ${mediaType}`);

    const roomContext = existingRooms.length > 0 
      ? `\n\nExisting rooms in this inspection: ${existingRooms.map(r => `${r.roomName} (${r.roomType}${r.floor ? `, ${r.floor}` : ''})`).join(', ')}`
      : '';

    console.log(`[AI] Starting photo analysis for ${base64Image.length} character base64 image`);

    // Making API call to Anthropic Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
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
  "analysisConfidence": 0.90
}

Be thorough but focus on genuine issues. If nothing concerning is visible, return an empty detectedIssues array.${roomContext}`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image
            }
          }
        ]
      }]
    });

    // Validate response structure
    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from AI');
    }

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    if (!analysisText || analysisText.trim().length === 0) {
      throw new Error('No text content in AI response');
    }

    console.log(`[AI] Received response: ${analysisText.substring(0, 200)}...`);
    
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
      const match = analysisText.match(pattern);
      if (match) {
        jsonString = match[1] || match[0];
        break;
      }
    }
    
    if (!jsonString) {
      console.error('[AI] Could not extract JSON from response:', analysisText);
      throw new Error('Could not parse JSON from AI response');
    }

    // Clean up the JSON string
    jsonString = jsonString.trim();
    
    // Remove any trailing commas or incomplete JSON
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    let analysis: PhotoAnalysisResult;
    try {
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI] JSON parse error:', parseError);
      console.error('[AI] Attempted to parse:', jsonString.substring(0, 500));
      throw new Error('Invalid JSON format in AI response');
    }
    
    // Validate and normalize the response structure
    analysis = {
      roomType: analysis.roomType || 'unknown',
      roomName: analysis.roomName || 'Unknown Room',
      detectedIssues: Array.isArray(analysis.detectedIssues) ? analysis.detectedIssues : [],
      roomSuggestions: analysis.roomSuggestions || {},
      analysisConfidence: typeof analysis.analysisConfidence === 'number' ? analysis.analysisConfidence : 0.5
    };

    // Validate each detected issue
    analysis.detectedIssues = analysis.detectedIssues.map((issue: any, index: number) => ({
      systemType: issue.systemType || 'general',
      category: issue.category || 'unknown',
      description: issue.description || 'Issue detected',
      condition: ['excellent', 'good', 'fair', 'needs_attention', 'major_concern'].includes(issue.condition) 
        ? issue.condition 
        : 'fair',
      recommendations: issue.recommendations || 'Professional evaluation recommended',
      confidence: typeof issue.confidence === 'number' ? issue.confidence : 0.5
    }));

    console.log(`[AI] Analysis complete: ${analysis.roomType} - ${analysis.detectedIssues.length} issues found`);
    return analysis;
  } catch (error) {
    // Log error using production logger in real implementation
    throw new Error(`Photo analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function bulkAnalyzePhotos(
  photos: Array<{ id: string; base64: string }>,
  existingRooms: Array<{ roomType: string; roomName: string; floor?: string }> = []
): Promise<Array<{ photoId: string; analysis: PhotoAnalysisResult }>> {
  const results = [];
  
  for (const photo of photos) {
    try {
      const analysis = await analyzeInspectionPhoto(photo.base64, existingRooms);
      results.push({ photoId: photo.id, analysis });
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Photo analysis failed - continue with remaining photos
      // Continue with other photos even if one fails
    }
  }
  
  return results;
}

// Helper function to convert file to base64
export function fileToBase64(file: Buffer): string {
  return file.toString('base64');
}

// Helper function to suggest room matching
export function findBestRoomMatch(
  detectedRoomType: string,
  detectedRoomName: string,
  existingRooms: Array<{ roomType: string; roomName: string; floor?: string | undefined }>
): { roomId: number; confidence: number } | null {
  if (existingRooms.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const room of existingRooms) {
    let score = 0;
    
    // Exact room type match
    if (room.roomType === detectedRoomType) {
      score += 0.6;
    }
    
    // Similar room name
    const nameSimilarity = calculateStringSimilarity(
      room.roomName.toLowerCase(),
      detectedRoomName.toLowerCase()
    );
    score += nameSimilarity * 0.4;
    
    if (score > highestScore && score > 0.5) {
      highestScore = score;
      bestMatch = { roomId: 0, confidence: score }; // Note: Room ID would need to come from actual room data
    }
  }
  
  return bestMatch;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Text analysis for property condition notes and descriptions
export async function analyzePropertyConditionText(
  text: string,
  context: { roomType?: string; systemType?: string; propertyInfo?: any } = {}
): Promise<{
  conditionSummary: string;
  suggestedConditionLevel: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'major_concern';
  recommendations: string[];
  clientDisclosureNotes: string;
  confidenceScore: number;
}> {
  try {
    const contextInfo = context.roomType ? `Room Type: ${context.roomType}` : 
                       context.systemType ? `System Type: ${context.systemType}` : '';
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are an AI assistant helping professional home inspectors analyze inspection text descriptions. 

Analyze this home inspection text and provide insights for professional inspection reports:

Text to analyze: "${text}"
${contextInfo ? `Context: ${contextInfo}` : ''}

Provide analysis in this exact JSON format:
{
  "conditionSummary": "Brief, professional summary of the condition",
  "suggestedConditionLevel": "excellent|good|fair|needs_attention|major_concern",
  "recommendations": ["List of 1-3 specific recommendations"],
  "inspectionNotes": "Professional notes suitable for inspection report",
  "confidenceScore": 0.95
}

Condition Level Guidelines:
- excellent: Above-average condition, well-maintained
- good: Normal condition, typical wear for age
- fair: Minor issues, cosmetic concerns, normal aging
- needs_attention: Issues affecting function or appearance, recommend addressing
- major_concern: Significant issues requiring professional evaluation or immediate attention`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Invalid response format');
    
    const result = JSON.parse(content.text);
    return {
      conditionSummary: result.conditionSummary || 'Unable to assess condition',
      suggestedConditionLevel: result.suggestedConditionLevel || 'fair',
      recommendations: result.recommendations || [],
      clientDisclosureNotes: result.inspectionNotes || '',
      confidenceScore: result.confidenceScore || 0.5
    };
  } catch (error) {
    // Error analyzing text - handle gracefully
    return {
      conditionSummary: 'Analysis unavailable',
      suggestedConditionLevel: 'fair',
      recommendations: [],
      clientDisclosureNotes: 'Unable to generate inspection notes',
      confidenceScore: 0.0
    };
  }
}
