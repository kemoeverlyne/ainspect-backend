import { storage } from './storage';
import type { Inspection, InspectionItem, BusinessInfo } from '@shared/schema';

export interface ReportData {
  inspection: Inspection;
  items: InspectionItem[];
  businessInfo: BusinessInfo | undefined;
  summary: {
    totalItems: number;
    completedItems: number;
    issuesFound: number;
    safetyHazards: number;
    majorConcerns: number;
  };
}

export async function generateReportData(inspectionId: number): Promise<ReportData> {
  const inspection = await storage.getInspection(inspectionId);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const items = await storage.getInspectionItemsByInspectionId(inspectionId);
  const businessInfo = await storage.getBusinessInfo();

  const completedItems = items.filter(item => item.isChecked);
  const issuesFound = items.filter(item => 
    item.condition && item.condition !== 'satisfactory' && item.isChecked
  );
  const safetyHazards = items.filter(item => 
    item.condition === 'safety_hazard' && item.isChecked
  );
  const majorConcerns = items.filter(item => 
    item.condition === 'major_concern' && item.isChecked
  );

  return {
    inspection,
    items,
    businessInfo,
    summary: {
      totalItems: items.length,
      completedItems: completedItems.length,
      issuesFound: issuesFound.length,
      safetyHazards: safetyHazards.length,
      majorConcerns: majorConcerns.length
    }
  };
}

