/**
 * Variable extraction utilities for narrative templates
 * Extracts common variables from finding text and structured data
 */

export interface ExtractedVariables {
  location?: string;
  condition?: string;
  quantity?: string;
  unit?: string;
  component?: string;
  material?: string;
  area?: string;
  roomName?: string;
  dimension?: string;
}

// Common location patterns
const LOCATION_PATTERNS = [
  /(north|south|east|west|northern|southern|eastern|western)/i,
  /(nw|ne|sw|se|northwest|northeast|southwest|southeast)/i,
  /(front|rear|back|side)/i,
  /(garage|basement|attic|crawl\s*space)/i,
  /(master|primary|guest|main)/i,
  /(bedroom\s*\d+|bathroom\s*\d+|bath\s*\d+)/i,
  /(first\s*floor|second\s*floor|third\s*floor|ground\s*floor)/i,
  /(upper|lower|middle)/i
];

// Quantity and measurement patterns
const QUANTITY_PATTERNS = [
  /(\d+)\s*(tiles|shingles|vents|outlets|panels|fixtures)/i,
  /(\d+)\s*(ft|feet|in|inches|'|")/i,
  /(\d+)\s*(square\s*feet|sq\s*ft|sf)/i,
  /(\d+)\s*(linear\s*feet|lf)/i,
  /(multiple|several|many|few)/i
];

// Condition/state patterns
const CONDITION_PATTERNS = [
  /(damaged|missing|loose|leaking|improper|corroded|cracked)/i,
  /(worn|deteriorated|broken|faulty|defective|malfunctioning)/i,
  /(blocked|clogged|disconnected|improperly\s*installed)/i,
  /(rusted|rotted|warped|sagging|settling)/i,
  /(peeling|faded|stained|discolored)/i
];

// Material patterns
const MATERIAL_PATTERNS = [
  /(wood|wooden|lumber|timber)/i,
  /(concrete|cement|masonry|brick|stone)/i,
  /(metal|steel|aluminum|copper|iron)/i,
  /(vinyl|plastic|composite|fiberglass)/i,
  /(asphalt|ceramic|tile|shingle)/i,
  /(drywall|plaster|stucco)/i
];

// Component-specific patterns
const COMPONENT_PATTERNS = [
  /(shingles?|flashing|gutters?|downspouts?)/i,
  /(outlets?|switches?|panels?|wiring)/i,
  /(pipes?|faucets?|toilets?|sinks?|drains?)/i,
  /(ductwork|vents?|units?|thermostats?)/i,
  /(windows?|doors?|frames?|sills?)/i,
  /(walls?|ceilings?|floors?|stairs?)/i
];

export class VariableExtractor {
  
  /**
   * Extract variables from finding text and structured data
   */
  static extractVariables(
    findingTitle: string,
    findingSummary: string,
    sectionName?: string,
    structuredData?: Record<string, any>
  ): ExtractedVariables {
    const text = `${findingTitle} ${findingSummary}`.toLowerCase();
    const variables: ExtractedVariables = {};

    // Extract location
    variables.location = this.extractLocation(text);
    
    // Extract condition
    variables.condition = this.extractCondition(text);
    
    // Extract quantity and measurements
    const quantityResult = this.extractQuantity(text);
    if (quantityResult.quantity) variables.quantity = quantityResult.quantity;
    if (quantityResult.unit) variables.unit = quantityResult.unit;
    
    // Extract material
    variables.material = this.extractMaterial(text);
    
    // Extract component from text or section
    variables.component = this.extractComponent(text, sectionName);
    
    // Extract room/area information
    variables.area = this.extractArea(text);
    variables.roomName = this.extractRoomName(text);
    
    // Extract dimensions
    variables.dimension = this.extractDimension(text);

    // Apply structured data overrides if available
    if (structuredData) {
      Object.assign(variables, this.extractFromStructuredData(structuredData));
    }

    // Apply defaults for missing critical variables
    return this.applyDefaults(variables);
  }

  private static extractLocation(text: string): string | undefined {
    for (const pattern of LOCATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  private static extractCondition(text: string): string | undefined {
    for (const pattern of CONDITION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  private static extractQuantity(text: string): { quantity?: string; unit?: string } {
    for (const pattern of QUANTITY_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          return { quantity: match[1], unit: match[2] };
        } else {
          return { quantity: match[1] };
        }
      }
    }
    return {};
  }

  private static extractMaterial(text: string): string | undefined {
    for (const pattern of MATERIAL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  private static extractComponent(text: string, sectionName?: string): string | undefined {
    // Try to extract from text first
    for (const pattern of COMPONENT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toLowerCase().replace(/s$/, ''); // Remove plural
      }
    }

    // Fall back to section name
    if (sectionName) {
      return sectionName.toLowerCase();
    }

    return undefined;
  }

  private static extractArea(text: string): string | undefined {
    const areaPatterns = [
      /(kitchen|bathroom|bedroom|living\s*room|dining\s*room)/i,
      /(garage|basement|attic|crawl\s*space)/i,
      /(exterior|interior|roof|foundation)/i
    ];

    for (const pattern of areaPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  private static extractRoomName(text: string): string | undefined {
    const roomPatterns = [
      /(master\s*bedroom|guest\s*bedroom|primary\s*bedroom)/i,
      /(master\s*bathroom|guest\s*bathroom|powder\s*room)/i,
      /(family\s*room|great\s*room|bonus\s*room)/i,
      /(utility\s*room|laundry\s*room|mud\s*room)/i
    ];

    for (const pattern of roomPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  private static extractDimension(text: string): string | undefined {
    const dimensionPatterns = [
      /(\d+\s*x\s*\d+)/i,
      /(\d+\s*by\s*\d+)/i,
      /(\d+(?:\.\d+)?\s*(?:ft|feet|in|inches))/i
    ];

    for (const pattern of dimensionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  /**
   * Extract variables from structured inspection data
   */
  private static extractFromStructuredData(data: Record<string, any>): Partial<ExtractedVariables> {
    const variables: Partial<ExtractedVariables> = {};

    // Location from room or area data
    if (data.room) variables.roomName = data.room;
    if (data.area) variables.area = data.area;
    if (data.location) variables.location = data.location;

    // Component from system data
    if (data.component) variables.component = data.component;
    if (data.system) variables.component = data.system;

    // Condition from status/condition fields
    if (data.condition) variables.condition = data.condition;
    if (data.status) variables.condition = data.status;

    // Material from material field
    if (data.material) variables.material = data.material;

    // Quantity from count/quantity fields
    if (data.quantity) variables.quantity = String(data.quantity);
    if (data.count) variables.quantity = String(data.count);

    return variables;
  }

  /**
   * Apply default values for missing critical variables
   */
  private static applyDefaults(variables: ExtractedVariables): ExtractedVariables {
    const defaults: ExtractedVariables = {
      location: variables.location || 'the area',
      condition: variables.condition || 'deficient',
      component: variables.component || 'component',
      area: variables.area || 'the property'
    };

    return { ...defaults, ...variables };
  }

  /**
   * Validate that all required placeholders have values
   */
  static validateVariables(
    variables: ExtractedVariables, 
    requiredPlaceholders: string[]
  ): { isValid: boolean; missing: string[] } {
    const missing = requiredPlaceholders.filter(
      placeholder => !variables[placeholder as keyof ExtractedVariables]
    );

    return {
      isValid: missing.length === 0,
      missing
    };
  }
}

/**
 * Convenience function to extract variables from a finding
 */
export function extractVariablesForFinding(
  title: string,
  summary: string,
  sectionName?: string,
  structuredData?: Record<string, any>
): ExtractedVariables {
  return VariableExtractor.extractVariables(title, summary, sectionName, structuredData);
}