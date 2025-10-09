// Professional Home Inspection Standards based on real inspection reports
// Training data for AI analysis and report generation

export const INSPECTION_CONDITIONS = {
  satisfactory: {
    label: "Satisfactory",
    color: "green",
    description: "Functionally consistent with its original purpose but may show signs of normal wear and tear and deterioration",
    priority: 1
  },
  marginal: {
    label: "Marginal", 
    color: "yellow",
    description: "Will probably require repair or replacement anytime within five years",
    priority: 2
  },
  poor: {
    label: "Poor",
    color: "orange", 
    description: "Will need repair or replacement now or in the very near future",
    priority: 3
  },
  major_concern: {
    label: "Major Concern",
    color: "red",
    description: "A system or component that is considered significantly deficient or is unsafe",
    priority: 4
  },
  safety_hazard: {
    label: "Safety Hazard",
    color: "red",
    description: "Denotes a condition that is unsafe and in need of prompt attention",
    priority: 5
  }
} as const;

export const PROFESSIONAL_LANGUAGE_PATTERNS = {
  // Common inspection verbiage from real reports
  recommendations: {
    repair: [
      "Recommend repair",
      "Should be repaired", 
      "Needs to be repaired",
      "Recommend repair or replacement",
      "Should be repaired or replaced"
    ],
    replacement: [
      "Recommend replacement",
      "Needs to be replaced",
      "Should be replaced",
      "Recommend replacing"
    ],
    professional_evaluation: [
      "Recommend a qualified contractor review",
      "Recommend evaluation by qualified professional",
      "Recommend a qualified [TRADE] contractor repair as necessary",
      "Should be evaluated by a qualified professional"
    ],
    monitoring: [
      "Recommend monitoring",
      "Monitor for further movement", 
      "Recommend monitoring for leaks",
      "Should be monitored"
    ],
    immediate_attention: [
      "Recommend repair ASAP",
      "Needs immediate attention",
      "Should be addressed promptly",
      "Requires prompt attention"
    ]
  },
  
  descriptive_terms: {
    structural: [
      "bulging", "cracking", "movement", "settlement", "separation",
      "sagging", "bowing", "deflection", "structural bracing needed"
    ],
    moisture: [
      "moisture stains", "water stains", "leaking", "wet", "damp",
      "condensation", "water damage", "mold like substance"
    ],
    electrical: [
      "reverse polarity", "open ground", "burn marks", "sparked",
      "GFCI does not operate", "exposed wiring", "unsafe wiring"
    ],
    plumbing: [
      "leaking", "loose", "poor drainage", "corrosion", "rust",
      "flex tube not recommended", "pipe deterioration"
    ],
    roofing: [
      "missing shingles", "deterioration", "granule loss", "flashing leaking",
      "ridge caps need replacement", "roof leak"
    ],
    hvac: [
      "filter dirty", "ductwork loose", "carbon monoxide", "venting issues",
      "heat exchanger", "inducer motor", "exhaust disconnected"
    ]
  }
};

export const ROOM_SPECIFIC_INSPECTION_ITEMS = {
  kitchen: {
    name: "Kitchen",
    sections: [
      {
        name: "Appliances",
        items: [
          {
            description: "Kitchen faucet operation and mounting",
            commonIssues: ["loose faucet needs securing", "reverse osmosis faucet pulls out", "faucet operation improper"]
          },
          {
            description: "Dishwasher operation",
            commonIssues: ["dishwasher does not operate", "dishwasher leaking"]
          },
          {
            description: "Garbage disposal wiring and operation", 
            commonIssues: ["wiring to garbage disposal unsafe", "disposal not operating"]
          }
        ]
      },
      {
        name: "Electrical",
        items: [
          {
            description: "Kitchen outlet condition and grounding",
            commonIssues: ["open ground in kitchen outlet", "reverse polarity", "GFCI does not operate"]
          },
          {
            description: "Under-sink electrical boxes",
            commonIssues: ["open outlet box under sink needs cover"]
          }
        ]
      },
      {
        name: "Plumbing",
        items: [
          {
            description: "Kitchen sink drain system",
            commonIssues: ["kitchen sink drain leaking", "drain pipe too small", "flex tube not recommended"]
          }
        ]
      },
      {
        name: "Surfaces",
        items: [
          {
            description: "Counter and cabinet condition",
            commonIssues: ["grout missing/eroding on counter", "pocket door damaged"]
          }
        ]
      }
    ]
  },
  
  bathroom: {
    name: "Bathroom", 
    sections: [
      {
        name: "Fixtures",
        items: [
          {
            description: "Toilet mounting and operation",
            commonIssues: ["toilet bowl loose needs securing", "water valve to toilet leaks", "new wax ring may be needed"]
          },
          {
            description: "Sink and faucet operation",
            commonIssues: ["sink stop not connected", "water flow very low", "both faucets leaking"]
          },
          {
            description: "Shower/tub condition",
            commonIssues: ["tiles around bathtub spigot loose", "shower handle not operating", "shower drain leaking", "shower door broken"]
          }
        ]
      },
      {
        name: "Electrical", 
        items: [
          {
            description: "Bathroom electrical systems",
            commonIssues: ["GFCI does not operate", "outlet needs cover"]
          }
        ]
      },
      {
        name: "Ventilation",
        items: [
          {
            description: "Bathroom exhaust systems",
            commonIssues: ["vent painted shut", "exhaust fan disconnected", "poor drainage"]
          }
        ]
      }
    ]
  },

  living_room: {
    name: "Living Room",
    sections: [
      {
        name: "Electrical",
        items: [
          {
            description: "Living room outlets and wiring",
            commonIssues: ["reverse polarity in outlet", "open ground in outlet"]
          }
        ]
      },
      {
        name: "Fireplace",
        items: [
          {
            description: "Fireplace operation and safety",
            commonIssues: ["fireplace needs firebrick mortar", "fireplace leaking carbon monoxide", "fireplace damper disconnected", "cracks in fireplace need repair"]
          }
        ]
      },
      {
        name: "Doors and Windows",
        items: [
          {
            description: "Door and window operation",
            commonIssues: ["deadbolt does not open", "window will not close properly", "leaking insulated glass"]
          }
        ]
      }
    ]
  },

  bedroom: {
    name: "Bedroom",
    sections: [
      {
        name: "Windows", 
        items: [
          {
            description: "Bedroom window condition",
            commonIssues: ["leaking insulated glass", "window hardware needs adjustment"]
          }
        ]
      },
      {
        name: "Electrical",
        items: [
          {
            description: "Bedroom electrical systems", 
            commonIssues: ["ceiling fan dismantled", "extension cord wiring not recommended"]
          }
        ]
      }
    ]
  }
};

