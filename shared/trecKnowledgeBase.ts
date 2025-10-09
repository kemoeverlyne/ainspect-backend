// TREC Knowledge Base - Comprehensive Standards of Practice and Regulations
// Based on TREC Online SOPs, Printable Booklet, and FAQ resources

export interface TRECStandard {
  id: string;
  section: string;
  title: string;
  requirements: string[];
  limitations: string[];
  commonIssues: string[];
  recommendations: string[];
  safetyAlerts?: string[];
  modernCodes?: string[];
  sopReference: string;
}

export interface TRECContextualPrompt {
  trigger: string;
  questions: string[];
  followUpQuestions: string[];
  complianceChecks: string[];
  actionItems: string[];
}

export interface TRECKnowledgeBase {
  standards: Record<string, TRECStandard>;
  contextualPrompts: Record<string, TRECContextualPrompt>;
  faqs: Record<string, string>;
  regulations: Record<string, string>;
  bestPractices: Record<string, string[]>;
}

export const TREC_KNOWLEDGE_BASE: TRECKnowledgeBase = {
  standards: {
    // STRUCTURAL SYSTEMS
    'structural-foundation': {
      id: 'structural-foundation',
      section: 'Structural',
      title: 'Foundation Systems',
      requirements: [
        'Inspect visible and accessible foundation elements',
        'Document foundation walls, piers, slab, and crawlspace conditions', 
        'Check for structural movement, settlement, or deterioration',
        'Evaluate foundation drainage and moisture control',
        'Report deficiencies that may affect structural integrity'
      ],
      limitations: [
        'Cannot inspect areas covered by stored items or debris',
        'No destructive testing or removal of materials', 
        'Cannot determine foundation design adequacy',
        'Areas below grade not accessible for inspection'
      ],
      commonIssues: [
        'Settlement cracks greater than 1/4 inch',
        'Moisture intrusion and water damage',
        'Inadequate foundation ventilation',
        'Missing or damaged foundation support elements',
        'Improper foundation repairs'
      ],
      recommendations: [
        'Professional structural engineer evaluation for significant cracks',
        'Foundation moisture remediation specialists',
        'Proper foundation drainage installation',
        'Foundation repair specialists for settlement issues'
      ],
      sopReference: 'TREC SOP 535.227(b)(1)'
    },

    'structural-framing': {
      id: 'structural-framing',
      section: 'Structural', 
      title: 'Structural Framing',
      requirements: [
        'Inspect visible structural framing members',
        'Check beams, columns, joists, and load-bearing elements',
        'Document structural deficiencies and damage',
        'Evaluate structural modifications and alterations'
      ],
      limitations: [
        'Only visible and accessible areas inspected',
        'Cannot determine structural design compliance',
        'No load calculations or engineering analysis performed'
      ],
      commonIssues: [
        'Sagging or damaged floor joists',
        'Missing or inadequate structural support',
        'Unauthorized structural modifications',
        'Termite or pest damage to framing',
        'Water damage to structural members'
      ],
      recommendations: [
        'Structural engineer evaluation for framing issues',
        'Pest control treatment for insect damage',
        'Professional repair of damaged framing members'
      ],
      sopReference: 'TREC SOP 535.227(b)(2)'
    },

    // ELECTRICAL SYSTEMS
    'electrical-service': {
      id: 'electrical-service',
      section: 'Electrical',
      title: 'Service Entrance and Panels',
      requirements: [
        'Inspect main electrical panel and service entrance',
        'Verify proper electrical grounding and bonding',
        'Check circuit breaker and fuse panel conditions',
        'Test main disconnect and overcurrent protection',
        'Document electrical service capacity and adequacy'
      ],
      limitations: [
        'Cannot remove panel covers or perform invasive testing',
        'No load calculations performed',
        'Cannot determine code compliance for installation date'
      ],
      commonIssues: [
        'Double-tapped circuit breakers',
        'Improper electrical panel labeling',
        'Missing or inadequate grounding',
        'Oversized breakers for wire gauge',
        'Federal Pacific or Zinsco panels (known hazards)'
      ],
      recommendations: [
        'Licensed electrician evaluation for panel upgrades',
        'Professional electrical safety inspection',
        'GFCI and AFCI protection installation',
        'Electrical service upgrade for inadequate capacity'
      ],
      safetyAlerts: [
        'Federal Pacific Stab-Lok panels - known fire hazard',
        'Zinsco panels - known safety issues',
        'Knob and tube wiring - obsolete and potentially dangerous'
      ],
      modernCodes: [
        '2023 NEC AFCI requirements for bedrooms and living areas',
        'GFCI protection for all bathroom, kitchen, and outdoor outlets',
        'Whole house surge protection requirements'
      ],
      sopReference: 'TREC SOP 535.227(c)(1)'
    },

    'electrical-outlets': {
      id: 'electrical-outlets',
      section: 'Electrical',
      title: 'Outlets and GFCI Protection',
      requirements: [
        'Test all accessible electrical outlets',
        'Verify GFCI protection where required',
        'Check outlet polarity and grounding',
        'Document missing or non-functional GFCI devices',
        'Test GFCI outlets for proper operation'
      ],
      limitations: [
        'Only accessible outlets tested',
        'Cannot test outlets behind furniture or appliances',
        'No electrical load testing performed'
      ],
      commonIssues: [
        'Missing GFCI protection in required locations',
        'Non-functional GFCI outlets',
        'Reversed polarity or open ground conditions', 
        'Damaged or loose outlet connections',
        'Insufficient outlet coverage per code'
      ],
      recommendations: [
        'GFCI outlet installation in required locations',
        'Licensed electrician for electrical repairs',
        'Outlet replacement for damaged receptacles'
      ],
      sopReference: 'TREC SOP 535.227(c)(3)'
    },

    // PLUMBING SYSTEMS  
    'plumbing-supply': {
      id: 'plumbing-supply',
      section: 'Plumbing',
      title: 'Water Supply System',
      requirements: [
        'Test water pressure and flow at fixtures',
        'Inspect visible supply piping and connections',
        'Check for leaks and water damage',
        'Evaluate water quality and pressure',
        'Document supply piping materials and conditions'
      ],
      limitations: [
        'Only visible and accessible piping inspected',
        'No pressure testing or invasive inspection',
        'Cannot determine piping behind walls'
      ],
      commonIssues: [
        'Low water pressure at fixtures',
        'Galvanized steel pipe corrosion',
        'Polybutylene piping (known to fail)',
        'Leaking pipe connections and joints',
        'Inadequate water heater capacity'
      ],
      recommendations: [
        'Licensed plumber for pipe replacement',
        'Water pressure booster system installation',
        'Polybutylene piping replacement',
        'Professional leak detection and repair'
      ],
      sopReference: 'TREC SOP 535.227(d)(1)'
    },

    'plumbing-drainage': {
      id: 'plumbing-drainage',
      section: 'Plumbing', 
      title: 'Drainage and Waste Systems',
      requirements: [
        'Test all accessible drains for proper operation',
        'Inspect visible drain, waste, and vent piping',
        'Check for leaks and blockages',
        'Evaluate fixture drainage and venting'
      ],
      limitations: [
        'Cannot perform camera inspection of drain lines',
        'No pressure testing of waste systems',
        'Cannot inspect piping inside walls'
      ],
      commonIssues: [
        'Slow drainage at fixtures',
        'Clogged or blocked drain lines',
        'Improper drain venting',
        'Cast iron drain pipe deterioration',
        'Missing or inadequate cleanouts'
      ],
      recommendations: [
        'Professional drain cleaning services',
        'Camera inspection of drain lines',
        'Cast iron pipe replacement',
        'Proper drain venting installation'
      ],
      sopReference: 'TREC SOP 535.227(d)(2)'
    },

    // HVAC SYSTEMS
    'hvac-heating': {
      id: 'hvac-heating',
      section: 'HVAC',
      title: 'Heating Equipment',
      requirements: [
        'Operate heating system using normal controls',
        'Inspect heating equipment and components',
        'Check flue pipes and venting systems',
        'Evaluate heating system safety and operation',
        'Test heating system performance and distribution'
      ],
      limitations: [
        'Will not operate system when outside temperature exceeds 65°F',
        'Cannot disassemble equipment for internal inspection',
        'No efficiency testing or combustion analysis'
      ],
      commonIssues: [
        'Cracked heat exchanger (safety hazard)',
        'Improper flue pipe installation or damage',
        'Missing or inadequate combustion air',
        'Dirty or clogged heating equipment',
        'Inadequate heating system maintenance'
      ],
      recommendations: [
        'HVAC technician for heat exchanger inspection',
        'Professional heating system cleaning and maintenance',
        'Carbon monoxide detector installation',
        'Flue pipe repair or replacement'
      ],
      safetyAlerts: [
        'Cracked heat exchanger - carbon monoxide hazard',
        'Improper flue venting - carbon monoxide risk',
        'Missing combustion air - safety concern'
      ],
      sopReference: 'TREC SOP 535.227(e)(1)'
    },

    'hvac-cooling': {
      id: 'hvac-cooling',
      section: 'HVAC',
      title: 'Cooling Equipment', 
      requirements: [
        'Operate cooling system using normal controls',
        'Check refrigerant lines and insulation',
        'Inspect condenser unit and evaporator coil',
        'Evaluate cooling system performance',
        'Test system operation and temperature differential'
      ],
      limitations: [
        'Will not operate when outside temperature below 60°F',
        'No refrigerant pressure testing performed',
        'Cannot determine refrigerant charge level'
      ],
      commonIssues: [
        'Refrigerant leaks and low charge',
        'Dirty or damaged condenser coils',
        'Missing or damaged refrigerant line insulation',
        'Inadequate cooling system maintenance',
        'Oversized or undersized equipment'
      ],
      recommendations: [
        'HVAC technician for refrigerant service',
        'Professional coil cleaning and maintenance',
        'Refrigerant line insulation repair',
        'System sizing evaluation'
      ],
      sopReference: 'TREC SOP 535.227(e)(2)'
    },

    'hvac-distribution': {
      id: 'hvac-distribution',
      section: 'HVAC',
      title: 'Air Distribution Systems',
      requirements: [
        'Inspect accessible ductwork and components',
        'Check supply and return air systems',
        'Evaluate ductwork support and insulation',
        'Test airflow at supply registers'
      ],
      limitations: [
        'Only accessible ductwork inspected',
        'No duct pressure testing performed',
        'Cannot inspect ducts inside walls or inaccessible areas'
      ],
      commonIssues: [
        'Disconnected or damaged ductwork',
        'Missing or inadequate duct insulation',
        'Undersized return air systems',
        'Ductwork not properly supported',
        'Excessive duct leakage'
      ],
      recommendations: [
        'Professional duct sealing and insulation',
        'Ductwork repair and replacement',
        'Return air system upgrade',
        'Duct cleaning services'
      ],
      sopReference: 'TREC SOP 535.227(e)(3)'
    }
  },

  contextualPrompts: {
    'foundationCracks': {
      trigger: 'foundation crack detected',
      questions: [
        'Is this crack wider than 1/4 inch?',
        'Does the crack show signs of recent movement?',
        'Are there multiple cracks in the same area?',
        'Is there evidence of water intrusion through the crack?'
      ],
      followUpQuestions: [
        'Have you noticed any doors or windows sticking?',
        'Are there any new cracks appearing inside the home?',
        'When was the last time this area was inspected?'
      ],
      complianceChecks: [
        'Document crack width and location per TREC SOP',
        'Photograph crack with measurement reference',
        'Note any associated structural movement'
      ],
      actionItems: [
        'Measure and document crack dimensions',
        'Check for additional cracks in area',
        'Recommend structural engineer evaluation if >1/4 inch'
      ]
    },

    'electricalPanels': {
      trigger: 'electrical panel inspection',
      questions: [
        'Are all circuits properly labeled?',
        'Any double-tapped breakers present?',
        'Is the panel manufacturer Federal Pacific or Zinsco?',
        'Are there any signs of overheating or arcing?'
      ],
      followUpQuestions: [
        'When was the electrical system last updated?',
        'Have there been any electrical issues reported?',
        'Are GFCI and AFCI protections installed per current codes?'
      ],
      complianceChecks: [
        'Verify main disconnect accessibility',
        'Check for proper panel clearances',
        'Document any code violations'
      ],
      actionItems: [
        'Test main disconnect operation',
        'Document panel manufacturer and model',
        'Note any safety concerns or hazards'
      ]
    },

    'roofingInspection': {
      trigger: 'roofing system inspection',
      questions: [
        'What type of roofing material is present?',
        'Are there any missing or damaged shingles visible?',
        'How is the condition of flashing around penetrations?',
        'Are gutters and downspouts properly attached?'
      ],
      followUpQuestions: [
        'What is the approximate age of the roofing system?',
        'Have there been any recent roof repairs?',
        'Is adequate attic ventilation present?'
      ],
      complianceChecks: [
        'Document roof inspection method (ground level, ladder, etc.)',
        'Note any safety limitations affecting inspection',
        'Identify areas not visible during inspection'
      ],
      actionItems: [
        'Photograph any visible deficiencies',
        'Check interior for signs of water intrusion',
        'Evaluate roof drainage and gutters'
      ]
    },

    'plumbingLeaks': {
      trigger: 'plumbing leak detected',
      questions: [
        'Is this an active leak or water damage?',
        'What type of piping is involved?',
        'Is there evidence of ongoing water damage?',
        'Are there water pressure issues at fixtures?'
      ],
      followUpQuestions: [
        'How long has this leak been present?',
        'Have there been other plumbing issues in the home?',
        'Is the water heater functioning properly?'
      ],
      complianceChecks: [
        'Document leak location and severity',
        'Check for associated water damage',
        'Note impact on structural elements'
      ],
      actionItems: [
        'Test water pressure at nearby fixtures',
        'Check for additional leaks in area',
        'Document water damage extent'
      ]
    }
  },

  faqs: {
    'inspection-scope': 'TREC inspections are visual inspections of readily accessible systems and components. Inspectors cannot perform destructive testing or move personal property to access systems.',
    'foundation-cracks': 'Cracks wider than 1/4 inch should be evaluated by a structural engineer. Smaller cracks are common in Texas due to soil conditions but should be monitored.',
    'electrical-panels': 'Federal Pacific and Zinsco panels have known safety issues and should be evaluated by a licensed electrician for potential replacement.',
    'gfci-requirements': 'GFCI protection is required in bathrooms, kitchens, garages, outdoor outlets, and other wet locations per current electrical codes.',
    'hvac-operation': 'HVAC systems are operated using normal controls during favorable weather conditions. Systems are not operated when temperatures are extreme.',
    'plumbing-pressure': 'Water pressure should be adequate at all fixtures. Low pressure may indicate supply line issues, valve problems, or inadequate system capacity.'
  },

  regulations: {
    'sop-compliance': 'All inspections must comply with TREC Standards of Practice Rule 535.227',
    'reporting-requirements': 'Inspectors must report deficiencies that affect safety or function of systems and components',
    'inspection-limitations': 'Inspections are limited to readily accessible and visible components only',
    'continuing-education': 'Inspectors must complete required continuing education to maintain TREC license'
  },

  bestPractices: {
    'documentation': [
      'Take high-quality photographs of all deficiencies',
      'Provide clear and concise descriptions of issues',
      'Include specific locations and measurements when applicable',
      'Reference applicable codes and standards when relevant'
    ],
    'safety': [
      'Always prioritize inspector and occupant safety',
      'Do not operate systems when unsafe conditions exist',
      'Identify and report immediate safety hazards',
      'Recommend professional evaluation when uncertain'
    ],
    'communication': [
      'Explain findings clearly to clients',
      'Provide appropriate recommendations for repairs',
      'Maintain professional boundaries regarding repair advice',
      'Refer clients to qualified professionals for repairs'
    ]
  }
};

