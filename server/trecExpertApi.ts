// TREC Expert AI API - Using Anthropic Claude for real-time guidance
import Anthropic from '@anthropic-ai/sdk';
import { TREC_KNOWLEDGE_BASE, searchTRECKnowledge, getTRECStandard, getContextualPrompts } from '../shared/trecKnowledgeBase';

// The newest Anthropic model is "claude-sonnet-4-20250514"
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TRECExpertRequest {
  question: string;
  context: {
    sectionType: string;
    currentSection?: string;
    inspectionFindings?: any[];
    photos?: string[];
    propertyDetails?: any;
  };
  requestType: 'guidance' | 'compliance_check' | 'photo_analysis' | 'general_question';
}

export interface TRECExpertResponse {
  answer: string;
  trecReference: string;
  actionItems: string[];
  warningFlags: string[];
  followUpQuestions: string[];
  confidence: number;
  contextualSuggestions: Array<{
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    sopReference: string;
  }>;
}

export interface PhotoAnalysisResult {
  analysis: {
    qualityScore: number;
    qualityFeedback: string;
    detectedIssues: Array<{
      title: string;
      description: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      confidence: number;
      recommendations: string[];
      trecCompliance: string;
    }>;
  };
  suggestions: Array<{
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    recommendation: string;
  }>;
}

class TRECExpertAI {
  private buildSystemPrompt(context: TRECExpertRequest['context']): string {
    const relevantStandards = Object.values(TREC_KNOWLEDGE_BASE.standards)
      .filter(standard => 
        standard.section.toLowerCase().includes(context.sectionType?.toLowerCase() || '') ||
        standard.title.toLowerCase().includes(context.currentSection?.toLowerCase() || '')
      );

    const contextualPrompts = context.sectionType ? 
      getContextualPrompts(context.sectionType.toLowerCase()) : null;

    return `You are a TREC-certified home inspection expert with comprehensive knowledge of:

TREC STANDARDS OF PRACTICE:
${relevantStandards.map(standard => `
- ${standard.title} (${standard.sopReference}):
  Requirements: ${standard.requirements.join('; ')}
  Limitations: ${standard.limitations.join('; ')}
  Common Issues: ${standard.commonIssues.join('; ')}
  Safety Alerts: ${standard.safetyAlerts?.join('; ') || 'None'}
`).join('\n')}

INSPECTION CONTEXT:
- Current Section: ${context.currentSection || 'Unknown'}
- Section Type: ${context.sectionType || 'General'}
- Recent Findings: ${JSON.stringify(context.inspectionFindings || [])}
- Property Details: ${JSON.stringify(context.propertyDetails || {})}

CONTEXTUAL GUIDANCE:
${contextualPrompts ? `
- Key Questions: ${contextualPrompts.questions.join('; ')}
- Compliance Checks: ${contextualPrompts.complianceChecks.join('; ')}
- Action Items: ${contextualPrompts.actionItems.join('; ')}
` : ''}

RESPONSE REQUIREMENTS:
1. Provide specific, actionable guidance ensuring TREC compliance
2. Include relevant TREC SOP references and regulatory requirements
3. Identify any safety concerns or warning flags
4. Suggest appropriate follow-up questions and action items
5. Rate your confidence in the response (0.0-1.0)

Always prioritize safety and TREC compliance in your responses.`;
  }