export const SYSTEM_SPECIFIC_INSPECTION_ITEMS = {
  exterior: {
    name: "Exterior Systems",
    sections: [
      {
        name: "Roofing",
        items: [
          {
            description: "Roof covering condition",
            commonIssues: ["missing shingles need replacement", "ridge caps deteriorated", "missing granules", "moss needs cleaning"]
          },
          {
            description: "Roof flashing and penetrations", 
            commonIssues: ["chimney flashing leaking", "flashing needs sealing", "plumbing boot cracked"]
          }
        ]
      },
      {
        name: "Gutters and Drainage",
        items: [
          {
            description: "Gutter system condition",
            commonIssues: ["gutters rusted through", "gutters pitched wrong direction", "downspout extension missing", "gutters have multiple holes"]
          }
        ]
      },
      {
        name: "Siding and Trim",
        items: [
          {
            description: "Exterior wall covering",
            commonIssues: ["wood rot on trim", "siding loose and wavy", "caulk failing around exterior", "trim pieces loose"]
          }
        ]
      },
      {
        name: "Foundation and Grading",
        items: [
          {
            description: "Foundation and site drainage",
            commonIssues: ["recommend additional fill for proper pitch", "remove dirt from touching siding", "landscaping too low"]
          }
        ]
      }
    ]
  },

  electrical: {
    name: "Electrical System", 
    sections: [
      {
        name: "Service and Distribution",
        items: [
          {
            description: "Electrical panel and service",
            commonIssues: ["knockout cover needed on junction box", "exposed Romex needs conduit"]
          }
        ]
      },
      {
        name: "Branch Circuits",
        items: [
          {
            description: "Outlet and switch condition",
            commonIssues: ["reverse polarity needs repair", "open ground needs repair", "GFCI does not operate", "outlet has burn marks"]
          }
        ]
      },
      {
        name: "Lighting",
        items: [
          {
            description: "Light fixtures and wiring",
            commonIssues: ["hanging wire fixtures need replacement", "loose light fixture", "broken light fixture"]
          }
        ]
      }
    ]
  },

  plumbing: {
    name: "Plumbing System",
    sections: [
      {
        name: "Supply System",
        items: [
          {
            description: "Water supply piping",
            commonIssues: ["main water shut off valve leaking", "corrosion on water pipes", "monitor water hardness"]
          }
        ]
      },
      {
        name: "Drain System", 
        items: [
          {
            description: "Drain, waste, and vent piping",
            commonIssues: ["old cast iron pipes have rust", "drain pipe leaking", "plumbing vent leaking", "flex tube not recommended"]
          }
        ]
      }
    ]
  },

  hvac: {
    name: "HVAC System",
    sections: [
      {
        name: "Heating Equipment",
        items: [
          {
            description: "Furnace operation and condition",
            commonIssues: ["secondary heat exchanger class action lawsuit", "inducer motor loud with water", "carbon monoxide from old units"]
          }
        ]
      },
      {
        name: "Distribution System",
        items: [
          {
            description: "Ductwork and air distribution", 
            commonIssues: ["supply ducts loose need tightening", "filter extremely dirty", "no heat source in room"]
          }
        ]
      },
      {
        name: "Ventilation",
        items: [
          {
            description: "Exhaust and ventilation systems",
            commonIssues: ["exhaust fan disconnected", "plastic dryer vent needs metal replacement", "vent holes too close to intake"]
          }
        ]
      }
    ]
  }
};

export const DEFERRED_COST_CATEGORIES = {
  short_term: {
    name: "1-2 Years",
    description: "Items needing attention within 1-2 years"
  },
  medium_term: {
    name: "3-5 Years", 
    description: "Items that have reached or are reaching their normal life expectancy"
  },
  monitoring: {
    name: "Monitor",
    description: "Items to monitor for changes or deterioration"
  }
};

export const SAFETY_PRIORITY_LEVELS = {
  immediate: {
    name: "Immediate Attention Required",
    description: "Safety hazards requiring prompt attention",
    color: "red"
  },
  major: {
    name: "Major Concerns",
    description: "Items that have failed or have potential of failing soon", 
    color: "orange"
  },
  standard: {
    name: "Standard Repairs",
    description: "Items to be addressed during normal maintenance",
    color: "yellow"
  }
};

export const PROFESSIONAL_CONTRACTORS = {
  "HVAC": "qualified HVAC contractor",
  "electrical": "qualified electrician", 
  "plumbing": "qualified plumber",
  "roofing": "qualified roofer",
  "structural": "qualified structural engineer",
  "chimney": "qualified chimney contractor",
  "siding": "qualified siding contractor",
  "foundation": "qualified basement contractor",
  "window": "qualified window contractor"
};