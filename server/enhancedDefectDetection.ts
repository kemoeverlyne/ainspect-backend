// Enhanced AI Defect Detection System for TREC Inspections
import Anthropic from '@anthropic-ai/sdk';
import { TREC_KNOWLEDGE_BASE, getTRECStandard } from '../shared/trecKnowledgeBase';

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DefectDetectionRequest {
  photoBase64: string;
  sectionType: string;
  subsectionId?: string;
  inspectionContext: {
    propertyAge?: number;
    propertyType?: string;
    previousFindings?: any[];
    environmentalFactors?: string[];
  };
  detectionMode: 'comprehensive' | 'targeted' | 'verification';
}

export interface DetectedDefect {
  id: string;
  category: 'structural' | 'electrical' | 'plumbing' | 'hvac' | 'safety' | 'general';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  confidence: number; // 0.0 to 1.0
  title: string;
  description: string;
  location: string;
  trecCompliance: {
    sopReference: string;
    complianceLevel: 'violation' | 'concern' | 'observation';
    requiredAction: string;
  };
  recommendations: {
    immediate: string[];
    professional: string[];
    monitoring: string[];
  };
  costEstimate: {
    range: string;
    urgency: 'immediate' | 'short_term' | 'long_term';
  };
  photoEvidence: {
    boundingBox?: { x: number; y: number; width: number; height: number };
    annotations: string[];
  };
}

export interface DefectDetectionResult {
  photoQuality: {
    score: number;
    feedback: string;
    improvements: string[];
  };
  detectedDefects: DetectedDefect[];
  overallAssessment: {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    priorityActions: string[];
    trecCompliance: 'compliant' | 'concerns' | 'violations';
  };
  suggestedFollowUp: {
    additionalPhotos: string[];
    inspectionAreas: string[];
    professionalConsultation: string[];
  };
}

class EnhancedDefectDetector {
  private buildDetectionPrompt(request: DefectDetectionRequest): string {
    const relevantStandards = Object.values(TREC_KNOWLEDGE_BASE.standards)
      .filter(standard => 
        standard.section.toLowerCase().includes(request.sectionType.toLowerCase())
      );

    const contextualKnowledge = this.buildContextualKnowledge(request);

    return `You are a TREC-certified master inspector with advanced computer vision capabilities, analyzing photos for comprehensive defect detection.

INSPECTION CONTEXT:
- Section Type: ${request.sectionType}
- Subsection: ${request.subsectionId || 'General'}
- Property Age: ${request.inspectionContext.propertyAge || 'Unknown'}
- Property Type: ${request.inspectionContext.propertyType || 'Unknown'}
- Detection Mode: ${request.detectionMode}

RELEVANT TREC STANDARDS:
${relevantStandards.map(standard => `
${standard.title} (${standard.sopReference}):
- Requirements: ${standard.requirements.join('; ')}
- Common Issues: ${standard.commonIssues.join('; ')}
- Safety Alerts: ${standard.safetyAlerts?.join('; ') || 'None'}
`).join('\n')}

CONTEXTUAL KNOWLEDGE:
${contextualKnowledge}

ANALYSIS REQUIREMENTS:
1. Photo Quality Assessment (1-10 score with specific feedback)
2. Comprehensive Defect Detection with:
   - Precise defect identification and classification
   - TREC compliance evaluation
   - Severity assessment (CRITICAL/HIGH/MEDIUM/LOW/INFORMATIONAL)
   - Confidence scoring (0.0-1.0)
   - Specific location identification
   - Cost estimation and urgency classification

3. TREC-Specific Focus Areas:
   - Code violations and safety hazards
   - Structural integrity concerns
   - System functionality issues
   - Maintenance and wear indicators
   - Environmental factors

4. Professional Recommendations:
   - Immediate safety actions
   - Professional consultation needs
   - Long-term monitoring requirements

RESPONSE FORMAT: Provide detailed analysis in structured format focusing on actionable findings that comply with TREC Standards of Practice.`;
  }

