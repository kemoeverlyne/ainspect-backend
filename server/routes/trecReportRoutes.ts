import { Request, Response } from 'express';
import { TRECReportGenerator, TRECReportData } from '../services/trecReportGenerator.js';
import { storage } from '../storage.js';

/**
 * Generate TREC report PDF
 */
export const generateTRECReportPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[TREC Report API] Generating PDF for TREC inspection ${id}`);

    // Fetch TREC inspection data
    const inspection = await storage.getTRECInspection(id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'TREC inspection not found' });
    }

    // Transform inspection data to report format
    const reportData: TRECReportData = {
      header: {
        clientName: inspection.clientName,
        propertyAddress: inspection.propertyAddress,
        inspectionDate: inspection.inspectionDate.toISOString(),
        inspectorName: inspection.inspectorName,
        licenseNo: inspection.trecLicenseNumber,
        companyName: inspection.companyData?.companyName || 'Inspection Company',
        companyPhone: inspection.companyData?.companyPhone || '',
        companyEmail: inspection.companyData?.companyEmail || '',
        companyAddress: inspection.companyData?.companyAddress || '',
        reportNo: inspection.id
      },
      sections: inspection.inspectionData?.sections || {},
      cover: {
        reportTitle: 'TREC Property Inspection Report',
        propertyFrontPhoto: inspection.inspectionData?.coverPageData?.propertyFrontPhoto
      },
      propertyPhotos: Object.values(inspection.inspectionData?.sections || {}).flatMap((section: any) => section.photos || [])
    };

    // Generate PDF
    const pdfBuffer = await TRECReportGenerator.generateTRECReport(reportData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="trec-inspection-${inspection.clientName.replace(/\s+/g, '-')}-${new Date(inspection.inspectionDate).toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.end(pdfBuffer);

  } catch (error) {
    console.error('[TREC Report API] Error generating PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate TREC report PDF',
      error: error.message 
    });
  }
};

/**
 * Get TREC report data (for preview)
 */
export const getTRECReportData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[TREC Report API] Getting data for TREC inspection ${id}`);

    // Fetch TREC inspection data
    const inspection = await storage.getTRECInspection(id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'TREC inspection not found' });
    }

    // Return inspection data
    res.json(inspection);

  } catch (error) {
    console.error('[TREC Report API] Error fetching inspection data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch TREC inspection data',
      error: error.message 
    });
  }
};
