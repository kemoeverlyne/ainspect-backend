# TREC Inspection Creation - Detailed Logging Guide

## Overview
This document explains the comprehensive logging system added to track TREC inspection creation, showing exactly where and how data is saved.

## What Was Added

### 1. Enhanced Route Logging (`server/routes.ts`)
**Location:** POST `/api/trec/inspections` endpoint (lines 1556-1701)

The endpoint now logs:

#### A. Incoming Request Data
- Timestamp of request
- Authenticated user details (ID, email, name)
- Raw request body structure
- All incoming field values

#### B. Required TREC Fields
- Client Name
- Property Address  
- Inspection Date
- Inspector Name
- TREC License Number
- Sponsor information (if provided)

#### C. Tracking Data
- Status
- Completed sections array
- Total photos count

#### D. JSONB Stored Data
- **Company Data**: name, phone, email, website, address
- **Warranty Data**: opt-in status, provider, terms, notes
- **Inspection Data**: cover page, sections, phase tracking
  - Shows section count and names
  - Indicates data structure without logging huge payloads

#### E. Database Operation Result
- Generated UUID
- Table name: `trec_inspections`
- Timestamp fields (created_at, updated_at)
- Verification of saved vs. input data

#### F. Audit Trail Creation
- Confirms entry in `trec_audit_trail` table
- Tracks who created the inspection and when

#### G. Dashboard Cache Update
- Confirms in-memory store update for quick dashboard display

### 2. Enhanced Storage Layer Logging (`server/storage.ts`)
**Location:** `createTRECInspection()` method (lines 692-806)

The storage layer now logs:

#### A. Database Operation Details
- Target table: `trec_inspections`
- SQL operation: INSERT with RETURNING *

#### B. Field-by-Field Data Breakdown
Shows exact column names and data types:

**VARCHAR fields:**
- `client_name` (clientName)
- `inspector_name` (inspectorName)
- `trec_license_number` (trecLicenseNumber)
- `sponsor_name` (sponsorName) - nullable
- `sponsor_trec_license_number` (sponsorTrecLicenseNumber) - nullable
- `inspector_id` (inspectorId) - foreign key to users table
- `status` - enum: draft/in_progress/completed/submitted

**TEXT fields:**
- `property_address` (propertyAddress)

**TIMESTAMP fields:**
- `inspection_date` (inspectionDate)
- `created_at` (auto-generated)
- `updated_at` (auto-generated)
- `completed_at` (nullable)

**INTEGER fields:**
- `total_photos` (totalPhotos)

**JSONB fields:**
- `completed_sections` - stores string array
- `company_data` - stores company object
- `warranty_data` - stores warranty object  
- `inspection_data` - stores full inspection details
  - Section count
  - Section names
  - Data size in bytes

#### C. Insert Verification
- Confirms successful row insertion
- Shows auto-generated UUID
- Verifies data integrity
- Confirms JSONB data preservation

#### D. Error Handling
- Error type and constructor name
- Error message
- Full error object
- Stack trace

## Database Schema

### Table: `trec_inspections`

```sql
CREATE TABLE trec_inspections (
  -- Primary Key
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Required TREC Header Information
  client_name VARCHAR NOT NULL,
  inspection_date TIMESTAMP NOT NULL,
  property_address TEXT NOT NULL,
  inspector_name VARCHAR NOT NULL,
  trec_license_number VARCHAR NOT NULL,
  
  -- Optional TREC Information
  sponsor_name VARCHAR,
  sponsor_trec_license_number VARCHAR,
  
  -- System Tracking
  inspector_id VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')),
  
  -- Completion Tracking
  completed_sections JSONB,  -- Array of section names
  total_photos INTEGER DEFAULT 0,
  
  -- Additional Data (JSONB for flexibility)
  company_data JSONB,
  warranty_data JSONB,
  inspection_data JSONB,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);
```

### Related Tables

#### `trec_audit_trail`
Tracks all changes to TREC inspections:
- When created/updated/deleted
- Who made the change (user_id)
- What changed (action, details)
- Where from (IP address, user agent)

