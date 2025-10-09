// Additional Inspection Services Definitions
// Comprehensive definitions for specialized inspection services

import { AdditionalInspectionService } from "./schema";

export interface ServiceInspectionItem {
  id: string;
  name: string;
  category?: string;
  required: boolean;
  description?: string;
}

export interface AdditionalServiceDefinition {
  id: AdditionalInspectionService;
  name: string;
  description: string;
  estimatedDuration: number; // minutes
  requiresSpecialEquipment: boolean;
  specialEquipment?: string[];
  inspectionItems: ServiceInspectionItem[];
  reportSections: string[];
  certificationRequired?: boolean;
  additionalFees?: {
    basePrice: number;
    description: string;
  };
}

export const ADDITIONAL_SERVICES_DEFINITIONS: Record<AdditionalInspectionService, AdditionalServiceDefinition> = {
  thermal_imaging: {
    id: 'thermal_imaging',
    name: 'Thermal Imaging Inspection',
    description: 'Infrared thermal imaging to detect temperature variations, moisture intrusion, electrical issues, and insulation problems',
    estimatedDuration: 60,
    requiresSpecialEquipment: true,
    specialEquipment: ['Thermal imaging camera', 'Temperature differential measurement tools'],
    certificationRequired: true,
    inspectionItems: [
      {
        id: 'thermal_exterior_walls',
        name: 'Exterior Walls - Thermal Analysis',
        category: 'Thermal Envelope',
        required: true,
        description: 'Scan exterior walls for heat loss, air leaks, and insulation gaps'
      },
      {
        id: 'thermal_windows_doors',
        name: 'Windows & Doors - Air Leakage',
        category: 'Thermal Envelope',
        required: true,
        description: 'Identify air infiltration around windows and doors'
      },
      {
        id: 'thermal_electrical_panels',
        name: 'Electrical Panels & Components',
        category: 'Electrical Systems',
        required: true,
        description: 'Detect overheated electrical components and connections'
      },
      {
        id: 'thermal_hvac_ducts',
        name: 'HVAC Ductwork',
        category: 'HVAC Systems',
        required: true,
        description: 'Locate duct leaks and inefficient heating/cooling distribution'
      },
      {
        id: 'thermal_roof_moisture',
        name: 'Roof Moisture Detection',
        category: 'Roofing',
        required: true,
        description: 'Identify moisture infiltration in roofing materials'
      },
      {
        id: 'thermal_plumbing_leaks',
        name: 'Plumbing - Hidden Leaks',
        category: 'Plumbing',
        required: true,
        description: 'Detect concealed water leaks in walls and under floors'
      }
    ],
    reportSections: ['Thermal Analysis Summary', 'Energy Efficiency Assessment', 'Thermal Images Gallery', 'Priority Recommendations'],
    additionalFees: {
      basePrice: 30000, // $300.00 in cents
      description: 'Thermal imaging inspection add-on'
    }
  },

  radon_testing: {
    id: 'radon_testing',
    name: 'Radon Testing',
    description: 'Professional radon gas testing to measure indoor radon levels for health and safety compliance',
    estimatedDuration: 15, // Setup time, actual testing is 48-72 hours
    requiresSpecialEquipment: true,
    specialEquipment: ['Radon testing equipment', 'Digital radon monitors'],
    certificationRequired: true,
    inspectionItems: [
      {
        id: 'radon_test_setup',
        name: 'Radon Test Device Setup',
        category: 'Testing Setup',
        required: true,
        description: 'Proper placement and setup of radon testing equipment'
      },
      {
        id: 'radon_basement_testing',
        name: 'Basement/Lowest Level Testing',
        category: 'Primary Testing Areas',
        required: true,
        description: 'Radon testing in basement or lowest occupied level'
      },
      {
        id: 'radon_main_floor_testing',
        name: 'Main Floor Testing',
        category: 'Secondary Testing',
        required: false,
        description: 'Additional radon testing on main living level if indicated'
      },
      {
        id: 'radon_ventilation_assessment',
        name: 'Ventilation System Assessment',
        category: 'Mitigation Potential',
        required: true,
        description: 'Evaluate existing ventilation for radon mitigation potential'
      },
      {
        id: 'radon_entry_points',
        name: 'Potential Radon Entry Points',
        category: 'Foundation Assessment',
        required: true,
        description: 'Identify cracks, gaps, and openings where radon could enter'
      }
    ],
    reportSections: ['Radon Test Results', 'EPA Compliance Assessment', 'Mitigation Recommendations', 'Health Risk Assessment'],
    additionalFees: {
      basePrice: 15000, // $150.00 in cents
      description: 'Professional radon testing (48-hour minimum)'
    }
  },

  sewer_scope: {
    id: 'sewer_scope',
    name: 'Sewer Scope Inspection',
    description: 'Video camera inspection of sewer lines to identify blockages, damage, and structural issues',
    estimatedDuration: 45,
    requiresSpecialEquipment: true,
    specialEquipment: ['Sewer camera system', 'Drain access tools', 'Video recording equipment'],
    inspectionItems: [
      {
        id: 'sewer_main_line',
        name: 'Main Sewer Line',
        category: 'Primary Sewer Lines',
        required: true,
        description: 'Video inspection of main sewer line from house to street connection'
      },
      {
        id: 'sewer_branch_lines',
        name: 'Branch Lines',
        category: 'Secondary Lines',
        required: true,
        description: 'Inspection of branch lines from fixtures to main line'
      },
      {
        id: 'sewer_pipe_condition',
        name: 'Pipe Material & Condition',
        category: 'Structural Assessment',
        required: true,
        description: 'Evaluate pipe material, age, and overall structural condition'
      },
      {
        id: 'sewer_blockages',
        name: 'Blockages & Obstructions',
        category: 'Flow Assessment',
        required: true,
        description: 'Identify root intrusion, debris, or structural blockages'
      },
      {
        id: 'sewer_connections',
        name: 'Connections & Joints',
        category: 'Connection Points',
        required: true,
        description: 'Inspect joints, connections, and transition points'
      },
      {
        id: 'sewer_cleanout_access',
        name: 'Cleanout Access Points',
        category: 'Access & Maintenance',
        required: true,
        description: 'Evaluate cleanout locations and accessibility'
      }
    ],
    reportSections: ['Sewer Line Video Report', 'Pipe Condition Assessment', 'Blockage Analysis', 'Repair Recommendations'],
    additionalFees: {
      basePrice: 27500, // $275.00 in cents
      description: 'Video sewer line inspection'
    }
  },

  pool_spa: {
    id: 'pool_spa',
    name: 'Pool & Spa Inspection',
    description: 'Comprehensive inspection of swimming pools, spas, and related equipment for safety and functionality',
    estimatedDuration: 90,
    requiresSpecialEquipment: true,
    specialEquipment: ['Pool testing kit', 'Electrical testing equipment', 'Safety equipment'],
    inspectionItems: [
      {
        id: 'pool_structure',
        name: 'Pool Structure & Shell',
        category: 'Structural Components',
        required: true,
        description: 'Inspect pool shell, coping, decking, and structural integrity'
      },
      {
        id: 'pool_equipment',
        name: 'Pool Equipment',
        category: 'Mechanical Systems',
        required: true,
        description: 'Evaluate pumps, filters, heaters, and circulation systems'
      },
      {
        id: 'pool_electrical',
        name: 'Electrical Systems',
        category: 'Electrical Safety',
        required: true,
        description: 'GFCI protection, bonding, grounding, and electrical safety compliance'
      },
      {
        id: 'pool_plumbing',
        name: 'Pool Plumbing',
        category: 'Plumbing Systems',
        required: true,
        description: 'Inspect plumbing lines, skimmers, returns, and drainage systems'
      },
      {
        id: 'pool_safety_features',
        name: 'Safety Features',
        category: 'Safety Compliance',
        required: true,
        description: 'Fencing, gates, covers, alarms, and safety equipment'
      },
      {
        id: 'spa_components',
        name: 'Spa/Hot Tub Components',
        category: 'Spa Systems',
        required: false,
        description: 'Spa-specific equipment, jets, controls, and safety features'
      },
      {
        id: 'pool_water_chemistry',
        name: 'Water Chemistry & Quality',
        category: 'Water Quality',
        required: true,
        description: 'Basic water testing and chemical balance assessment'
      }
    ],
    reportSections: ['Pool Safety Assessment', 'Equipment Functionality Report', 'Code Compliance Review', 'Maintenance Recommendations'],
    additionalFees: {
      basePrice: 35000, // $350.00 in cents
      description: 'Pool and spa inspection'
    }
  },

  drone_inspection: {
    id: 'drone_inspection',
    name: 'Drone Aerial Inspection',
    description: 'Unmanned aerial vehicle inspection of roof, exterior, and inaccessible areas',
    estimatedDuration: 30,
    requiresSpecialEquipment: true,
    specialEquipment: ['Professional drone', 'High-resolution camera', 'FAA certification'],
    certificationRequired: true,
    inspectionItems: [
      {
        id: 'drone_roof_overview',
        name: 'Roof Overview & Condition',
        category: 'Roofing Systems',
        required: true,
        description: 'Comprehensive aerial view of entire roof system and materials'
      },
      {
        id: 'drone_roof_details',
        name: 'Roof Detail Areas',
        category: 'Roofing Systems',
        required: true,
        description: 'Close-up inspection of chimneys, vents, flashing, and penetrations'
      },
      {
        id: 'drone_gutters',
        name: 'Gutter Systems',
        category: 'Drainage Systems',
        required: true,
        description: 'Inspect gutters, downspouts, and drainage components'
      },
      {
        id: 'drone_siding_upper',
        name: 'Upper Level Siding',
        category: 'Exterior Systems',
        required: true,
        description: 'Inspect siding, trim, and exterior components at height'
      },
      {
        id: 'drone_windows_upper',
        name: 'Upper Level Windows',
        category: 'Window Systems',
        required: true,
        description: 'Inspect upper-story windows and exterior trim'
      },
      {
        id: 'drone_structural_exterior',
        name: 'Exterior Structural Elements',
        category: 'Structural Systems',
        required: true,
        description: 'Overall structural assessment of exterior elements'
      }
    ],
    reportSections: ['Aerial Photography Report', 'Roof Condition Assessment', 'Inaccessible Area Analysis', 'High-Definition Image Gallery'],
    additionalFees: {
      basePrice: 25000, // $250.00 in cents
      description: 'Professional drone inspection'
    }
  },

  mold_testing: {
    id: 'mold_testing',
    name: 'Mold Testing & Assessment',
    description: 'Professional mold testing, air quality sampling, and moisture assessment',
    estimatedDuration: 60,
    requiresSpecialEquipment: true,
    specialEquipment: ['Air sampling equipment', 'Surface sampling tools', 'Moisture meters'],
    inspectionItems: [
      {
        id: 'mold_visual_assessment',
        name: 'Visual Mold Assessment',
        category: 'Visual Inspection',
        required: true,
        description: 'Comprehensive visual inspection for visible mold growth'
      },
      {
        id: 'mold_air_sampling',
        name: 'Indoor Air Quality Sampling',
        category: 'Air Quality Testing',
        required: true,
        description: 'Indoor air sampling for mold spore concentration'
      },
      {
        id: 'mold_surface_sampling',
        name: 'Surface Sampling',
        category: 'Surface Testing',
        required: false,
        description: 'Direct surface sampling of suspected mold growth areas'
      },
      {
        id: 'mold_moisture_assessment',
        name: 'Moisture Assessment',
        category: 'Moisture Analysis',
        required: true,
        description: 'Moisture level testing in walls, floors, and suspected areas'
      },
      {
        id: 'mold_hvac_assessment',
        name: 'HVAC System Assessment',
        category: 'HVAC Systems',
        required: true,
        description: 'Inspect HVAC system for mold contamination and air quality impact'
      },
      {
        id: 'mold_problem_areas',
        name: 'High-Risk Areas',
        category: 'Problem Assessment',
        required: true,
        description: 'Focus on bathrooms, basements, crawl spaces, and other high-moisture areas'
      }
    ],
    reportSections: ['Mold Assessment Results', 'Air Quality Analysis', 'Moisture Report', 'Remediation Recommendations'],
    additionalFees: {
      basePrice: 40000, // $400.00 in cents
      description: 'Professional mold testing and assessment'
    }
  },

  wdo_inspection: {
    id: 'wdo_inspection',
    name: 'Wood Destroying Organism (WDO) Inspection',
    description: 'Specialized inspection for termites, carpenter ants, wood-boring beetles, and wood decay fungi',
    estimatedDuration: 75,
    requiresSpecialEquipment: true,
    specialEquipment: ['Moisture meters', 'Probing tools', 'Flashlights', 'Magnification equipment'],
    certificationRequired: true,
    inspectionItems: [
      {
        id: 'wdo_termite_inspection',
        name: 'Termite Inspection',
        category: 'Termite Assessment',
        required: true,
        description: 'Comprehensive termite inspection including subterranean and drywood species'
      },
      {
        id: 'wdo_carpenter_ant',
        name: 'Carpenter Ant Inspection',
        category: 'Ant Assessment',
        required: true,
        description: 'Inspect for carpenter ant damage and activity'
      },
      {
        id: 'wdo_wood_boring_beetles',
        name: 'Wood-Boring Beetles',
        category: 'Beetle Assessment',
        required: true,
        description: 'Inspect for powder post beetles and other wood-boring insects'
      },
      {
        id: 'wdo_wood_decay_fungi',
        name: 'Wood Decay Fungi',
        category: 'Fungal Assessment',
        required: true,
        description: 'Inspect for brown rot, white rot, and other wood decay fungi'
      },
      {
        id: 'wdo_moisture_conditions',
        name: 'Conducive Moisture Conditions',
        category: 'Environmental Factors',
        required: true,
        description: 'Identify moisture conditions that promote WDO activity'
      },
      {
        id: 'wdo_structural_damage',
        name: 'Structural Damage Assessment',
        category: 'Damage Assessment',
        required: true,
        description: 'Evaluate extent of structural damage caused by WDOs'
      },
      {
        id: 'wdo_foundation_inspection',
        name: 'Foundation & Crawl Space',
        category: 'Foundation Systems',
        required: true,
        description: 'Thorough inspection of foundation areas and crawl spaces'
      }
    ],
    reportSections: ['WDO Findings Report', 'Damage Assessment', 'Treatment Recommendations', 'Prevention Strategies'],
    additionalFees: {
      basePrice: 17500, // $175.00 in cents
      description: 'Wood destroying organism inspection'
    }
  },

  wind_mitigation: {
    id: 'wind_mitigation',
    name: 'Wind Mitigation Inspection',
    description: 'Specialized inspection documenting wind-resistant features for insurance discounts',
    estimatedDuration: 45,
    requiresSpecialEquipment: false,
    certificationRequired: true,
    inspectionItems: [
      {
        id: 'wind_roof_covering',
        name: 'Roof Covering',
        category: 'Roof Systems',
        required: true,
        description: 'Document roof covering type and installation method'
      },
      {
        id: 'wind_roof_deck_attachment',
        name: 'Roof Deck Attachment',
        category: 'Roof Systems',
        required: true,
        description: 'Inspect roof deck attachment method (nails vs. screws/staples)'
      },
      {
        id: 'wind_roof_wall_connection',
        name: 'Roof-to-Wall Attachment',
        category: 'Structural Connections',
        required: true,
        description: 'Document roof-to-wall connection method and hardware'
      },
      {
        id: 'wind_roof_geometry',
        name: 'Roof Geometry',
        category: 'Roof Design',
        required: true,
        description: 'Document roof shape and hip roof percentage'
      },
      {
        id: 'wind_secondary_water_resistance',
        name: 'Secondary Water Resistance',
        category: 'Water Protection',
        required: true,
        description: 'Inspect for underlayment and secondary water barrier systems'
      },
      {
        id: 'wind_opening_protection',
        name: 'Opening Protection',
        category: 'Window/Door Protection',
        required: true,
        description: 'Document window and door protection systems (shutters, impact glass)'
      }
    ],
    reportSections: ['Wind Mitigation Report Form', 'Insurance Discount Documentation', 'Photo Documentation', 'Compliance Verification'],
    additionalFees: {
      basePrice: 12500, // $125.00 in cents
      description: 'Wind mitigation inspection for insurance discounts'
    }
  },

  four_point_inspection: {
    id: 'four_point_inspection',
    name: '4-Point Inspection',
    description: 'Insurance-focused inspection of four major systems: roof, electrical, plumbing, and HVAC',
    estimatedDuration: 60,
    requiresSpecialEquipment: false,
    inspectionItems: [
      {
        id: 'four_point_roof',
        name: 'Roofing System',
        category: 'Roof Assessment',
        required: true,
        description: 'Roof age, material type, condition, and remaining useful life'
      },
      {
        id: 'four_point_electrical',
        name: 'Electrical System',
        category: 'Electrical Assessment',
        required: true,
        description: 'Panel type, wiring type, GFCI protection, and overall condition'
      },
      {
        id: 'four_point_plumbing',
        name: 'Plumbing System',
        category: 'Plumbing Assessment',
        required: true,
        description: 'Supply line materials, waste line materials, water heater condition'
      },
      {
        id: 'four_point_hvac',
        name: 'HVAC System',
        category: 'HVAC Assessment',
        required: true,
        description: 'Heating and cooling system type, age, condition, and functionality'
      },
      {
        id: 'four_point_age_documentation',
        name: 'Age Documentation',
        category: 'System Ages',
        required: true,
        description: 'Document installation dates and ages of all four major systems'
      },
      {
        id: 'four_point_insurance_issues',
        name: 'Insurance Risk Factors',
        category: 'Risk Assessment',
        required: true,
        description: 'Identify factors that may affect insurability or premiums'
      }
    ],
    reportSections: ['4-Point Inspection Summary', 'System Age Documentation', 'Insurance Risk Assessment', 'Photo Documentation'],
    additionalFees: {
      basePrice: 20000, // $200.00 in cents
      description: '4-Point inspection for insurance purposes'
    }
  }
};