  async provideTRECGuidance(request: TRECExpertRequest): Promise<TRECExpertResponse> {
    const systemPrompt = this.buildSystemPrompt(request.context);

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: request.question
        }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response type from Claude');
      }

      // Parse the AI response and structure it
      const aiResponse = content.text;
      
      // Extract structured information from the response
      const structuredResponse = this.parseAIResponse(aiResponse, request.context);
      
      return structuredResponse;
    } catch (error) {
      console.error('TREC Expert AI Error:', error);
      return this.getErrorResponse();
    }
  }

  async analyzePhoto(photoBase64: string, context: TRECExpertRequest['context']): Promise<PhotoAnalysisResult> {
    const systemPrompt = `You are a TREC-certified inspection expert analyzing photos for compliance and defect detection.

ANALYSIS REQUIREMENTS:
1. Evaluate photo quality and clarity (rate 1-10)
2. Identify potential structural, electrical, plumbing, or HVAC issues
3. Assess severity levels: HIGH (safety concern), MEDIUM (functional issue), LOW (cosmetic)
4. Provide TREC-compliant recommendations
5. Note any code violations or safety hazards

CURRENT INSPECTION CONTEXT:
- Section: ${context.sectionType}
- Area: ${context.currentSection || 'Unknown'}

Focus on issues relevant to TREC Standards of Practice and Texas building codes.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this inspection photo for potential defects, safety issues, and TREC compliance matters. Provide a detailed assessment including quality score and specific findings.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: photoBase64
              }
            }
          ]
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response type from Claude');
      }

      return this.parsePhotoAnalysis(content.text, context);
    } catch (error) {
      console.error('Photo Analysis Error:', error);
      return {
        analysis: {
          qualityScore: 0,
          qualityFeedback: 'Analysis failed - please try again',
          detectedIssues: []
        },
        suggestions: []
      };
    }
  }

  private parseAIResponse(aiResponse: string, context: TRECExpertRequest['context']): TRECExpertResponse {
    // Extract key information from AI response
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    // Default structured response
    let response: TRECExpertResponse = {
      answer: aiResponse,
      trecReference: 'TREC SOP 535.227',
      actionItems: [],
      warningFlags: [],
      followUpQuestions: [],
      confidence: 0.85,
      contextualSuggestions: []
    };

    // Parse action items (look for bullet points or numbered lists)
    const actionLines = lines.filter(line => 
      line.includes('Action:') || 
      line.includes('Recommend:') || 
      line.includes('Should:') ||
      line.match(/^\d+\./) ||
      line.match(/^[-•]/)
    );
    
    response.actionItems = actionLines.map(line => 
      line.replace(/^[-•\d.]\s*/, '').replace(/Action:|Recommend:|Should:/gi, '').trim()
    );

    // Parse warning flags (look for safety concerns)
    const warningLines = lines.filter(line => 
      line.toLowerCase().includes('safety') ||
      line.toLowerCase().includes('hazard') ||
      line.toLowerCase().includes('warning') ||
      line.toLowerCase().includes('danger')
    );
    
    response.warningFlags = warningLines.map(line => line.trim());

    // Extract TREC references
    const trecMatch = aiResponse.match(/TREC SOP[\s]?(\d+\.\d+)/gi);
    if (trecMatch) {
      response.trecReference = trecMatch[0];
    }

    // Generate contextual suggestions based on section type
    const relevantStandards = Object.values(TREC_KNOWLEDGE_BASE.standards)
      .filter(standard => standard.section.toLowerCase().includes(context.sectionType?.toLowerCase() || ''))
      .slice(0, 3); // Limit to 3 most relevant

    response.contextualSuggestions = relevantStandards.map(standard => ({
      title: standard.title,
      content: standard.commonIssues[0] || standard.requirements[0],
      priority: 'medium' as const,
      sopReference: standard.sopReference
    }));

    return response;
  }

  private parsePhotoAnalysis(aiResponse: string, context: TRECExpertRequest['context']): PhotoAnalysisResult {
    // Extract quality score
    const qualityMatch = aiResponse.match(/quality[\s:]*(\d+)/i);
    const qualityScore = qualityMatch ? parseInt(qualityMatch[1]) : 7;

    // Extract detected issues
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    const detectedIssues = [];
    const suggestions = [];

    // Look for severity indicators
    for (const line of lines) {
      if (line.toLowerCase().includes('high') || line.toLowerCase().includes('severe')) {
        detectedIssues.push({
          title: 'High Priority Issue',
          description: line.trim(),
          severity: 'HIGH' as const,
          confidence: 0.8,
          recommendations: ['Professional inspection recommended'],
          trecCompliance: 'Immediate attention required'
        });
        
        suggestions.push({
          title: 'High Priority Finding',
          description: line.trim(),
          severity: 'HIGH' as const,
          confidence: 0.8,
          recommendation: 'Immediate professional evaluation recommended'
        });
      } else if (line.toLowerCase().includes('medium') || line.toLowerCase().includes('moderate')) {
        suggestions.push({
          title: 'Moderate Issue',
          description: line.trim(),
          severity: 'MEDIUM' as const,
          confidence: 0.7,
          recommendation: 'Monitor and consider professional evaluation'
        });
      }
    }

    return {
      analysis: {
        qualityScore,
        qualityFeedback: qualityScore >= 8 ? 'Excellent photo quality for analysis' :
                        qualityScore >= 6 ? 'Good photo quality' :
                        'Photo quality could be improved for better analysis',
        detectedIssues
      },
      suggestions
    };
  }

  private getErrorResponse(): TRECExpertResponse {
    return {
      answer: 'I apologize, but I encountered an error processing your request. Please try again or contact technical support.',
      trecReference: 'TREC SOP 535.227',
      actionItems: ['Try rephrasing your question', 'Contact technical support if issue persists'],
      warningFlags: [],
      followUpQuestions: [],
      confidence: 0,
      contextualSuggestions: []
    };
  }
}

export const trecExpertAI = new TRECExpertAI();