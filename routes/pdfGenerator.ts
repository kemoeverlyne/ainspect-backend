import express from 'express';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// PDF Generation endpoint
router.post('/generate-pdf', async (req, res) => {
  let browser;
  try {
    const { inspectionId, token } = req.body;
    
    console.log('[PDF Generator] Starting PDF generation for inspection:', inspectionId);
    
    // Launch Playwright browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewportSize({
      width: 1200,
      height: 800
    });
    
    // Navigate to the report template page
    const reportUrl = `http://localhost:5173/report-template?inspectionId=${inspectionId}`;
    console.log('[PDF Generator] Navigating to:', reportUrl);
    
    await page.goto(reportUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Inject the authentication token into localStorage
    if (token) {
      await page.evaluate((authToken) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('token', authToken);
      }, token);
      
      // Reload the page to pick up the token
      await page.reload({ waitUntil: 'networkidle' });
    }
    
    // Wait for content to stabilize and check if page loaded properly
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the page loaded successfully
    const pageTitle = await page.title();
    console.log('[PDF Generator] Page title:', pageTitle);
    
    // Wait for the main content to be visible
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      console.log('[PDF Generator] Main content loaded successfully');
    } catch (error: any) {
      console.log('[PDF Generator] Warning: Could not find main content, proceeding anyway');
    }
    
    // Generate PDF using Playwright
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    console.log('[PDF Generator] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Close browser safely
    try {
      await browser.close();
    } catch (closeError: any) {
      console.log('[PDF Generator] Warning: Error closing browser:', closeError.message);
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inspection-report-${inspectionId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    
    // Try to close browser if it exists
    try {
      if (typeof browser !== 'undefined') {
        await browser.close();
      }
    } catch (closeError: any) {
      console.log('[PDF Generator] Warning: Error closing browser after error:', closeError.message);
    }
    
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: (error as Error).message
    });
  }
});

// Alternative PDF generation using Playwright (if available)
router.post('/generate-pdf-playwright', async (req, res) => {
  try {
    const { inspectionId, reportData, htmlContent } = req.body;
    
    console.log('[PDF Generator] Starting Playwright PDF generation for inspection:', inspectionId);
    
    // Check if Playwright is available
    let playwright;
    try {
      playwright = require('playwright');
    } catch (err) {
      console.log('[PDF Generator] Playwright not available, falling back to Puppeteer');
      return res.status(503).json({
        error: 'Playwright not available',
        fallback: 'Use /generate-pdf endpoint instead'
      });
    }
    
    // Launch browser
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    await browser.close();
    
    console.log('[PDF Generator] Playwright PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inspection-report-${inspectionId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error: any) {
    console.error('[PDF Generator] Error generating PDF with Playwright:', error);
    res.status(500).json({
      error: 'Failed to generate PDF with Playwright',
      message: error.message
    });
  }
});

// Preview endpoint to see HTML before PDF generation
router.post('/preview-html', async (req, res) => {
  try {
    const { reportData } = req.body;
    
    const htmlContent = generateReportHTML(reportData);
    
    res.json({
      html: htmlContent,
      success: true
    });
    
  } catch (error: any) {
    console.error('[PDF Generator] Error generating HTML preview:', error);
    res.status(500).json({
      error: 'Failed to generate HTML preview',
      message: error.message
    });
  }
});

// Helper function to generate report HTML
function generateReportHTML(data: any) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Inspection Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
        }
        body {
            font-family: 'Inter', system-ui, sans-serif;
            line-height: 1.6;
        }
        .page-break {
            page-break-before: always;
        }
        .no-break {
            page-break-inside: avoid;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
        }
    </style>
