import { narrativeService } from '../services/narratives';
import type { InsertNarrative } from '@shared/schema';

// Sample narratives for seeding companies
export const sampleNarratives: Omit<InsertNarrative, 'companyId' | 'createdBy'>[] = [
  // ROOFING Narratives
  {
    title: "Roof Shingle Damage",
    body: "The {{material}} shingles on the {{location}} roof show signs of {{condition}}. This condition affects approximately {{quantity}} shingles and may allow water penetration. Recommend evaluation by a qualified roofing contractor for repair or replacement.",
    category: "ROOFING",
    component: "Shingles",
    severity: "MAJOR",
    tags: ["damage", "weathering", "replacement", "repair"],
    language: "en-US"
  },
  {
    title: "Flashing Issues",
    body: "The {{component}} flashing at the {{location}} appears {{condition}}. This condition compromises the weatherproofing of the roof system. Recommend repair or replacement by a qualified roofing contractor to prevent water intrusion.",
    category: "ROOFING", 
    component: "Flashing",
    severity: "MAJOR",
    tags: ["flashing", "leak", "water damage", "repair"],
    language: "en-US"
  },
  {
    title: "Gutter Maintenance Required",
    body: "The gutters and downspouts on the {{location}} section show {{condition}}. This condition may result in improper water drainage and potential foundation issues. Recommend cleaning and repair by a qualified contractor.",
    category: "ROOFING",
    component: "Gutters",
    severity: "MINOR", 
    tags: ["gutters", "drainage", "maintenance", "cleaning"],
    language: "en-US"
  },

  // ELECTRICAL Narratives
  {
    title: "GFCI Protection Missing",
    body: "The {{component}} outlets in the {{area}} lack proper GFCI protection as required by current electrical codes. This condition presents a potential safety hazard. Recommend installation of GFCI protection by a licensed electrician.",
    category: "ELECTRICAL",
    component: "Outlets",
    severity: "SAFETY",
    tags: ["GFCI", "safety", "code compliance", "outlets"],
    language: "en-US"
  },
  {
    title: "Electrical Panel Issues",
    body: "The main electrical panel shows {{condition}}. The {{component}} in the panel require attention. This condition may affect electrical safety and performance. Recommend evaluation by a licensed electrician.",
    category: "ELECTRICAL",
    component: "Electrical Panel",
    severity: "MAJOR",
    tags: ["panel", "breakers", "safety", "repair"],
    language: "en-US"
  },
  {
    title: "Wiring Concerns",
    body: "The electrical wiring in the {{area}} appears {{condition}}. This {{material}} wiring may not meet current electrical codes or safety standards. Recommend evaluation and potential upgrade by a licensed electrician.",
    category: "ELECTRICAL",
    component: "Wiring",
    severity: "MAJOR",
    tags: ["wiring", "old", "upgrade", "safety"],
    language: "en-US"
  },

  // PLUMBING Narratives
  {
    title: "Water Pressure Issues",
    body: "The {{component}} in the {{roomName}} demonstrates {{condition}} water pressure. This condition may indicate plumbing system issues affecting {{quantity}} fixtures. Recommend evaluation by a licensed plumber.",
    category: "PLUMBING",
    component: "Faucets",
    severity: "MINOR",
    tags: ["pressure", "flow", "fixtures", "repair"],
    language: "en-US"
  },
  {
    title: "Pipe Leakage",
    body: "The {{material}} {{component}} shows evidence of {{condition}}. Water damage or staining is visible in the {{location}}. This condition requires immediate attention to prevent further damage. Recommend repair by a licensed plumber.",
    category: "PLUMBING",
    component: "Pipes",
    severity: "MAJOR",
    tags: ["leak", "water damage", "pipes", "repair"],
    language: "en-US"
  },
  {
    title: "Toilet Installation Issues",
    body: "The toilet in the {{roomName}} shows {{condition}}. The {{component}} may not be properly secured or sealed. This condition could lead to water damage or sanitary issues. Recommend evaluation by a licensed plumber.",
    category: "PLUMBING",
    component: "Toilet",
    severity: "MINOR",
    tags: ["toilet", "installation", "seal", "repair"],
    language: "en-US"
  },

  // HVAC Narratives
  {
    title: "Air Filter Replacement Needed",
    body: "The air filter in the HVAC system appears {{condition}}. This condition reduces system efficiency and indoor air quality. Recommend immediate filter replacement and regular maintenance schedule.",
    category: "HVAC",
    component: "Air Filter",
    severity: "MINOR",
    tags: ["filter", "maintenance", "air quality", "efficiency"],
    language: "en-US"
  },
  {
    title: "Ductwork Issues",
    body: "The {{component}} in the {{location}} shows {{condition}}. This condition affects system efficiency and may impact heating and cooling performance. Recommend evaluation and repair by a qualified HVAC technician.",
    category: "HVAC",
    component: "Ductwork", 
    severity: "MAJOR",
    tags: ["ducts", "insulation", "air flow", "efficiency"],
    language: "en-US"
  },
  {
    title: "HVAC Unit Maintenance",
    body: "The {{component}} unit shows signs of {{condition}}. Regular maintenance appears to have been deferred. This condition may affect system performance and longevity. Recommend professional HVAC service and maintenance.",
    category: "HVAC",
    component: "HVAC Unit",
    severity: "MINOR", 
    tags: ["maintenance", "service", "performance", "efficiency"],
    language: "en-US"
  },

  // EXTERIOR Narratives
  {
    title: "Siding Damage",
    body: "The {{material}} siding on the {{location}} wall shows {{condition}}. This condition affects approximately {{quantity}} {{unit}} of siding material. Weather protection may be compromised. Recommend repair by a qualified contractor.",
    category: "EXTERIOR",
    component: "Siding",
    severity: "MAJOR",
    tags: ["siding", "weather protection", "repair", "exterior"],
    language: "en-US"
  },
  {
    title: "Window Issues", 
    body: "The windows on the {{location}} show {{condition}}. The {{component}} may affect energy efficiency and weather resistance. Recommend evaluation and potential repair or replacement by a qualified contractor.",
    category: "EXTERIOR",
    component: "Windows",
    severity: "MINOR",
    tags: ["windows", "sealing", "energy efficiency", "weather"],
    language: "en-US"
  },
  {
    title: "Foundation Concerns",
    body: "The foundation wall at the {{location}} shows {{condition}}. This condition may affect structural integrity and requires monitoring. Recommend evaluation by a structural engineer or qualified foundation contractor.",
    category: "EXTERIOR", 
    component: "Foundation",
    severity: "MAJOR",
    tags: ["foundation", "structural", "settling", "repair"],
    language: "en-US"
  },

  // INTERIOR Narratives
  {
    title: "Floor Covering Issues",
    body: "The {{material}} flooring in the {{roomName}} shows {{condition}}. This condition affects approximately {{quantity}} {{unit}} of flooring. Recommend repair or replacement by a qualified flooring contractor.",
    category: "INTERIOR",
    component: "Flooring",
    severity: "MINOR",
    tags: ["flooring", "wear", "replacement", "interior"],
    language: "en-US"
  },
  {
    title: "Wall Surface Damage",
    body: "The wall surfaces in the {{roomName}} show {{condition}}. This condition may indicate underlying moisture issues or settling. Recommend evaluation and repair by a qualified contractor.",
    category: "INTERIOR",
    component: "Walls",
    severity: "MINOR", 
    tags: ["walls", "cracks", "paint", "repair"],
    language: "en-US"
  },
  {
    title: "Ceiling Issues",
    body: "The ceiling in the {{roomName}} shows evidence of {{condition}}. This condition may indicate roof leaks or plumbing issues above. Recommend investigation of the source and repair by qualified contractors.",
    category: "INTERIOR",
    component: "Ceiling",
    severity: "MAJOR",
    tags: ["ceiling", "stains", "leaks", "repair"],
    language: "en-US"
  },

  // OTHER/GENERAL Narratives
  {
    title: "Smoke Detector Check",
    body: "The smoke detectors in the {{area}} require {{condition}}. This condition affects life safety systems in the property. Recommend immediate attention to ensure proper fire protection.",
    category: "OTHER",
    component: "Smoke Detectors",
    severity: "SAFETY",
    tags: ["smoke detector", "safety", "fire protection", "batteries"],
    language: "en-US"
  },
  {
    title: "General Maintenance",
    body: "The {{component}} in the {{area}} shows signs of deferred maintenance. The {{condition}} condition suggests regular upkeep has been neglected. Recommend establishing a maintenance schedule for optimal performance.",
    category: "OTHER",
    component: "Various",
    severity: "INFO",
    tags: ["maintenance", "upkeep", "general", "prevention"],
    language: "en-US"
  },
  {
    title: "Safety Concern",
    body: "A safety concern was identified with the {{component}} in the {{location}}. The {{condition}} presents a potential hazard. Recommend immediate attention by a qualified professional to address this safety issue.",
    category: "OTHER",
    component: "Safety Item",
    severity: "SAFETY",
    tags: ["safety", "hazard", "immediate", "professional"],
    language: "en-US"
  }
];

/**
 * Seed narratives for a specific company
 */
export async function seedCompanyNarratives(companyId: string): Promise<void> {
  console.log(`🌱 Seeding narratives for company: ${companyId}`);
  
  try {
    await narrativeService.seedNarratives(companyId, sampleNarratives);
    console.log(`✅ Successfully seeded ${sampleNarratives.length} narratives for company ${companyId}`);
  } catch (error) {
    console.error(`❌ Failed to seed narratives for company ${companyId}:`, error);
    throw error;
  }
}

/**
 * Seed narratives for default company (used in development)
 */
export async function seedDefaultNarratives(): Promise<void> {
  const defaultCompanyId = 'default-company';
  await seedCompanyNarratives(defaultCompanyId);
}