// PDF-exact system templates matching the Green Summit Ave Inspection Report
// Based on pages 28-35 of the PDF screenshots provided

export const PDF_SYSTEM_TEMPLATES = {
  // BASEMENT SECTION - Page 29
  basement: {
    title: "BASEMENT",
    sections: [
      {
        title: "STAIRS",
        items: [
          { id: "stairs_condition_label", label: "Condition:", type: "label" },
          { id: "stairs_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "stairs_marginal", label: "Marginal", type: "checkbox" },
          { id: "stairs_poor", label: "Poor", type: "checkbox" },
          { id: "stairs_typical_wear", label: "Typical wear and tear", type: "checkbox" },
          { id: "stairs_need_repair", label: "Need repair", type: "checkbox" },
          { id: "stairs_loose", label: "Loose", type: "checkbox" },
          { id: "handrail_label", label: "Handrail:", type: "label" },
          { id: "handrail_yes", label: "Yes", type: "checkbox" },
          { id: "handrail_no", label: "No", type: "checkbox" },
          { id: "handrail_condition_label", label: "Condition:", type: "label" },
          { id: "handrail_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "handrail_balusters_recommended", label: "Handrail/Railing/Balusters Recommended", type: "checkbox" },
          { id: "headway_over_stairs_label", label: "Headway Over Stairs:", type: "label" },
          { id: "headway_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "headway_low_clearance", label: "Low clearance", type: "checkbox" },
          { id: "headway_safety_hazard", label: "Safety hazard", type: "checkbox" }
        ]
      },
      {
        title: "FOUNDATION",
        items: [
          { id: "foundation_condition_label", label: "Condition:", type: "label" },
          { id: "foundation_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "foundation_marginal", label: "Marginal", type: "checkbox" },
          { id: "foundation_have_evaluated", label: "Have evaluated", type: "checkbox" },
          { id: "foundation_monitor", label: "Monitor", type: "checkbox" },
          { id: "foundation_material_label", label: "Material:", type: "label" },
          { id: "foundation_brick", label: "Brick", type: "checkbox" },
          { id: "foundation_concrete_block", label: "Concrete block", type: "checkbox" },
          { id: "foundation_fieldstone", label: "Fieldstone", type: "checkbox" },
          { id: "foundation_poured_concrete", label: "Poured concrete", type: "checkbox" },
          { id: "foundation_horizontal_cracks_label", label: "Horizontal Cracks:", type: "label" },
          { id: "foundation_horizontal_north", label: "North", type: "checkbox" },
          { id: "foundation_horizontal_south", label: "South", type: "checkbox" },
          { id: "foundation_horizontal_east", label: "East", type: "checkbox" },
          { id: "foundation_horizontal_west", label: "West", type: "checkbox" },
          { id: "foundation_step_cracks_label", label: "Step Cracks:", type: "label" },
          { id: "foundation_step_north", label: "North", type: "checkbox" },
          { id: "foundation_step_south", label: "South", type: "checkbox" },
          { id: "foundation_step_east", label: "East", type: "checkbox" },
          { id: "foundation_step_west", label: "West", type: "checkbox" },
          { id: "foundation_vertical_cracks_label", label: "Vertical Cracks:", type: "label" },
          { id: "foundation_vertical_north", label: "North", type: "checkbox" },
          { id: "foundation_vertical_south", label: "South", type: "checkbox" },
          { id: "foundation_vertical_east", label: "East", type: "checkbox" },
          { id: "foundation_vertical_west", label: "West", type: "checkbox" },
          { id: "foundation_covered_walls_label", label: "Covered Walls:", type: "label" },
          { id: "foundation_covered_north", label: "North", type: "checkbox" },
          { id: "foundation_covered_south", label: "South", type: "checkbox" },
          { id: "foundation_covered_east", label: "East", type: "checkbox" },
          { id: "foundation_covered_west", label: "West", type: "checkbox" },
          { id: "foundation_basement_apparent_label", label: "Basement Apparent:", type: "label" },
          { id: "foundation_basement_yes", label: "Yes", type: "checkbox" },
          { id: "foundation_basement_no", label: "No", type: "checkbox" },
          { id: "foundation_basement_fresh", label: "Fresh", type: "checkbox" },
          { id: "foundation_basement_old_stains", label: "Old stains", type: "checkbox" },
          { id: "foundation_indication_moisture_label", label: "Indication Of Moisture:", type: "label" },
          { id: "foundation_indication_yes", label: "Yes", type: "checkbox" },
          { id: "foundation_indication_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "FLOOR",
        items: [
          { id: "floor_material_label", label: "Material:", type: "label" },
          { id: "floor_concrete", label: "Concrete", type: "checkbox" },
          { id: "floor_dirt_gravel", label: "Dirt/Gravel", type: "checkbox" },
          { id: "floor_not_visible", label: "Not visible/Covered with floor coverings", type: "checkbox" },
          { id: "floor_condition_label", label: "Condition:", type: "label" },
          { id: "floor_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "floor_marginal", label: "Marginal", type: "checkbox" },
          { id: "floor_poor", label: "Poor", type: "checkbox" },
          { id: "floor_typical_cracks", label: "Typical cracks", type: "checkbox" }
        ]
      },
      {
        title: "DRAINAGE",
        items: [
          { id: "drainage_sump_pump_label", label: "Sump Pump:", type: "label" },
          { id: "drainage_sump_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_sump_no", label: "No", type: "checkbox" },
          { id: "drainage_working", label: "Working", type: "checkbox" },
          { id: "drainage_not_working", label: "Not working", type: "checkbox" },
          { id: "drainage_pump_not_tested", label: "Pump not tested", type: "checkbox" },
          { id: "drainage_floor_drains_label", label: "Floor Drains:", type: "label" },
          { id: "drainage_floor_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_floor_not_visible", label: "Not visible", type: "checkbox" },
          { id: "drainage_floor_not_tested", label: "Drains not tested", type: "checkbox" }
        ]
      },
      {
        title: "CEILING BEAMS",
        items: [
          { id: "ceiling_beams_material_label", label: "Material:", type: "label" },
          { id: "ceiling_beams_steel", label: "Steel", type: "checkbox" },
          { id: "ceiling_beams_wood", label: "Wood", type: "checkbox" },
          { id: "ceiling_beams_concrete", label: "Concrete", type: "checkbox" },
          { id: "ceiling_beams_block", label: "Block", type: "checkbox" },
          { id: "ceiling_beams_not_visible", label: "Not visible/Covered with finish material.", type: "checkbox" },
          { id: "ceiling_beams_condition_label", label: "Condition:", type: "label" },
          { id: "ceiling_beams_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "ceiling_beams_marginal", label: "Marginal", type: "checkbox" },
          { id: "ceiling_beams_poor", label: "Poor", type: "checkbox" },
          { id: "ceiling_beams_stained_rusted", label: "Stained/rusted", type: "checkbox" }
        ]
      },
      {
        title: "COLUMNS",
        items: [
          { id: "columns_material_label", label: "Material:", type: "label" },
          { id: "columns_steel", label: "Steel", type: "checkbox" },
          { id: "columns_wood", label: "Wood", type: "checkbox" },
          { id: "columns_concrete", label: "Concrete", type: "checkbox" },
          { id: "columns_block", label: "Block", type: "checkbox" },
          { id: "columns_not_visible", label: "Not visible/Covered with finish material.", type: "checkbox" },
          { id: "columns_condition_label", label: "Condition:", type: "label" },
          { id: "columns_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "columns_marginal", label: "Marginal", type: "checkbox" },
          { id: "columns_poor", label: "Poor", type: "checkbox" },
          { id: "columns_stained_rusted", label: "Stained/rusted", type: "checkbox" }
        ]
      },
      {
        title: "POSTS",
        items: [
          { id: "posts_material_label", label: "Material:", type: "label" },
          { id: "posts_wood", label: "Wood", type: "checkbox" },
          { id: "posts_steel", label: "Steel", type: "checkbox" },
          { id: "posts_truss", label: "Truss", type: "checkbox" },
          { id: "posts_not_visible", label: "Not visible/Covered with finish material.", type: "checkbox" },
          { id: "posts_soft", label: "Soft", type: "checkbox" },
          { id: "posts_2x10", label: "2x10", type: "checkbox" },
          { id: "posts_2x12", label: "2x12", type: "checkbox" },
          { id: "posts_engineered_i_type", label: "Engineered I-Type", type: "checkbox" },
          { id: "posts_sagging_altered_joists", label: "Sagging/altered joists", type: "checkbox" },
          { id: "posts_condition_label", label: "Condition:", type: "label" },
          { id: "posts_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "posts_marginal", label: "Marginal", type: "checkbox" },
          { id: "posts_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "SUB FLOOR",
        items: [
          { id: "sub_floor_indication", label: "Indication of moisture stains/rotting", type: "checkbox" },
          { id: "sub_floor_note", label: "**Areas around shower stalls, etc., as viewed from basement or crawl space.", type: "text" }
        ]
      }
    ]
  },

  // CRAWL SPACE SECTION - Page 30
  crawlspace: {
    title: "CRAWL SPACE",
    sections: [
      {
        title: "CRAWL SPACE",
        items: [
          { id: "crawl_full_crawlspace", label: "Full crawlspace", type: "checkbox" },
          { id: "crawl_combination_basement", label: "Combination basement/crawl space/slab", type: "checkbox" }
        ]
      },
      {
        title: "ACCESS",
        items: [
          { id: "access_exterior", label: "Exterior", type: "checkbox" },
          { id: "access_interior_hatchdoor", label: "Interior hatchdoor", type: "checkbox" },
          { id: "access_via_basement", label: "Via basement", type: "checkbox" },
          { id: "access_no_access", label: "No Access", type: "checkbox" },
          { id: "access_inspected_from_label", label: "Inspected from:", type: "label" },
          { id: "access_access_panel", label: "Access panel", type: "checkbox" },
          { id: "access_in_crawl_space", label: "In the crawl space", type: "checkbox" }
        ]
      },
      {
        title: "FOUNDATION WALLS",
        items: [
          { id: "foundation_walls_material_label", label: "Material:", type: "label" },
          { id: "foundation_walls_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "foundation_walls_marginal", label: "Marginal", type: "checkbox" },
          { id: "foundation_walls_have_evaluated", label: "Have evaluated", type: "checkbox" },
          { id: "foundation_walls_monitor", label: "Monitor", type: "checkbox" },
          { id: "foundation_walls_concrete_block", label: "Concrete block", type: "checkbox" },
          { id: "foundation_walls_poured_concrete", label: "Poured Concrete", type: "checkbox" },
          { id: "foundation_walls_stone", label: "Stone", type: "checkbox" },
          { id: "foundation_walls_post_columns", label: "Post & columns", type: "checkbox" },
          { id: "foundation_walls_cracks", label: "Cracks", type: "checkbox" },
          { id: "foundation_walls_block", label: "Block", type: "checkbox" },
          { id: "foundation_walls_movement", label: "Movement", type: "checkbox" }
        ]
      },
      {
        title: "FLOOR",
        items: [
          { id: "floor_concrete", label: "Concrete", type: "checkbox" },
          { id: "floor_gravel", label: "Gravel", type: "checkbox" },
          { id: "floor_dirt", label: "Dirt", type: "checkbox" },
          { id: "floor_typical_cracks", label: "Typical cracks", type: "checkbox" }
        ]
      },
      {
        title: "DRAINAGE",
        items: [
          { id: "drainage_sump_pump_label", label: "Sump pump:", type: "label" },
          { id: "drainage_sump_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_sump_no", label: "No", type: "checkbox" },
          { id: "drainage_operable_label", label: "Operable:", type: "label" },
          { id: "drainage_operable_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_operable_no", label: "No", type: "checkbox" },
          { id: "drainage_pump_not_tested", label: "Pump Not tested", type: "checkbox" },
          { id: "drainage_standing_water_label", label: "Standing Water:", type: "label" },
          { id: "drainage_standing_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_standing_no", label: "No", type: "checkbox" },
          { id: "drainage_standing_not_visible", label: "Not visible", type: "checkbox" },
          { id: "drainage_evidence_moisture_label", label: "Evidence of moisture damage:", type: "label" },
          { id: "drainage_evidence_yes", label: "Yes", type: "checkbox" },
          { id: "drainage_evidence_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "VENTILATION",
        items: [
          { id: "ventilation_wall_vents", label: "Wall vents", type: "checkbox" },
          { id: "ventilation_power_vents", label: "Power vents", type: "checkbox" },
          { id: "ventilation_none_apparent", label: "None apparent", type: "checkbox" }
        ]
      },
      {
        title: "GIRDERS/BEAMS/COLUMNS",
        items: [
          { id: "girders_beams_steel", label: "Steel", type: "checkbox" },
          { id: "girders_beams_wood", label: "Wood", type: "checkbox" },
          { id: "girders_beams_masonry", label: "Masonry", type: "checkbox" },
          { id: "girders_beams_not_visible", label: "Not visible", type: "checkbox" },
          { id: "girders_beams_condition_label", label: "Condition:", type: "label" },
          { id: "girders_beams_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "girders_beams_marginal", label: "Marginal", type: "checkbox" },
          { id: "girders_beams_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "POSTS",
        items: [
          { id: "posts_material_label", label: "Material:", type: "label" },
          { id: "posts_sat", label: "Sat", type: "checkbox" },
          { id: "posts_wood", label: "Wood", type: "checkbox" },
          { id: "posts_2x10", label: "2x10", type: "checkbox" },
          { id: "posts_2x12", label: "2x12", type: "checkbox" },
          { id: "posts_engineered_i_type", label: "Engineered I-Type", type: "checkbox" },
          { id: "posts_sagging_altered_joists", label: "Sagging/altered joists", type: "checkbox" },
          { id: "posts_condition_label", label: "Condition:", type: "label" },
          { id: "posts_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "posts_marginal", label: "Marginal", type: "checkbox" },
          { id: "posts_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "SUB FLOOR",
        items: [
          { id: "sub_floor_indication_moisture", label: "Indication of moisture stains/rotting", type: "checkbox" },
          { id: "sub_floor_note", label: "**Areas around shower stalls, etc., as viewed from basement or crawl space", type: "text" }
        ]
      },
      {
        title: "INSULATION",
        items: [
          { id: "insulation_none", label: "None", type: "checkbox" },
          { id: "insulation_type_label", label: "Type:", type: "label" },
          { id: "insulation_location_label", label: "Location:", type: "label" },
          { id: "insulation_walls", label: "Walls", type: "checkbox" },
          { id: "insulation_between_floor_joists", label: "Between floor joists", type: "checkbox" }
        ]
      },
      {
        title: "VAPOR BARRIER",
        items: [
          { id: "vapor_barrier_yes", label: "Yes", type: "checkbox" },
          { id: "vapor_barrier_no", label: "No", type: "checkbox" },
          { id: "vapor_barrier_kraft_foil_face", label: "Kraft/foil face", type: "checkbox" },
          { id: "vapor_barrier_plastic", label: "Plastic", type: "checkbox" },
          { id: "vapor_barrier_not_visible", label: "Not visible", type: "checkbox" }
        ]
      }
    ]
  },

  // PLUMBING SECTION - Page 31
  plumbing: {
    title: "PLUMBING",
    sections: [
      {
        title: "WATER SERVICE",
        items: [
          { id: "water_service_main_shutoff_label", label: "Main Shut-off Location:", type: "label" },
          { id: "water_service_main_shutoff_basement", label: "In the basement", type: "checkbox" },
          { id: "water_service_water_entry_piping_label", label: "Water Entry Piping:", type: "label" },
          { id: "water_service_no_visible", label: "No visible", type: "checkbox" },
          { id: "water_service_copper_galvanized", label: "Copper/Galvanized", type: "checkbox" },
          { id: "water_service_plastic_pvc_cpvc", label: "Plastic* (PVC, CPVC, Polybutylene, PEX)", type: "checkbox" },
          { id: "water_service_lead", label: "Lead", type: "checkbox" },
          { id: "water_service_lead_other_solder_joints_label", label: "Lead Other Than Solder Joints:", type: "label" },
          { id: "water_service_lead_yes", label: "Yes", type: "checkbox" },
          { id: "water_service_lead_no", label: "No", type: "checkbox" },
          { id: "water_service_unknown", label: "Unknown", type: "checkbox" },
          { id: "water_service_service_entry", label: "Service entry", type: "checkbox" },
          { id: "water_service_visible_water_distribution_piping_label", label: "Visible Water Distribution Piping:", type: "label" },
          { id: "water_service_copper", label: "Copper", type: "checkbox" },
          { id: "water_service_galvanized", label: "Galvanized", type: "checkbox" },
          { id: "water_service_plastic_pvc_cpvc_polybutylene_pex", label: "Plastic* (PVC, CPVC, Polybutylene, PEX)", type: "checkbox" },
          { id: "water_service_condition_label", label: "Condition:", type: "label" },
          { id: "water_service_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_service_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_service_poor", label: "Poor", type: "checkbox" },
          { id: "water_service_functional_flow_label", label: "Functional Flow:", type: "label" },
          { id: "water_service_functional_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_service_functional_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_service_functional_poor", label: "Poor", type: "checkbox" },
          { id: "water_service_water_pressure_label", label: "Water pressure over 80 psi", type: "checkbox" },
          { id: "water_service_pressure_regulator_label", label: "Pressure regulator:", type: "label" },
          { id: "water_service_pressure_corroded", label: "Corroded", type: "checkbox" },
          { id: "water_service_pressure_leaking", label: "Leaking", type: "checkbox" },
          { id: "water_service_pressure_valves_broken", label: "Valves broken/missing", type: "checkbox" },
          { id: "water_service_pressure_preinsular_metal", label: "Preinsular metal", type: "checkbox" },
          { id: "water_service_cross_connections_label", label: "Cross connections:", type: "label" },
          { id: "water_service_cross_yes", label: "Yes", type: "checkbox" },
          { id: "water_service_cross_no", label: "No", type: "checkbox" },
          { id: "water_service_cross_cast_iron", label: "Cast iron", type: "checkbox" },
          { id: "water_service_cross_galvanized", label: "Galvanized", type: "checkbox" },
          { id: "water_service_cross_abs", label: "ABS", type: "checkbox" },
          { id: "water_service_drain_waste_vent_pipe_label", label: "Drain/Waste/Vent Pipe:", type: "label" },
          { id: "water_service_drain_yes", label: "Yes", type: "checkbox" },
          { id: "water_service_drain_cast_iron", label: "Cast iron", type: "checkbox" },
          { id: "water_service_drain_condition_label", label: "Condition:", type: "label" },
          { id: "water_service_drain_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_service_drain_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_service_drain_poor", label: "Poor", type: "checkbox" },
          { id: "water_service_traps_proper_p_type_label", label: "Traps Proper P-Type:", type: "label" },
          { id: "water_service_traps_yes", label: "Yes", type: "checkbox" },
          { id: "water_service_traps_no", label: "No", type: "checkbox" },
          { id: "water_service_functional_drainage_label", label: "Functional Drainage:", type: "label" },
          { id: "water_service_functional_drainage_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_service_functional_drainage_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_service_functional_drainage_poor", label: "Poor", type: "checkbox" },
          { id: "water_service_gas_line_label", label: "Gas Line:", type: "label" },
          { id: "water_service_gas_copper", label: "Copper", type: "checkbox" },
          { id: "water_service_gas_black_iron", label: "Black iron", type: "checkbox" },
          { id: "water_service_gas_stainless_steel", label: "Stainless steel", type: "checkbox" },
          { id: "water_service_gas_csst", label: "CSST", type: "checkbox" },
          { id: "water_service_gas_not_visible", label: "Not visible", type: "checkbox" },
          { id: "water_service_gas_condition_label", label: "Condition:", type: "label" },
          { id: "water_service_gas_condition_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_service_gas_condition_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_service_gas_condition_poor", label: "Poor", type: "checkbox" },
          { id: "water_service_gas_recommend_plumber", label: "Recommend plumber evaluate", type: "checkbox" }
        ]
      }
    ],
    notes: "At the gas meter"
  },

  // WATER HEATER SECTION - Page 31
  water_heater: {
    title: "WATER HEATER SHUT-OFF LOCATION",
    sections: [
      {
        title: "WATER HEATER",
        items: [
          { id: "water_heater_brand_name", label: "Brand name:", type: "text", value: "Bradford White" },
          { id: "water_heater_serial", label: "Serial #:", type: "text", value: "TC5101546" },
          { id: "water_heater_type_label", label: "Type:", type: "label" },
          { id: "water_heater_gas", label: "Gas", type: "checkbox" },
          { id: "water_heater_electric", label: "Electric", type: "checkbox" },
          { id: "water_heater_oil", label: "Oil", type: "checkbox" },
          { id: "water_heater_capacity", label: "Capacity:", type: "text", value: "75 gal." },
          { id: "water_heater_approx_age", label: "Approx. age:", type: "text", value: "15-20+ year(s)" },
          { id: "water_heater_combustion_air_venting_label", label: "Combustion Air Venting Present:", type: "label" },
          { id: "water_heater_combustion_yes", label: "Yes", type: "checkbox" },
          { id: "water_heater_combustion_no", label: "No", type: "checkbox" },
          { id: "water_heater_relief_valve_label", label: "Relief Valve:", type: "label" },
          { id: "water_heater_relief_yes", label: "Yes", type: "checkbox" },
          { id: "water_heater_relief_no", label: "No", type: "checkbox" },
          { id: "water_heater_extension_proper_label", label: "Extension proper:", type: "label" },
          { id: "water_heater_extension_yes", label: "Yes", type: "checkbox" },
          { id: "water_heater_extension_no", label: "No", type: "checkbox" },
          { id: "water_heater_missing", label: "Missing", type: "checkbox" },
          { id: "water_heater_recommend_repair", label: "Recommend repair", type: "checkbox" },
          { id: "water_heater_vent_pipe_label", label: "Vent Pipe:", type: "label" },
          { id: "water_heater_vent_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_heater_vent_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_heater_vent_poor", label: "Poor", type: "checkbox" },
          { id: "water_heater_vent_rusted", label: "Rusted", type: "checkbox" },
          { id: "water_heater_vent_revised", label: "Revised", type: "checkbox" },
          { id: "water_heater_condition_label", label: "Condition:", type: "label" },
          { id: "water_heater_condition_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_heater_condition_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_heater_condition_poor", label: "Poor", type: "checkbox" }
        ]
      }
    ]
  },

  // HEATING SYSTEM SECTION - Page 32
  heating: {
    title: "HEATING SYSTEM",
    sections: [
      {
        title: "BOILER SYSTEM",
        items: [
          { id: "boiler_brand_name", label: "Brand Name:", type: "text", value: "Weil-McLain" },
          { id: "boiler_model", label: "Model #:", type: "text", value: "CGi-5-PIDN" },
          { id: "boiler_approximate_age", label: "Approximate age:", type: "text", value: "20-25+ year(s)" },
          { id: "boiler_unknown", label: "Unknown", type: "checkbox" },
          { id: "boiler_energy_source_label", label: "Energy Source:", type: "label" },
          { id: "boiler_oil", label: "Oil", type: "checkbox" },
          { id: "boiler_lp", label: "LP", type: "checkbox" },
          { id: "boiler_electric", label: "Electric", type: "checkbox" },
          { id: "boiler_solid_fuel", label: "Solid Fuel", type: "checkbox" },
          { id: "boiler_distribution_label", label: "Distribution:", type: "label" },
          { id: "boiler_hot_water", label: "Hot water", type: "checkbox" },
          { id: "boiler_baseboard", label: "Baseboard", type: "checkbox" },
          { id: "boiler_steam", label: "Steam", type: "checkbox" },
          { id: "boiler_radiant_floor", label: "Radiant Floor", type: "checkbox" },
          { id: "boiler_circulation_label", label: "Circulation:", type: "label" },
          { id: "boiler_pump", label: "Pump", type: "checkbox" },
          { id: "boiler_gravity", label: "Gravity", type: "checkbox" },
          { id: "boiler_multiple_zones", label: "Multiple zones", type: "checkbox" },
          { id: "boiler_controls_label", label: "Controls:", type: "label" },
          { id: "boiler_temperature_gauge_label", label: "Temperature gauge exist:", type: "label" },
          { id: "boiler_temperature_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_temperature_no", label: "No", type: "checkbox" },
          { id: "boiler_operable_label", label: "Operable:", type: "label" },
          { id: "boiler_operable_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_operable_no", label: "No", type: "checkbox" },
          { id: "boiler_combustion_air_venting_label", label: "Combustion Air Venting Present:", type: "label" },
          { id: "boiler_combustion_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_combustion_no", label: "No", type: "checkbox" },
          { id: "boiler_combustion_na", label: "N/A", type: "checkbox" },
          { id: "boiler_relief_valve_label", label: "Relief valve:", type: "label" },
          { id: "boiler_relief_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_relief_no", label: "No", type: "checkbox" },
          { id: "boiler_relief_missing", label: "Missing", type: "checkbox" },
          { id: "boiler_extension_proper_label", label: "Extension proper:", type: "label" },
          { id: "boiler_extension_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_extension_no", label: "No", type: "checkbox" },
          { id: "boiler_extension_not_fire", label: "Did not fire", type: "checkbox" },
          { id: "boiler_extension_fixed", label: "Fixed", type: "checkbox" },
          { id: "boiler_operated_label", label: "Operated:", type: "label" },
          { id: "boiler_operated_satisfactory", label: "Satisfactory:", type: "checkbox" },
          { id: "boiler_operated_yes", label: "Yes", type: "checkbox" },
          { id: "boiler_operated_no", label: "No", type: "checkbox" },
          { id: "boiler_recommend_hvac_label", label: "Recommend HVAC technician examine", type: "checkbox" },
          { id: "boiler_before_closing", label: "Before closing", type: "checkbox" }
        ]
      },
      {
        title: "OTHER SYSTEMS",
        items: [
          { id: "other_systems_na", label: "N/A", type: "checkbox" },
          { id: "other_systems_electric_baseboard", label: "Electric baseboard", type: "checkbox" },
          { id: "other_systems_radiant_ceiling_cable", label: "Radiant ceiling cable", type: "checkbox" },
          { id: "other_systems_gas_space_heater", label: "Gas space heater", type: "checkbox" },
          { id: "other_systems_wood_burning_stove", label: "Wood burning stove (See Remarks)", type: "checkbox" },
          { id: "other_systems_proper_operation_label", label: "Proper Operation:", type: "label" },
          { id: "other_systems_yes", label: "Yes", type: "checkbox" },
          { id: "other_systems_no", label: "No", type: "checkbox" },
          { id: "other_systems_system_condition_label", label: "System Condition:", type: "label" },
          { id: "other_systems_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "other_systems_marginal", label: "Marginal", type: "checkbox" },
          { id: "other_systems_poor", label: "Poor", type: "checkbox" }
        ]
      }
    ]
  },

  // A/C UNIT SECTION - Page 32  
  ac_unit: {
    title: "A/C UNIT",
    sections: [
      {
        title: "A/C UNIT",
        items: [
          { id: "ac_central_system", label: "Central system", type: "checkbox" },
          { id: "ac_wall_unit", label: "Wall Unit", type: "checkbox" },
          { id: "ac_location_label", label: "Location:", type: "text", value: "In the attic and on the exterior" },
          { id: "ac_age_label", label: "Age:", type: "text", value: "1-5+ yrs." },
          { id: "ac_energy_source_label", label: "Energy Source:", type: "label" },
          { id: "ac_electric", label: "Electric", type: "checkbox" },
          { id: "ac_gas", label: "Gas", type: "checkbox" },
          { id: "ac_unit_type_label", label: "Unit Type:", type: "label" },
          { id: "ac_evaporator_coil_label", label: "Evaporator Coil:", type: "label" },
          { id: "ac_air_cooled", label: "Air cooled", type: "checkbox" },
          { id: "ac_water_cooled", label: "Water cooled", type: "checkbox" },
          { id: "ac_geothermal", label: "Geothermal", type: "checkbox" },
          { id: "ac_heat_pump", label: "Heat pump", type: "checkbox" },
          { id: "ac_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "ac_not_visible", label: "Not visible", type: "checkbox" },
          { id: "ac_needs_cleaning", label: "Needs cleaning", type: "checkbox" },
          { id: "ac_damaged", label: "Damaged", type: "checkbox" },
          { id: "ac_refrigerant_lines_label", label: "Refrigerant lines:", type: "label" },
          { id: "ac_leak", label: "Leak", type: "checkbox" },
          { id: "ac_damage", label: "Damage", type: "checkbox" },
          { id: "ac_insulation_missing", label: "Insulation missing", type: "checkbox" },
          { id: "ac_satisfactory_ref", label: "Satisfactory", type: "checkbox" },
          { id: "ac_condensate_line_drain_label", label: "Condensate Line/Drain:", type: "label" },
          { id: "ac_to_exterior", label: "To exterior", type: "checkbox" },
          { id: "ac_to_pump", label: "To pump", type: "checkbox" },
          { id: "ac_floor_drain", label: "Floor drain", type: "checkbox" },
          { id: "ac_operation_label", label: "Operation:", type: "label" },
          { id: "ac_difference_temperature", label: "Difference in temperature (split) should be 14-22° Fahrenheit. (See remarks)", type: "text" },
          { id: "ac_condition_label", label: "Condition:", type: "label" },
          { id: "ac_condition_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "ac_condition_marginal", label: "Marginal", type: "checkbox" },
          { id: "ac_condition_poor", label: "Poor", type: "checkbox" },
          { id: "ac_recommend_hvac", label: "Recommend HVAC technician examine/service", type: "checkbox" },
          { id: "ac_not_operated", label: "Not operated due to exterior temperature", type: "checkbox" }
        ]
      }
    ]
  },

  // ELECTRICAL COOLING SYSTEM SECTION - Page 33
  electrical: {
    title: "ELECTRIC/COOLING SYSTEM",
    sections: [
      {
        title: "MAIN PANEL",
        items: [
          { id: "main_panel_location_label", label: "Location:", type: "text", value: "Basement" },
          { id: "main_panel_condition_label", label: "Condition:", type: "label" },
          { id: "main_panel_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "main_panel_marginal", label: "Marginal", type: "checkbox" },
          { id: "main_panel_poor", label: "Poor" },
          { id: "main_panel_breakers", label: "Breakers", type: "checkbox" },
          { id: "main_panel_fuses", label: "Fuses", type: "checkbox" },
          { id: "main_panel_adequate_clearance_label", label: "Adequate Clearance to Panel:", type: "label" },
          { id: "main_panel_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_no", label: "No", type: "checkbox" },
          { id: "main_panel_amperage_label", label: "Amperage:", type: "text", value: "Volts 120/240" },
          { id: "main_panel_appears_grounded_label", label: "Appears Grounded:", type: "text", value: "Yes" },
          { id: "main_panel_gfci_breaker_label", label: "GFCI Breaker:", type: "label" },
          { id: "main_panel_gfci_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_gfci_no", label: "No", type: "checkbox" },
          { id: "main_panel_operable_label", label: "Operable:", type: "label" },
          { id: "main_panel_operable_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_operable_no", label: "No", type: "checkbox" },
          { id: "main_panel_double_tapping", label: "Double tapping of the main wire", type: "checkbox" },
          { id: "main_panel_afci_breaker_label", label: "AFCI Breaker:", type: "label" },
          { id: "main_panel_afci_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_afci_no", label: "No", type: "checkbox" },
          { id: "main_panel_operable_afci_label", label: "Operable:", type: "label" },
          { id: "main_panel_operable_afci_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_operable_afci_no", label: "No", type: "checkbox" },
          { id: "main_panel_main_wire_label", label: "MAIN WIRE:", type: "label" },
          { id: "main_panel_copper", label: "Copper", type: "checkbox" },
          { id: "main_panel_aluminum", label: "Aluminum", type: "checkbox" },
          { id: "main_panel_neutral_isolated_label", label: "Neutral isolated:", type: "label" },
          { id: "main_panel_neutral_yes", label: "Yes", type: "checkbox" },
          { id: "main_panel_neutral_no", label: "No", type: "checkbox" },
          { id: "main_panel_separate_branch", label: "Separate branch", type: "checkbox" },
          { id: "main_panel_condition_wire_label", label: "Condition:", type: "label" },
          { id: "main_panel_condition_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "main_panel_condition_marginal", label: "Marginal", type: "checkbox" },
          { id: "main_panel_condition_poor", label: "Poor", type: "checkbox" },
          { id: "main_panel_bx_cable", label: "BX cable", type: "checkbox" },
          { id: "main_panel_conduit", label: "Conduit", type: "checkbox" },
          { id: "main_panel_knob_tube", label: "Knob & tube**", type: "checkbox" },
          { id: "main_panel_romex", label: "Romex", type: "checkbox" },
          { id: "main_panel_wires_undersized", label: "Wires undersized/inadequately-fused", type: "checkbox" },
          { id: "main_panel_double_tapping_wire", label: "Double tapping", type: "checkbox" },
          { id: "main_panel_panel_not_accessible", label: "Panel not accessible", type: "checkbox" },
          { id: "main_panel_not_evaluated", label: "Not evaluated", type: "checkbox" },
          { id: "main_panel_reason", label: "Reason:", type: "text", value: "The panel screw was rusted and could not get the panel off." }
        ]
      },
      {
        title: "SUB PANEL(S)",
        items: [
          { id: "sub_panel_none_apparent", label: "None apparent", type: "checkbox" },
          { id: "sub_panel_location_1_label", label: "Location 1:", type: "text", value: "Basement" },
          { id: "sub_panel_location_2_label", label: "Location 2:", type: "text", value: "Basement" },
          { id: "sub_panel_panel_not_accessible", label: "Panel not accessible", type: "checkbox" },
          { id: "sub_panel_not_evaluated", label: "Not evaluated", type: "checkbox" },
          { id: "sub_panel_reason", label: "Reason:", type: "text" },
          { id: "sub_panel_branch_wire_label", label: "Branch Wire:", type: "label" },
          { id: "sub_panel_neutral_ground_separated_label", label: "Neutral/ground separated:" },
          { id: "sub_panel_copper", label: "Copper", type: "checkbox" },
          { id: "sub_panel_aluminum", label: "Aluminum", type: "checkbox" },
          { id: "sub_panel_neutral_isolated_label", label: "Neutral isolated:", type: "label" },
          { id: "sub_panel_yes", label: "Yes", type: "checkbox" },
          { id: "sub_panel_no", label: "No", type: "checkbox" },
          { id: "sub_panel_separate_branch", label: "Separate branch", type: "checkbox" },
          { id: "sub_panel_condition_label", label: "Condition:", type: "label" },
          { id: "sub_panel_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "sub_panel_marginal", label: "Marginal", type: "checkbox" },
          { id: "sub_panel_poor", label: "Poor", type: "checkbox" },
          { id: "sub_panel_recommend_separating", label: "Recommend separating/isolating neutrals", type: "checkbox" }
        ]
      },
      {
        title: "ELECTRICAL FIXTURES",
        items: [
          { id: "electrical_fixtures_representative_label", label: "A representative number of installed lighting fixtures, switches, and receptacles located inside the house, garage, and exterior walls were tested and found to be:", type: "text" },
          { id: "electrical_fixtures_condition_label", label: "Condition:", type: "label" },
          { id: "electrical_fixtures_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "electrical_fixtures_marginal", label: "Marginal", type: "checkbox" },
          { id: "electrical_fixtures_poor", label: "Poor", type: "checkbox" },
          { id: "electrical_fixtures_open_grounds", label: "Open grounds", type: "checkbox" },
          { id: "electrical_fixtures_reverse_polarity", label: "Reverse polarity", type: "checkbox" },
          { id: "electrical_fixtures_gfci_not_operating", label: "GFCI's not operating", type: "checkbox" },
          { id: "electrical_fixtures_sold_conductor", label: "Sold conductor aluminum branch wiring circuits*", type: "checkbox" },
          { id: "electrical_fixtures_recommend_electrician", label: "Recommend electrician evaluate/repair*", type: "checkbox" },
          { id: "electrical_fixtures_see_remarks", label: "(See remarks)", type: "checkbox" }
        ]
      }
    ]
  },

  // INTERIOR SECTION - Page 27-28
  interior: {
    title: "INTERIOR",
    sections: [
      {
        title: "INTERIOR WINDOWS/GLASS",
        items: [
          { id: "interior_windows_condition_label", label: "Condition:", type: "label" },
          { id: "interior_windows_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "interior_windows_marginal", label: "Marginal", type: "checkbox" },
          { id: "interior_windows_poor", label: "Poor", type: "checkbox" },
          { id: "interior_windows_needs_repair", label: "Needs repair", type: "checkbox" },
          { id: "interior_windows_painted_shut", label: "Painted shut (See remarks)", type: "checkbox" },
          { id: "interior_windows_glazing_compound", label: "Glazing compound needed", type: "checkbox" },
          { id: "interior_windows_cracked_glass", label: "Cracked glass", type: "checkbox" },
          { id: "interior_windows_hardware_missing", label: "Hardware missing", type: "checkbox" },
          { id: "interior_windows_evidence_leaking_label", label: "Evidence of Leaking Insulated Glass:", type: "label" },
          { id: "interior_windows_yes", label: "Yes", type: "checkbox" },
          { id: "interior_windows_no", label: "No", type: "checkbox" },
          { id: "interior_windows_na", label: "N/A", type: "checkbox" },
          { id: "interior_windows_broken_counter_balance", label: "Broken counter-balance mechanism", type: "checkbox" }
        ]
      },
      {
        title: "FIREPLACE",
        items: [
          { id: "fireplace_none", label: "None", type: "checkbox" },
          { id: "fireplace_location_label", label: "Location(s):", type: "text", value: "Living Room" },
          { id: "fireplace_type_label", label: "Type:", type: "label" },
          { id: "fireplace_gas", label: "Gas", type: "checkbox" },
          { id: "fireplace_wood", label: "Wood", type: "checkbox" },
          { id: "fireplace_wood_burning_stove", label: "Wood burning stove", type: "checkbox" },
          { id: "fireplace_electric", label: "Electric", type: "checkbox" },
          { id: "fireplace_vent_less", label: "Vent less (See remarks)", type: "checkbox" },
          { id: "fireplace_material_label", label: "Material:", type: "label" },
          { id: "fireplace_masonry", label: "Masonry", type: "checkbox" },
          { id: "fireplace_metal_insert", label: "Metal insert", type: "checkbox" },
          { id: "fireplace_metal_enclosed", label: "Metal enclosed", type: "checkbox" },
          { id: "fireplace_operation_label", label: "Operation:", type: "label" },
          { id: "fireplace_gas_key", label: "Gas key", type: "checkbox" },
          { id: "fireplace_gas_operated", label: "Operable:", type: "label" },
          { id: "fireplace_gas_yes", label: "Yes", type: "checkbox" },
          { id: "fireplace_gas_no", label: "No", type: "checkbox" },
          { id: "fireplace_damper_missing", label: "Damper missing", type: "checkbox" },
          { id: "fireplace_fireplace_shut", label: "Fireplace doors need repair", type: "checkbox" },
          { id: "fireplace_damper_modified_label", label: "Damper Modified for Gas Operation:", type: "label" },
          { id: "fireplace_damper_yes", label: "Yes", type: "checkbox" },
          { id: "fireplace_damper_no", label: "No", type: "checkbox" },
          { id: "fireplace_damper_missing_op", label: "Damper missing", type: "checkbox" },
          { id: "fireplace_hearth_extension_label", label: "Hearth Extension Adequate:", type: "label" },
          { id: "fireplace_hearth_yes", label: "Yes", type: "checkbox" },
          { id: "fireplace_hearth_no", label: "No", type: "checkbox" },
          { id: "fireplace_mantel_label", label: "Mantel:", type: "label" },
          { id: "fireplace_mantel_na", label: "N/A", type: "checkbox" },
          { id: "fireplace_mantel_secure", label: "Secure", type: "checkbox" },
          { id: "fireplace_mantel_loose", label: "Loose", type: "checkbox" },
          { id: "fireplace_physical_condition_label", label: "Physical Condition:", type: "label" },
          { id: "fireplace_physical_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "fireplace_physical_marginal", label: "Marginal", type: "checkbox" },
          { id: "fireplace_physical_poor", label: "Poor", type: "checkbox" },
          { id: "fireplace_recommend_heating", label: "Recommend heating/fire cleaned and re-examined", type: "checkbox" }
        ]
      },
      {
        title: "STAIRS/STEPS/BALCONIES",
        items: [
          { id: "stairs_steps_risers_treads_label", label: "Risers/Treads:", type: "label" },
          { id: "stairs_steps_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "stairs_steps_marginal", label: "Marginal", type: "checkbox" },
          { id: "stairs_steps_poor", label: "Poor", type: "checkbox" },
          { id: "stairs_steps_handrail_label", label: "Handrail:", type: "label" },
          { id: "stairs_steps_handrail_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "stairs_steps_handrail_marginal", label: "Marginal", type: "checkbox" },
          { id: "stairs_steps_handrail_poor", label: "Poor", type: "checkbox" },
          { id: "stairs_steps_stair_guards", label: "Stair guards", type: "checkbox" },
          { id: "stairs_steps_hand_rail_balusters", label: "Hand Rail/Railing/Balusters Recommended", type: "checkbox" },
          { id: "stairs_steps_risers_treads_uneven", label: "Risers/Treads uneven", type: "checkbox" },
          { id: "stairs_steps_headroom_label", label: "Headroom:", type: "label" },
          { id: "stairs_steps_headroom_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "stairs_steps_headroom_marginal", label: "Marginal", type: "checkbox" },
          { id: "stairs_steps_headroom_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "SMOKE/CARBON MONOXIDE DETECTORS",
        items: [
          { id: "smoke_carbon_present_label", label: "Present:", type: "label" },
          { id: "smoke_carbon_smoke_detector", label: "Smoke Detector:", type: "text", value: "Yes" },
          { id: "smoke_carbon_co_detector", label: "CO Detector:", type: "text", value: "Yes" },
          { id: "smoke_carbon_operable_smoke_label", label: "Operable:", type: "label" },
          { id: "smoke_carbon_operable_smoke_yes", label: "Yes", type: "checkbox" },
          { id: "smoke_carbon_operable_smoke_no", label: "No", type: "checkbox" },
          { id: "smoke_carbon_operable_smoke_not_tested", label: "Not tested", type: "checkbox" },
          { id: "smoke_carbon_operable_co_label", label: "Operable:", type: "label" },
          { id: "smoke_carbon_operable_co_yes", label: "Yes", type: "checkbox" },
          { id: "smoke_carbon_operable_co_no", label: "No", type: "checkbox" },
          { id: "smoke_carbon_operable_co_not_tested", label: "Not tested", type: "checkbox" }
        ]
      },
      {
        title: "ATTIC STRUCTURE/FRAMING/INSULATION",
        items: [
          { id: "attic_access_label", label: "Access:", type: "label" },
          { id: "attic_pull_down", label: "Pull down", type: "checkbox" },
          { id: "attic_scuttle_hole_hatch", label: "Scuttle hole/hatch", type: "checkbox" },
          { id: "attic_inspected_from_label", label: "Inspected From:", type: "label" },
          { id: "attic_access_panel", label: "Access panel", type: "checkbox" },
          { id: "attic_in_attic", label: "In the attic", type: "checkbox" },
          { id: "attic_location_label", label: "Location:", type: "label" },
          { id: "attic_bedroom_hall", label: "Bedroom hall", type: "checkbox" },
          { id: "attic_closet", label: "Closet", type: "checkbox" },
          { id: "attic_garage", label: "Garage", type: "checkbox" },
          { id: "attic_flooring_label", label: "Flooring:", type: "label" },
          { id: "attic_none", label: "None", type: "checkbox" },
          { id: "attic_insulation_label", label: "Insulation:", type: "label" },
          { id: "attic_fiber_glass", label: "Fiber glass", type: "checkbox" },
          { id: "attic_batts", label: "Batts", type: "checkbox" },
          { id: "attic_loose", label: "Loose", type: "checkbox" },
          { id: "attic_cellulose", label: "Cellulose", type: "checkbox" },
          { id: "attic_foam", label: "Foam", type: "checkbox" },
          { id: "attic_vermiculite", label: "Vermiculite", type: "checkbox" },
          { id: "attic_recommend_baffles", label: "Recommend Baffles @ Eaves", type: "checkbox" },
          { id: "attic_depth_label", label: "Depth:", type: "text", value: "3-6\"" },
          { id: "attic_installed_in_label", label: "Installed In:", type: "label" },
          { id: "attic_rafters", label: "Rafters", type: "checkbox" },
          { id: "attic_walls", label: "Walls", type: "checkbox" },
          { id: "attic_between_ceiling_joists", label: "Between ceiling joists", type: "checkbox" },
          { id: "attic_underside_roof_deck", label: "Underside of Roof Deck", type: "checkbox" },
          { id: "attic_not_visible", label: "Not visible", type: "checkbox" },
          { id: "attic_damaged", label: "Damaged", type: "checkbox" },
          { id: "attic_displaced", label: "Displaced", type: "checkbox" },
          { id: "attic_missing", label: "Missing", type: "checkbox" },
          { id: "attic_compressed", label: "Compressed", type: "checkbox" },
          { id: "attic_vapor_barriers_label", label: "Vapor Barriers:", type: "label" },
          { id: "attic_kraft_foil_faced", label: "Kraft/foil faced", type: "checkbox" },
          { id: "attic_plastic", label: "Plastic", type: "checkbox" },
          { id: "attic_not_visible_vapor", label: "Not visible", type: "checkbox" },
          { id: "attic_improperly_installed", label: "Improperly Installed", type: "checkbox" },
          { id: "attic_ventilation_label", label: "Ventilation:", type: "label" },
          { id: "attic_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "attic_inadequate", label: "Inadequate", type: "checkbox" },
          { id: "attic_fan_exhausted_label", label: "Fan Exhausted To:", type: "label" },
          { id: "attic_fan_attic", label: "Attic:", type: "checkbox" },
          { id: "attic_fan_yes", label: "Yes", type: "checkbox" },
          { id: "attic_fan_no", label: "No", type: "checkbox" },
          { id: "attic_fan_outside", label: "Outside:", type: "checkbox" },
          { id: "attic_fan_outside_yes", label: "Yes", type: "checkbox" },
          { id: "attic_fan_outside_no", label: "No", type: "checkbox" },
          { id: "attic_fan_not_visible", label: "Not visible", type: "checkbox" },
          { id: "attic_hvac_duct_label", label: "HVAC Duct:", type: "label" },
          { id: "attic_hvac_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "attic_hvac_damaged", label: "Damaged", type: "checkbox" },
          { id: "attic_hvac_split", label: "Split", type: "checkbox" },
          { id: "attic_hvac_disconnected", label: "Disconnected", type: "checkbox" },
          { id: "attic_hvac_leaking", label: "Leaking", type: "checkbox" },
          { id: "attic_hvac_undersized", label: "Undersized", type: "checkbox" },
          { id: "attic_hvac_recommend_insulation", label: "Recommend Insulation", type: "checkbox" },
          { id: "attic_chimney_chase_label", label: "Chimney Chase:", type: "label" },
          { id: "attic_chimney_na", label: "N/A", type: "checkbox" },
          { id: "attic_chimney_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "attic_chimney_needs_repair", label: "Needs repair", type: "checkbox" },
          { id: "attic_chimney_not_visible", label: "Not Visible", type: "checkbox" },
          { id: "attic_structural_problems_label", label: "Structural Problems Observed:", type: "label" },
          { id: "attic_structural_yes", label: "Yes", type: "checkbox" },
          { id: "attic_structural_no", label: "No", type: "checkbox" },
          { id: "attic_structural_recommend", label: "Recommend repair", type: "checkbox" },
          { id: "attic_structural_recommend_engineer", label: "Recommend Structural Engineer", type: "checkbox" },
          { id: "attic_roof_structure_label", label: "Roof Structure:", type: "label" },
          { id: "attic_roof_rafters", label: "Rafters", type: "checkbox" },
          { id: "attic_roof_trusses", label: "Trusses", type: "checkbox" },
          { id: "attic_roof_wood", label: "Wood", type: "checkbox" },
          { id: "attic_roof_collar_ties", label: "Collar Ties", type: "checkbox" },
          { id: "attic_roof_purlines", label: "Purlines", type: "checkbox" },
          { id: "attic_roof_knee_wall", label: "Knee Wall", type: "checkbox" },
          { id: "attic_roof_ceiling_joists_label", label: "Ceiling Joists:", type: "label" },
          { id: "attic_roof_sheathing_label", label: "Sheathing:", type: "label" },
          { id: "attic_roof_plywood", label: "Plywood", type: "checkbox" },
          { id: "attic_roof_osb", label: "OSB", type: "checkbox" },
          { id: "attic_roof_planking", label: "Planking", type: "checkbox" },
          { id: "attic_roof_rotted", label: "Rotted", type: "checkbox" },
          { id: "attic_roof_stained", label: "Stained", type: "checkbox" },
          { id: "attic_roof_delaminated", label: "Delaminated", type: "checkbox" },
          { id: "attic_evidence_condensation_label", label: "Evidence of Condensation/Moisture Leaking:", type: "label" },
          { id: "attic_evidence_yes", label: "Yes", type: "checkbox" },
          { id: "attic_evidence_no", label: "No", type: "checkbox" },
          { id: "attic_evidence_see_remarks", label: "(See remarks)", type: "checkbox" }
        ]
      }
    ]
  }
};

// Helper function to get system template by type
export function getSystemTemplate(systemType: string) {
  return PDF_SYSTEM_TEMPLATES[systemType as keyof typeof PDF_SYSTEM_TEMPLATES];
}

// All supported system types from the PDF
export const SUPPORTED_SYSTEM_TYPES = Object.keys(PDF_SYSTEM_TEMPLATES);