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
    reportNo: string;
  };
  sections: {
    [key: string]: {
      rating: string;
      comments: string;
      photos: string[];
    };
  };
  cover: {
    reportTitle: string;
    propertyFrontPhoto?: string;
  };
  propertyPhotos: string[];
}

export class TRECReportGenerator {
  private static readonly TREC_FORM_PATH = path.join(__dirname, '../../assets/trec-form-pages-1-2.pdf');

  /**
   * Generate custom cover and table of contents pages
   */
  private static async generateCustomPages(reportData: TRECReportData): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const html = this.generateHTML(reportData);
    await page.setContent(html);
    await page.emulateMedia({ media: 'print' });
    
    const customPdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    return customPdf;
  }

  /**
   * Generate HTML for custom pages
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
   * Generate complete TREC report PDF
   */
  public static async generateTRECReport(reportData: TRECReportData): Promise<Buffer> {
    try {
      console.log('[TRECReportGenerator] Starting TREC report generation...');
      
      // Generate custom cover and TOC pages
      console.log('[TRECReportGenerator] Generating custom pages...');
      const customPagesPdf = await this.generateCustomPages(reportData);
      
      // Load TREC form template
      console.log('[TRECReportGenerator] Loading TREC form template...');
      let trecFormPdf: Buffer;
      
      try {
        trecFormPdf = await fs.readFile(this.TREC_FORM_PATH);
      } catch (error) {
        console.warn('[TRECReportGenerator] TREC form template not found, creating placeholder...');
        // Create a placeholder PDF if template is not available
        trecFormPdf = await this.createPlaceholderForm();
      }
      
      // Merge PDFs
      console.log('[TRECReportGenerator] Merging PDFs...');
      const finalPdf = await this.mergePDFs([customPagesPdf, trecFormPdf]);
      
      console.log('[TRECReportGenerator] TREC report generation completed successfully');
      return finalPdf;
      
    } catch (error) {
      console.error('[TRECReportGenerator] Error generating TREC report:', error);
      throw new Error(`Failed to generate TREC report: ${error.message}`);
    }
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