// Helper functions for knowledge base queries
export function getTRECStandard(id: string): TRECStandard | undefined {
  return TREC_KNOWLEDGE_BASE.standards[id];
}

export function getContextualPrompts(trigger: string): TRECContextualPrompt | undefined {
  return TREC_KNOWLEDGE_BASE.contextualPrompts[trigger];
}

export function searchTRECKnowledge(query: string): {
  standards: TRECStandard[];
  faqs: Array<{ question: string; answer: string }>;
  bestPractices: string[];
} {
  const searchTerm = query.toLowerCase();
  
  const matchingStandards = Object.values(TREC_KNOWLEDGE_BASE.standards).filter(standard =>
    standard.title.toLowerCase().includes(searchTerm) ||
    standard.section.toLowerCase().includes(searchTerm) ||
    standard.requirements.some(req => req.toLowerCase().includes(searchTerm)) ||
    standard.commonIssues.some(issue => issue.toLowerCase().includes(searchTerm))
  );

  const matchingFAQs = Object.entries(TREC_KNOWLEDGE_BASE.faqs)
    .filter(([key, value]) => 
      key.includes(searchTerm) || value.toLowerCase().includes(searchTerm)
    )
    .map(([question, answer]) => ({ question, answer }));

  const matchingBestPractices = Object.values(TREC_KNOWLEDGE_BASE.bestPractices)
    .flat()
    .filter(practice => practice.toLowerCase().includes(searchTerm));

  return {
    standards: matchingStandards,
    faqs: matchingFAQs,
    bestPractices: matchingBestPractices
  };
}

export function getTRECComplianceChecklist(sectionType: string): string[] {
  const relevantStandards = Object.values(TREC_KNOWLEDGE_BASE.standards)
    .filter(standard => standard.section.toLowerCase() === sectionType.toLowerCase());
  
  const checklist: string[] = [];
  
  relevantStandards.forEach(standard => {
    checklist.push(...standard.requirements);
    if (standard.safetyAlerts) {
      checklist.push(...standard.safetyAlerts.map(alert => `🚨 SAFETY: ${alert}`));
    }
  });
  
  return checklist;
}