  private buildContextualKnowledge(request: DefectDetectionRequest): string {
    let knowledge = '';

    // Add section-specific detection parameters
    switch (request.sectionType.toLowerCase()) {
      case 'structural':
        knowledge += `
STRUCTURAL DEFECT INDICATORS:
- Foundation: Cracks >1/4", settlement signs, water intrusion, inadequate support
- Roof: Missing/damaged materials, flashing issues, structural sagging, water damage
- Walls: Cracks, bowing, moisture damage, structural movement indicators
- Floors: Sagging, squeaking, gaps, structural support issues
- Windows/Doors: Operation issues, seal failures, frame damage, security concerns
        `;
        break;

      case 'electrical':
        knowledge += `
ELECTRICAL SAFETY INDICATORS:
- Panels: Federal Pacific/Zinsco brands (immediate safety concern), double-tapped breakers, overheating signs
- Wiring: Exposed conductors, improper splices, aluminum wiring concerns, knob-and-tube
- GFCI: Missing protection in wet areas, non-functional devices, wrong outlet types
- Grounding: Missing equipment grounding, improper bonding, code violations
- Overloading: Extension cord reliance, insufficient outlets, oversized breakers
        `;
        break;

      case 'hvac':
        knowledge += `
HVAC SYSTEM INDICATORS:
- Heating: Cracked heat exchangers (CO hazard), improper venting, combustion air issues
- Cooling: Refrigerant leaks, dirty coils, inadequate maintenance, oversizing/undersizing
- Distribution: Disconnected ducts, missing insulation, inadequate return air
- Safety: Gas leaks, electrical hazards, carbon monoxide risks, fire safety
        `;
        break;

      case 'plumbing':
        knowledge += `
PLUMBING DEFECT INDICATORS:
- Supply: Low pressure, pipe material concerns (polybutylene, galvanized), leaks
- Drainage: Slow drainage, improper venting, cast iron deterioration, blockages
- Fixtures: Leaks, operation issues, improper installations, code violations
- Water Heater: Venting issues, TPR valve problems, age-related concerns, efficiency
        `;
        break;
    }

    // Add environmental factors
    if (request.inspectionContext.environmentalFactors?.length) {
      knowledge += `
ENVIRONMENTAL FACTORS TO CONSIDER:
${request.inspectionContext.environmentalFactors.join(', ')}
      `;
    }

    return knowledge;
  }

