// Versioned inspection item schema for consistent data structure
export type InspectionItemV2 = {
  id: string;
  label: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Not Inspected';
  severity?: 'Low' | 'Moderate' | 'High' | null;
  notes?: string;
  photos: string[];
  recommendation?: 'Monitor' | 'Repair' | 'Replace' | 'Further Evaluation';
  costRange?: { min?: number; max?: number } | null;
  defectCodes?: string[];
};

export type SectionDataV2 = {
  __version: 2;
  sectionKey: 'grounds' | 'exterior' | 'roofing' | 'plumbing' | 'hvac' | 'electrical';
  items: InspectionItemV2[];
  meta?: { 
    lastEditedAt?: string; 
    draft?: boolean;
    inspectorId?: string;
    propertyId?: string;
  };
};

export type InspectionGroup = {
  id: string;
  label: string;
  expanded: boolean;
  items: InspectionItemV2[];
};

export type SystemType = {
  id: string;
  label: string;
  icon: string;
};

// Legacy type detection for migration
export type LegacyInspectionItem = {
  id?: string;
  title?: string;
  label?: string;
  status?: string;
  condition?: string;
  [key: string]: any;
};

export type DataVersion = 0 | 1 | 2;