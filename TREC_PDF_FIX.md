# TREC PDF Generation Fix

## Issue Description

The TREC PDF generation was failing with a 500 error due to Playwright browsers not being installed on the production server (Render). The error message was:

```
browserType.launch: Executable doesn't exist at /opt/render/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
```

## Root Cause

1. **Missing Playwright Browsers**: The production server didn't have Playwright browsers installed
2. **Silent Installation Failure**: The `postinstall` script was failing silently with `|| echo 'Playwright installation failed, continuing...'`
3. **No Fallback Mechanism**: The system had no fallback when Playwright was unavailable

## Solution Implemented

### 1. Fixed Package.json Installation Script

**Before:**
```json
"postinstall": "npx playwright install chromium --with-deps || echo 'Playwright installation failed, continuing...'"
```

**After:**
```json
"postinstall": "npx playwright install chromium --with-deps",
"install-browsers": "npx playwright install chromium --with-deps"
```

### 2. Updated Dockerfile

Added explicit Playwright browser installation steps:

```dockerfile
# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# ... build steps ...

# Reinstall Playwright browsers after production install
RUN npx playwright install chromium --with-deps
```

### 3. Added Fallback PDF Generation

Created a robust fallback system using `pdf-lib` when Playwright is unavailable:

- **Playwright Availability Check**: Tests if Playwright can launch a browser
- **Fallback PDF Generation**: Uses `pdf-lib` to create a basic PDF with inspection data
- **Error Handling**: Gracefully handles Playwright failures and falls back to alternative method

### 4. Enhanced Error Handling

The `generateTRECReport` method now:
- Checks Playwright availability before attempting to use it
- Falls back to `pdf-lib` if Playwright fails
- Provides detailed logging for debugging
- Maintains the same API interface

## Files Modified

1. **package.json** - Fixed installation script
2. **Dockerfile** - Added Playwright browser installation
3. **server/services/trecReportGenerator.ts** - Added fallback mechanism
4. **render.yaml** - Already had correct build command
5. **test-trec-pdf.js** - Added test script for verification

## Testing

Run the test script to verify the fix:

```bash
npm run test:trec-pdf
```

This will generate a test PDF and save it as `test-trec-report.pdf`.

## Deployment Notes

### For Render.com:
- The `render.yaml` already includes Playwright installation in the build command
- The updated `package.json` will ensure browsers are installed during deployment
- The fallback mechanism ensures PDF generation works even if Playwright fails

### For Docker:
- The updated `Dockerfile` ensures Playwright browsers are installed
- Multiple installation steps ensure browsers persist through the build process

### For Local Development:
- Run `npm run install-browsers` to manually install browsers
- The fallback mechanism will work if Playwright is not available

## Benefits

1. **Reliability**: PDF generation now works even when Playwright is unavailable
2. **Performance**: Falls back to faster `pdf-lib` when possible
3. **Debugging**: Better error messages and logging
4. **Compatibility**: Works across different deployment environments
5. **Maintainability**: Clear separation between Playwright and fallback methods

## Future Improvements

1. **Template System**: Could add HTML template support for better fallback PDFs
2. **Caching**: Could cache Playwright browser availability check
3. **Monitoring**: Could add metrics for fallback usage
4. **Configuration**: Could make PDF generation method configurable via environment variables