// Helper functions
export function getServiceDefinition(serviceId: AdditionalInspectionService): AdditionalServiceDefinition {
  return ADDITIONAL_SERVICES_DEFINITIONS[serviceId];
}

export function getServicesByCategory(): Record<string, AdditionalServiceDefinition[]> {
  const categories: Record<string, AdditionalServiceDefinition[]> = {
    'Specialized Testing': [],
    'Safety & Compliance': [],
    'Insurance Inspections': [],
    'Advanced Technology': []
  };

  Object.values(ADDITIONAL_SERVICES_DEFINITIONS).forEach(service => {
    if (['radon_testing', 'mold_testing'].includes(service.id)) {
      categories['Specialized Testing'].push(service);
    } else if (['wdo_inspection', 'pool_spa'].includes(service.id)) {
      categories['Safety & Compliance'].push(service);
    } else if (['wind_mitigation', 'four_point_inspection'].includes(service.id)) {
      categories['Insurance Inspections'].push(service);
    } else if (['thermal_imaging', 'drone_inspection', 'sewer_scope'].includes(service.id)) {
      categories['Advanced Technology'].push(service);
    }
  });

  return categories;
}

export function calculateTotalAdditionalServicesFee(selectedServices: AdditionalInspectionService[]): number {
  return selectedServices.reduce((total, serviceId) => {
    const service = getServiceDefinition(serviceId);
    return total + (service.additionalFees?.basePrice || 0);
  }, 0);
}

export function getEstimatedTotalDuration(selectedServices: AdditionalInspectionService[]): number {
  return selectedServices.reduce((total, serviceId) => {
    const service = getServiceDefinition(serviceId);
    return total + service.estimatedDuration;
  }, 0);
}