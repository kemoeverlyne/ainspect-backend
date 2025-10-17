import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TRECReportData {
  header: {
    clientName: string;
    propertyAddress: string;
    inspectionDate: string;
    inspectorName: string;
    licenseNo: string;
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    companyAddress: string;
    companyWebsite?: string;
    reportNo: string;
    sponsorName?: string;
    sponsorLicenseNo?: string;
  };
  sections: {
    [key: string]: {
      [itemKey: string]: {
        title?: string;
        rating?: string;
        comment?: string;
        notes?: string;
        photos?: string[];
        recommendations?: string;
      };
    };
  };
  cover: {
    reportTitle: string;
    propertyFrontPhoto?: string;
  };
  propertyPhotos: string[];
  propertyInfo?: {
    type?: string;
    yearBuilt?: string;
    squareFootage?: string;
    weather?: string;
  };
}

export class TRECReportGenerator {
  private static getTRECFormURL(): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/trec/trec_inspection_defalt pages.pdf`;
  }

  /**
   * Generate cover page only
   */
  private static async generateCoverPage(reportData: TRECReportData): Promise<Buffer> {
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    const { header } = reportData;
    const inspectionDate = new Date(header.inspectionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const coverHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; font-family: Inter, sans-serif; }
    .page { width: 8.5in; height: 11in; padding: 48px; box-sizing: border-box; }
    .cover-header { 
      background: linear-gradient(135deg, #1e3a8a, #3b82f6); 
      color: #fff; 
      padding: 32px 48px; 
      margin: -48px -48px 0; 
      display: flex; 
      justify-content: space-between; 
      align-items: start; 
    }
    .company-name { font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    .company-contact { font-size: 14px; margin: 6px 0; opacity: .95; }
    .property-address { font-size: 32px; font-weight: 700; margin: 24px 0; }
    .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .meta-value { font-size: 15px; font-weight: 500; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover-header">
      <div>
        <h1 class="company-name">${header.companyName}</h1>
        <div class="company-contact">${header.companyPhone}</div>
        <div class="company-contact">${header.companyEmail}</div>
        <div class="company-contact">${header.companyAddress}</div>
      </div>
    </div>

    <div style="padding: 48px 0; display: flex; flex-direction: column; justify-content: center;">
      <div style="background: #eff6ff; padding: 8px 16px; border-radius: 6px; width: fit-content; margin-bottom: 24px;">
        <strong>Texas Property Inspection Report</strong>
      </div>

      <h2 class="property-address">${header.propertyAddress}</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
        <div>
          <div class="meta-label">Client Name</div>
          <div class="meta-value">${header.clientName}</div>
        </div>
        <div>
          <div class="meta-label">Inspection Date</div>
          <div class="meta-value">${inspectionDate}</div>
        </div>
        <div>
          <div class="meta-label">Inspector</div>
          <div class="meta-value">${header.inspectorName}</div>
        </div>
        <div>
          <div class="meta-label">TREC License #</div>
          <div class="meta-value">${header.licenseNo}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    
    await page.setContent(coverHTML, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    
    const coverPdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    return coverPdf;
  }

  /**
   * Fill the official TREC form with inspection data
   */
  private static async fillTRECForm(reportData: TRECReportData): Promise<Buffer> {
    try {
      const { header, propertyInfo } = reportData;
      
      // Load the official TREC fillable PDF (extracted version)
      const trecFormPath = path.join(__dirname, '../../uploads/trec-forms/Extracted_REI-7-6_fillable.pdf');
      
      // Check if form exists, if not try alternate locations
      let formBytes: Buffer;
      try {
        formBytes = await fs.readFile(trecFormPath);
        console.log('[TREC PDF] Loaded extracted TREC form from:', trecFormPath);
      } catch (error) {
        console.log('[TREC PDF] Form not found at:', trecFormPath);
        console.log('[TREC PDF] Attempting alternate location...');
        
        // Try loading from frontend public folder (for development)
        const alternatePath = path.join(__dirname, '../../../ainspect-frontend/public/Extracted_REI 7-6_fillable.pdf');
        formBytes = await fs.readFile(alternatePath);
        console.log('[TREC PDF] Loaded form from alternate location');
      }

      // Load the PDF
      const pdfDoc = await PDFDocument.load(formBytes);
      const form = pdfDoc.getForm();
      
      console.log('[TREC PDF] PDF loaded, attempting to fill form fields...');
      
      // Get all form fields to see what's available
      const fields = form.getFields();
      console.log('[TREC PDF] Available form fields:', fields.map(f => f.getName()));
      
      // Fill in the form fields with inspection data
      // Using the exact field names from the extracted TREC form
      const fieldMappings: { [key: string]: string } = {
        // Exact field names from the form
        'Name of Client': header.clientName,
        'Date of Inspection': new Date(header.inspectionDate).toLocaleDateString('en-US'),
        'Address of Inspected Property': header.propertyAddress,
        'Name of Inspector': header.inspectorName,
        'TREC License': header.licenseNo,
        'Name of Sponsor if applicable': header.sponsorName || '',
        'TREC License_2': header.sponsorLicenseNo || '',
      };
      
      // Try to fill each field
      let fieldsFilledCount = 0;
      fields.forEach(field => {
        const fieldName = field.getName();
        const value = fieldMappings[fieldName];
        
        if (value) {
          try {
            const fieldType = field.constructor.name;
            console.log(`[TREC PDF] ✓ Filling "${fieldName}" with: "${value}"`);
            
            if (fieldType === 'PDFTextField') {
              (field as any).setText(value);
              fieldsFilledCount++;
            } else if (fieldType === 'PDFCheckBox') {
              if (value.toLowerCase() === 'true' || value === '1') {
                (field as any).check();
                fieldsFilledCount++;
              }
            }
          } catch (err) {
            console.log(`[TREC PDF] ✗ Could not fill field "${fieldName}":`, err);
          }
        } else {
          console.log(`[TREC PDF] ○ Skipping "${fieldName}" (no value)`);
        }
      });
      
      console.log(`[TREC PDF] Filled ${fieldsFilledCount} of ${fields.length} fields`);
      
      // Flatten the form to make it non-editable
      form.flatten();
      
      console.log('[TREC PDF] Form filled successfully');
      return Buffer.from(await pdfDoc.save());
      
    } catch (error) {
      console.error('[TREC PDF] Error filling TREC form:', error);
      throw error;
    }
  }

  /**
   * Generate complete filled TREC report pages
   */
  private static async generateFilledReport(reportData: TRECReportData): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Block external image requests to prevent timeouts
    await page.route('**/*', (route) => {
      const url = route.request().url();
      // Allow data URLs and localhost, block external URLs
      if (url.startsWith('data:') || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
        route.continue();
      } else {
        // Abort external resource loading
        route.abort();
      }
    });
    
    const html = this.generateCompleteReportHTML(reportData);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.emulateMedia({ media: 'print' });
    
    const reportPdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });
    
    await browser.close();
    return reportPdf;
  }

  /**
   * Generate complete filled TREC report HTML with all sections
   */
  private static generateCompleteReportHTML(reportData: TRECReportData): string {
    const { header, sections, propertyInfo } = reportData;
    
    console.log('\n[TREC PDF GENERATOR] === STARTING HTML GENERATION ===');
    console.log('[TREC PDF GENERATOR] Sections received:', {
      type: typeof sections,
      isArray: Array.isArray(sections),
      keys: Object.keys(sections),
      count: Object.keys(sections).length
    });
    console.log('[TREC PDF GENERATOR] First 5 section keys:', Object.keys(sections).slice(0, 5));
    
    // Format inspection date
    const inspectionDate = new Date(header.inspectionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // TREC section definitions with proper subsection structure
    const trecSectionDefinitions: { [key: string]: { title: string; items: { id: string; name: string }[] } } = {
      'I': {
        title: 'STRUCTURAL SYSTEMS',
        items: [
          { id: 'foundations', name: 'A. Foundations' },
          { id: 'gradingDrainage', name: 'B. Grading and Drainage' },
          { id: 'roofCoveringMaterials', name: 'C. Roof Covering Materials' },
          { id: 'roofStructuresAttics', name: 'D. Roof Structures and Attics' },
          { id: 'walls', name: 'E. Walls (Interior and Exterior)' },
          { id: 'floors', name: 'F. Floors' },
          { id: 'doors', name: 'G. Doors (Interior and Exterior)' },
          { id: 'windows', name: 'H. Windows' },
          { id: 'stairways', name: 'I. Stairways (Interior and Exterior)' },
          { id: 'fireplaces', name: 'J. Fireplaces and Chimneys' },
          { id: 'porches', name: 'K. Porches, Balconies, Decks, and Carports' },
          { id: 'other', name: 'L. Other' },
        ]
      },
      'II': {
        title: 'ELECTRICAL SYSTEMS',
        items: [
          { id: 'serviceEntrancePanels', name: 'A. Service Entrance and Panels' },
          { id: 'branchCircuits', name: 'B. Branch Circuits, Connected Devices, and Fixtures' },
          { id: 'other', name: 'C. Other' },
        ]
      },
      'III': {
        title: 'HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS',
        items: [
          { id: 'heatingEquipment', name: 'A. Heating Equipment' },
          { id: 'coolingEquipment', name: 'B. Cooling Equipment' },
          { id: 'ductSystems', name: 'C. Duct Systems, Chases, and Vents' },
          { id: 'other', name: 'D. Other' },
        ]
      },
      'IV': {
        title: 'PLUMBING SYSTEMS',
        items: [
          { id: 'plumbingSupply', name: 'A. Plumbing Supply, Distribution Systems and Fixtures' },
          { id: 'drains', name: 'B. Drains, Wastes, and Vents' },
          { id: 'waterHeating', name: 'C. Water Heating Equipment' },
          { id: 'hydromassage', name: 'D. Hydro-Massage Therapy Equipment' },
          { id: 'gasSystems', name: 'E. Gas Systems' },
          { id: 'other', name: 'F. Other' },
        ]
      },
      'V': {
        title: 'APPLIANCES',
        items: [
          { id: 'dishwasher', name: 'A. Dishwashers' },
          { id: 'foodWasteDisposer', name: 'B. Food Waste Disposers' },
          { id: 'rangeHood', name: 'C. Range Hood and Exhaust Systems' },
          { id: 'ranges', name: 'D. Ranges, Cooktops, and Ovens' },
          { id: 'microwaveOvens', name: 'E. Microwave Ovens' },
          { id: 'mechanicalExhaust', name: 'F. Mechanical Exhaust Vents and Bathroom Heaters' },
          { id: 'garageDoorOperators', name: 'G. Garage Door Operators' },
          { id: 'dryerExhaust', name: 'H. Dryer Exhaust Systems' },
          { id: 'other', name: 'I. Other' },
        ]
      },
      'VI': {
        title: 'OPTIONAL SYSTEMS',
        items: [
          { id: 'landscapeIrrigation', name: 'A. Landscape Irrigation (Sprinkler) Systems' },
          { id: 'swimmingPools', name: 'B. Swimming Pools, Spas, Hot Tubs, and Equipment' },
          { id: 'outbuildings', name: 'C. Outbuildings' },
          { id: 'privateWaterWells', name: 'D. Private Water Wells' },
          { id: 'privateSewage', name: 'E. Private Sewage Disposal (Septic) Systems' },
          { id: 'otherBuiltIn', name: 'F. Other Built-In Appliances' },
          { id: 'other', name: 'G. Other' },
        ]
      }
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TREC Property Inspection Report - ${header.propertyAddress}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }
    
    .page { 
      width: 8.5in; 
      min-height: 11in; 
      padding: 0.5in; 
      background: white;
      page-break-after: always;
    }
    
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    
    /* Header Styles */
    .report-header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .report-title {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .form-number {
      font-size: 14pt;
      font-weight: bold;
      margin: 5px 0;
    }
    
    .trec-info {
      font-size: 9pt;
      color: #333;
      margin: 3px 0;
    }
    
    /* Property Information Box */
    .property-info {
      border: 2px solid #000;
      padding: 15px;
      margin-bottom: 20px;
      background: #f9f9f9;
    }
    
    .property-row {
      display: flex;
      margin-bottom: 8px;
      align-items: baseline;
    }
    
    .property-label {
      font-weight: bold;
      width: 180px;
      flex-shrink: 0;
    }
    
    .property-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 18px;
      padding: 0 5px;
    }
    
    /* Legend */
    .legend {
      background: #e8e8e8;
      border: 1px solid #000;
      padding: 10px;
      margin: 15px 0;
    }
    
    .legend-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .legend-items {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .legend-item {
      font-size: 10pt;
    }
    
    /* Section Styles */
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    
    .section-header {
      background: #d0d0d0;
      font-weight: bold;
      font-size: 12pt;
      padding: 8px 12px;
      border: 1px solid #000;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .subsection-title {
      font-weight: bold;
      font-size: 11pt;
      margin: 12px 0 5px 0;
      padding: 5px 8px;
      background: #f0f0f0;
      border-left: 4px solid #666;
    }
    
    /* Inspection Table */
    .inspection-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    
    .inspection-table th {
      background: #e0e0e0;
      border: 1px solid #000;
      padding: 6px 4px;
      font-weight: bold;
      text-align: center;
    }
    
    .inspection-table td {
      border: 1px solid #666;
      padding: 5px 4px;
      vertical-align: top;
    }
    
    .item-name-cell {
      width: 35%;
      font-weight: 500;
    }
    
    .rating-cell {
      width: 8%;
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
    }
    
    .rating-I { color: #000; }
    .rating-NI { color: #666; }
    .rating-NP { color: #999; }
    .rating-D { color: #cc0000; background: #ffe0e0; }
    
    .comments-cell {
      width: 37%;
      font-size: 9pt;
      line-height: 1.3;
    }
    
    /* Photos */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    .photo-item {
      border: 1px solid #ccc;
      padding: 5px;
      text-align: center;
    }
    
    .photo-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border: 1px solid #ddd;
    }
    
    .photo-caption {
      font-size: 8pt;
      margin-top: 5px;
      color: #333;
    }
    
    /* Footer */
    .page-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #000;
      font-size: 9pt;
    }
    
    .inspector-signature {
      margin-top: 20px;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      width: 300px;
      margin: 20px 0 5px 0;
    }
    
    @media print {
      .page { margin: 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page">
    <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 40px; margin: -0.5in -0.5in 30px; text-align: center;">
      <div style="font-size: 28pt; font-weight: bold; margin-bottom: 15px;">TEXAS PROPERTY INSPECTION REPORT</div>
      <div style="font-size: 16pt; margin-bottom: 20px;">REI 7-6 (Revised 05/2015)</div>
      <div style="font-size: 12pt; opacity: 0.9;">${header.companyName}</div>
    </div>
    
    <div style="padding: 20px;">
      <h2 style="font-size: 24pt; font-weight: bold; margin: 20px 0; text-align: center;">${header.propertyAddress}</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div>
          <div style="font-size: 10pt; color: #666; text-transform: uppercase; margin-bottom: 5px;">Client Name</div>
          <div style="font-size: 14pt; font-weight: 500;">${header.clientName}</div>
        </div>
        <div>
          <div style="font-size: 10pt; color: #666; text-transform: uppercase; margin-bottom: 5px;">Inspection Date</div>
          <div style="font-size: 14pt; font-weight: 500;">${inspectionDate}</div>
        </div>
        <div>
          <div style="font-size: 10pt; color: #666; text-transform: uppercase; margin-bottom: 5px;">Inspector</div>
          <div style="font-size: 14pt; font-weight: 500;">${header.inspectorName}</div>
        </div>
        <div>
          <div style="font-size: 10pt; color: #666; text-transform: uppercase; margin-bottom: 5px;">TREC License #</div>
          <div style="font-size: 14pt; font-weight: 500;">${header.licenseNo}</div>
        </div>
      </div>
      
      ${header.sponsorName ? `
      <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-left: 4px solid #3b82f6;">
        <div style="font-weight: bold; margin-bottom: 10px;">Sponsor Information</div>
        <div><strong>Sponsor:</strong> ${header.sponsorName}</div>
        ${header.sponsorLicenseNo ? `<div><strong>Sponsor License:</strong> ${header.sponsorLicenseNo}</div>` : ''}
      </div>
      ` : ''}
      
      <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border: 1px solid #ddd;">
        <div style="font-weight: bold; margin-bottom: 10px;">Company Information</div>
        <div>${header.companyName}</div>
        <div>${header.companyPhone}</div>
        <div>${header.companyEmail}</div>
        ${header.companyAddress ? `<div>${header.companyAddress}</div>` : ''}
        ${header.companyWebsite ? `<div>${header.companyWebsite}</div>` : ''}
      </div>
      
      <div style="margin-top: 50px; text-align: center; font-size: 9pt; color: #666;">
        <div>Report ID: ${header.reportNo}</div>
        <div style="margin-top: 20px;">This report was prepared exclusively for ${header.clientName}</div>
        <div style="margin-top: 5px;">©${new Date().getFullYear()} ${header.companyName}</div>
      </div>
    </div>
  </div>

  <!-- MAIN REPORT PAGES -->
  <div class="page">
    <div class="report-header">
      <div class="report-title">Property Inspection Report</div>
      <div class="form-number">Promulgated by the Texas Real Estate Commission (TREC)</div>
      <div class="trec-info">P.O. Box 12188, Austin, TX 78711-2188 • (512) 936-3000 • http://www.trec.texas.gov</div>
      <div class="trec-info">TREC No. REI 7-6</div>
    </div>

    <div class="property-info">
      <div class="property-row">
        <div class="property-label">Client:</div>
        <div class="property-value">${header.clientName}</div>
      </div>
      <div class="property-row">
        <div class="property-label">Property Address:</div>
        <div class="property-value">${header.propertyAddress}</div>
      </div>
      <div class="property-row">
        <div class="property-label">Date of Inspection:</div>
        <div class="property-value">${inspectionDate}</div>
      </div>
      <div class="property-row">
        <div class="property-label">Inspector:</div>
        <div class="property-value">${header.inspectorName}</div>
      </div>
      <div class="property-row">
        <div class="property-label">TREC License #:</div>
        <div class="property-value">${header.licenseNo}</div>
      </div>
      <div class="property-row">
        <div class="property-label">Company:</div>
        <div class="property-value">${header.companyName}</div>
      </div>
      ${header.sponsorName ? `
      <div class="property-row">
        <div class="property-label">Sponsor:</div>
        <div class="property-value">${header.sponsorName} ${header.sponsorLicenseNo ? `(TREC #${header.sponsorLicenseNo})` : ''}</div>
      </div>
      ` : ''}
    </div>

    <div class="legend">
      <div class="legend-title">LEGEND:</div>
      <div class="legend-items">
        <div class="legend-item"><strong>I</strong> = Inspected</div>
        <div class="legend-item"><strong>NI</strong> = Not Inspected</div>
        <div class="legend-item"><strong>NP</strong> = Not Present</div>
        <div class="legend-item"><strong>D</strong> = Deficient</div>
      </div>
    </div>

    ${Object.entries(trecSectionDefinitions).map(([sectionId, sectionDef]) => {
      console.log(`[TREC PDF] Processing section ${sectionId}`);
      console.log(`[TREC PDF] Section keys available:`, Object.keys(sections));
      
      // Check if data is in hierarchical format (new) or flat format (old)
      const sectionData = sections[sectionId];
      const isHierarchical = sectionData && sectionData.subsections;
      
      console.log(`[TREC PDF] Section ${sectionId} format:`, isHierarchical ? 'HIERARCHICAL (new)' : 'FLAT (old)');
      
      if (isHierarchical) {
        console.log(`[TREC PDF] Section ${sectionId} title: ${sectionData.title}`);
        console.log(`[TREC PDF] Subsections:`, Object.keys(sectionData.subsections));
      }
      
      return `
        <div class="section page-break">
          <div class="section-header">${sectionId}. ${isHierarchical ? sectionData.title : sectionDef.title}</div>
          
