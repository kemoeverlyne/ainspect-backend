import puppeteer from 'puppeteer';
import { TRECReportData } from './trecReportGenerator.js';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  scale?: number;
  landscape?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export interface StandardInspectionData {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress: string;
  inspectionDate: Date;
  inspectorName: string;
  licenseNumber?: string;
  inspectorEmail?: string;
  inspectorPhone?: string;
  inspectorCompany?: string;
  realtorName?: string;
  realtorCompany?: string;
  realtorPhone?: string;
  realtorEmail?: string;
  companyData?: {
    companyName?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
  };
  reportData?: {
    summary?: {
      totalItems?: number;
      itemsPassed?: number;
      itemsFailed?: number;
      safetyIssues?: number;
      majorDefects?: number;
      criticalIssues?: number;
      minorIssues?: number;
      overallCondition?: string;
      complianceScore?: number;
    };
    property?: {
      type?: string;
      yearBuilt?: string;
      squareFootage?: string;
      weather?: string;
      temperature?: string;
      occupancy?: string;
      buildingType?: string;
      lotSize?: string;
      stories?: string;
      foundationType?: string;
      roofType?: string;
      garageType?: string;
      heatingType?: string;
      coolingType?: string;
      waterSource?: string;
      sewerType?: string;
    };
    inspectionDetails?: {
      startTime?: string;
      endTime?: string;
      duration?: string;
      presentDuringInspection?: string[];
      limitationsOfInspection?: string[];
      scopeOfInspection?: string;
    };
    systems?: {
      [key: string]: {
        id?: string;
        name?: string;
        status?: string;
        issueCount?: number;
        summary?: string;
        items?: any[];
        completionPercentage?: number;
        totalFields?: number;
        completedFields?: number;
        manufacturer?: string;
        model?: string;
        serialNumber?: string;
        age?: string;
        location?: string;
        observations?: any[];
      };
    };
    sections?: any;
    photos?: string[];
    frontHomePhoto?: string;
    findings?: any[];
    recommendations?: {
      immediate?: any[];
      shortTerm?: any[];
      longTerm?: any[];
      maintenance?: any[];
    };
    agreement?: {
      inspectionStandards?: string;
      scopeDescription?: string;
      limitations?: string[];
    };
  };
  status?: string;
}

export class PDFGenerator {
  private static browser: puppeteer.Browser | null = null;

