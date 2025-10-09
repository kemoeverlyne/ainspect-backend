# TREC Report Generator

This service generates professional TREC (Texas Real Estate Commission) Property Inspection Reports (REI 7-6) in PDF format.

## Features

- **Custom Cover Page**: Professional cover page with company branding
- **Table of Contents**: Organized navigation for all inspection sections
- **TREC Form Integration**: Merges with official TREC REI 7-6 form template
- **Dynamic Content**: Populates inspection data from database
- **PDF Download**: Generates downloadable PDF reports

## API Endpoints

### Generate TREC Report PDF
```
GET /api/trec/inspections/:id/report.pdf
```
Generates and downloads a complete TREC report PDF for the specified inspection.

### Get TREC Report Data
```
GET /api/trec/inspections/:id/report-data
```
Returns the inspection data used for report generation (for preview purposes).

### Test Report Generation
```
GET /api/trec/test-report
```
Generates a test TREC report with sample data (for development/testing).

## Usage in Frontend

The TREC inspection page automatically uses this service when generating reports:

```typescript
// Generate PDF using the new TREC report generator
const pdfResponse = await fetch(`/api/trec/inspections/${trecResult.id}/report.pdf`);

if (!pdfResponse.ok) {
  throw new Error('Failed to generate PDF');
}

// Download the PDF
const pdfBlob = await pdfResponse.blob();
const pdfUrl = URL.createObjectURL(pdfBlob);
const link = document.createElement('a');
link.href = pdfUrl;
link.download = `trec-inspection-${clientName}-${date}.pdf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(pdfUrl);
```

## TREC Form Template

The service requires the official TREC REI 7-6 form template:

**File Location**: `ainspect-backend/assets/trec-form-pages-1-2.pdf`

**How to Obtain**:
1. Visit https://www.trec.texas.gov/
2. Download the official REI 7-6 Property Inspection Report form
3. Extract pages 1-2 and save as `trec-form-pages-1-2.pdf`

**Note**: If the template is not available, the service will generate a placeholder form automatically.

## Report Structure

The generated report includes:

1. **Cover Page**
   - Company branding and contact information
   - Property address and inspection details
   - Inspector information and TREC license number
   - Report metadata

2. **Table of Contents**
   - All inspection sections (I-VI)
   - Professional navigation layout

3. **TREC Form Pages**
   - Official REI 7-6 form template
   - Populated with inspection data
   - Professional formatting

## Data Structure

The service expects inspection data in this format:

```typescript
interface TRECReportData {
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
```

## Dependencies

- **playwright**: For HTML to PDF conversion
- **pdf-lib**: For PDF manipulation and merging
- **express**: For API endpoints

## Error Handling

The service includes comprehensive error handling:
- Missing inspection data
- PDF generation failures
- File system errors
- Network issues

All errors are logged and returned with appropriate HTTP status codes.
