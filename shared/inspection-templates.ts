// Professional home inspection templates for certified inspectors

export const INSPECTION_SYSTEMS = {
  exterior: {
    name: "Exterior",
    categories: {
      "site-grounds": "Site & Grounds",
      "roof-covering": "Roof Covering", 
      "chimney": "Chimney",
      "gutters": "Gutters & Downspouts",
      "siding": "Siding & Trim",
      "windows-doors": "Windows & Doors",
      "electrical-exterior": "Exterior Electrical"
    }
  },
  structural: {
    name: "Structural Systems",
    categories: {
      "foundation": "Foundation & Basement",
      "framing": "Framing & Structure",
      "floors": "Floors & Subfloors"
    }
  },
  electrical: {
    name: "Electrical System",
    categories: {
      "service-panel": "Service Panel & Distribution",
      "wiring": "Wiring & Components",
      "outlets-switches": "Outlets & Switches",
      "lighting": "Lighting Fixtures",
      "safety-devices": "GFCI & Safety Devices"
    }
  },
  plumbing: {
    name: "Plumbing System", 
    categories: {
      "water-supply": "Water Supply System",
      "drainage": "Drainage & Waste",
      "water-heater": "Water Heater",
      "fixtures": "Plumbing Fixtures"
    }
  },
  hvac: {
    name: "HVAC System",
    categories: {
      "heating": "Heating System",
      "cooling": "Cooling System", 
      "ductwork": "Ductwork & Ventilation",
      "controls": "Controls & Thermostats"
    }
  },
  interior: {
    name: "Interior",
    categories: {
      "walls-ceilings": "Walls & Ceilings",
      "flooring": "Flooring Systems",
      "doors-windows": "Interior Doors & Windows",
      "stairs-railings": "Stairs & Railings"
    }
  },
  kitchen: {
    name: "Kitchen",
    categories: {
      "cabinets": "Cabinets & Hardware",
      "countertops": "Countertops & Surfaces",
      "sink": "Kitchen Sink & Plumbing",
      "disposal": "Garbage Disposal",
      "range": "Range & Cooking",
      "dishwasher": "Dishwasher",
      "exhaust": "Ventilation",
      "electrical": "Kitchen Electrical"
    }
  },
  bathrooms: {
    name: "Bathrooms",
    categories: {
      "fixtures": "Plumbing Fixtures",
      "ventilation": "Ventilation",
      "electrical": "Bathroom Electrical",
      "surfaces": "Surfaces & Finishes"
    }
  },
  laundry: {
    name: "Laundry",
    categories: {
      "connections": "Washer/Dryer Connections",
      "ventilation": "Dryer Ventilation",
      "electrical": "Laundry Electrical",
      "plumbing": "Laundry Plumbing"
    }
  },
  garage: {
    name: "Garage",
    categories: {
      "structure": "Garage Structure",
      "doors": "Garage Doors & Openers",
      "electrical": "Garage Electrical",
      "ventilation": "Ventilation & Safety"
    }
  }
};