  /**
   * Initialize Puppeteer browser instance
   */
  private static async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML content using Puppeteer
   */
  public static async generatePDFFromHTML(
    htmlContent: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      console.log('[PDFGenerator] Starting PDF generation from HTML...');
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2
      });

      // Set content with a more lenient wait condition
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Wait for any images to load using the new method
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        printBackground: options.printBackground !== false,
        scale: options.scale || 1,
        landscape: options.landscape || false,
        preferCSSPageSize: true,
        timeout: 30000
      });

      await page.close();
      
      console.log('[PDFGenerator] PDF generated successfully, size:', pdfBuffer.length);
      return pdfBuffer;

    } catch (error) {
      console.error('[PDFGenerator] Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Generate PDF from URL using Puppeteer
   */
  public static async generatePDFFromURL(
    url: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      console.log('[PDFGenerator] Starting PDF generation from URL:', url);
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2
      });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for any dynamic content to load using the new method
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        printBackground: options.printBackground !== false,
        scale: options.scale || 1,
        landscape: options.landscape || false,
        preferCSSPageSize: true,
        timeout: 30000
      });

      await page.close();
      
      console.log('[PDFGenerator] PDF generated successfully from URL, size:', pdfBuffer.length);
      return pdfBuffer;

    } catch (error) {
      console.error('[PDFGenerator] Error generating PDF from URL:', error);
      throw new Error(`Failed to generate PDF from URL: ${error.message}`);
    }
  }

  /**
   * Generate Standard Inspection Report PDF
   */
  public static async generateStandardReportPDF(
    inspectionData: StandardInspectionData,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      console.log('[PDFGenerator] Generating standard inspection report PDF...');
      
      const htmlContent = this.createStandardReportHTML(inspectionData);
      return await this.generatePDFFromHTML(htmlContent, options);

    } catch (error) {
      console.error('[PDFGenerator] Error generating standard report PDF:', error);
      throw new Error(`Failed to generate standard report PDF: ${error.message}`);
    }
  }

  /**
   * Generate TREC Report PDF
   */
  public static async generateTRECReportPDF(
    reportData: TRECReportData,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      console.log('[PDFGenerator] Generating TREC report PDF...');
      
      const htmlContent = this.createTRECReportHTML(reportData);
      return await this.generatePDFFromHTML(htmlContent, options);

    } catch (error) {
      console.error('[PDFGenerator] Error generating TREC report PDF:', error);
      throw new Error(`Failed to generate TREC report PDF: ${error.message}`);
    }
  }

  /**
   * Create HTML content for standard inspection report
   */
  private static createStandardReportHTML(inspectionData: StandardInspectionData): string {
    const { 
      id, clientName, clientEmail, clientPhone, propertyAddress, inspectionDate, 
      inspectorName, licenseNumber, inspectorEmail, inspectorPhone, inspectorCompany,
      realtorName, realtorCompany, realtorPhone, realtorEmail,
      companyData, reportData, status 
    } = inspectionData;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Professional Inspection Report - ${propertyAddress}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --ink: #0f172a;
            --muted: #6b7280;
            --border: #e5e7eb;
            --chip: #f3f4f6;
            --bg: #ffffff;
            --accent: #3b82f6;
          }
          
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: #fafafa;
            color: var(--ink);
            font: 14px/1.6 Inter, system-ui, -apple-system, sans-serif;
          }
          
          h1, h2, h3, h4 { margin: 0; font-weight: 600; }
          
          .page {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            padding: 48px;
            min-height: 100vh;
          }
          
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          
          /* Cover Page */
          .cover-page {
            padding: 0;
            display: grid;
            grid-template-rows: auto 1fr auto;
            min-height: 100vh;
          }
          
          .cover-header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 32px 48px;
            display: flex;
            justify-content: space-between;
            align-items: start;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 16px;
            letter-spacing: -0.5px;
          }
          
          .company-contact {
            font-size: 14px;
            margin: 6px 0;
            opacity: 0.95;
          }
          
          .company-logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }
          
          .cover-main {
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .property-hero {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            align-items: center;
            margin-bottom: 48px;
          }
          
          .property-details {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          .report-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: fit-content;
          }
          
          .property-address {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.2;
            color: var(--ink);
            margin: 0;
          }
          
          .property-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 8px;
          }
          
          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .meta-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .meta-value {
            font-size: 15px;
            color: var(--ink);
            font-weight: 500;
          }
          
          .property-image {
            width: 100%;
            height: 320px;
            background: linear-gradient(135deg, #dbeafe, #e0e7ff);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--muted);
            font-size: 14px;
            border: 1px solid var(--border);
            overflow: hidden;
          }
          
          .cover-footer {
            background: var(--chip);
            padding: 32px 48px;
            border-top: 1px solid var(--border);
          }
          
          .inspector-team {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          
          .inspector-card {
            display: flex;
            gap: 16px;
          }
          
          .inspector-photo {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            background: linear-gradient(135deg, #bfdbfe, #93c5fd);
            flex-shrink: 0;
          }
          
          .inspector-info {
            flex: 1;
          }
          
          .inspector-role {
            font-size: 11px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .inspector-name {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px;
            color: var(--ink);
          }
          
          .inspector-contact {
            font-size: 12px;
            color: var(--accent);
            margin: 2px 0;
          }
          
          .inspector-license {
            font-size: 11px;
            color: var(--muted);
            margin-top: 6px;
          }
          
          /* Report Content Pages */
          h1, h2, h3, h4 { margin: 0; font-weight: 700; }
          
          .section-header {
            background: linear-gradient(135deg, var(--navy-800), var(--navy-600));
            color: white;
            padding: 24px 32px;
            margin: 64px calc(-1 * 0.75in) 32px;
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border-left: 6px solid var(--blue-500);
          }
          
          .subsection {
            margin: 32px 0;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.2s;
          }
          
          .subsection:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          
          .subsection-header {
            background: linear-gradient(to right, var(--gray-50), white);
            padding: 24px 32px;
            border-bottom: 2px solid var(--gray-100);
          }
          
          .subsection-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--navy-800);
            margin: 0;
          }
          
          .subsection-content {
            padding: 32px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          
          .summary-card {
            background: var(--light);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid var(--border);
          }
          
          .summary-number {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
            display: block;
          }
          
          .summary-number.excellent { color: var(--success); }
          .summary-number.good { color: var(--primary); }
          .summary-number.attention { color: var(--warning); }
          .summary-number.critical { color: var(--danger); }
          
          .summary-label {
            font-size: 14px;
            color: var(--text-light);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          /* TOC Section Styles */
          .toc-section {
            margin: 32px 0 40px;
          }
          
          .toc-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #0f172a;
          }
          
          .toc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
          }
          
          .toc-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            text-decoration: none;
            color: #0f172a;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
          }
          
          .toc-item::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--tab-color, #3b82f6);
          }
          
          .toc-number {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            color: #3b82f6;
            font-weight: 700;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .toc-label {
            font-size: 14px;
            font-weight: 500;
          }
          
          /* Summary Stats Grid */
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 24px 0;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            text-align: center;
          }
          
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 8px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          /* Info Table Styles */
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          
          .info-table td {
            padding: 14px 18px;
            border: 1px solid #e5e7eb;
            font-size: 14px;
          }
          
          .info-table td:first-child {
            font-weight: 600;
            background: linear-gradient(to right, #f9fafb, #f3f4f6);
            width: 35%;
            color: #374151;
          }
          
          .info-table td:last-child {
            background: white;
          }
          
          /* Observation Items */
          .observation-item {
            display: flex;
            align-items: start;
            gap: 14px;
            margin: 12px 0;
            padding: 16px;
            background: linear-gradient(135deg, #fafafa, white);
            border-left: 3px solid #e5e7eb;
            border-radius: 8px;
            transition: all 0.2s;
          }
          
          .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            flex-shrink: 0;
            margin-top: 2px;
            transition: all 0.2s;
          }
          
          .checkbox.checked {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border-color: #2563eb;
            position: relative;
          }
          
          .checkbox.checked::after {
            content: "✓";
            position: absolute;
            color: white;
            font-size: 14px;
            font-weight: 700;
            top: 0px;
            left: 3px;
          }
          
          /* Subsection Styles */
          .subsection {
            margin: 32px 0;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            border: 1px solid #e5e7eb;
          }
          
          .subsection-header {
            background: linear-gradient(to right, #f9fafb, white);
            padding: 18px 24px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .subsection-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #0f172a;
          }
          
          .subsection-content {
            padding: 24px;
          }
          
          .section-header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 24px 32px;
            margin: 56px 0 36px;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
            border-left: 6px solid #60a5fa;
            border-radius: 8px;
          }
          
          /* Status Badges */
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
          }
          
          .status-badge::before {
            content: "";
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          
          .status-excellent, .status-satisfactory, .status-good {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            color: #065f46;
          }
          
          .status-excellent::before, .status-satisfactory::before, .status-good::before {
            background: #059669;
          }
          
          .status-marginal {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            color: #92400e;
          }
          
          .status-marginal::before {
            background: #d97706;
          }
          
          .status-attention, .status-poor {
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            color: #991b1b;
          }
          
          .status-attention::before, .status-poor::before {
            background: #dc2626;
          }
          
          .status-critical, .status-safety {
            background: linear-gradient(135deg, #fecaca, #fca5a5);
            color: #7f1d1d;
            font-weight: 700;
          }
          
          .status-critical::before, .status-safety::before {
            background: #b91c1c;
          }
          
          /* Photo Grid */
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin: 24px 0;
          }
          
          .photo-item {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s;
          }
          
          .photo-placeholder {
            width: 100%;
            height: 220px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 13px;
          }
          
          .photo-item img {
            width: 100%;
            height: 220px;
            object-fit: cover;
          }
          
          .photo-caption {
            font-size: 13px;
            color: #4b5563;
            padding: 12px 16px;
            background: #fafafa;
            line-height: 1.5;
          }
          
          @media print {
            body { margin: 0; }
            @page { 
              margin: 0.75in; 
              size: A4;
            }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            .page { padding: 0; }
            .section-header { margin-left: 0; margin-right: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- COVER PAGE (Template Format) -->
          <div class="cover-page">
            <div class="cover-header">
              <div class="company-info">
                <h1 class="company-name">${companyData?.companyName || inspectorCompany || 'AINSPECT'}</h1>
                ${companyData?.companyPhone || inspectorPhone ? `<div class="company-contact">${companyData?.companyPhone || inspectorPhone}</div>` : ''}
                ${companyData?.companyEmail || inspectorEmail ? `<div class="company-contact">${companyData?.companyEmail || inspectorEmail}</div>` : ''}
                ${companyData?.companyWebsite ? `<div class="company-contact">${companyData.companyWebsite}</div>` : ''}
              </div>
              <div class="company-logo">AI</div>
            </div>
            <div class="cover-main">
              <div class="property-hero">
                <div class="property-details">
                  <div class="report-badge">Inspection Report</div>
                  <h2 class="property-address">${propertyAddress}</h2>
                  <div class="property-meta">
                    <div class="meta-item">
                      <div class="meta-label">Client</div>
                      <div class="meta-value">${clientName}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">Inspection Date</div>
                      <div class="meta-value">${new Date(inspectionDate).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">Report ID</div>
                      <div class="meta-value">RPT-${id.substring(0, 8).toUpperCase()}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">Overall Score</div>
                      <div class="meta-value">${reportData?.summary?.overallScore || reportData?.summary?.complianceScore || 0}/100</div>
                    </div>
                  </div>
                </div>
                <div class="property-image">
                  ${reportData?.frontHomePhoto ? `
                    <img src="${reportData.frontHomePhoto}" alt="Property Photo" style="width: 100%; height: 100%; object-fit: cover;">
                  ` : 'Property Photo'}
                </div>
              </div>
            </div>
            <div class="cover-footer">
              <div class="inspector-team">
                <div class="inspector-card">
                  <div class="inspector-photo"></div>
                  <div class="inspector-info">
                    <div class="inspector-role">Lead Inspector</div>
                    <div class="inspector-name">${inspectorName}</div>
                    <div class="inspector-contact">${inspectorPhone || 'N/A'}</div>
                    <div class="inspector-contact">${inspectorEmail || 'N/A'}</div>
                    ${licenseNumber ? `<div class="inspector-license">License #${licenseNumber}</div>` : ''}
                  </div>
                </div>
                ${realtorName ? `
                <div class="inspector-card">
                  <div class="inspector-photo"></div>
                  <div class="inspector-info">
                    <div class="inspector-role">Real Estate Agent</div>
                    <div class="inspector-name">${realtorName}</div>
                    <div class="inspector-contact">${realtorPhone || 'N/A'}</div>
                    <div class="inspector-contact">${realtorEmail || 'N/A'}</div>
                  </div>
                </div>
                ` : ''}
                <div class="inspector-card">
                  <div class="inspector-photo"></div>
                  <div class="inspector-info">
                    <div class="inspector-role">Client</div>
                    <div class="inspector-name">${clientName}</div>
                    <div class="inspector-contact">${clientEmail || 'N/A'}</div>
                    <div class="inspector-contact">${clientPhone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- EXECUTIVE SUMMARY PAGE -->
          <div class="page-break"></div>
          <div class="page">
            <h1 class="section-header">EXECUTIVE SUMMARY</h1>
            
            <!-- Key Metrics Dashboard -->
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">INSPECTION METRICS</h3>
              </div>
              <div class="subsection-content">
                <div class="summary-stats">
                  <div class="stat-card" style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-left: 4px solid #0ea5e9;">
                    <div class="stat-value" style="color: #0ea5e9;">${reportData?.summary?.overallScore || reportData?.summary?.complianceScore || 0}</div>
                    <div class="stat-label">Overall Score</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Out of 100</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b;">
                    <div class="stat-value" style="color: #f59e0b;">${reportData?.summary?.totalIssues || reportData?.summary?.itemsFailed || 0}</div>
                    <div class="stat-label">Total Issues</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Items requiring attention</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #fee2e2, #fecaca); border-left: 4px solid #ef4444;">
                    <div class="stat-value" style="color: #ef4444;">${reportData?.summary?.criticalIssues || reportData?.summary?.majorDefects || 0}</div>
                    <div class="stat-label">Critical Issues</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Immediate attention required</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-left: 4px solid #10b981;">
                    <div class="stat-value" style="color: #10b981;">${reportData?.summary?.safetyIssues || 0}</div>
                    <div class="stat-label">Safety Issues</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Safety concerns identified</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Property Overview -->
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">PROPERTY OVERVIEW</h3>
              </div>
              <div class="subsection-content">
                <table class="info-table">
                  <tr><td>Property Address</td><td>${propertyAddress}</td></tr>
                  <tr><td>Inspection Date</td><td>${new Date(inspectionDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td></tr>
                  <tr><td>Inspection Type</td><td>Standard Inspection</td></tr>
                  <tr><td>Report Status</td><td>${status || 'Completed'}</td></tr>
                  <tr><td>Inspector</td><td>${inspectorName}</td></tr>
                  ${licenseNumber ? `<tr><td>License Number</td><td>${licenseNumber}</td></tr>` : ''}
                </table>
              </div>
            </div>

            <!-- Report Conventions -->
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">REPORT CONVENTIONS</h3>
              </div>
              <div class="subsection-content">
                <div class="observation-item" style="border-left-color: #10b981; background: linear-gradient(135deg, #d1fae5, #a7f3d0);">
                  <div class="checkbox" style="background: #10b981; border-color: #10b981;"></div>
                  <div><strong>EXCELLENT/SATISFACTORY</strong> - Component is functionally consistent with its original purpose and shows minimal signs of wear.</div>
                </div>
                <div class="observation-item" style="border-left-color: #f59e0b; background: linear-gradient(135deg, #fef3c7, #fde68a);">
                  <div class="checkbox" style="background: #f59e0b; border-color: #f59e0b;"></div>
                  <div><strong>GOOD/MARGINAL</strong> - Component will probably require repair or replacement within five years.</div>
                </div>
                <div class="observation-item" style="border-left-color: #f97316; background: linear-gradient(135deg, #fed7aa, #fdba74);">
                  <div class="checkbox" style="background: #f97316; border-color: #f97316;"></div>
                  <div><strong>ATTENTION/POOR</strong> - Component will need repair or replacement now or in the very near future.</div>
                </div>
                <div class="observation-item" style="border-left-color: #ef4444; background: linear-gradient(135deg, #fee2e2, #fecaca);">
                  <div class="checkbox" style="background: #ef4444; border-color: #ef4444;"></div>
                  <div><strong>CRITICAL/SAFETY HAZARD</strong> - System or component that is considered significantly deficient or unsafe.</div>
                </div>
              </div>
            </div>
          </div>

          
          <!-- SYSTEMS OVERVIEW PAGE -->
          ${(() => {
            // Build systemSections from reportData.systems or reportData.sections
            const systemSections = [];
            
            // Try reportData.systems first (array format)
            if (reportData?.systems && Array.isArray(reportData.systems)) {
              systemSections.push(...reportData.systems.map((sys: any) => ({
                name: sys.name || sys.id || 'Unknown System',
                status: sys.status || 'pending',
                issueCount: sys.issueCount || 0,
                completionPercentage: sys.completionPercentage || 0
              })));
            }
            // Try reportData.sections (object format)
            else if (reportData?.sections && typeof reportData.sections === 'object') {
              Object.entries(reportData.sections).forEach(([key, section]: [string, any]) => {
                systemSections.push({
                  name: section.name || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  status: section.status || 'pending',
                  issueCount: section.issueCount || Object.keys(section).filter((k: string) => section[k]?.condition === 'deficient' || section[k]?.condition === 'critical').length || 0,
                  completionPercentage: section.completionPercentage || 0
                });
              });
            }
            
            // If still no systems, return empty string
            if (systemSections.length === 0) {
              return '';
            }
            
            const systemColors = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#84cc16', '#10b981'];
            
            return `
          <div class="page-break"></div>
          <div class="page">
            <h1 class="section-header">SYSTEMS OVERVIEW</h1>
            
            <div class="toc-section">
              <h2 class="toc-title">Inspection Systems</h2>
              <div class="toc-grid">
                ${systemSections.map((section: any, index: number) => {
                  const color = systemColors[index % systemColors.length];
                  return `
                    <div class="toc-item" style="--tab-color: ${color};">
                      <div class="toc-number">${index + 1}</div>
                      <div class="toc-label">${section.name}</div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                        ${section.issueCount || 0} issues • ${section.completionPercentage || 0}% complete
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Systems Summary Table -->
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">SYSTEMS SUMMARY</h3>
              </div>
              <div class="subsection-content">
                <table class="info-table">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white;">
                      <td style="color: white; font-weight: 700;">System</td>
                      <td style="color: white; font-weight: 700;">Status</td>
                      <td style="color: white; font-weight: 700;">Issues</td>
                      <td style="color: white; font-weight: 700;">Completion</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${systemSections.map((section: any) => `
                      <tr>
                        <td style="font-weight: 600;">${section.name}</td>
                        <td>
                          <span class="status-badge status-${section.status || 'good'}" style="font-size: 10px; padding: 4px 8px;">
                            ${(section.status || 'good').toUpperCase()}
                          </span>
                        </td>
                        <td style="text-align: center; font-weight: 600;">${section.issueCount || 0}</td>
                        <td style="text-align: center; font-weight: 600;">${section.completionPercentage || 0}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            `;
          })()}
          
          
          <!-- Systems Overview -->
          ${(reportData?.systems && Object.keys(reportData.systems).length > 0) || (reportData?.sections && Object.keys(reportData.sections).length > 0) ? `
          <div class="page-break"></div>
          <div class="section-header" id="systems-overview">Systems Overview</div>
          
          ${reportData?.systems ? Object.entries(reportData.systems).map(([systemId, system]: [string, any]) => `
            <div class="subsection" style="margin-bottom: 32px; page-break-inside: avoid;">
              <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 20px; font-weight: 700; color: #1e3a8a; margin-bottom: 8px;">${system.name || systemId.charAt(0).toUpperCase() + systemId.slice(1)}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <span style="padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${
                      system.status === 'excellent' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 
                      system.status === 'good' ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 
                      system.status === 'attention' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                      system.status === 'critical' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 
                      'linear-gradient(135deg, #f3f4f6, #e5e7eb)'
                    }; color: ${
                      system.status === 'excellent' ? '#065f46' : 
                      system.status === 'good' ? '#1e40af' : 
                      system.status === 'attention' ? '#92400e' : 
                      system.status === 'critical' ? '#991b1b' : '#374151'
                    }; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      ${system.status || 'Inspected'}
                    </span>
                    ${system.issueCount !== undefined ? `
                    <span style="font-size: 13px; color: #6b7280;">
                      Issues: <strong style="color: ${system.issueCount > 0 ? '#dc2626' : '#059669'}; font-size: 14px;">${system.issueCount || 0}</strong>
                    </span>` : ''}
                  </div>
                  ${system.completionPercentage !== undefined ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${system.completionPercentage}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px;"></div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: #3b82f6;">${system.completionPercentage}%</span>
                  </div>` : ''}
                </div>
              </div>
              <div class="subsection-content">
                
                ${system.manufacturer || system.model || system.age || system.location ? `
                <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 13px;">
                    ${system.manufacturer ? `<div style="display: flex; flex-direction: column; gap: 4px;"><strong style="color: #1e3a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Manufacturer</strong> <span style="color: #334155; font-weight: 500;">${system.manufacturer}</span></div>` : ''}
                    ${system.model ? `<div style="display: flex; flex-direction: column; gap: 4px;"><strong style="color: #1e3a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Model</strong> <span style="color: #334155; font-weight: 500;">${system.model}</span></div>` : ''}
                    ${system.age ? `<div style="display: flex; flex-direction: column; gap: 4px;"><strong style="color: #1e3a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Age</strong> <span style="color: #334155; font-weight: 500;">${system.age}</span></div>` : ''}
                    ${system.location ? `<div style="display: flex; flex-direction: column; gap: 4px;"><strong style="color: #1e3a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Location</strong> <span style="color: #334155; font-weight: 500;">${system.location}</span></div>` : ''}
                    ${system.serialNumber ? `<div style="display: flex; flex-direction: column; gap: 4px;"><strong style="color: #1e3a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Serial Number</strong> <span style="color: #334155; font-weight: 500;">${system.serialNumber}</span></div>` : ''}
                  </div>
                </div>` : ''}
                
                ${system.summary ? `
                <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
                  <p style="color: #1e40af; line-height: 1.7; margin: 0; font-size: 13px;">${system.summary}</p>
                </div>` : ''}
                
                ${system.observations && system.observations.length > 0 ? `
                <div style="margin-bottom: 24px;">
                  <h4 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Observations</h4>
                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${system.observations.map((obs: any, idx: number) => `
                      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="display: flex; gap: 12px; align-items: start;">
                          <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">${idx + 1}</div>
                          <div style="flex: 1;">
                            <p style="color: #334155; line-height: 1.6; margin: 0; font-size: 13px;">${obs.text || obs.description || obs}</p>
                            ${obs.location ? `<div style="margin-top: 8px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; display: inline-block;"><span style="font-size: 11px; color: #64748b; font-weight: 600;">📍 ${obs.location}</span></div>` : ''}
                            ${obs.timestamp ? `<div style="margin-top: 6px;"><span style="font-size: 11px; color: #94a3b8;">⏱️ ${obs.timestamp}</span></div>` : ''}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>` : ''}
                
                ${system.items && system.items.length > 0 ? `
                <div style="margin-top: 24px;">
                  <h4 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Inspection Items</h4>
                  <div style="display: grid; gap: 14px;">
                    ${system.items.slice(0, 10).map((item: any) => `
                      <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid ${
                        item.condition === 'critical' || item.condition === 'deficient' ? '#dc2626' :
                        item.condition === 'attention' || item.condition === 'marginal' ? '#f59e0b' :
                        '#10b981'
                      }; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: ${item.comment || item.notes ? '10px' : '0'};">
                          <strong style="font-size: 14px; color: #1e3a8a; font-weight: 600;">${item.name || item.label || 'Item'}</strong>
                          <span style="padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; background: ${
                            item.condition === 'good' || item.condition === 'satisfactory' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' :
                            item.condition === 'attention' || item.condition === 'marginal' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' :
                            item.condition === 'critical' || item.condition === 'deficient' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' :
                            'linear-gradient(135deg, #e5e7eb, #d1d5db)'
                          }; color: ${
                            item.condition === 'good' || item.condition === 'satisfactory' ? '#065f46' :
                            item.condition === 'attention' || item.condition === 'marginal' ? '#92400e' :
                            item.condition === 'critical' || item.condition === 'deficient' ? '#991b1b' :
                            '#374151'
                          }; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                            ${item.condition || 'N/A'}
                          </span>
                        </div>
                        ${item.comment || item.notes ? `
                        <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.7; padding-left: 12px; border-left: 2px solid #e2e8f0;">${item.comment || item.notes}</p>` : ''}
                      </div>
                    `).join('')}
                    ${system.items.length > 10 ? `
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 13px; color: #64748b; font-weight: 500;">
                      ... and ${system.items.length - 10} more items
                    </div>` : ''}
                  </div>
                </div>` : ''}
              </div>
            </div>
          `).join('') : ''}
          
          ${reportData?.sections ? Object.entries(reportData.sections).map(([sectionId, sectionData]: [string, any]) => `
            <div class="subsection" style="margin-bottom: 32px; page-break-inside: avoid;">
              <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 20px; font-weight: 700; color: #1e3a8a; margin: 0;">${sectionData.title || sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h3>
              </div>
              <div style="display: grid; gap: 14px;">
                ${Object.entries(sectionData).filter(([key]) => key !== 'title').map(([itemId, itemData]: [string, any]) => {
                  if (typeof itemData !== 'object' || itemData === null) return '';
                  
                  return `
                    <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid ${
                      itemData.condition === 'critical' || itemData.condition === 'deficient' || itemData.rating === 'Deficient' ? '#dc2626' :
                      itemData.condition === 'attention' || itemData.condition === 'marginal' || itemData.rating === 'Not Present' ? '#f59e0b' :
                      '#10b981'
                    }; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: ${itemData.notes || itemData.comments || itemData.value || itemData.recommendations ? '10px' : '0'};">
                        <strong style="font-size: 14px; color: #1e3a8a; font-weight: 600;">${itemData.title || itemId.replace(/([A-Z])/g, ' $1').trim()}</strong>
                        ${itemData.condition || itemData.rating ? `
                          <span style="padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; background: ${
                            itemData.condition === 'good' || itemData.condition === 'satisfactory' || itemData.rating === 'Inspected' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' :
                            itemData.condition === 'attention' || itemData.condition === 'marginal' || itemData.rating === 'Not Present' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' :
                            itemData.condition === 'critical' || itemData.condition === 'deficient' || itemData.rating === 'Deficient' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' :
                            'linear-gradient(135deg, #e5e7eb, #d1d5db)'
                          }; color: ${
                            itemData.condition === 'good' || itemData.condition === 'satisfactory' || itemData.rating === 'Inspected' ? '#065f46' :
                            itemData.condition === 'attention' || itemData.condition === 'marginal' || itemData.rating === 'Not Present' ? '#92400e' :
                            itemData.condition === 'critical' || itemData.condition === 'deficient' || itemData.rating === 'Deficient' ? '#991b1b' :
                            '#374151'
                          }; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                            ${itemData.condition || itemData.rating}
                          </span>
                        ` : ''}
                      </div>
                      ${itemData.value ? `
                        <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px;">
                          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Value</span>
                          <p style="font-size: 13px; color: #334155; margin: 4px 0 0 0; font-weight: 500;">${itemData.value}</p>
                        </div>
                      ` : ''}
                      ${itemData.notes || itemData.comments ? `
                        <p style="font-size: 13px; color: #64748b; margin: 0 0 ${itemData.recommendations ? '10px' : '0'} 0; line-height: 1.7; padding-left: 12px; border-left: 2px solid #e2e8f0;">${itemData.notes || itemData.comments}</p>
                      ` : ''}
                      ${itemData.recommendations ? `
                        <div style="margin-top: 10px; padding: 12px 14px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 3px solid #f59e0b; border-radius: 6px;">
                          <p style="font-size: 11px; font-weight: 700; color: #92400e; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">💡 Recommendation</p>
                          <p style="font-size: 13px; color: #78350f; line-height: 1.6; margin: 0;">${itemData.recommendations}</p>
                        </div>
                      ` : ''}
                      ${itemData.photos && itemData.photos.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #e5e7eb;">
                          ${itemData.photos.slice(0, 4).map((photo: string) => `
                            <img src="${photo}" alt="Item photo" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('') : ''}
          ` : ''}
          
          <!-- Photo Gallery -->
          ${reportData?.photos && reportData.photos.length > 0 ? `
          <div class="page-break"></div>
          <div class="section-header" id="photo-documentation">Photo Documentation</div>
          <div class="subsection">
            <div class="subsection-content">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                ${reportData.photos.slice(0, 12).map((photo: string, index: number) => `
                  <div style="page-break-inside: avoid;">
                    <img src="${photo}" alt="Inspection Photo ${index + 1}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 8px;">Photo ${index + 1}</p>
                  </div>
                `).join('')}
              </div>
              ${reportData.photos.length > 12 ? `
              <div style="text-align: center; padding: 16px; margin-top: 20px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
                ${reportData.photos.length - 12} additional photos available in the digital report
              </div>` : ''}
            </div>
          </div>` : ''}
          
          <!-- Recommendations Summary -->
          ${reportData?.recommendations ? `
          <div class="page-break"></div>
          <div class="section-header" id="recommendations">SUMMARY OF RECOMMENDATIONS</div>
          
          ${reportData.recommendations.immediate?.length ? `
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">IMMEDIATE ATTENTION REQUIRED</h3>
            </div>
            <div class="subsection-content">
              <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); border-left: 4px solid #dc2626; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <p style="font-size: 13px; color: #7f1d1d; margin-bottom: 12px; font-weight: 600;">These items require immediate attention for safety or to prevent further damage:</p>
                ${reportData.recommendations.immediate.map((rec: any, index: number) => `
                  <div style="margin: 12px 0; padding-left: 24px; position: relative; line-height: 1.6;">
                    <div style="position: absolute; left: 0; color: #dc2626; font-weight: 700;">${index + 1}.</div>
                    <div>
                      <strong>${rec.title || rec.item || 'Recommendation'}</strong>
                      ${rec.description ? `<br><span style="font-size: 13px; color: #991b1b;">${rec.description}</span>` : ''}
                      ${rec.location ? `<br><span style="font-size: 12px; color: #7f1d1d;"><em>Location: ${rec.location}</em></span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>` : ''}
          
          ${reportData.recommendations.shortTerm?.length ? `
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">SHORT-TERM REPAIRS (Within 1 Year)</h3>
            </div>
            <div class="subsection-content">
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                ${reportData.recommendations.shortTerm.map((rec: any, index: number) => `
                  <div style="margin: 12px 0; padding-left: 24px; position: relative; line-height: 1.6;">
                    <div style="position: absolute; left: 0; color: #d97706; font-weight: 700;">${index + 1}.</div>
                    <div>
                      <strong>${rec.title || rec.item || 'Recommendation'}</strong>
                      ${rec.description ? `<br><span style="font-size: 13px; color: #78350f;">${rec.description}</span>` : ''}
                      ${rec.location ? `<br><span style="font-size: 12px; color: #78350f;"><em>Location: ${rec.location}</em></span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>` : ''}
          
          ${reportData.recommendations.longTerm?.length ? `
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">LONG-TERM PLANNING (1-5 Years)</h3>
            </div>
            <div class="subsection-content">
              <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-left: 4px solid #3b82f6; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                ${reportData.recommendations.longTerm.map((rec: any, index: number) => `
                  <div style="margin: 12px 0; padding-left: 24px; position: relative; line-height: 1.6;">
                    <div style="position: absolute; left: 0; color: #3b82f6; font-weight: 700;">${index + 1}.</div>
                    <div>
                      <strong>${rec.title || rec.item || 'Recommendation'}</strong>
                      ${rec.description ? `<br><span style="font-size: 13px; color: #1e3a8a;">${rec.description}</span>` : ''}
                      ${rec.estimatedCost ? `<br><span style="font-size: 12px; color: #1e40af;"><em>Estimated Cost: ${rec.estimatedCost}</em></span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>` : ''}
          
          ${reportData.recommendations.maintenance?.length ? `
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">ONGOING MAINTENANCE RECOMMENDATIONS</h3>
            </div>
            <div class="subsection-content">
              <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-left: 4px solid #059669; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                ${reportData.recommendations.maintenance.map((rec: any, index: number) => `
                  <div style="margin: 12px 0; padding-left: 24px; position: relative; line-height: 1.6;">
                    <div style="position: absolute; left: 0; color: #059669; font-weight: 700;">${index + 1}.</div>
                    <div>
                      <strong>${rec.title || rec.item || 'Recommendation'}</strong>
                      ${rec.description ? `<br><span style="font-size: 13px; color: #065f46;">${rec.description}</span>` : ''}
                      ${rec.frequency ? `<br><span style="font-size: 12px; color: #047857;"><em>Frequency: ${rec.frequency}</em></span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>` : ''}
          ` : ''}
          
          <!-- Scope of Inspection & Limitations -->
          ${reportData?.agreement || reportData?.inspectionDetails?.limitationsOfInspection?.length ? `
          <div class="page-break"></div>
          <div class="section-header" id="scope-limitations">SCOPE OF INSPECTION & LIMITATIONS</div>
          
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">INSPECTION STANDARDS</h3>
            </div>
            <div class="subsection-content">
              <p style="line-height: 1.8; margin-bottom: 16px;">
                ${reportData.agreement?.inspectionStandards || 'This inspection was performed in accordance with the Standards of Practice of the American Society of Home Inspectors (ASHI) and/or the International Association of Certified Home Inspectors (InterNACHI). The inspection is a visual examination of the readily accessible systems and components of a home.'}
              </p>
            </div>
          </div>
          
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">SCOPE OF INSPECTION</h3>
            </div>
            <div class="subsection-content">
              <p style="line-height: 1.8; margin-bottom: 16px;">
                ${reportData.agreement?.scopeDescription || 'The inspection includes a visual examination of the property\'s major systems and components including: structural elements, exterior, roofing, plumbing, electrical, heating and cooling systems, interior, insulation and ventilation. The inspection does not include areas that are not readily accessible or visible.'}
              </p>
            </div>
          </div>
          
          ${reportData.inspectionDetails?.limitationsOfInspection?.length || reportData.agreement?.limitations?.length ? `
          <div class="subsection">
            <div class="subsection-header">
              <h3 class="subsection-title">LIMITATIONS OF INSPECTION</h3>
            </div>
            <div class="subsection-content">
              <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; border-radius: 10px; padding: 20px;">
                <p style="font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px;">⚠</span> Important Limitations
                </p>
                <ul style="margin: 8px 0; padding-left: 24px;">
                  ${(reportData.inspectionDetails?.limitationsOfInspection || reportData.agreement?.limitations || []).map((limitation: string) => `
                    <li style="font-size: 13px; color: #78350f; margin: 8px 0; line-height: 1.6;">${limitation}</li>
                  `).join('')}
                  ${(!reportData.inspectionDetails?.limitationsOfInspection?.length && !reportData.agreement?.limitations?.length) ? `
                    <li style="font-size: 13px; color: #78350f; margin: 8px 0; line-height: 1.6;">This inspection does not include areas that are concealed, inaccessible, or obstructed.</li>
                    <li style="font-size: 13px; color: #78350f; margin: 8px 0; line-height: 1.6;">This is a visual inspection only and does not include destructive testing.</li>
                    <li style="font-size: 13px; color: #78350f; margin: 8px 0; line-height: 1.6;">Inspector does not guarantee the absence of defects or future performance of systems.</li>
                    <li style="font-size: 13px; color: #78350f; margin: 8px 0; line-height: 1.6;">Environmental hazards such as mold, asbestos, radon, and lead paint require specialized testing.</li>
                  ` : ''}
                </ul>
              </div>
            </div>
          </div>` : ''}
          ` : ''}

          
          ${reportData?.photos && reportData.photos.length > 0 ? `
          <!-- PHOTO GALLERY PAGE -->
          <div class="page-break"></div>
          <div class="page">
            <h1 class="section-header">PHOTO GALLERY</h1>
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">INSPECTION PHOTOGRAPHS</h3>
              </div>
              <div class="subsection-content">
                <div class="photo-grid">
                  ${reportData.photos.slice(0, 12).map((photo: string, index: number) => `
                    <div class="photo-item">
                      ${photo && photo.length > 0 ? `
                        <img src="${photo}" alt="Inspection Photo ${index + 1}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="photo-placeholder" style="display: none;">
                          <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                            <div>Photo ${index + 1}</div>
                          </div>
                        </div>
                      ` : `
                        <div class="photo-placeholder">
                          <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                            <div>Photo ${index + 1}</div>
                          </div>
                        </div>
                      `}
                      <div class="photo-caption">Inspection Photo ${index + 1}</div>
                    </div>
                  `).join('')}
                </div>
                ${reportData.photos.length > 12 ? `
                <div style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 8px; border-left: 4px solid #0ea5e9;">
                  <div style="font-size: 14px; font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">📝 Note:</div>
                  <div style="font-size: 13px; color: #075985;">This report shows ${Math.min(12, reportData.photos.length)} of ${reportData.photos.length} total inspection photos. View the online version for all photos.</div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}

          ${reportData?.frontHomePhoto ? `
          <!-- PROPERTY PHOTO PAGE -->
          <div class="page-break"></div>
          <div class="page">
            <h1 class="section-header">PROPERTY PHOTOGRAPH</h1>
            <div class="subsection">
              <div class="subsection-header">
                <h3 class="subsection-title">FRONT OF PROPERTY</h3>
              </div>
              <div class="subsection-content">
                <div class="photo-item" style="max-width: 600px; margin: 0 auto;">
                  <img src="${reportData.frontHomePhoto}" alt="Front view of property" style="width: 100%; height: 400px; object-fit: cover;" />
                  <div class="photo-caption">Front view of ${propertyAddress}</div>
                </div>
                <div style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 8px; border-left: 4px solid #0ea5e9;">
                  <div style="font-size: 14px; font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">📝 Note:</div>
                  <div style="font-size: 13px; color: #075985;">Property image captured at time of inspection. For high-resolution copies, please contact the inspector.</div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <!-- Report Footer -->
          <div style="margin-top: 48px; padding: 24px; background: #f9fafb; border-top: 2px solid #e5e7eb; border-radius: 8px;">
            <p style="text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              This report was prepared by ${inspectorName} ${licenseNumber ? `(License: ${licenseNumber})` : ''} 
              for ${clientName} on ${new Date(inspectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
            <p style="text-align: center; font-size: 11px; color: #9ca3af;">
              © ${new Date().getFullYear()} ${companyData?.companyName || inspectorCompany || 'Professional Inspection Services'}. All rights reserved.
            </p>
            <p style="text-align: center; font-size: 10px; color: #9ca3af; margin-top: 12px;">
              Report ID: ${id} | Generated: ${new Date().toLocaleString('en-US')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Create HTML content for TREC report
   */
  private static createTRECReportHTML(reportData: TRECReportData): string {
    const { header, sections, cover } = reportData;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>TREC Property Inspection Report - ${header.propertyAddress}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --ink: #0f172a;
            --muted: #6b7280;
            --border: #e5e7eb;
            --chip: #f3f4f6;
            --bg: #ffffff;
            --accent: #3b82f6;
            --primary: #1e40af;
            --primary-light: #3b82f6;
            --secondary: #64748b;
            --success: #059669;
            --warning: #d97706;
            --danger: #dc2626;
            --light: #f8fafc;
            --dark: #0f172a;
            --text: #334155;
            --text-light: #64748b;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--ink);
            background: #fafafa;
            font-size: 14px;
          }
          
          .page {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            padding: 48px;
            min-height: 100vh;
          }
          
          /* Cover Page */
          .cover-page {
            padding: 0;
            display: grid;
            grid-template-rows: auto 1fr auto;
            min-height: 100vh;
          }
          
          .cover-header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 32px 48px;
            display: flex;
            justify-content: space-between;
            align-items: start;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 16px;
            letter-spacing: -0.5px;
          }
          
          .company-contact {
            font-size: 14px;
            margin: 6px 0;
            opacity: 0.95;
          }
          
          .company-logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }
          
          .cover-main {
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .report-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 24px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 32px;
            backdrop-filter: blur(10px);
          }
          
          .property-address {
            font-family: 'Libre Baskerville', Georgia, serif;
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.3;
            color: white;
            margin: 0 0 32px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          }
          
          .property-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 8px;
          }
          
          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .meta-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .meta-value {
            font-size: 15px;
            color: var(--ink);
            font-weight: 500;
          }
          
          .cover-footer {
            background: var(--chip);
            padding: 32px 48px;
            border-top: 1px solid var(--border);
          }
          
          .inspector-team {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          
          .inspector-card {
            display: flex;
            gap: 16px;
          }
          
          .inspector-photo {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            background: linear-gradient(135deg, #bfdbfe, #93c5fd);
            flex-shrink: 0;
          }
          
          .inspector-info {
            flex: 1;
          }
          
          .inspector-role {
            font-size: 11px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .inspector-name {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px;
            color: var(--ink);
          }
          
          .inspector-contact {
            font-size: 12px;
            color: var(--accent);
            margin: 2px 0;
          }
          
          .inspector-license {
            font-size: 11px;
            color: var(--muted);
            margin-top: 6px;
          }
          
          /* TREC Form Pages */
          .trec-form-page {
            page-break-before: always;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }
          
          .report-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .report-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          
          .form-number {
            font-size: 14px;
            margin: 5px 0;
            font-weight: bold;
          }
          
          .trec-info {
            font-size: 10px;
            margin: 3px 0;
          }
          
          .property-info {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 10px;
          }
          
          .property-row {
            display: flex;
            margin-bottom: 8px;
          }
          
          .property-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
          }
          
          .property-value {
            flex: 1;
            border-bottom: 1px solid #000;
            min-height: 16px;
          }
          
          .legend {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          
          .legend-title {
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .legend-items {
            display: flex;
            gap: 20px;
          }
          
          .legend-item {
            font-size: 11px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-header {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .inspection-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          
          .inspection-table th {
            background: #e0e0e0;
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-weight: bold;
          }
          
          .inspection-table td {
            border: 1px solid #000;
            padding: 6px;
            vertical-align: top;
          }
          
          .rating-cell {
            text-align: center;
            font-weight: bold;
            width: 30px;
          }
          
          .rating-I { color: #000; }
          .rating-NI { color: #666; }
          .rating-NP { color: #999; }
          .rating-D { color: #d00; font-weight: bold; }
          
          .comments-cell {
            width: 200px;
          }
          
          .inspector-info {
            margin-top: 30px;
            border-top: 2px solid #000;
            padding-top: 15px;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            margin-top: 20px;
          }
          
          @media print {
            body { margin: 0; }
            @page { 
              margin: 0.75in; 
              size: A4;
            }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            .page { padding: 0; }
            .cover-page { padding: 48px; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-header">
              <div class="company-info">
                <div class="company-name">${header.companyName}</div>
                <div class="company-contact">Phone: ${header.companyPhone}</div>
                <div class="company-contact">Email: ${header.companyEmail}</div>
                <div class="company-contact">License: ${header.licenseNo}</div>
              </div>
              <div class="company-logo">TREC</div>
            </div>
            
            <div class="cover-main">
              <div class="report-badge">TREC Property Inspection Report</div>
              <h1 class="property-address">${header.propertyAddress}</h1>
              <div class="property-meta">
                <div class="meta-item">
                  <div class="meta-label">Client</div>
                  <div class="meta-value">${header.clientName}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Date</div>
                  <div class="meta-value">${new Date(header.inspectionDate).toLocaleDateString()}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Inspector</div>
                  <div class="meta-value">${header.inspectorName}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Report ID</div>
                  <div class="meta-value">#${header.reportNo}</div>
                </div>
              </div>
            </div>
            
            <div class="cover-footer">
              <div class="inspector-team">
                <div class="inspector-card">
                  <div class="inspector-photo"></div>
                  <div class="inspector-info">
                    <div class="inspector-role">Licensed Inspector</div>
                    <div class="inspector-name">${header.inspectorName}</div>
                    <div class="inspector-contact">${header.companyEmail}</div>
                    <div class="inspector-license">License: ${header.licenseNo}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- TREC Form Pages -->
          <div class="page-break"></div>
          <div class="trec-form-page">
            <div class="report-header">
              <div class="report-title">Property Inspection Report</div>
              <div class="form-number">TREC Form 7-6</div>
              <div class="trec-info">Texas Real Estate Commission</div>
              <div class="trec-info">P.O. Box 12188, Austin, TX 78711-2188</div>
              <div class="trec-info">(512) 936-3000</div>
            </div>
            
            <div class="property-info">
              <div class="property-row">
                <div class="property-label">Property Address:</div>
                <div class="property-value">${header.propertyAddress}</div>
              </div>
              <div class="property-row">
                <div class="property-label">Client Name:</div>
                <div class="property-value">${header.clientName}</div>
              </div>
              <div class="property-row">
                <div class="property-label">Inspection Date:</div>
                <div class="property-value">${new Date(header.inspectionDate).toLocaleDateString()}</div>
              </div>
              <div class="property-row">
                <div class="property-label">Inspector Name:</div>
                <div class="property-value">${header.inspectorName}</div>
              </div>
              <div class="property-row">
                <div class="property-label">License Number:</div>
                <div class="property-value">${header.licenseNo}</div>
              </div>
            </div>
            
            <div class="legend">
              <div class="legend-title">Legend:</div>
              <div class="legend-items">
                <div class="legend-item">I = Inspected</div>
                <div class="legend-item">NI = Not Inspected</div>
                <div class="legend-item">NP = Not Present</div>
                <div class="legend-item">D = Deficient</div>
              </div>
            </div>
            
            ${Object.entries(sections).map(([sectionName, sectionData]: [string, any]) => `
              <div class="section">
                <div class="section-header">${sectionName}</div>
                <table class="inspection-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>I</th>
                      <th>NI</th>
                      <th>NP</th>
                      <th>D</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(sectionData || {}).map(([itemName, itemData]: [string, any]) => `
                      <tr>
                        <td>${itemName}</td>
                        <td class="rating-cell ${itemData?.rating === 'I' ? 'rating-I' : ''}">${itemData?.rating === 'I' ? '✓' : ''}</td>
                        <td class="rating-cell ${itemData?.rating === 'NI' ? 'rating-NI' : ''}">${itemData?.rating === 'NI' ? '✓' : ''}</td>
                        <td class="rating-cell ${itemData?.rating === 'NP' ? 'rating-NP' : ''}">${itemData?.rating === 'NP' ? '✓' : ''}</td>
                        <td class="rating-cell ${itemData?.rating === 'D' ? 'rating-D' : ''}">${itemData?.rating === 'D' ? '✓' : ''}</td>
                        <td class="comments-cell">${itemData?.comments || ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
            
            <div class="inspector-info">
              <div class="property-row">
                <div class="property-label">Inspector Signature:</div>
                <div class="property-value"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Date:</div>
                <div class="property-value"></div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Close browser instance
   */
  public static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}