#### `trec_section_items`
Stores individual inspection items for each section

#### `trec_photos`
Stores photo metadata and references

## How Data Flows

### Frontend → Backend → Database

1. **Frontend** (`TRECInspectionPage.tsx`):
   - Collects inspection data from user
   - Structures data with required TREC fields
   - Sends POST to `/api/trec/inspections`

2. **API Route** (`routes.ts`):
   - Authenticates user
   - Logs incoming request (with all details)
   - Adds `inspectorId` from authenticated user
   - Calls storage layer

3. **Storage Layer** (`storage.ts`):
   - Logs field-by-field breakdown
   - Executes INSERT query
   - Returns created inspection with auto-generated fields
   - Logs verification results

4. **Response Flow**:
   - Create audit trail entry
   - Update in-memory dashboard cache
   - Return inspection to frontend
   - Log completion

## How to Test

### Option 1: Use the Test Script

```bash
cd ainspect-backend
node test-trec-create-with-logs.js
```

The test script will:
1. Login with test credentials
2. Create a TREC inspection with sample data
3. Verify the inspection was saved
4. Display results in color-coded terminal output

### Option 2: Manual Testing

1. Start the backend server:
```bash
cd ainspect-backend
npm start
```

2. Open the frontend and navigate to TREC inspection page

3. Fill out the inspection form with:
   - Client information
   - Property details
   - Inspector information
   - Company data
   - Warranty options
   - Inspection sections

4. Click "Generate Report" or "Save"

5. **Check the backend console** for detailed logs

### Option 3: API Testing with curl

```bash
# Login first
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Use the token from response
export TOKEN="your_jwt_token_here"

# Create TREC inspection
curl -X POST http://localhost:3000/api/trec/inspections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clientName": "John Doe",
    "inspectionDate": "2025-10-16T12:00:00Z",
    "propertyAddress": "123 Main St, Austin, TX 78701",
    "inspectorName": "Jane Inspector",
    "trecLicenseNumber": "TREC-12345",
    "status": "completed",
    "completedSections": ["structural", "electrical"],
    "totalPhotos": 10,
    "companyData": {
      "companyName": "ABC Inspections",
      "companyPhone": "(555) 123-4567"
    },
    "warrantyData": {
      "warrantyOptIn": true
    },
    "inspectionData": {
      "sections": {
        "structural": {
          "foundation": {
            "rating": "inspected",
            "comment": "Good condition"
          }
        }
      }
    }
  }'
```

## What to Look For in Logs

### Successful Creation
When a TREC inspection is created successfully, you'll see:

```
========================================
[TREC CREATE] NEW TREC INSPECTION CREATION REQUEST
========================================
[TREC CREATE] Timestamp: 2025-10-16T...
[TREC CREATE] Current user ID: abc-123-def
[TREC CREATE] Current user email: user@example.com

[TREC CREATE] === INCOMING REQUEST DATA ===
[TREC CREATE] Raw request body keys: [...]
[TREC CREATE] Full request body: {...}

[TREC CREATE] === REQUIRED TREC FIELDS ===
[TREC CREATE] Client Name: John Doe
[TREC CREATE] Property Address: 123 Main St...
...

[STORAGE] ========================================
[STORAGE] DATABASE INSERT OPERATION - TREC INSPECTION
[STORAGE] ========================================
[STORAGE] Target table: trec_inspections
[STORAGE] Operation: INSERT with RETURNING *

[STORAGE] === FIELD-BY-FIELD BREAKDOWN ===
[STORAGE] VARCHAR fields:
[STORAGE]   - clientName (client_name): John Doe
...

[STORAGE] === EXECUTING DATABASE INSERT ===
[STORAGE] Executing: INSERT INTO trec_inspections...

[STORAGE] === DATABASE INSERT SUCCESSFUL ===
[STORAGE] ✓ Row inserted successfully
[STORAGE] Generated UUID: xyz-789-abc
...

[TREC CREATE] === DATABASE INSERTION RESULT ===
[TREC CREATE] ✓ Inspection created successfully
[TREC CREATE] Generated ID: xyz-789-abc
[TREC CREATE] Saved to table: trec_inspections
...

[TREC CREATE] === CREATING AUDIT TRAIL ===
[TREC CREATE] ✓ Audit entry created in trec_audit_trail table

[TREC CREATE] === DASHBOARD CACHE UPDATE ===
[TREC CREATE] ✓ Added inspection to in-memory dashboard store

========================================
[TREC CREATE] TREC INSPECTION CREATION COMPLETED
========================================
```