export const INSPECTION_ITEMS = {
  exterior: [
    { description: "Service walks - material and condition", category: "site-grounds" },
    { description: "Driveway/parking areas", category: "site-grounds" },
    { description: "Porch support and condition", category: "site-grounds" },
    { description: "Steps and stoops condition", category: "site-grounds" },
    { description: "Roof covering material and condition", category: "roof-covering" },
    { description: "Roof ventilation adequacy", category: "roof-covering" },
    { description: "Flashing condition and sealing", category: "roof-covering" },
    { description: "Chimney structure and condition", category: "chimney" },
    { description: "Rain cap and spark arrestor", category: "chimney" },
    { description: "Gutters and downspouts attachment", category: "gutters" },
    { description: "Downspout extensions", category: "gutters" },
    { description: "Siding material and condition", category: "siding" },
    { description: "Trim, soffit, and fascia", category: "siding" },
    { description: "Windows operation and condition", category: "windows-doors" },
    { description: "Door operation and weatherstripping", category: "windows-doors" },
    { description: "Exterior electrical outlets", category: "electrical-exterior" },
    { description: "Exterior lighting fixtures", category: "electrical-exterior" }
  ],
  structural: [
    { description: "Foundation walls condition", category: "foundation" },
    { description: "Foundation settlement or movement", category: "foundation" },
    { description: "Basement/crawl space moisture", category: "foundation" },
    { description: "Floor joists condition", category: "framing" },
    { description: "Beams and support posts", category: "framing" },
    { description: "Floor surfaces condition", category: "floors" },
    { description: "Floor levelness and squeaks", category: "floors" }
  ],
  electrical: [
    { description: "Main service panel condition", category: "service-panel" },
    { description: "Circuit breakers operation", category: "service-panel" },
    { description: "Grounding system adequacy", category: "service-panel" },
    { description: "Wiring type and condition", category: "wiring" },
    { description: "Wire connections security", category: "wiring" },
    { description: "Outlet operation and grounding", category: "outlets-switches" },
    { description: "Switch operation", category: "outlets-switches" },
    { description: "Light fixture operation", category: "lighting" },
    { description: "GFCI outlets operation", category: "safety-devices" },
    { description: "AFCI breakers operation", category: "safety-devices" }
  ],
  plumbing: [
    { description: "Water pressure adequacy", category: "water-supply" },
    { description: "Water supply piping condition", category: "water-supply" },
    { description: "Drain line operation", category: "drainage" },
    { description: "Vent system adequacy", category: "drainage" },
    { description: "Water heater condition", category: "water-heater" },
    { description: "Water heater venting", category: "water-heater" },
    { description: "Fixture operation and condition", category: "fixtures" },
    { description: "Faucet operation and leaks", category: "fixtures" }
  ],
  hvac: [
    { description: "Heating system operation", category: "heating" },
    { description: "Heat exchanger condition", category: "heating" },
    { description: "Cooling system operation", category: "cooling" },
    { description: "Refrigerant levels", category: "cooling" },
    { description: "Ductwork condition and insulation", category: "ductwork" },
    { description: "Air filtration system", category: "ductwork" },
    { description: "Thermostat operation", category: "controls" },
    { description: "Zone controls operation", category: "controls" }
  ],
  interior: [
    { description: "Wall surfaces condition", category: "walls-ceilings" },
    { description: "Ceiling condition and stains", category: "walls-ceilings" },
    { description: "Paint and wallpaper condition", category: "walls-ceilings" },
    { description: "Flooring condition and wear", category: "flooring" },
    { description: "Carpet condition and stains", category: "flooring" },
    { description: "Interior door operation", category: "doors-windows" },
    { description: "Window operation and locks", category: "doors-windows" },
    { description: "Stairway condition and railings", category: "stairs-railings" },
    { description: "Handrail security", category: "stairs-railings" }
  ],
  kitchen: [
    { description: "Cabinet condition and operation", category: "cabinets" },
    { description: "Cabinet door alignment", category: "cabinets" },
    { description: "Countertop condition", category: "countertops" },
    { description: "Backsplash condition", category: "countertops" },
    { description: "Kitchen sink and faucet", category: "sink" },
    { description: "Sink drainage", category: "sink" },
    { description: "Disposal operation", category: "disposal" },
    { description: "Range and oven operation", category: "range" },
    { description: "Range hood operation", category: "range" },
    { description: "Dishwasher operation", category: "dishwasher" },
    { description: "Exhaust fan operation", category: "exhaust" },
    { description: "Kitchen electrical outlets", category: "electrical" },
    { description: "GFCI protection", category: "electrical" }
  ],
  bathrooms: [
    { description: "Toilet operation and condition", category: "fixtures" },
    { description: "Bathtub/shower condition", category: "fixtures" },
    { description: "Bathroom sink and faucet", category: "fixtures" },
    { description: "Plumbing fixture drainage", category: "fixtures" },
    { description: "Exhaust fan operation", category: "ventilation" },
    { description: "Bathroom ventilation adequacy", category: "ventilation" },
    { description: "Bathroom electrical outlets", category: "electrical" },
    { description: "GFCI protection", category: "electrical" },
    { description: "Tile and grout condition", category: "surfaces" },
    { description: "Bathroom flooring condition", category: "surfaces" },
    { description: "Wall surfaces and paint", category: "surfaces" }
  ],
  laundry: [
    { description: "Washer connections", category: "connections" },
    { description: "Dryer connections", category: "connections" },
    { description: "Laundry sink condition", category: "connections" },
    { description: "Dryer vent system", category: "ventilation" },
    { description: "Dryer vent termination", category: "ventilation" },
    { description: "Laundry electrical outlets", category: "electrical" },
    { description: "GFCI protection", category: "electrical" },
    { description: "Laundry room plumbing", category: "plumbing" },
    { description: "Water supply lines", category: "plumbing" }
  ],
  garage: [
    { description: "Garage structure condition", category: "structure" },
    { description: "Garage foundation", category: "structure" },
    { description: "Garage door operation", category: "doors" },
    { description: "Garage door opener", category: "doors" },
    { description: "Safety features", category: "doors" },
    { description: "Garage electrical system", category: "electrical" },
    { description: "GFCI outlets", category: "electrical" },
    { description: "Garage ventilation", category: "ventilation" },
    { description: "Carbon monoxide safety", category: "ventilation" }
  ]
};

export const CONDITIONS = {
  satisfactory: { label: "Satisfactory", color: "green", description: "Functionally consistent with original purpose" },
  marginal: { label: "Marginal", color: "yellow", description: "Will probably require repair within five years" },
  poor: { label: "Poor", color: "red", description: "Needs repair or replacement now" },
  major_concern: { label: "Major Concern", color: "red", description: "Significantly deficient or unsafe" },
  safety_hazard: { label: "Safety Hazard", color: "red", description: "Unsafe condition requiring prompt attention" },
  not_applicable: { label: "Not Applicable", color: "gray", description: "Not present or not applicable" }
};