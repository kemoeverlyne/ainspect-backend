// Comprehensive Inspection Templates based on professional inspection reports
// Dynamic room-specific elements generated from real inspection data

export const ROOM_INSPECTION_TEMPLATES = {
  kitchen: {
    name: "Kitchen",
    description: "Kitchen appliances, fixtures, and systems inspection",
    sections: [
      {
        id: "kitchen_electrical",
        name: "Electrical Systems",
        items: [
          {
            id: "kitchen_outlets",
            description: "Kitchen outlet condition and grounding",
            checkPoints: [
              "GFCI protection properly installed and functional",
              "No reverse polarity conditions",
              "Proper grounding on all outlets",
              "No burn marks or sparking conditions",
              "Adequate number of outlets per code"
            ],
            commonIssues: [
              "Open ground in kitchen outlet should be repaired",
              "Reverse polarity in kitchen outlet needs repair",
              "GFCI outlet does not operate and should be replaced",
              "Outlet has burn marks and needs replacement"
            ],
            recommendations: [
              "Recommend qualified electrician repair grounding issues",
              "GFCI outlets should be tested monthly",
              "Replace any damaged or non-functional outlets"
            ]
          },
          {
            id: "under_sink_electrical",
            description: "Under-sink electrical installations",
            checkPoints: [
              "Proper junction box covers in place",
              "No exposed wiring",
              "GFCI protection for wet locations"
            ],
            commonIssues: [
              "Open outlet box under kitchen sink needs a cover",
              "Exposed wiring under sink requires protection"
            ]
          }
        ]
      },
      {
        id: "kitchen_plumbing",
        name: "Plumbing Systems",
        items: [
          {
            id: "kitchen_sink",
            description: "Kitchen sink and faucet systems",
            checkPoints: [
              "Faucet properly secured and operational",
              "No leaks in supply lines or connections",
              "Proper drain operation",
              "Adequate water pressure and flow"
            ],
            commonIssues: [
              "Kitchen faucet is loose and needs to be secured to the countertop",
              "Kitchen sink drain is leaking and needs repair",
              "Reverse osmosis faucet pulls right out of its base"
            ],
            recommendations: [
              "Recommend repair by qualified plumber",
              "Secure faucet mounting hardware",
              "Address any drain leaks promptly"
            ]
          },
          {
            id: "kitchen_drains",
            description: "Kitchen drain systems",
            checkPoints: [
              "Proper drain pipe sizing",
              "No flex tube connections",
              "Adequate slope for drainage"
            ],
            commonIssues: [
              "Drain pipe under kitchen sink is too small on the left side",
              "Flex tube drain pipe is not a recommended practice"
            ]
          }
        ]
      },
      {
        id: "kitchen_appliances", 
        name: "Kitchen Appliances",
        items: [
          {
            id: "dishwasher",
            description: "Dishwasher operation and installation",
            checkPoints: [
              "Proper electrical connection",
              "Secure mounting and installation",
              "No leaks in supply or drain connections",
              "Normal operation cycle"
            ],
            commonIssues: [
              "Dishwasher does not operate and needs repair or replacement",
              "Dishwasher drain connection leaking"
            ]
          },
          {
            id: "garbage_disposal",
            description: "Garbage disposal wiring and operation",
            checkPoints: [
              "Proper electrical wiring and connections",
              "Safe switch location and operation",
              "Normal grinding operation"
            ],
            commonIssues: [
              "Wiring to garbage disposal is unsafe and should be repaired by qualified electrician"
            ]
          }
        ]
      }
    ]
  },

  bathroom: {
    name: "Bathroom",
    description: "Bathroom fixtures, plumbing, and ventilation systems",
    sections: [
      {
        id: "bathroom_fixtures",
        name: "Bathroom Fixtures",
        items: [
          {
            id: "toilet",
            description: "Toilet installation and operation", 
            checkPoints: [
              "Secure mounting to floor",
              "Proper wax ring seal",
              "Water supply valve operation",
              "No leaks at base or connections"
            ],
            commonIssues: [
              "Toilet bowl is loose and should be secured to the floor",
              "Water valve to toilet leaks and needs repair",
              "New wax ring may be needed",
              "Loose toilet bowl needs to be sealed to the floor"
            ],
            recommendations: [
              "Recommend repair by qualified plumber",
              "Secure toilet to floor with proper bolts",
              "Replace wax ring if leaking"
            ]
          },
          {
            id: "bathroom_sink",
            description: "Bathroom sink and faucet operation",
            checkPoints: [
              "Faucet operation and water flow",
              "Drain stopper functionality",
              "No leaks in supply or drain lines",
              "Adequate water pressure"
            ],
            commonIssues: [
              "Sink stop is not connected in main bathroom",
              "Water flow at sink is very low",
              "Both faucets are leaking and need repair"
            ]
          },
          {
            id: "shower_tub",
            description: "Shower and bathtub systems",
            checkPoints: [
              "Tile and grout condition around fixtures",
              "Shower/tub handle operation",
              "Drain operation and sealing",
              "Door or curtain installation"
            ],
            commonIssues: [
              "Tiles around bathtub spigot are loose and need repair",
              "Master bathroom shower handle is not operating properly",
              "Master bathroom shower drain is leaking",
              "Shower door is broken and needs repair or replacement"
            ]
          }
        ]
      },
      {
        id: "bathroom_electrical",
        name: "Electrical Systems",
        items: [
          {
            id: "bathroom_gfci",
            description: "GFCI protection and outlets",
            checkPoints: [
              "GFCI outlets properly installed and functional",
              "Proper outlet covers and protection",
              "No exposed wiring"
            ],
            commonIssues: [
              "GFCI in master bathroom does not operate and needs replacement",
              "Outlet needs proper cover plate"
            ]
          }
        ]
      },
      {
        id: "bathroom_ventilation",
        name: "Ventilation Systems",
        items: [
          {
            id: "exhaust_fan",
            description: "Bathroom exhaust fan operation",
            checkPoints: [
              "Fan operates properly",
              "Adequate air movement",
              "Proper exterior venting",
              "No obstructions"
            ],
            commonIssues: [
              "Upper east bathroom vent is painted shut and needs repair",
              "Exhaust fan has been disconnected",
              "Poor drainage in bathroom should be repaired"
            ]
          }
        ]
      }
    ]
  },

  living_room: {
    name: "Living Room",
    description: "Living room electrical systems, fireplace, and structural elements",
    sections: [
      {
        id: "living_room_electrical",
        name: "Electrical Systems",
        items: [
          {
            id: "living_room_outlets",
            description: "Living room electrical outlets and wiring",
            checkPoints: [
              "Proper polarity on all outlets",
              "Adequate grounding",
              "No damaged outlets or covers",
              "Sufficient number of outlets"
            ],
            commonIssues: [
              "Reverse polarity in living room outlet needs to be repaired",
              "Open ground in living room outlet needs repair"
            ]
          }
        ]
      },
      {
        id: "fireplace_systems",
        name: "Fireplace Systems", 
        items: [
          {
            id: "fireplace_safety",
            description: "Fireplace operation and safety systems",
            checkPoints: [
              "Damper operation",
              "Firebrick condition",
              "No carbon monoxide leaks",
              "Proper ventilation"
            ],
            commonIssues: [
              "Fireplace damper is disconnected and needs repair",
              "Living room fireplace needs firebrick mortar on some bricks",
              "Family room fireplace appears to be leaking carbon monoxide",
              "Fireplace has some condensation forming on glass when running",
              "Cracks in fireplace need to be repaired"
            ],
            recommendations: [
              "Recommend qualified chimney contractor repair as necessary",
              "Address carbon monoxide issues immediately",
              "Repair damper mechanism for proper operation"
            ]
          }
        ]
      },
      {
        id: "doors_windows",
        name: "Doors and Windows",
        items: [
          {
            id: "door_operation",
            description: "Door hardware and operation",
            checkPoints: [
              "Deadbolt and lock operation",
              "Door alignment and closure",
              "Hardware functionality"
            ],
            commonIssues: [
              "Deadbolt on door leading to deck does not open",
              "Door hardware needs adjustment or replacement"
            ]
          },
          {
            id: "window_condition",
            description: "Window condition and operation",
            checkPoints: [
              "Window operation and closure",
              "Insulated glass integrity",
              "Hardware functionality"
            ],
            commonIssues: [
              "Dining room window will not close properly and needs hardware adjustment",
              "Leaking insulated glass present in living room windows"
            ]
          }
        ]
      }
    ]
  },

  bedroom: {
    name: "Bedroom",
    description: "Bedroom electrical systems, windows, and fixtures",
    sections: [
      {
        id: "bedroom_electrical",
        name: "Electrical Systems",
        items: [
          {
            id: "bedroom_fixtures",
            description: "Bedroom electrical fixtures and fans",
            checkPoints: [
              "Ceiling fan installation and operation",
              "Proper electrical connections",
              "No extension cord wiring"
            ],
            commonIssues: [
              "Ceiling fan in master bedroom is dismantled",
              "Extension cord wiring to master bedroom ceiling fan is not recommended practice"
            ],
            recommendations: [
              "Recommend properly hard wiring the fan",
              "Replace dismantled fixtures as needed"
            ]
          }
        ]
      },
      {
        id: "bedroom_windows",
        name: "Windows",
        items: [
          {
            id: "bedroom_window_condition",
            description: "Bedroom window condition and operation",
            checkPoints: [
              "Insulated glass integrity",
              "Window operation",
              "Hardware condition"
            ],
            commonIssues: [
              "Evidence of leaking insulated glass in master bedroom",
              "Leaking insulated glass in bedroom windows",
              "Small window on upper front has leaking insulated glass"
            ],
            recommendations: [
              "Recommend replacement by qualified window contractor"
            ]
          }
        ]
      }
    ]
  }
};

