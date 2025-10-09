import { db } from './db';
import { services } from '../shared/schema';

export async function seedServices() {
  const serviceData = [
    // Safety Services
    {
      id: 'thermal_imaging',
      name: 'Thermal Imaging',
      description: 'Detect temperature variations and moisture issues using advanced thermal imaging technology',
      category: 'safety',
      basePrice: 30000, // $300
      duration: 60,
      requirements: 'Thermal imaging camera, trained technician',
      isActive: true,
      isPopular: true,
      icon: 'thermometer',
      color: 'red'
    },
    {
      id: 'radon_testing',
      name: 'Radon Testing',
      description: 'Test for harmful radon gas levels in your home',
      category: 'safety',
      basePrice: 15000, // $150
      duration: 30,
      requirements: 'Radon testing kit, 48-hour minimum test period',
      isActive: true,
      isPopular: true,
      icon: 'shield',
      color: 'orange'
    },
    {
      id: 'mold_testing',
      name: 'Mold Testing',
      description: 'Air quality and surface mold testing for health safety',
      category: 'safety',
      basePrice: 40000, // $400
      duration: 90,
      requirements: 'Mold testing kit, lab analysis',
      isActive: true,
      isPopular: false,
      icon: 'droplets',
      color: 'green'
    },
    {
      id: 'wdo_inspection',
      name: 'Wood Destroying Organisms',
      description: 'Termite and pest damage inspection',
      category: 'safety',
      basePrice: 20000, // $200
      duration: 45,
      requirements: 'WDO inspection license, specialized tools',
      isActive: true,
      isPopular: true,
      icon: 'bug',
      color: 'brown'
    },

    // Advanced Diagnostics
    {
      id: 'sewer_scope',
      name: 'Sewer Scope',
      description: 'Camera inspection of sewer line to detect blockages and damage',
      category: 'diagnostics',
      basePrice: 27500, // $275
      duration: 75,
      requirements: 'Sewer camera, access to cleanout',
      isActive: true,
      isPopular: true,
      icon: 'camera',
      color: 'blue'
    },
    {
      id: 'drone_inspection',
      name: 'Drone Inspection',
      description: 'Aerial inspection of roof and high areas',
      category: 'diagnostics',
      basePrice: 25000, // $250
      duration: 60,
      requirements: 'Drone pilot license, weather permitting',
      isActive: true,
      isPopular: true,
      icon: 'drone',
      color: 'purple'
    },
    {
      id: 'wind_mitigation',
      name: 'Wind Mitigation',
      description: 'Insurance wind resistance inspection for hurricane coverage',
      category: 'diagnostics',
      basePrice: 20000, // $200
      duration: 45,
      requirements: 'Wind mitigation certification',
      isActive: true,
      isPopular: false,
      icon: 'wind',
      color: 'yellow'
    },
    {
      id: 'four_point_inspection',
      name: '4-Point Inspection',
      description: 'Focused inspection on roof, electrical, plumbing, and HVAC systems',
      category: 'diagnostics',
      basePrice: 20000, // $200
      duration: 60,
      requirements: '4-point inspection certification',
      isActive: true,
      isPopular: false,
      icon: 'check-square',
      color: 'indigo'
    },

    // Specialized Inspections
    {
      id: 'pool_spa',
      name: 'Pool & Spa Inspection',
      description: 'Complete pool and spa system inspection including equipment and safety',
      category: 'specialized',
      basePrice: 35000, // $350
      duration: 90,
      requirements: 'Pool inspection certification, specialized equipment',
      isActive: true,
      isPopular: false,
      icon: 'waves',
      color: 'cyan'
    },
    {
      id: 'well_inspection',
      name: 'Well Water System',
      description: 'Inspection of well water system and water quality testing',
      category: 'specialized',
      basePrice: 30000, // $300
      duration: 75,
      requirements: 'Well inspection certification, water testing equipment',
      isActive: true,
      isPopular: false,
      icon: 'droplet',
      color: 'blue'
    },
    {
      id: 'septic_inspection',
      name: 'Septic System',
      description: 'Comprehensive septic system inspection and pumping',
      category: 'specialized',
      basePrice: 40000, // $400
      duration: 120,
      requirements: 'Septic inspection certification, pumping equipment',
      isActive: true,
      isPopular: false,
      icon: 'tank',
      color: 'brown'
    },

    // Maintenance Services
    {
      id: 'hvac_tuneup',
      name: 'HVAC Tune-up',
      description: 'Professional HVAC system maintenance and tune-up',
      category: 'maintenance',
      basePrice: 15000, // $150
      duration: 60,
      requirements: 'HVAC technician license',
      isActive: true,
      isPopular: false,
      icon: 'thermometer',
      color: 'orange'
    },
    {
      id: 'electrical_safety',
      name: 'Electrical Safety Check',
      description: 'Comprehensive electrical safety inspection and testing',
      category: 'maintenance',
      basePrice: 20000, // $200
      duration: 45,
      requirements: 'Electrical contractor license',
      isActive: true,
      isPopular: false,
      icon: 'zap',
      color: 'yellow'
    },
    {
      id: 'plumbing_maintenance',
      name: 'Plumbing Maintenance',
      description: 'Plumbing system maintenance and minor repairs',
      category: 'maintenance',
      basePrice: 18000, // $180
      duration: 60,
      requirements: 'Plumbing license',
      isActive: true,
      isPopular: false,
      icon: 'wrench',
      color: 'blue'
    },

    // Consultation Services
    {
      id: 'pre_purchase_consultation',
      name: 'Pre-Purchase Consultation',
      description: 'Expert consultation on property condition and investment value',
      category: 'consultation',
      basePrice: 25000, // $250
      duration: 90,
      requirements: 'Real estate inspection license, market knowledge',
      isActive: true,
      isPopular: false,
      icon: 'users',
      color: 'purple'
    },
    {
      id: 'maintenance_planning',
      name: 'Maintenance Planning',
      description: 'Create a comprehensive maintenance plan for your property',
      category: 'consultation',
      basePrice: 20000, // $200
      duration: 60,
      requirements: 'Property management experience',
      isActive: true,
      isPopular: false,
      icon: 'calendar',
      color: 'green'
    },
    {
      id: 'energy_efficiency',
      name: 'Energy Efficiency Audit',
      description: 'Comprehensive energy efficiency assessment and recommendations',
      category: 'consultation',
      basePrice: 30000, // $300
      duration: 120,
      requirements: 'Energy auditor certification',
      isActive: true,
      isPopular: false,
      icon: 'leaf',
      color: 'green'
    }
  ];

  try {
    // Insert services if they don't exist
    for (const service of serviceData) {
      await db
        .insert(services)
        .values(service)
        .onConflictDoNothing();
    }
    
    console.log('✅ Services seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  }
}