</head>
<body class="bg-white text-gray-900">
    <!-- Header -->
    <div class="gradient-bg text-white p-8 mb-8 rounded-lg no-break">
        <div class="flex justify-between items-start">
            <div>
                <h1 class="text-3xl font-bold mb-2">Property Inspection Report</h1>
                <p class="text-blue-100 text-lg">Professional Home Inspection Services</p>
            </div>
            <div class="text-right">
                <div class="bg-white/20 rounded-lg p-4">
                    <p class="text-sm">Report ID</p>
                    <p class="font-mono text-lg">${data.id.slice(0, 8)}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Property Information -->
    <div class="mb-8 no-break">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Property Information
        </h2>
        <div class="grid grid-cols-2 gap-6">
            <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">Property Details</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span class="font-medium">Address:</span>
                        <span class="ml-2">${data.address}</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <span class="font-medium">Type:</span>
                        <span class="ml-2">${data.property?.type || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-medium">Inspection Date:</span>
                        <span class="ml-2">${new Date(data.date).toLocaleDateString()}</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                        </svg>
                        <span class="font-medium">Weather:</span>
                        <span class="ml-2">${data.property?.weather || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">Client Information</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span class="font-medium">Client:</span>
                        <span class="ml-2">${data.client.name}</span>
                    </div>
                    ${data.client.email ? `
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-medium">Email:</span>
                        <span class="ml-2">${data.client.email}</span>
                    </div>
                    ` : ''}
                    ${data.client.phone ? `
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <span class="font-medium">Phone:</span>
                        <span class="ml-2">${data.client.phone}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>

    <!-- Inspector Information -->
    <div class="mb-8 no-break">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Inspector Information
        </h2>
        <div class="bg-gray-50 p-6 rounded-lg">
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <h3 class="font-semibold text-lg mb-3">Inspector Details</h3>
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span class="font-medium">Name:</span>
                            <span class="ml-2">${data.inspector.name}</span>
                        </div>
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span class="font-medium">Company:</span>
                            <span class="ml-2">${data.inspector.company}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="font-semibold text-lg mb-3">Realtor Information</h3>
                    <div class="space-y-2">
                        ${data.realtor?.name ? `
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span class="font-medium">Realtor:</span>
                            <span class="ml-2">${data.realtor.name}</span>
                        </div>
                        ` : ''}
                        ${data.realtor?.company ? `
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span class="font-medium">Company:</span>
                            <span class="ml-2">${data.realtor.company}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="mb-8 page-break">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
            Executive Summary
        </h2>
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-green-50 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-green-600">${data.summary.itemsPassed}</div>
                <div class="text-sm text-green-700">Items Passed</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-red-600">${data.summary.itemsFailed}</div>
                <div class="text-sm text-red-700">Items Failed</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-blue-600">${data.summary.complianceScore}%</div>
                <div class="text-sm text-blue-700">Compliance Score</div>
            </div>
        </div>
        
        <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="font-semibold text-lg mb-3">Overall Condition</h3>
            <p class="text-lg">${data.summary.overallCondition}</p>
        </div>
    </div>

    <!-- Systems Overview -->
    <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            Systems Overview
        </h2>
        <div class="grid grid-cols-2 gap-4">
            ${Object.values(data.systems).map((system: any) => `
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold">${system.name}</h3>
                    <span class="px-2 py-1 rounded-full text-xs ${
                        system.status === 'passed' ? 'bg-green-100 text-green-800' :
                        system.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">
                        ${system.status}
                    </span>
                </div>
                <div class="text-sm text-gray-600">
                    <div>Items: ${system.totalItems || 0}</div>
                    <div>Passed: ${system.passedItems || 0}</div>
                    <div>Failed: ${system.failedItems || 0}</div>
                </div>
            </div>
            `).join('')}
        </div>
    </div>

    <!-- Key Findings -->
    <div class="mb-8 page-break">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            Key Findings
        </h2>
        <div class="space-y-4">
            ${data.findings.slice(0, 10).map((finding: any) => `
            <div class="border-l-4 ${
                finding.severity === 'critical' ? 'border-red-500 bg-red-50' :
                finding.severity === 'high' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
            } p-4 rounded-r-lg">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold">${finding.description}</h3>
                    <span class="px-2 py-1 rounded-full text-xs ${
                        finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        finding.severity === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                    }">
                        ${finding.severity}
                    </span>
                </div>
                <p class="text-sm text-gray-600">${finding.location}</p>
                ${finding.recommendation ? `
                <p class="text-sm mt-2"><strong>Recommendation:</strong> ${finding.recommendation}</p>
                ` : ''}
            </div>
            `).join('')}
        </div>
    </div>

    <!-- Photo Gallery -->
    ${data.photos.length > 0 ? `
    <div class="mb-8 page-break">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Photo Gallery
        </h2>
        <div class="grid grid-cols-2 gap-4">
            ${data.photos.slice(0, 8).map((photo: any, index: number) => `
            <div class="bg-gray-100 rounded-lg overflow-hidden">
                <img src="${photo}" alt="Inspection Photo ${index + 1}" class="w-full h-48 object-cover" />
                <div class="p-2 text-center text-sm text-gray-600">Photo ${index + 1}</div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="mt-12 pt-8 border-t border-gray-200">
        <div class="text-center text-gray-600">
            <p class="text-sm">This report was generated by AInspect Professional Inspection Services</p>
            <p class="text-xs mt-2">Report generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>
  `;
}

export default router;