export const SYSTEM_INSPECTION_TEMPLATES = {
  electrical: {
    name: "Electrical System",
    description: "Complete electrical system inspection including service, distribution, and safety",
    sections: [
      {
        id: "electrical_service",
        name: "Service and Distribution",
        items: [
          {
            id: "electrical_panel",
            description: "Main electrical panel and service equipment",
            checkPoints: [
              "Proper panel covers and protection",
              "No exposed wiring or connections",
              "Adequate service capacity",
              "Proper grounding system"
            ],
            commonIssues: [
              "Knockout cover needed on junction box in basement",
              "Cover plate needed on outlet, switch and junction box",
              "Exposed Romex wiring should be enclosed in conduit"
            ]
          }
        ]
      },
      {
        id: "electrical_circuits", 
        name: "Branch Circuits and Outlets",
        items: [
          {
            id: "outlet_safety",
            description: "Outlet condition and safety features",
            checkPoints: [
              "Proper polarity on all outlets",
              "GFCI protection where required",
              "No open grounds",
              "No burn damage or sparking"
            ],
            commonIssues: [
              "Reverse polarity needs to be repaired",
              "Open ground needs to be repaired", 
              "GFCI does not operate and should be replaced",
              "Outlet has burn marks and sparked when touched",
              "Outlet to the left of sump pump has reverse polarity"
            ],
            recommendations: [
              "Recommend qualified electrician repair as necessary",
              "Replace damaged outlets immediately",
              "Test GFCI outlets monthly"
            ]
          }
        ]
      },
      {
        id: "electrical_lighting",
        name: "Lighting Systems",
        items: [
          {
            id: "light_fixtures",
            description: "Light fixture installation and safety",
            checkPoints: [
              "Secure fixture mounting",
              "Proper electrical connections",
              "No temporary or hanging wire fixtures"
            ],
            commonIssues: [
              "Hanging wire light fixtures need to be removed and replaced with permanent fixtures",
              "Loose light fixture needs to be repaired",
              "Broken light fixture in basement needs repair or replacement"
            ]
          }
        ]
      }
    ]
  },

  plumbing: {
    name: "Plumbing System",
    description: "Water supply, drainage, and plumbing fixtures inspection",
    sections: [
      {
        id: "water_supply",
        name: "Water Supply System",
        items: [
          {
            id: "supply_piping",
            description: "Water supply piping and connections",
            checkPoints: [
              "No leaks in supply lines",
              "Adequate water pressure",
              "Proper pipe materials and installation",
              "Main shut-off valve operation"
            ],
            commonIssues: [
              "Main water shut off valve is leaking and should be repaired",
              "Some corrosion on water pipes - monitor water for hardness",
              "Water pipes showing signs of deterioration"
            ]
          }
        ]
      },
      {
        id: "drainage_system",
        name: "Drainage and Waste Systems",
        items: [
          {
            id: "drain_piping",
            description: "Drain, waste, and vent piping",
            checkPoints: [
              "No leaks in drain systems",
              "Proper pipe materials and connections", 
              "Adequate venting",
              "No flex tube connections"
            ],
            commonIssues: [
              "Old cast iron drain pipes have rust and corrosion",
              "Drain pipe is leaking and needs repair",
              "Plumbing vent is leaking and needs repair",
              "Flex tube drain piping is not a recommended practice"
            ],
            recommendations: [
              "Recommend monitoring for leaks and replace when necessary",
              "Replace flex tube with proper drain piping",
              "Qualified plumber should address leaks promptly"
            ]
          }
        ]
      }
    ]
  },

  hvac: {
    name: "HVAC System", 
    description: "Heating, ventilation, and air conditioning systems inspection",
    sections: [
      {
        id: "heating_equipment",
        name: "Heating Equipment",
        items: [
          {
            id: "furnace_operation",
            description: "Furnace operation and safety",
            checkPoints: [
              "Proper combustion and heat exchange",
              "No carbon monoxide leaks",
              "Adequate ventilation",
              "Heat exchanger condition"
            ],
            commonIssues: [
              "Secondary heat exchanger that has been on upgrade list and part of class action lawsuit",
              "Inducer motor is extremely loud and has water in it",
              "Carbon monoxide is coming out of boilers and venting systems on old units",
              "Furnace has secondary heat exchanger part of class action lawsuit"
            ],
            recommendations: [
              "Recommend qualified HVAC contractor review and repair as necessary",
              "Replace old units ASAP to prevent carbon monoxide",
              "Qualified Carrier dealer should review secondary heat exchanger"
            ]
          }
        ]
      },
      {
        id: "distribution_system",
        name: "Air Distribution System",
        items: [
          {
            id: "ductwork",
            description: "Ductwork and air distribution",
            checkPoints: [
              "Secure ductwork connections",
              "Proper insulation where required",
              "No disconnected or loose ducts",
              "Clean air filters"
            ],
            commonIssues: [
              "Two supply ducts have come loose and need to be tightened to the floor",
              "Supply duct has come loose and needs to be tightened",
              "Filter is extremely dirty and needs to be replaced",
              "Furnace filter is installed backwards"
            ]
          }
        ]
      },
      {
        id: "ventilation_systems",
        name: "Ventilation Systems",
        items: [
          {
            id: "exhaust_systems",
            description: "Exhaust and ventilation equipment",
            checkPoints: [
              "Proper exhaust fan operation",
              "Adequate exterior venting",
              "Proper vent materials",
              "No holes or damage in vent piping"
            ],
            commonIssues: [
              "Exhaust fan in attic has been disconnected",
              "Plastic dryer vent needs to be replaced with metal one",
              "Vent for water heater has holes in it",
              "Exhaust fan from sunroom is exhausting into attic"
            ]
          }
        ]
      }
    ]
  },

  exterior: {
    name: "Exterior Systems",
    description: "Roofing, siding, foundation, and exterior components",
    sections: [
      {
        id: "roofing_system",
        name: "Roofing System",
        items: [
          {
            id: "roof_covering",
            description: "Roof covering condition and integrity",
            checkPoints: [
              "No missing or damaged shingles",
              "Adequate granule retention",
              "No moss or debris accumulation",
              "Ridge caps properly installed"
            ],
            commonIssues: [
              "Some shingles are missing from the roof and need replacement",
              "Missing shingles on south side need to be replaced",
              "Ridge caps have deterioration and missing granules",
              "Missing and damaged shingles on roof need replacement"
            ]
          },
          {
            id: "roof_flashing",
            description: "Roof flashing and penetrations",
            checkPoints: [
              "Chimney flashing properly sealed",
              "No leaks around penetrations",
              "Skylight flashing condition",
              "Plumbing boot integrity"
            ],
            commonIssues: [
              "Chimney flashing is leaking and needs to be repaired and sealed",
              "Recommend sealing around skylight flashing in spring",
              "Cracked plumbing boot on east side should be replaced",
              "Old stains moisture stains around chimney"
            ]
          }
        ]
      },
      {
        id: "gutter_systems",
        name: "Gutters and Drainage",
        items: [
          {
            id: "gutter_condition",
            description: "Gutter system condition and function",
            checkPoints: [
              "No rust or holes in gutters",
              "Proper pitch for drainage",
              "Downspout extensions in place",
              "Secure mounting to structure"
            ],
            commonIssues: [
              "Front gutters are rusted through and need to be replaced",
              "Back gutter is pitching the wrong direction and should be repaired",
              "Gutters have multiple holes and need patching or replacement",
              "Downspout extension is missing on front of house"
            ]
          }
        ]
      },
      {
        id: "siding_trim",
        name: "Siding and Trim",
        items: [
          {
            id: "exterior_walls",
            description: "Exterior wall covering and trim",
            checkPoints: [
              "No wood rot or deterioration",
              "Proper caulking and sealing",
              "Secure siding installation",
              "Trim pieces properly attached"
            ],
            commonIssues: [
              "Wood rot on trim and should be replaced",
              "Siding is loose, wavy and inappropriate nailing",
              "Caulk is failing around entire exterior",
              "Trim pieces have come loose and should be repaired"
            ]
          }
        ]
      }
    ]
  }
};

