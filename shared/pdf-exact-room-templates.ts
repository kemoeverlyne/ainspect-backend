// Exact PDF room templates matching the Green Summit Ave Inspection Report
// Based on pages 25-27 of the PDF and screenshots provided

export const PDF_ROOM_TEMPLATES = {
  // BEDROOM TEMPLATE - Based on PDF pages 25-27
  bedroom: {
    title: "BEDROOM",
    sections: [
      {
        title: "Walls & Ceiling",
        items: [
          { id: "walls_ceiling_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "walls_ceiling_marginal", label: "Marginal", type: "checkbox" },
          { id: "walls_ceiling_poor", label: "Poor", type: "checkbox" },
          { id: "walls_ceiling_typical_cracks", label: "Typical cracks", type: "checkbox" },
          { id: "walls_ceiling_damage", label: "Damage", type: "checkbox" }
        ]
      },
      {
        title: "Moisture stains",
        items: [
          { id: "moisture_stains_yes", label: "Yes", type: "checkbox" },
          { id: "moisture_stains_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Floor",
        items: [
          { id: "floor_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "floor_marginal", label: "Marginal", type: "checkbox" },
          { id: "floor_poor", label: "Poor", type: "checkbox" },
          { id: "floor_squeaks", label: "Squeaks", type: "checkbox" },
          { id: "floor_slopes", label: "Slopes", type: "checkbox" }
        ]
      },
      {
        title: "Electrical",
        items: [
          { id: "switches_label", label: "Switches:", type: "label" },
          { id: "switches_yes", label: "Yes", type: "checkbox" },
          { id: "switches_no", label: "No", type: "checkbox" },
          { id: "receptacles_label", label: "Receptacles:", type: "label" },
          { id: "receptacles_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_no", label: "No", type: "checkbox" },
          { id: "receptacles_operable_label", label: "Operable:", type: "label" },
          { id: "receptacles_operable_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_operable_no", label: "No", type: "checkbox" },
          { id: "safety_hazard", label: "Safety Hazard", type: "checkbox" },
          { id: "cover_plates_missing", label: "Cover plates missing", type: "checkbox" }
        ]
      },
      {
        title: "Open ground/Reverse polarity",
        items: [
          { id: "open_ground_yes", label: "Yes", type: "checkbox" },
          { id: "open_ground_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Heating Source Present",
        items: [
          { id: "heating_yes", label: "Yes", type: "checkbox" },
          { id: "heating_not_visible", label: "Not visible", type: "checkbox" }
        ]
      },
      {
        title: "Egress Restricted",
        items: [
          { id: "egress_na", label: "N/A", type: "checkbox" },
          { id: "egress_yes", label: "Yes", type: "checkbox" },
          { id: "egress_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Doors & Windows",
        items: [
          { id: "doors_windows_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "doors_windows_marginal", label: "Marginal", type: "checkbox" },
          { id: "doors_windows_poor", label: "Poor", type: "checkbox" },
          { id: "cracked_glass", label: "Cracked glass", type: "checkbox" },
          { id: "evidence_leaking_glass", label: "Evidence of leaking insulated glass", type: "checkbox" },
          { id: "broken_missing_hardware", label: "Broken/Missing hardware", type: "checkbox" }
        ]
      },
      {
        title: "Holes",
        items: [
          { id: "holes_doors", label: "Doors", type: "checkbox" },
          { id: "holes_walls", label: "Walls", type: "checkbox" },
          { id: "holes_ceilings", label: "Ceilings", type: "checkbox" }
        ]
      }
    ]
  },

  // BATHROOM TEMPLATE - Based on PDF pages 23-24
  bathroom: {
    title: "BATHROOM",
    sections: [
      {
        title: "Sinks",
        items: [
          { id: "sinks_faucet_leaks_label", label: "Faucet leaks:", type: "label" },
          { id: "sinks_faucet_leaks_yes", label: "Yes", type: "checkbox" },
          { id: "sinks_faucet_leaks_no", label: "No", type: "checkbox" },
          { id: "sinks_pipes_leak_label", label: "Pipes leak:", type: "label" },
          { id: "sinks_pipes_leak_yes", label: "Yes", type: "checkbox" },
          { id: "sinks_pipes_leak_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Showers",
        items: [
          { id: "showers_faucet_leaks_label", label: "Faucet leaks:", type: "label" },
          { id: "showers_faucet_leaks_yes", label: "Yes", type: "checkbox" },
          { id: "showers_faucet_leaks_no", label: "No", type: "checkbox" },
          { id: "showers_pipes_leak_label", label: "Pipes leak:", type: "label" },
          { id: "showers_pipes_leak_yes", label: "Yes", type: "checkbox" },
          { id: "showers_pipes_leak_not_visible", label: "Not Visible", type: "checkbox" },
          { id: "showers_operable_label", label: "Operable:", type: "label" },
          { id: "showers_operable_yes", label: "Yes", type: "checkbox" },
          { id: "showers_operable_no", label: "No", type: "checkbox" },
          { id: "cracked_bowl", label: "Cracked bowl", type: "checkbox" },
          { id: "toilet_leaks", label: "Toilet leaks", type: "checkbox" }
        ]
      },
      {
        title: "Toilet",
        items: [
          { id: "toilet_bowl_loose_label", label: "Bowl loose:", type: "label" },
          { id: "toilet_bowl_loose_yes", label: "Yes", type: "checkbox" },
          { id: "toilet_bowl_loose_no", label: "No", type: "checkbox" },
          { id: "toilet_operable_label", label: "Operable:", type: "label" },
          { id: "toilet_operable_yes", label: "Yes", type: "checkbox" },
          { id: "toilet_operable_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Shower/Tub area",
        items: [
          { id: "shower_tub_ceramic_plastic", label: "Ceramic/Plastic", type: "checkbox" },
          { id: "shower_tub_fiberglass", label: "Fiberglass", type: "checkbox" },
          { id: "shower_tub_masonite", label: "Masonite", type: "checkbox" },
          { id: "shower_tub_condition_label", label: "Condition:", type: "label" },
          { id: "shower_tub_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "shower_tub_marginal", label: "Marginal", type: "checkbox" },
          { id: "shower_tub_poor", label: "Poor", type: "checkbox" },
          { id: "shower_tub_rotted_floors", label: "Rotted floors", type: "checkbox" }
        ]
      },
      {
        title: "Caulk/Grouting Needed",
        items: [
          { id: "caulk_grouting_yes", label: "Yes", type: "checkbox" },
          { id: "caulk_grouting_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Drainage",
        items: [
          { id: "drainage_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "drainage_marginal", label: "Marginal", type: "checkbox" },
          { id: "drainage_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "Water flow",
        items: [
          { id: "water_flow_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "water_flow_marginal", label: "Marginal", type: "checkbox" },
          { id: "water_flow_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "Moisture stains present",
        items: [
          { id: "moisture_stains_present_yes", label: "Yes", type: "checkbox" },
          { id: "moisture_stains_present_no", label: "No", type: "checkbox" },
          { id: "moisture_stains_walls", label: "Walls", type: "checkbox" },
          { id: "moisture_stains_ceilings", label: "Ceilings", type: "checkbox" },
          { id: "moisture_stains_cabinets", label: "Cabinets", type: "checkbox" }
        ]
      },
      {
        title: "Receptacles Present",
        items: [
          { id: "receptacles_present_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_present_no", label: "No", type: "checkbox" },
          { id: "receptacles_present_operable_label", label: "Operable:", type: "label" },
          { id: "receptacles_present_operable_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_present_operable_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "GFCI",
        items: [
          { id: "gfci_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_no", label: "No", type: "checkbox" },
          { id: "gfci_operable_label", label: "Operable:", type: "label" },
          { id: "gfci_operable_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_operable_no", label: "No", type: "checkbox" },
          { id: "potential_safety_hazards", label: "Potential Safety Hazards(s)", type: "checkbox" }
        ]
      },
      {
        title: "Open ground/Reverse polarity",
        items: [
          { id: "open_ground_reverse_yes", label: "Yes", type: "checkbox" },
          { id: "open_ground_reverse_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Heat source present",
        items: [
          { id: "heat_source_yes", label: "Yes", type: "checkbox" },
          { id: "heat_source_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Window/doors",
        items: [
          { id: "window_doors_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "window_doors_marginal", label: "Marginal", type: "checkbox" },
          { id: "window_doors_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "Exhaust fan",
        items: [
          { id: "exhaust_fan_yes", label: "Yes", type: "checkbox" },
          { id: "exhaust_fan_no", label: "No", type: "checkbox" },
          { id: "exhaust_fan_operable_label", label: "Operable:", type: "label" },
          { id: "exhaust_fan_operable_yes", label: "Yes", type: "checkbox" },
          { id: "exhaust_fan_operable_no", label: "No", type: "checkbox" },
          { id: "exhaust_fan_noisy", label: "Noisy", type: "checkbox" }
        ]
      }
    ]
  },

  // KITCHEN TEMPLATE - Based on PDF page 22
  kitchen: {
    title: "KITCHEN",
    sections: [
      {
        title: "COUNTERTOPS",
        items: [
          { id: "countertops_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "countertops_marginal", label: "Marginal", type: "checkbox" },
          { id: "countertops_recommend_repair", label: "Recommend repair/caulking", type: "checkbox" }
        ]
      },
      {
        title: "CABINETS", 
        items: [
          { id: "cabinets_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "cabinets_marginal", label: "Marginal", type: "checkbox" },
          { id: "cabinets_recommend_repair", label: "Recommend repair/adjustment", type: "checkbox" }
        ]
      },
      {
        title: "PLUMBING COMPONENTS",
        items: [
          { id: "faucet_leaks_label", label: "Faucet Leaks:", type: "label" },
          { id: "faucet_leaks_yes", label: "Yes", type: "checkbox" },
          { id: "faucet_leaks_no", label: "No", type: "checkbox" },
          { id: "pipes_leak_corroded_label", label: "Pipes leak/corroded:", type: "label" },
          { id: "pipes_leak_corroded_yes", label: "Yes", type: "checkbox" },
          { id: "pipes_leak_corroded_no", label: "No", type: "checkbox" },
          { id: "sink_faucet_label", label: "Sink/Faucet:", type: "label" },
          { id: "sink_faucet_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "sink_faucet_corroded", label: "Corroded", type: "checkbox" },
          { id: "sink_faucet_chipped", label: "Chipped", type: "checkbox" },
          { id: "sink_faucet_cracked", label: "Cracked", type: "checkbox" },
          { id: "sink_faucet_recommend_repair", label: "Recommend repair", type: "checkbox" },
          { id: "functional_drainage_label", label: "Functional Drainage:", type: "label" },
          { id: "functional_drainage_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "functional_drainage_marginal", label: "Marginal", type: "checkbox" },
          { id: "functional_drainage_poor", label: "Poor", type: "checkbox" },
          { id: "functional_flow_label", label: "Functional Flow:", type: "label" },
          { id: "functional_flow_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "functional_flow_marginal", label: "Marginal", type: "checkbox" },
          { id: "functional_flow_poor", label: "Poor", type: "checkbox" }
        ]
      },
      {
        title: "WALLS & CEILING",
        items: [
          { id: "walls_ceiling_condition_label", label: "Condition:", type: "label" },
          { id: "walls_ceiling_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "walls_ceiling_marginal", label: "Marginal", type: "checkbox" },
          { id: "walls_ceiling_poor", label: "Poor", type: "checkbox" },
          { id: "walls_ceiling_typical_cracks", label: "Typical cracks", type: "checkbox" },
          { id: "walls_ceiling_moisture_stains", label: "Moisture stains", type: "checkbox" }
        ]
      },
      {
        title: "HEATING/COOLING/POWER",
        items: [
          { id: "heating_cooling_yes", label: "Yes", type: "checkbox" },
          { id: "heating_cooling_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "FLOOR",
        items: [
          { id: "floor_condition_label", label: "Condition:", type: "label" },
          { id: "floor_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "floor_marginal", label: "Marginal", type: "checkbox" },
          { id: "floor_poor", label: "Poor", type: "checkbox" },
          { id: "floor_sloping", label: "Sloping", type: "checkbox" },
          { id: "floor_squeaks", label: "Squeaks", type: "checkbox" }
        ]
      },
      {
        title: "APPLIANCES",
        subtitle: "Appliances are tested for functional operation only. A complete inspection was not performed. (See remarks page)",
        items: [
          { id: "disposal_label", label: "Disposal", type: "label" },
          { id: "disposal_operable_label", label: "Operable:", type: "label" },
          { id: "disposal_operable_yes", label: "Yes", type: "checkbox" },
          { id: "disposal_operable_no", label: "No", type: "checkbox" },
          { id: "microwave_label", label: "Microwave", type: "label" },
          { id: "microwave_operable_label", label: "Operable:", type: "label" },
          { id: "microwave_operable_yes", label: "Yes", type: "checkbox" },
          { id: "microwave_operable_no", label: "No", type: "checkbox" },
          { id: "oven_label", label: "Oven", type: "label" },
          { id: "oven_operable_label", label: "Operable:", type: "label" },
          { id: "oven_operable_yes", label: "Yes", type: "checkbox" },
          { id: "oven_operable_no", label: "No", type: "checkbox" },
          { id: "exhaust_fan_label", label: "Exhaust fan", type: "label" },
          { id: "exhaust_fan_operable_label", label: "Operable:", type: "label" },
          { id: "exhaust_fan_operable_yes", label: "Yes", type: "checkbox" },
          { id: "exhaust_fan_operable_no", label: "No", type: "checkbox" },
          { id: "range_label", label: "Range", type: "label" },
          { id: "range_operable_label", label: "Operable:", type: "label" },
          { id: "range_operable_yes", label: "Yes", type: "checkbox" },
          { id: "range_operable_no", label: "No", type: "checkbox" },
          { id: "refrigerator_label", label: "Refrigerator", type: "label" },
          { id: "refrigerator_operable_label", label: "Operable:", type: "label" },
          { id: "refrigerator_operable_yes", label: "Yes", type: "checkbox" },
          { id: "refrigerator_operable_no", label: "No", type: "checkbox" },
          { id: "dishwasher_label", label: "Dishwasher", type: "label" },
          { id: "dishwasher_operable_label", label: "Operable:", type: "label" },
          { id: "dishwasher_operable_yes", label: "Yes", type: "checkbox" },
          { id: "dishwasher_operable_no", label: "No", type: "checkbox" },
          { id: "dishwasher_air_gap_label", label: "Dishwasher Air Gap or Dishwasher Drain Line Present:", type: "label" },
          { id: "dishwasher_air_gap_yes", label: "Yes", type: "checkbox" },
          { id: "dishwasher_air_gap_not_visible", label: "Not Visible", type: "checkbox" },
          { id: "receptacles_present_label", label: "Receptacles Present:", type: "label" },
          { id: "receptacles_present_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_present_no", label: "No", type: "checkbox" },
          { id: "receptacles_operable_label", label: "Operable:", type: "label" },
          { id: "receptacles_operable_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_operable_no", label: "No", type: "checkbox" },
          { id: "gfci_label", label: "GFCI:", type: "label" },
          { id: "gfci_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_no", label: "No", type: "checkbox" },
          { id: "gfci_operable_label", label: "Operable:", type: "label" },
          { id: "gfci_operable_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_operable_no", label: "No", type: "checkbox" },
          { id: "open_ground_reverse_polarity_label", label: "Open ground/Reverse polarity:", type: "label" },
          { id: "open_ground_reverse_polarity_yes", label: "Yes", type: "checkbox" },
          { id: "open_ground_reverse_polarity_no", label: "No", type: "checkbox" },
          { id: "potential_safety_hazards", label: "Potential safety hazard(s)", type: "checkbox" }
        ]
      }
    ]
  },

  // LAUNDRY ROOM TEMPLATE - Based on PDF page 22
  laundry: {
    title: "LAUNDRY ROOM",
    sections: [
      {
        title: "LAUNDRY",
        items: [
          { id: "laundry_sink_label", label: "Laundry sink:", type: "label" },
          { id: "laundry_sink_na", label: "N/A", type: "checkbox" },
          { id: "faucet_leaks_label", label: "Faucet leaks:", type: "label" },
          { id: "faucet_leaks_yes", label: "Yes", type: "checkbox" },
          { id: "faucet_leaks_no", label: "No", type: "checkbox" },
          { id: "pipes_leak_label", label: "Pipes leak:", type: "label" },
          { id: "pipes_leak_yes", label: "Yes", type: "checkbox" },
          { id: "pipes_leak_no", label: "No", type: "checkbox" },
          { id: "cross_connections_label", label: "Cross connections:", type: "label" },
          { id: "cross_connections_yes", label: "Yes", type: "checkbox" },
          { id: "cross_connections_no", label: "No", type: "checkbox" },
          { id: "heat_source_present_label", label: "Heat source present:", type: "label" },
          { id: "heat_source_present_yes", label: "Yes", type: "checkbox" },
          { id: "heat_source_present_no", label: "No", type: "checkbox" },
          { id: "room_vented_label", label: "Room vented:", type: "label" },
          { id: "room_vented_yes", label: "Yes", type: "checkbox" },
          { id: "room_vented_no", label: "No", type: "checkbox" },
          { id: "dryer_vented_label", label: "Dryer vented:", type: "label" },
          { id: "dryer_vented_wall", label: "Wall", type: "checkbox" },
          { id: "dryer_vented_ceiling", label: "Ceiling", type: "checkbox" },
          { id: "dryer_vented_floor", label: "Floor", type: "checkbox" },
          { id: "dryer_vented_not_exterior", label: "Not vented to Exterior", type: "checkbox" },
          { id: "dryer_vented_recommend_repair", label: "Recommend repair", type: "checkbox" },
          { id: "dryer_vented_safety_hazard", label: "Safety hazard", type: "checkbox" },
          { id: "plastic_dryer_vent_not_recommended", label: "Plastic Dryer Vent not recommended", type: "checkbox" },
          { id: "plastic_dryer_vent_yes", label: "Yes", type: "checkbox" },
          { id: "plastic_dryer_vent_no", label: "No", type: "checkbox" },
          { id: "plastic_dryer_vent_safety_hazard", label: "Safety hazard", type: "checkbox" }
        ]
      },
      {
        title: "Electrical",
        items: [
          { id: "open_ground_reverse_polarity_label", label: "Open ground/reverse polarity within 6' of water:", type: "label" },
          { id: "gfci_present_label", label: "GFCI present:", type: "label" },
          { id: "gfci_present_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_present_no", label: "No", type: "checkbox" },
          { id: "gfci_operable_label", label: "Operable:", type: "label" },
          { id: "gfci_operable_yes", label: "Yes", type: "checkbox" },
          { id: "gfci_operable_no", label: "No", type: "checkbox" },
          { id: "appliances_label", label: "Appliances:", type: "label" },
          { id: "appliances_washer", label: "Washer", type: "checkbox" },
          { id: "appliances_dryer", label: "Dryer", type: "checkbox" },
          { id: "appliances_water_heater", label: "Water heater", type: "checkbox" },
          { id: "appliances_furnace_boiler", label: "Furnace/Boiler", type: "checkbox" },
          { id: "water_can_leak_on_line", label: "Water can leak on line:", type: "checkbox" },
          { id: "wiring", label: "Wiring", type: "checkbox" },
          { id: "not_visible", label: "Not visible", type: "checkbox" }
        ]
      }
    ]
  },

  // LIVING ROOM TEMPLATE - Based on PDF page 25
  "living-room": {
    title: "LIVING ROOM",
    sections: [
      {
        title: "Walls & Ceiling",
        items: [
          { id: "walls_ceiling_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "walls_ceiling_marginal", label: "Marginal", type: "checkbox" },
          { id: "walls_ceiling_poor", label: "Poor", type: "checkbox" },
          { id: "walls_ceiling_typical_cracks", label: "Typical cracks", type: "checkbox" },
          { id: "walls_ceiling_damage", label: "Damage", type: "checkbox" }
        ]
      },
      {
        title: "Moisture stains",
        items: [
          { id: "moisture_stains_yes", label: "Yes", type: "checkbox" },
          { id: "moisture_stains_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Floor",
        items: [
          { id: "floor_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "floor_marginal", label: "Marginal", type: "checkbox" },
          { id: "floor_poor", label: "Poor", type: "checkbox" },
          { id: "floor_squeaks", label: "Squeaks", type: "checkbox" },
          { id: "floor_slopes", label: "Slopes", type: "checkbox" }
        ]
      },
      {
        title: "Electrical",
        items: [
          { id: "switches_label", label: "Switches:", type: "label" },
          { id: "switches_yes", label: "Yes", type: "checkbox" },
          { id: "switches_no", label: "No", type: "checkbox" },
          { id: "receptacles_label", label: "Receptacles:", type: "label" },
          { id: "receptacles_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_no", label: "No", type: "checkbox" },
          { id: "receptacles_operable_label", label: "Operable:", type: "label" },
          { id: "receptacles_operable_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_operable_no", label: "No", type: "checkbox" },
          { id: "safety_hazard", label: "Safety Hazard", type: "checkbox" },
          { id: "cover_plates_missing", label: "Cover plates missing", type: "checkbox" }
        ]
      },
      {
        title: "Open ground/Reverse polarity",
        items: [
          { id: "open_ground_yes", label: "Yes", type: "checkbox" },
          { id: "open_ground_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Heating Source Present",
        items: [
          { id: "heating_yes", label: "Yes", type: "checkbox" },
          { id: "heating_not_visible", label: "Not visible", type: "checkbox" }
        ]
      },
      {
        title: "Egress Restricted",
        items: [
          { id: "egress_na", label: "N/A", type: "checkbox" },
          { id: "egress_yes", label: "Yes", type: "checkbox" },
          { id: "egress_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Doors & Windows",
        items: [
          { id: "doors_windows_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "doors_windows_marginal", label: "Marginal", type: "checkbox" },
          { id: "doors_windows_poor", label: "Poor", type: "checkbox" },
          { id: "cracked_glass", label: "Cracked glass", type: "checkbox" },
          { id: "evidence_leaking_glass", label: "Evidence of leaking insulated glass", type: "checkbox" },
          { id: "broken_missing_hardware", label: "Broken/Missing hardware", type: "checkbox" }
        ]
      },
      {
        title: "Holes",
        items: [
          { id: "holes_doors", label: "Doors", type: "checkbox" },
          { id: "holes_walls", label: "Walls", type: "checkbox" },
          { id: "holes_ceilings", label: "Ceilings", type: "checkbox" }
        ]
      }
    ]
  },

  // DINING ROOM TEMPLATE - Same structure as living room
  "dining-room": {
    title: "DINING ROOM", 
    sections: [
      {
        title: "Walls & Ceiling",
        items: [
          { id: "walls_ceiling_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "walls_ceiling_marginal", label: "Marginal", type: "checkbox" },
          { id: "walls_ceiling_poor", label: "Poor", type: "checkbox" },
          { id: "walls_ceiling_typical_cracks", label: "Typical cracks", type: "checkbox" },
          { id: "walls_ceiling_damage", label: "Damage", type: "checkbox" }
        ]
      },
      {
        title: "Moisture stains",
        items: [
          { id: "moisture_stains_yes", label: "Yes", type: "checkbox" },
          { id: "moisture_stains_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Floor",
        items: [
          { id: "floor_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "floor_marginal", label: "Marginal", type: "checkbox" },
          { id: "floor_poor", label: "Poor", type: "checkbox" },
          { id: "floor_squeaks", label: "Squeaks", type: "checkbox" },
          { id: "floor_slopes", label: "Slopes", type: "checkbox" }
        ]
      },
      {
        title: "Electrical",
        items: [
          { id: "switches_label", label: "Switches:", type: "label" },
          { id: "switches_yes", label: "Yes", type: "checkbox" },
          { id: "switches_no", label: "No", type: "checkbox" },
          { id: "receptacles_label", label: "Receptacles:", type: "label" },
          { id: "receptacles_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_no", label: "No", type: "checkbox" },
          { id: "receptacles_operable_label", label: "Operable:", type: "label" },
          { id: "receptacles_operable_yes", label: "Yes", type: "checkbox" },
          { id: "receptacles_operable_no", label: "No", type: "checkbox" },
          { id: "safety_hazard", label: "Safety Hazard", type: "checkbox" },
          { id: "cover_plates_missing", label: "Cover plates missing", type: "checkbox" }
        ]
      },
      {
        title: "Open ground/Reverse polarity",
        items: [
          { id: "open_ground_yes", label: "Yes", type: "checkbox" },
          { id: "open_ground_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Heating Source Present",
        items: [
          { id: "heating_yes", label: "Yes", type: "checkbox" },
          { id: "heating_not_visible", label: "Not visible", type: "checkbox" }
        ]
      },
      {
        title: "Egress Restricted",
        items: [
          { id: "egress_na", label: "N/A", type: "checkbox" },
          { id: "egress_yes", label: "Yes", type: "checkbox" },
          { id: "egress_no", label: "No", type: "checkbox" }
        ]
      },
      {
        title: "Doors & Windows",
        items: [
          { id: "doors_windows_satisfactory", label: "Satisfactory", type: "checkbox" },
          { id: "doors_windows_marginal", label: "Marginal", type: "checkbox" },
          { id: "doors_windows_poor", label: "Poor", type: "checkbox" },
          { id: "cracked_glass", label: "Cracked glass", type: "checkbox" },
          { id: "evidence_leaking_glass", label: "Evidence of leaking insulated glass", type: "checkbox" },
          { id: "broken_missing_hardware", label: "Broken/Missing hardware", type: "checkbox" }
        ]
      },
      {
        title: "Holes",
        items: [
          { id: "holes_doors", label: "Doors", type: "checkbox" },
          { id: "holes_walls", label: "Walls", type: "checkbox" },
          { id: "holes_ceilings", label: "Ceilings", type: "checkbox" }
        ]
      }
    ]
  }
};

// Helper function to get room template by type
export function getRoomTemplate(roomType: string) {
  return PDF_ROOM_TEMPLATES[roomType as keyof typeof PDF_ROOM_TEMPLATES];
}

// All supported room types from the PDF
export const SUPPORTED_ROOM_TYPES = Object.keys(PDF_ROOM_TEMPLATES);