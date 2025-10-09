import type { Express } from "express";
import { TrecReportData } from "@shared/trecTypes";

export function setupReportRoutes(app: Express) {
  // Get TREC payload data for PDF generation
  app.get('/api/reports/:id/trec-payload', async (req, res) => {
    try {
      const reportId = req.params.id;
      
      // TODO: Replace with actual database queries
      // This is a mock response for now - replace with real data fetching
      const mockTrecData: TrecReportData = {
        cover: {
          reportTitle: "Property Inspection Report",
          inspectorName: "John Doe",
          companyName: "ABC Inspection Services",
          companyPhone: "(555) 123-4567",
          companyEmail: "info@abcinspections.com",
          companyWebsite: "www.abcinspections.com",
          licenseNo: "TREC#12345",
          reportDate: new Date().toISOString(),
          propertyAddress: "123 Main Street",
          city: "Dallas",
          state: "TX",
          zip: "75201",
          clientName: "Jane Smith",
        },
        header: {
          client: "Jane Smith",
          propertyAddress: "123 Main Street",
          city: "Dallas",
          state: "TX",
          zip: "75201",
          inspector: "John Doe",
          trecLicense: "TREC#12345",
          inspectionDate: new Date().toISOString(),
          reportNo: "REI-2024-001",
        },
        sections: {
          foundation: { rating: 'I', comments: 'Foundation appears structurally sound.' },
          gradingDrainage: { rating: 'I', comments: 'Proper grading observed around foundation.' },
          roofCoveringMaterials: { rating: 'NI', comments: 'Unable to inspect due to weather conditions.' },
          roofStructuresAndAttics: { rating: 'I', comments: 'Roof structure appears adequate.' },
          walls: { rating: 'I', comments: 'Exterior walls in good condition.' },
          windows: { rating: 'D', comments: 'Several windows have broken seals in double-pane glass.' },
          doors: { rating: 'I', comments: 'All doors function properly.' },
          floors: { rating: 'I', comments: 'Flooring systems appear adequate.' },
          stairwaysBalconiesRailings: { rating: 'I', comments: 'All railings secure and properly installed.' },
          fireplaces: { rating: 'NP', comments: 'No fireplace present.' },
          porches: { rating: 'I', comments: 'Porch structure appears sound.' },
          serviceEntrancePanels: { rating: 'I', comments: 'Electrical panel properly labeled.' },
          branchCircuitConductors: { rating: 'I', comments: 'Wiring appears adequate.' },
          connectedDevicesFixtures: { rating: 'D', comments: 'GFCI outlets missing in bathroom.' },
          heatingEquipment: { rating: 'I', comments: 'HVAC system functioning properly.' },
          coolingEquipment: { rating: 'I', comments: 'Air conditioning unit operational.' },
          ductSystems: { rating: 'I', comments: 'Ductwork appears properly installed.' },
          plumbingSupplyDistributionSystems: { rating: 'I', comments: 'Water pressure adequate throughout.' },
          drainWasteVentSystems: { rating: 'I', comments: 'Drainage systems functioning properly.' },
          waterHeatingEquipment: { rating: 'I', comments: 'Water heater in good working condition.' },
          hydromassageTubs: { rating: 'NP', comments: 'No hydromassage tubs present.' },
          kitchenAppliances: { rating: 'I', comments: 'All kitchen appliances function properly.' },
          laundryAppliances: { rating: 'I', comments: 'Washer and dryer connections adequate.' },
          bathExhaustSystems: { rating: 'I', comments: 'Bathroom exhaust fans operational.' },
          garageDoors: { rating: 'I', comments: 'Garage door and opener function properly.' },
          drywellSepticSystems: { rating: 'NP', comments: 'Property connected to municipal sewer.' },
          waterWells: { rating: 'NP', comments: 'Property connected to municipal water.' },
        },
      };

      res.json(mockTrecData);
    } catch (error) {
      console.error('Error fetching TREC payload:', error);
      res.status(500).json({ error: 'Failed to fetch report data' });
    }
  });
}