          <table class="inspection-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>I</th>
                <th>NI</th>
                <th>NP</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              ${sectionDef.items.map((item, index) => {
                const itemLetter = String.fromCharCode(65 + index); // 65 = 'A'
                
                let itemData: any = {};
                let itemName = item.name;
                let rating = 'NI';
                let comments = '';
                
                if (isHierarchical) {
                  // NEW FORMAT: Read from hierarchical structure
                  itemData = (sectionData.subsections as any)[itemLetter] || {};
                  rating = itemData.rating || 'NI';
                  comments = itemData.comments || '';
                  itemName = itemData.fullName || itemData.name || item.name;
                  
                  console.log(`[TREC PDF] ${sectionId}.${itemLetter} (hierarchical):`, {
                    name: itemName,
                    rating,
                    hasComments: !!comments,
                    hasPhotos: !!(itemData.photos && itemData.photos.length > 0)
                  });
                } else {
                  // OLD FORMAT: Read from flat structure
                  const itemKey = `${sectionId}${itemLetter}`;
                  itemData = sections[itemKey] || {};
                  rating = itemData.rating || 'NI';
                  comments = itemData.comment || itemData.notes || itemData.comments || '';
                  
                  console.log(`[TREC PDF] ${itemKey} (flat):`, {
                    hasData: !!itemData.rating,
                    rating,
                    hasComments: !!comments,
                    hasPhotos: !!(itemData.photos && itemData.photos.length > 0)
                  });
                }
                
                return `
                  <tr class="no-break">
                    <td class="item-name-cell">${itemName}</td>
                    <td class="rating-cell ${rating === 'I' ? 'rating-I' : ''}">${rating === 'I' ? '✓' : ''}</td>
                    <td class="rating-cell ${rating === 'NI' ? 'rating-NI' : ''}">${rating === 'NI' ? '✓' : ''}</td>
                    <td class="rating-cell ${rating === 'NP' ? 'rating-NP' : ''}">${rating === 'NP' ? '✓' : ''}</td>
                    <td class="rating-cell ${rating === 'D' ? 'rating-D' : ''}">${rating === 'D' ? '✓' : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          ${(() => {
            // Show detailed comments and photos for each subsection
            let detailsHTML = '';
            
            sectionDef.items.forEach((item, index) => {
              const itemLetter = String.fromCharCode(65 + index);
              let itemData: any = {};
              let itemName = '';
              let comments = '';
              let photos: string[] = [];
              
              if (isHierarchical) {
                // NEW FORMAT: Read from hierarchical structure
                itemData = (sectionData.subsections as any)[itemLetter] || {};
                itemName = itemData.fullName || itemData.name || item.name;
                comments = itemData.comments || '';
                photos = itemData.photos || [];
              } else {
                // OLD FORMAT: Read from flat structure
                const itemKey = `${sectionId}${itemLetter}`;
                itemData = sections[itemKey] || {};
                itemName = item.name;
                comments = itemData.comment || itemData.notes || itemData.comments || '';
                photos = itemData.photos || [];
              }
              
              // Only show subsection if it has comments or photos
              if (comments || (photos && photos.length > 0)) {
                detailsHTML += `
                  <div class="subsection-details" style="margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f9f9f9;">
                    <h4 style="font-size: 12pt; font-weight: bold; margin-bottom: 10px; color: #1e3a8a;">${itemName}</h4>
                    
                    ${comments ? `
                      <div style="margin-bottom: 15px;">
                        <p style="font-size: 10pt; line-height: 1.6; color: #333;">${comments}</p>
                      </div>
                    ` : ''}
                    
                    ${photos && photos.length > 0 ? `
                      <div class="photo-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                        ${photos.map((photo, photoIdx) => `
                          <div class="photo-item" style="break-inside: avoid;">
                            <img src="${photo}" alt="${itemName} - Photo ${photoIdx + 1}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
                            <div class="photo-caption" style="font-size: 9pt; color: #666; margin-top: 5px; text-align: center;">Photo ${photoIdx + 1}</div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }
            });
            
            return detailsHTML;
          })()}
        </div>
      `;
    }).join('')}
  </div>

  <!-- SIGNATURE PAGE -->
  <div class="page">
    <div class="page-footer">
      <div class="inspector-signature">
        <p><strong>Inspector:</strong> ${header.inspectorName}</p>
        <p><strong>TREC License #:</strong> ${header.licenseNo}</p>
        ${header.sponsorName ? `<p><strong>Sponsor:</strong> ${header.sponsorName} ${header.sponsorLicenseNo ? `(TREC #${header.sponsorLicenseNo})` : ''}</p>` : ''}
        <p><strong>Company:</strong> ${header.companyName}</p>
        <p><strong>Phone:</strong> ${header.companyPhone}</p>
        <p><strong>Email:</strong> ${header.companyEmail}</p>
        
        <div class="signature-line"></div>
        <p style="font-size: 9pt;">Inspector Signature</p>
        
        <div style="margin-top: 20px;">
          <p><strong>Date:</strong> ${inspectionDate}</p>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding: 15px; background: #f5f5f5; border-left: 4px solid #3b82f6;">
        <p style="font-size: 9pt;"><strong>Note:</strong> This report is the property of ${header.clientName} and is solely for the use of the client in the evaluation of the subject property. The inspection was performed in accordance with the Texas Real Estate Commission Standards of Practice.</p>
      </div>
    </div>
  </div>

</body>
</html>`;
  }

  /**
   * Generate HTML for custom pages (Legacy method - kept for compatibility)
   */
  private static generateHTML(reportData: TRECReportData): string {
    const { header, sections } = reportData;
    
    // Format inspection date
    const inspectionDate = new Date(header.inspectionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Generate table of contents items
    const tocItems = Object.entries(sections).map(([key, data]) => {
      const sectionNames: { [key: string]: string } = {
        'I': 'Structural Systems',
        'II': 'Electrical Systems', 
        'III': 'Heating, Ventilation & Air Conditioning',
        'IV': 'Plumbing Systems',
        'V': 'Appliances',
        'VI': 'Optional Systems'
      };
      
      return `
        <div class="toc-item">
          <div class="toc-number">${key}</div>
          <div>${sectionNames[key] || key}</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; font-family: Inter, sans-serif; }
    
    .page { width: 8.5in; height: 11in; padding: 48px; box-sizing: border-box; }
    
    .cover-page { display: grid; grid-template-rows: auto 1fr auto; min-height: 11in; }
    
    .cover-header { 
      background: linear-gradient(135deg, #1e3a8a, #3b82f6); 
      color: #fff; 
      padding: 32px 48px; 
      margin: -48px -48px 0; 
      display: flex; 
      justify-content: space-between; 
      align-items: start; 
    }
    
    .company-name { font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    .company-contact { font-size: 14px; margin: 6px 0; opacity: .95; }
    
    .company-logo { 
      width: 80px; 
      height: 80px; 
      background: rgba(255,255,255,.15); 
      border-radius: 16px; 
      border: 2px solid rgba(255,255,255,.3); 
    }
    
    .property-address { font-size: 32px; font-weight: 700; margin: 24px 0; }
    
    .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .meta-value { font-size: 15px; font-weight: 500; margin-top: 4px; }
    
    .cover-footer { 
      background: #f9fafb; 
      padding: 32px 48px; 
      margin: 0 -48px -48px; 
      border-top: 1px solid #e5e7eb; 
    }
    
    .toc-title { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 32px; }
    
    .toc-item { 
      display: flex; 
      gap: 16px; 
      padding: 16px 20px; 
      margin: 8px 0; 
      border: 1px solid #e5e7eb; 
      border-radius: 10px; 
      text-decoration: none; 
      color: #000; 
    }
    
    .toc-number { 
      width: 32px; 
      height: 32px; 
      border-radius: 8px; 
      background: #eff6ff; 
      color: #3b82f6; 
      font-weight: 700; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page">
    <div class="cover-header">
      <div>
        <h1 class="company-name">${header.companyName}</h1>
        <div class="company-contact">${header.companyPhone}</div>
        <div class="company-contact">${header.companyEmail}</div>
        <div class="company-contact">${header.companyAddress}</div>
      </div>
      <div class="company-logo"></div>
    </div>

    <div style="padding: 48px 0; display: flex; flex-direction: column; justify-content: center;">
      <div style="background: #eff6ff; padding: 8px 16px; border-radius: 6px; width: fit-content; margin-bottom: 24px;">
        <strong>Texas Property Inspection Report</strong>
      </div>

      <h2 class="property-address">${header.propertyAddress}</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
        <div>
          <div class="meta-label">Client Name</div>
          <div class="meta-value">${header.clientName}</div>
        </div>
        <div>
          <div class="meta-label">Inspection Date</div>
          <div class="meta-value">${inspectionDate}</div>
        </div>
        <div>
          <div class="meta-label">Inspector</div>
          <div class="meta-value">${header.inspectorName}</div>
        </div>
        <div>
          <div class="meta-label">TREC License #</div>
          <div class="meta-value">${header.licenseNo}</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <div style="display: flex; gap: 12px;">
          <div style="width: 64px; height: 64px; border-radius: 12px; background: #bfdbfe;"></div>
          <div>
            <div class="meta-label">Lead Inspector</div>
            <div class="meta-value">${header.inspectorName}</div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">TREC #${header.licenseNo}</div>
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="width: 64px; height: 64px; border-radius: 12px; background: #bfdbfe;"></div>
          <div>
            <div class="meta-label">Report Number</div>
            <div class="meta-value">${header.reportNo}</div>
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="width: 64px; height: 64px; border-radius: 12px; background: #bfdbfe;"></div>
          <div>
            <div class="meta-label">Inspection Date</div>
            <div class="meta-value">${inspectionDate}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="page">
    <h2 class="toc-title">Report Contents</h2>
    <div style="max-width: 600px; margin: 0 auto;">
      ${tocItems}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Merge multiple PDFs into one
   */
  private static async mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    return Buffer.from(await mergedPdf.save());
  }

  /**
   * Generate complete TREC report PDF with all inspection data
   */
  public static async generateTRECReport(reportData: TRECReportData): Promise<Buffer> {
    try {
      console.log('[TRECReportGenerator] Starting TREC report generation...');
      console.log('[TRECReportGenerator] Report data:', {
        clientName: reportData.header.clientName,
        propertyAddress: reportData.header.propertyAddress,
        inspectorName: reportData.header.inspectorName,
        sectionsCount: Object.keys(reportData.sections).length,
        sectionIds: Object.keys(reportData.sections)
      });
      
      // Check if Playwright is available
      const playwrightAvailable = await this.checkPlaywrightAvailability();
      
      if (!playwrightAvailable) {
        console.log('[TRECReportGenerator] Playwright not available, using fallback PDF generation...');
        return await this.generateFallbackPDF(reportData);
      }
      
      console.log('[TRECReportGenerator] Step 1: Generating cover page...');
      const coverPagePdf = await this.generateCoverPage(reportData);
      console.log('[TRECReportGenerator] Cover page generated');
      
      console.log('[TRECReportGenerator] Step 2: Filling official TREC form...');
      let trecFormPdf: Buffer;
      try {
        trecFormPdf = await this.fillTRECForm(reportData);
        console.log('[TRECReportGenerator] TREC form filled successfully');
      } catch (error: any) {
        console.log('[TREC PDF] Could not fill form, generating HTML version instead:', error.message);
        trecFormPdf = Buffer.from([]); // Skip if form filling fails
      }
      
      console.log('[TRECReportGenerator] Step 3: Generating inspection data pages...');
      const inspectionDataPdf = await this.generateFilledReport(reportData);
      console.log('[TRECReportGenerator] Inspection data pages generated');
      
      console.log('[TRECReportGenerator] Step 4: Merging PDFs...');
      const pdfBuffers = [coverPagePdf];
      if (trecFormPdf.length > 0) {
        pdfBuffers.push(trecFormPdf);
      }
      pdfBuffers.push(inspectionDataPdf);
      
      const finalPdf = await this.mergePDFs(pdfBuffers);
      
      console.log('[TRECReportGenerator] TREC report generation completed successfully');
      console.log('[TRECReportGenerator] Final PDF size:', finalPdf.length, 'bytes');
      
      return finalPdf;
      
    } catch (error: any) {
      console.error('[TRECReportGenerator] Error generating TREC report:', error);
      
      // If Playwright fails, try fallback
      if (error.message.includes('Executable doesn\'t exist') || error.message.includes('browserType.launch')) {
        console.log('[TRECReportGenerator] Playwright error detected, trying fallback PDF generation...');
        try {
          return await this.generateFallbackPDF(reportData);
        } catch (fallbackError: any) {
          console.error('[TRECReportGenerator] Fallback PDF generation also failed:', fallbackError);
          throw new Error(`Failed to generate TREC report: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to generate TREC report: ${error.message}`);
    }
  }

  /**
   * Check if Playwright is available and working
   */
  private static async checkPlaywrightAvailability(): Promise<boolean> {
    try {
      // Try to launch browser with minimal options
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      await browser.close();
      return true;
    } catch (error) {
      console.log('[TRECReportGenerator] Playwright not available:', error.message);
      return false;
    }
  }

  /**
   * Generate a fallback PDF using pdf-lib when Playwright is not available
   */
  private static async generateFallbackPDF(reportData: TRECReportData): Promise<Buffer> {
    console.log('[TRECReportGenerator] Generating fallback PDF using pdf-lib...');
    
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Add title
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('TREC Property Inspection Report', {
      x: 50,
      y: height - 50,
      size: 20,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Add header information
    const { header } = reportData;
    let yPosition = height - 100;
    
    const addText = (text: string, x: number, y: number, size: number = 12, isBold: boolean = false) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? font : regularFont,
        color: rgb(0, 0, 0),
      });
    };
    
    addText('Client Name:', 50, yPosition, 12, true);
    addText(header.clientName, 150, yPosition);
    yPosition -= 20;
    
    addText('Property Address:', 50, yPosition, 12, true);
    addText(header.propertyAddress, 150, yPosition);
    yPosition -= 20;
    
    addText('Inspector Name:', 50, yPosition, 12, true);
    addText(header.inspectorName, 150, yPosition);
    yPosition -= 20;
    
    addText('License Number:', 50, yPosition, 12, true);
    addText(header.licenseNo, 150, yPosition);
    yPosition -= 20;
    
    addText('Inspection Date:', 50, yPosition, 12, true);
    addText(new Date(header.inspectionDate).toLocaleDateString(), 150, yPosition);
    yPosition -= 40;
    
    // Add sections
    addText('INSPECTION SECTIONS', 50, yPosition, 14, true);
    yPosition -= 30;
    
    const sections = reportData.sections;
    for (const [sectionId, sectionData] of Object.entries(sections)) {
      if (yPosition < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = newPage.getSize().height - 50;
      }
      
      addText(`Section ${sectionId}:`, 50, yPosition, 12, true);
      yPosition -= 20;
      
      for (const [itemKey, itemData] of Object.entries(sectionData)) {
        if (yPosition < 80) {
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = newPage.getSize().height - 50;
        }
        
        addText(`  ${itemKey}:`, 70, yPosition, 10, true);
        if (itemData.rating) {
          addText(`Rating: ${itemData.rating}`, 200, yPosition, 10);
        }
        yPosition -= 15;
        
        if (itemData.comment) {
          addText(`Comment: ${itemData.comment}`, 70, yPosition, 10);
          yPosition -= 15;
        }
      }
      yPosition -= 10;
    }
    
    // Add footer
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText('Generated by AInspect - Professional Property Inspection Software', {
      x: 50,
      y: 30,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    console.log('[TRECReportGenerator] Fallback PDF generated successfully, size:', pdfBytes.length, 'bytes');
    
    return Buffer.from(pdfBytes);
  }

  /**
   * Create a placeholder TREC form if template is not available
   */
  private static async createPlaceholderForm(): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 48px; font-family: Arial, sans-serif; }
    .page { width: 8.5in; height: 11in; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
    .field { margin-bottom: 15px; }
    .field-label { font-weight: bold; margin-bottom: 5px; }
    .field-value { border-bottom: 1px solid #000; min-height: 20px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Texas Real Estate Commission</h1>
      <h2>Property Inspection Report (REI 7-6)</h2>
      <p><em>This is a placeholder form. Please upload the official TREC form template.</em></p>
    </div>
    
    <div class="section">
      <div class="section-title">I. STRUCTURAL SYSTEMS</div>
      <div class="field">
        <div class="field-label">Foundations:</div>
        <div class="field-value"></div>
      </div>
      <div class="field">
        <div class="field-label">Grading and Drainage:</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">II. ELECTRICAL SYSTEMS</div>
      <div class="field">
        <div class="field-label">Service Entrance and Panels:</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">III. HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS</div>
      <div class="field">
        <div class="field-label">Heating Equipment:</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">IV. PLUMBING SYSTEMS</div>
      <div class="field">
        <div class="field-label">Water Supply System and Fixtures:</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">V. APPLIANCES</div>
      <div class="field">
        <div class="field-label">Dishwasher:</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">VI. OPTIONAL SYSTEMS</div>
      <div class="field">
        <div class="field-label">Landscape Irrigation:</div>
        <div class="field-value"></div>
      </div>
    </div>
  </div>
</body>
</html>`;
    
    await page.setContent(html);
    await page.emulateMedia({ media: 'print' });
    
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    return pdf;
  }
}