export function generateSummaryReport(data: ReportData): string {
  const { inspection, items, businessInfo, summary } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Home Inspection Report - ${inspection.propertyAddress}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .contact-info { font-size: 14px; color: #666; margin-top: 10px; }
        .title { font-size: 20px; font-weight: bold; margin: 20px 0; }
        .property-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-section { display: flex; justify-content: space-between; margin: 20px 0; }
        .summary-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; }
        .summary-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .safety-hazard { color: #dc2626 !important; }
        .major-concern { color: #ea580c !important; }
        .issue-section { margin: 30px 0; }
        .system-group { margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; }
        .system-header { background: #f3f4f6; padding: 15px; font-weight: bold; font-size: 16px; }
        .issue-item { padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .issue-item:last-child { border-bottom: none; }
        .condition-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .satisfactory { background: #dcfce7; color: #166534; }
        .marginal { background: #fef3c7; color: #92400e; }
        .poor { background: #fee2e2; color: #991b1b; }
        .major_concern { background: #fed7aa; color: #c2410c; }
        .safety_hazard { background: #fecaca; color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${businessInfo?.name || 'Professional Home Inspection'}</div>
        <div class="contact-info">${businessInfo?.contact || ''}</div>
        <div class="title">HOME INSPECTION REPORT</div>
      </div>

      <div class="property-info">
        <h2>Property Information</h2>
        <p><strong>Address:</strong> ${inspection.propertyAddress}, ${inspection.propertyCity}, ${inspection.propertyZipCode}</p>
        <p><strong>Client:</strong> ${inspection.clientFirstName} ${inspection.clientLastName}</p>
        <p><strong>Inspection Date:</strong> ${inspection.inspectionDate}</p>
        <p><strong>Property Type:</strong> ${inspection.propertyType}</p>
        ${inspection.propertyYearBuilt ? `<p><strong>Year Built:</strong> ${inspection.propertyYearBuilt}</p>` : ''}
        ${inspection.propertySqft ? `<p><strong>Square Footage:</strong> ${inspection.propertySqft.toLocaleString()} sq ft</p>` : ''}
      </div>

      <div class="summary-section">
        <div class="summary-box">
          <div class="summary-number">${summary.totalItems}</div>
          <div>Total Items</div>
        </div>
        <div class="summary-box">
          <div class="summary-number">${summary.completedItems}</div>
          <div>Completed</div>
        </div>
        <div class="summary-box">
          <div class="summary-number">${summary.issuesFound}</div>
          <div>Issues Found</div>
        </div>
        <div class="summary-box">
          <div class="summary-number major-concern">${summary.majorConcerns}</div>
          <div>Major Concerns</div>
        </div>
        <div class="summary-box">
          <div class="summary-number safety-hazard">${summary.safetyHazards}</div>
          <div>Safety Hazards</div>
        </div>
      </div>

      <div class="issue-section">
        <h2>Inspection Findings</h2>
        ${generateSystemSections(items)}
      </div>

      <div class="footer">
        <p>This report was generated on ${new Date().toLocaleDateString()} and is based on a visual inspection of the property. This inspection is limited to readily accessible areas and components.</p>
        <p>For questions about this report, please contact ${businessInfo?.contact || 'the inspection company'}.</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

function generateSystemSections(items: InspectionItem[]): string {
  const systemGroups: { [key: string]: InspectionItem[] } = {};
  
  items.forEach(item => {
    if (!systemGroups[item.systemType]) {
      systemGroups[item.systemType] = [];
    }
    systemGroups[item.systemType].push(item);
  });

  return Object.entries(systemGroups)
    .map(([systemType, systemItems]) => {
      const issueItems = systemItems.filter(item => item.condition && item.condition !== 'satisfactory' && item.isChecked);
      
      if (issueItems.length === 0) return '';
      
      return `
        <div class="system-group">
          <div class="system-header">${systemType.toUpperCase().replace(/-/g, ' ')}</div>
          ${issueItems.map(item => `
            <div class="issue-item">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>${item.category.replace(/-/g, ' ').toUpperCase()}</strong>
                <span class="condition-badge ${item.condition || 'unknown'}">${(item.condition || 'unknown').replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <p><strong>Description:</strong> ${item.description}</p>
              ${item.recommendations ? `<p><strong>Recommendations:</strong> ${item.recommendations}</p>` : ''}
              ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    })
    .filter(section => section !== '')
    .join('');
}

export function generateIssuesReport(data: ReportData): string {
  const { inspection, items, businessInfo } = data;
  const issueItems = items.filter(item => 
    item.condition && item.condition !== 'satisfactory' && item.isChecked
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Issues Report - ${inspection.propertyAddress}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .contact-info { font-size: 14px; color: #666; margin-top: 10px; }
        .title { font-size: 20px; font-weight: bold; margin: 20px 0; }
        .property-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .issue-item { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .condition-badge { padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: bold; display: inline-block; }
        .safety_hazard { background: #fecaca; color: #dc2626; }
        .major_concern { background: #fed7aa; color: #c2410c; }
        .poor { background: #fee2e2; color: #991b1b; }
        .marginal { background: #fef3c7; color: #92400e; }
        .priority-high { border-left: 4px solid #dc2626; }
        .priority-medium { border-left: 4px solid #ea580c; }
        .priority-low { border-left: 4px solid #eab308; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${businessInfo?.name || 'Professional Home Inspection'}</div>
        <div class="contact-info">${businessInfo?.contact || ''}</div>
        <div class="title">ISSUES REPORT</div>
      </div>

      <div class="property-info">
        <h2>Property Information</h2>
        <p><strong>Address:</strong> ${inspection.propertyAddress}, ${inspection.propertyCity}, ${inspection.propertyZipCode}</p>
        <p><strong>Client:</strong> ${inspection.clientFirstName} ${inspection.clientLastName}</p>
        <p><strong>Inspection Date:</strong> ${inspection.inspectionDate}</p>
        <p><strong>Total Issues Found:</strong> ${issueItems.length}</p>
      </div>

      <div class="issues-section">
        <h2>Identified Issues</h2>
        ${issueItems.length === 0 ? 
          '<p>No issues were identified during this inspection.</p>' :
          issueItems
            .sort((a, b) => {
              const priority = { 'safety_hazard': 3, 'major_concern': 2, 'poor': 1, 'marginal': 0 };
              return (priority[b.condition as keyof typeof priority] || 0) - (priority[a.condition as keyof typeof priority] || 0);
            })
            .map((item, index) => {
              const priorityClass = item.condition === 'safety_hazard' ? 'priority-high' :
                                 item.condition === 'major_concern' ? 'priority-medium' : 'priority-low';
              
              return `
                <div class="issue-item ${priorityClass}">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Issue #${index + 1}: ${item.category.replace(/-/g, ' ').toUpperCase()}</h3>
                    <span class="condition-badge ${item.condition}">${item.condition ? item.condition.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}</span>
                  </div>
                  <p><strong>System:</strong> ${item.systemType.replace(/-/g, ' ').toUpperCase()}</p>
                  <p><strong>Description:</strong> ${item.description}</p>
                  ${item.recommendations ? `<p><strong>Recommendations:</strong> ${item.recommendations}</p>` : ''}
                  ${item.notes ? `<p><strong>Inspector Notes:</strong> ${item.notes}</p>` : ''}
                </div>
              `;
            }).join('')
        }
      </div>

      <div class="footer">
        <p>This issues report was generated on ${new Date().toLocaleDateString()} based on items marked as requiring attention during the inspection.</p>
        <p>Priority levels: Safety Hazard (Immediate attention required), Major Concern (Professional evaluation recommended), Poor (Needs attention), Marginal (Monitor over time).</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}