// Professional inspection language patterns for dynamic report generation
export const INSPECTION_LANGUAGE_LIBRARY = {
  conditions: {
    satisfactory: "Functionally consistent with its original purpose but may show signs of normal wear and tear and deterioration",
    marginal: "Will probably require repair or replacement anytime within five years", 
    poor: "Will need repair or replacement now or in the very near future",
    major_concern: "A system or component that is considered significantly deficient or is unsafe",
    safety_hazard: "Denotes a condition that is unsafe and in need of prompt attention"
  },
  
  recommendationPhrases: {
    repair: [
      "Recommend repair",
      "Should be repaired", 
      "Needs to be repaired",
      "Recommend repair or replacement as necessary"
    ],
    replacement: [
      "Recommend replacement",
      "Needs to be replaced",
      "Should be replaced",
      "Recommend replacing"
    ],
    professional: [
      "Recommend a qualified {contractor} review",
      "Recommend evaluation by qualified {contractor}",
      "Recommend a qualified {contractor} repair as necessary"
    ],
    monitoring: [
      "Recommend monitoring",
      "Monitor for further movement",
      "Recommend monitoring for leaks",
      "Should be monitored"
    ],
    immediate: [
      "Recommend repair ASAP",
      "Needs immediate attention",
      "Should be addressed promptly",
      "Requires prompt attention"
    ]
  },

  professionalContractors: {
    "electrical": "electrician",
    "plumbing": "plumber", 
    "hvac": "HVAC contractor",
    "roofing": "roofer",
    "structural": "structural engineer",
    "chimney": "chimney contractor",
    "siding": "siding contractor",
    "foundation": "basement contractor",
    "window": "window contractor"
  }
};

