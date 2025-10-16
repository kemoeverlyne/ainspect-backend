import { Request, Response } from 'express';
import { TRECReportGenerator, TRECReportData } from '../services/trecReportGenerator.js';
import { storage } from '../storage.js';

/**
 * Generate TREC report PDF
 */
export const generateTRECReportPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[TREC Report API] Generating PDF for inspection ${id}`);

    // First try to fetch as TREC inspection
    let inspection = await storage.getTRECInspection(id);
    
    // If not found as TREC inspection, try as regular inspection report
    if (!inspection) {
      console.log(`[TREC Report API] Not found as TREC inspection, trying regular inspection report...`);
      const regularReport = await storage.getInspectionReportById(id);
      
      if (!regularReport) {
        return res.status(404).json({ message: 'Inspection not found' });
      }
      
      // Transform regular report to TREC format
      inspection = {
        id: regularReport.id,
        clientName: regularReport.clientName || 'Client Name',
        propertyAddress: regularReport.propertyAddress || 'Property Address',
        inspectionDate: regularReport.inspectionDate || new Date(),
        inspectorName: regularReport.inspectorName || 'Inspector Name',
        trecLicenseNumber: regularReport.trecLicenseNumber || 'TREC-0000',
        companyData: regularReport.reportData?.companyData || {},
        inspectionData: regularReport.reportData?.inspectionData || {},
        status: regularReport.status || 'completed'
      };
    }

    // Handle both old and new data formats
    // Old format: inspection.reportData.{companyData, warrantyData, inspectionData}
    // New format: inspection.{companyData, warrantyData, inspectionData}
    const companyData = inspection.companyData || (inspection as any).reportData?.companyData || {};
    const inspectionData = inspection.inspectionData || (inspection as any).reportData?.inspectionData || {};
    
    console.log('\n[TREC PDF API] === DATA FORMAT DETECTION ===');
    console.log('[TREC PDF API] Has inspection.companyData:', !!inspection.companyData);
    console.log('[TREC PDF API] Has inspection.reportData:', !!(inspection as any).reportData);
    console.log('[TREC PDF API] Using companyData from:', inspection.companyData ? 'NEW format' : 'OLD format (reportData)');
    console.log('[TREC PDF API] Using inspectionData from:', inspection.inspectionData ? 'NEW format' : 'OLD format (reportData)');

    // Transform inspection data to report format
    console.log('\n[TREC PDF API] Transforming inspection data:', {
      id: inspection.id,
      clientName: inspection.clientName,
      propertyAddress: inspection.propertyAddress,
      inspectionDate: inspection.inspectionDate,
      inspectorName: inspection.inspectorName,
      trecLicenseNumber: inspection.trecLicenseNumber,
      hasCompanyData: !!companyData && Object.keys(companyData).length > 0,
      hasInspectionData: !!inspectionData && Object.keys(inspectionData).length > 0,
      sectionsCount: Object.keys(inspectionData?.sections || {}).length
    });

    // Log detailed section structure
    console.log('\n[TREC PDF API] === INSPECTION DATA RECEIVED FROM STORAGE ===');
    if (inspectionData?.sections) {
      const sections = inspectionData.sections;
      console.log('[TREC PDF API] Sections object type:', typeof sections);
      console.log('[TREC PDF API] Sections is array?:', Array.isArray(sections));
      console.log('[TREC PDF API] Section keys:', Object.keys(sections));
      console.log('[TREC PDF API] Total section items:', Object.keys(sections).length);
      
      // Log each section item in detail
      Object.entries(sections).forEach(([sectionKey, sectionData]) => {
        console.log(`\n[TREC PDF API] === Section Item: "${sectionKey}" ===`);
        console.log('[TREC PDF API] Full data:', JSON.stringify(sectionData, null, 2));
      });
    } else {
      console.log('[TREC PDF API] ❌ NO SECTIONS DATA FOUND!');
      console.log('[TREC PDF API] inspectionData:', inspectionData);
      console.log('[TREC PDF API] Full inspection object keys:', Object.keys(inspection));
    }

    const reportData: TRECReportData = {
      header: {
        clientName: inspection.clientName,
        propertyAddress: inspection.propertyAddress,
        inspectionDate: inspection.inspectionDate.toISOString(),
        inspectorName: inspection.inspectorName,
        licenseNo: inspection.trecLicenseNumber,
        companyName: companyData?.companyName || 'Inspection Company',
        companyPhone: companyData?.companyPhone || '',
        companyEmail: companyData?.companyEmail || '',
        companyAddress: companyData?.companyAddress || '',
        companyWebsite: companyData?.companyWebsite || '',
        reportNo: inspection.id,
        sponsorName: inspection.sponsorName,
        sponsorLicenseNo: inspection.sponsorTrecLicenseNumber
      },
      sections: inspectionData?.sections || {},
      cover: {
        reportTitle: 'TREC Property Inspection Report',
        propertyFrontPhoto: inspectionData?.coverPageData?.propertyFrontPhoto
      },
      propertyPhotos: Object.values(inspectionData?.sections || {}).flatMap((section: any) => section.photos || []),
      propertyInfo: inspectionData?.propertyInfo || {}
    };

    console.log('[TREC Report API] Report data prepared:', {
      headerKeys: Object.keys(reportData.header),
      sectionsCount: Object.keys(reportData.sections).length,
      hasCover: !!reportData.cover,
      photosCount: reportData.propertyPhotos.length
    });

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