### Error Scenarios
If something goes wrong, you'll see:

```
========================================
[TREC CREATE] ERROR OCCURRED
========================================
[TREC CREATE] ✗ Failed to create TREC inspection
[TREC CREATE] Error type: PostgresError
[TREC CREATE] Error message: ...
[TREC CREATE] Stack trace: ...
========================================
```

Or at the storage level:

```
[STORAGE] === DATABASE INSERT FAILED ===
[STORAGE] ✗ Error creating TREC inspection
[STORAGE] Error type: ...
[STORAGE] Error message: ...
[STORAGE] Full error: ...
========================================
```

## Verifying Data in Database

### Direct SQL Query
```sql
-- View latest TREC inspection
SELECT 
  id,
  client_name,
  property_address,
  inspector_name,
  status,
  created_at,
  company_data,
  inspection_data
FROM trec_inspections
ORDER BY created_at DESC
LIMIT 1;

-- View audit trail
SELECT *
FROM trec_audit_trail
WHERE inspection_id = 'your-inspection-id'
ORDER BY timestamp DESC;
```

### Using the API
```bash
# Get specific inspection
curl -X GET http://localhost:3000/api/trec/inspections/{id} \
  -H "Authorization: Bearer $TOKEN"

# Get all inspections for user
curl -X GET http://localhost:3000/api/trec/inspections \
  -H "Authorization: Bearer $TOKEN"
```

## Key Points

1. **Data Storage Location**: PostgreSQL database, table `trec_inspections`

2. **Data Format**: 
   - Simple fields: VARCHAR, TEXT, TIMESTAMP, INTEGER
   - Complex data: JSONB (allows flexible nested objects)

3. **Audit Trail**: Every create/update/delete is logged in `trec_audit_trail`

4. **JSONB Advantages**:
   - Flexible schema for inspection sections
   - Efficient storage and querying
   - No need to alter tables when adding fields
   - Can query nested data with PostgreSQL JSON operators

5. **Primary Key**: Auto-generated UUID for security and scalability

6. **Foreign Keys**: `inspector_id` links to `users` table

## Troubleshooting

### Issue: Logs not appearing
**Solution**: Check console output where backend server is running, not where test is running

### Issue: Data not saving
**Solution**: Check for error logs showing constraint violations or missing required fields

### Issue: JSONB data null
**Solution**: Verify frontend is sending proper JSON objects, check logs for data structure

### Issue: Authentication errors
**Solution**: Ensure valid JWT token is included in Authorization header

## Next Steps

After verifying TREC creation works:

1. Test TREC inspection updates (PUT endpoint)
2. Test section items creation
3. Test photo uploads
4. Test PDF generation from saved TREC data
5. Verify audit trail is working
6. Test retrieval and display on dashboard

## Files Modified

- `ainspect-backend/server/routes.ts` - Enhanced POST `/api/trec/inspections` endpoint
- `ainspect-backend/server/storage.ts` - Enhanced `createTRECInspection()` method
- `ainspect-backend/test-trec-create-with-logs.js` - New test script (created)

## Summary

The logging system now provides complete visibility into:
- ✅ What data arrives from frontend
- ✅ How data is structured and validated
- ✅ Exactly which database table and columns are used
- ✅ What data types are stored (VARCHAR, JSONB, etc.)
- ✅ Success/failure of each operation
- ✅ Audit trail creation
- ✅ Verification that saved data matches input

This makes debugging and understanding the data flow much easier!