// Home inspection systems mapping for backward compatibility
export const HOME_INSPECTION_SYSTEMS = SYSTEM_INSPECTION_TEMPLATES;

// Room types for selection wizard
export const ROOM_TYPES = {
  bedrooms: { 
    id: "bedrooms",
    name: "Bedrooms", 
    icon: "Bed", 
    min: 1, 
    max: 10, 
    maxCount: 10,
    defaultCount: 3,
    allowMultiple: true,
    sections: ROOM_INSPECTION_TEMPLATES.bedroom?.sections || []
  },
  bathrooms: { 
    id: "bathrooms",
    name: "Bathrooms", 
    icon: "Bath", 
    min: 1, 
    max: 8, 
    maxCount: 8,
    defaultCount: 2,
    allowMultiple: true,
    sections: ROOM_INSPECTION_TEMPLATES.bathroom?.sections || []
  },
  kitchen: { 
    id: "kitchen",
    name: "Kitchen", 
    icon: "ChefHat", 
    min: 1, 
    max: 2, 
    maxCount: 2,
    defaultCount: 1,
    allowMultiple: true,
    sections: ROOM_INSPECTION_TEMPLATES.kitchen?.sections || []
  },
  living_room: { 
    id: "living_room",
    name: "Living Room", 
    icon: "Sofa", 
    min: 1, 
    max: 3, 
    maxCount: 3,
    defaultCount: 1,
    allowMultiple: true,
    sections: ROOM_INSPECTION_TEMPLATES.living_room?.sections || []
  },
  dining_room: { 
    id: "dining_room",
    name: "Dining Room", 
    icon: "Utensils", 
    min: 0, 
    max: 2, 
    maxCount: 2,
    defaultCount: 0,
    allowMultiple: true
  },
  family_room: { 
    id: "family_room",
    name: "Family Room", 
    icon: "Users", 
    min: 0, 
    max: 2, 
    maxCount: 2,
    defaultCount: 0,
    allowMultiple: true
  },
  office: { 
    id: "office",
    name: "Office/Study", 
    icon: "Briefcase", 
    min: 0, 
    max: 3, 
    maxCount: 3,
    defaultCount: 0,
    allowMultiple: true
  },
  basement: { 
    id: "basement",
    name: "Basement", 
    icon: "Archive", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  attic: { 
    id: "attic",
    name: "Attic", 
    icon: "Home", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  garage: { 
    id: "garage",
    name: "Garage", 
    icon: "Car", 
    min: 0, 
    max: 3, 
    maxCount: 3,
    defaultCount: 0,
    allowMultiple: true
  },
  laundry_room: { 
    id: "laundry_room",
    name: "Laundry Room", 
    icon: "Shirt", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  mudroom: { 
    id: "mudroom",
    name: "Mudroom", 
    icon: "Door", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  sunroom: { 
    id: "sunroom",
    name: "Sunroom", 
    icon: "Sun", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  den: { 
    id: "den",
    name: "Den", 
    icon: "BookOpen", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  library: { 
    id: "library",
    name: "Library", 
    icon: "Library", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  pantry: { 
    id: "pantry",
    name: "Pantry", 
    icon: "Package", 
    min: 0, 
    max: 1, 
    maxCount: 1,
    defaultCount: 0,
    allowMultiple: false
  },
  closets: { 
    id: "closets",
    name: "Walk-in Closets", 
    icon: "Package2", 
    min: 0, 
    max: 5, 
    maxCount: 5,
    defaultCount: 0,
    allowMultiple: true
  }
} as const;

export default {
  ROOM_INSPECTION_TEMPLATES,
  SYSTEM_INSPECTION_TEMPLATES,
  INSPECTION_LANGUAGE_LIBRARY,
  ROOM_TYPES,
  HOME_INSPECTION_SYSTEMS
};