  async detectDefects(request: DefectDetectionRequest): Promise<DefectDetectionResult> {
    const systemPrompt = this.buildDetectionPrompt(request);

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Perform comprehensive TREC-compliant defect analysis of this ${request.sectionType} inspection photo. Focus on detecting safety hazards, code violations, and functional issues. Provide specific, actionable findings with TREC compliance assessment.`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: request.photoBase64
              }
            }
          ]
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response type from Claude');
      }

      return this.parseDefectDetectionResponse(content.text, request);
    } catch (error) {
      console.error('Enhanced Defect Detection Error:', error);
      return this.getErrorResponse();
    }
  }

  private parseDefectDetectionResponse(aiResponse: string, request: DefectDetectionRequest): DefectDetectionResult {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    // Extract photo quality score
    const qualityMatch = aiResponse.match(/quality[\s:]*(\d+)/i);
    const qualityScore = qualityMatch ? parseInt(qualityMatch[1]) : 7;

    // Parse detected defects from AI response
    const detectedDefects: DetectedDefect[] = [];
    let currentDefect: Partial<DetectedDefect> | null = null;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Detect high-priority/critical issues
      if (lowerLine.includes('critical') || lowerLine.includes('immediate') || lowerLine.includes('safety')) {
        detectedDefects.push(this.createDefectFromLine(line, 'CRITICAL', request.sectionType));
      }
      // Detect high priority issues
      else if (lowerLine.includes('high') || lowerLine.includes('severe') || lowerLine.includes('significant')) {
        detectedDefects.push(this.createDefectFromLine(line, 'HIGH', request.sectionType));
      }
      // Detect medium priority issues
      else if (lowerLine.includes('medium') || lowerLine.includes('moderate') || lowerLine.includes('concern')) {
        detectedDefects.push(this.createDefectFromLine(line, 'MEDIUM', request.sectionType));
      }
      // Detect low priority observations
      else if (lowerLine.includes('minor') || lowerLine.includes('observation') || lowerLine.includes('maintenance')) {
        detectedDefects.push(this.createDefectFromLine(line, 'LOW', request.sectionType));
      }
    }

    // Add section-specific common defects if found
    const sectionDefects = this.detectSectionSpecificIssues(aiResponse, request.sectionType);
    detectedDefects.push(...sectionDefects);

    // Calculate overall assessment
    const overallAssessment = this.calculateOverallAssessment(detectedDefects);

    return {
      photoQuality: {
        score: qualityScore,
        feedback: qualityScore >= 8 ? 'Excellent photo quality for detailed analysis' :
                  qualityScore >= 6 ? 'Good photo quality with minor limitations' :
                  'Photo quality could be improved for more accurate detection',
        improvements: qualityScore < 8 ? [
          'Ensure adequate lighting for clear detail visibility',
          'Focus on key areas mentioned in TREC standards',
          'Include measurement reference for defects',
          'Capture multiple angles for complex issues'
        ] : []
      },
      detectedDefects: detectedDefects.slice(0, 8), // Limit to most significant findings
      overallAssessment,
      suggestedFollowUp: {
        additionalPhotos: this.generatePhotoSuggestions(detectedDefects, request.sectionType),
        inspectionAreas: this.generateInspectionSuggestions(detectedDefects),
        professionalConsultation: this.generateProfessionalRecommendations(detectedDefects)
      }
    };
  }

  private createDefectFromLine(line: string, severity: DetectedDefect['severity'], sectionType: string): DetectedDefect {
    const cleanLine = line.replace(/^[-•\d.]\s*/, '').trim();
    
    return {
      id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: this.categorizeDefect(sectionType),
      severity,
      confidence: severity === 'CRITICAL' ? 0.9 : severity === 'HIGH' ? 0.8 : 0.7,
      title: this.extractDefectTitle(cleanLine),
      description: cleanLine,
      location: 'Visible in photo',
      trecCompliance: {
        sopReference: this.getTRECReference(sectionType),
        complianceLevel: severity === 'CRITICAL' ? 'violation' : severity === 'HIGH' ? 'concern' : 'observation',
        requiredAction: severity === 'CRITICAL' ? 'Immediate professional evaluation required' : 
                        'Professional inspection recommended'
      },
      recommendations: {
        immediate: severity === 'CRITICAL' ? ['Professional evaluation required immediately'] : [],
        professional: [`${sectionType} specialist evaluation`],
        monitoring: severity === 'LOW' ? ['Monitor for changes over time'] : []
      },
      costEstimate: {
        range: this.estimateCost(severity),
        urgency: severity === 'CRITICAL' ? 'immediate' : severity === 'HIGH' ? 'short_term' : 'long_term'
      },
      photoEvidence: {
        annotations: ['Visible defect in provided photo']
      }
    };
  }

  private categorizeDefect(sectionType: string): DetectedDefect['category'] {
    switch (sectionType.toLowerCase()) {
      case 'structural': return 'structural';
      case 'electrical': return 'electrical';
      case 'plumbing': return 'plumbing';
      case 'hvac': return 'hvac';
      default: return 'general';
    }
  }

  private extractDefectTitle(description: string): string {
    const words = description.split(' ');
    return words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
  }

  private getTRECReference(sectionType: string): string {
    switch (sectionType.toLowerCase()) {
      case 'structural': return 'TREC SOP 535.227(b)';
      case 'electrical': return 'TREC SOP 535.227(c)';
      case 'plumbing': return 'TREC SOP 535.227(d)';
      case 'hvac': return 'TREC SOP 535.227(e)';
      default: return 'TREC SOP 535.227';
    }
  }

  private estimateCost(severity: DetectedDefect['severity']): string {
    switch (severity) {
      case 'CRITICAL': return '$1,000 - $10,000+';
      case 'HIGH': return '$500 - $5,000';
      case 'MEDIUM': return '$200 - $2,000';
      case 'LOW': return '$100 - $500';
      default: return 'Varies';
    }
  }

  private detectSectionSpecificIssues(aiResponse: string, sectionType: string): DetectedDefect[] {
    const defects: DetectedDefect[] = [];
    const lowerResponse = aiResponse.toLowerCase();

    // Electrical-specific detection
    if (sectionType === 'electrical') {
      if (lowerResponse.includes('federal pacific') || lowerResponse.includes('fpe')) {
        defects.push({
          id: 'fpe-panel-detected',
          category: 'electrical',
          severity: 'CRITICAL',
          confidence: 0.95,
          title: 'Federal Pacific Panel Detected',
          description: 'Federal Pacific Electric panel identified - known safety hazard',
          location: 'Main electrical panel',
          trecCompliance: {
            sopReference: 'TREC SOP 535.227(c)(1)',
            complianceLevel: 'violation',
            requiredAction: 'Immediate electrical panel replacement recommended'
          },
          recommendations: {
            immediate: ['Do not operate electrical system under load', 'Contact licensed electrician immediately'],
            professional: ['Licensed electrician panel replacement'],
            monitoring: []
          },
          costEstimate: {
            range: '$2,000 - $4,000',
            urgency: 'immediate'
          },
          photoEvidence: {
            annotations: ['FPE panel brand identification in photo']
          }
        });
      }
    }

    return defects;
  }

  private calculateOverallAssessment(defects: DetectedDefect[]): DefectDetectionResult['overallAssessment'] {
    const criticalCount = defects.filter(d => d.severity === 'CRITICAL').length;
    const highCount = defects.filter(d => d.severity === 'HIGH').length;
    
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    let trecCompliance: 'compliant' | 'concerns' | 'violations';

    if (criticalCount > 0) {
      riskLevel = 'critical';
      trecCompliance = 'violations';
    } else if (highCount > 0) {
      riskLevel = 'high';
      trecCompliance = 'concerns';
    } else if (defects.length > 2) {
      riskLevel = 'moderate';
      trecCompliance = 'concerns';
    } else {
      riskLevel = 'low';
      trecCompliance = 'compliant';
    }

    const priorityActions = defects
      .filter(d => d.severity === 'CRITICAL' || d.severity === 'HIGH')
      .map(d => d.recommendations.immediate[0] || d.title)
      .slice(0, 3);

    return {
      riskLevel,
      priorityActions,
      trecCompliance
    };
  }

  private generatePhotoSuggestions(defects: DetectedDefect[], sectionType: string): string[] {
    const suggestions = [
      `Additional ${sectionType} overview photos from different angles`,
      'Close-up detail shots of identified defects with measurement reference'
    ];

    if (defects.some(d => d.severity === 'CRITICAL' || d.severity === 'HIGH')) {
      suggestions.push('Before and after photos if immediate repairs are made');
    }

    return suggestions;
  }

  private generateInspectionSuggestions(defects: DetectedDefect[]): string[] {
    return [
      'Inspect surrounding areas for similar conditions',
      'Check related systems that may be affected',
      'Verify proper functionality of connected components'
    ];
  }

  private generateProfessionalRecommendations(defects: DetectedDefect[]): string[] {
    const recommendations = new Set<string>();
    
    defects.forEach(defect => {
      defect.recommendations.professional.forEach(rec => recommendations.add(rec));
    });

    return Array.from(recommendations).slice(0, 3);
  }

  private getErrorResponse(): DefectDetectionResult {
    return {
      photoQuality: {
        score: 0,
        feedback: 'Unable to analyze photo quality',
        improvements: ['Please try uploading the photo again']
      },
      detectedDefects: [],
      overallAssessment: {
        riskLevel: 'low',
        priorityActions: [],
        trecCompliance: 'compliant'
      },
      suggestedFollowUp: {
        additionalPhotos: [],
        inspectionAreas: [],
        professionalConsultation: []
      }
    };
  }
}

export const enhancedDefectDetector = new EnhancedDefectDetector();