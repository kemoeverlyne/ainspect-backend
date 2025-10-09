export type TrecReportData = {
  // Cover page
  cover: {
    reportTitle: string;        // e.g., "Property Inspection Report"
    inspectorPhoto?: File | string; // blob/url/base64
    companyLogo?: File | string;
    propertyFrontPhoto?: File | string;
    inspectorName: string;
    companyName: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    licenseNo?: string;
    licenseExpiry?: string;     // optional display
    reportDate: string;         // ISO date
    propertyAddress: string;
    city: string;
    state: string;
    zip: string;
    clientName?: string;
  };

  // REI 7-6 core fields (map these to the template's AcroForm field names)
  header: {
    client: string;
    propertyAddress: string;
    city: string;
    state: string;
    zip: string;
    inspector: string;
    trecLicense: string;
    inspectionDate: string;     // ISO
    reportNo?: string;
  };

  // Sections (examples—use what we already store in the app)
  sections: {
    // each section mirrors the UI selections and narratives
    foundation: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    gradingDrainage: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    roofCoveringMaterials: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    roofStructuresAndAttics: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    walls: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    windows: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    doors: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    floors: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    stairwaysBalconiesRailings: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    fireplaces: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    porches: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    serviceEntrancePanels: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    branchCircuitConductors: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    connectedDevicesFixtures: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    heatingEquipment: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    coolingEquipment: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    ductSystems: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    plumbingSupplyDistributionSystems: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    drainWasteVentSystems: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    waterHeatingEquipment: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    hydromassageTubs: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    kitchenAppliances: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    laundryAppliances: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    bathExhaustSystems: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    garageDoors: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    drywellSepticSystems: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    waterWells: { rating: 'I'|'NI'|'NP'|'D', comments?: string };
    // Add more sections as needed
  };

  // Footer/legal fields if the form exposes them
  footer?: {
    pageOf?: string; // optional if form auto-numbers
  };
};

export type TrecRating = 'I' | 'NI' | 'NP' | 'D';

export type TrecSectionData = {
  rating: TrecRating;
  comments?: string;
};