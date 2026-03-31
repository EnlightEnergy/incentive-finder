/**
 * generate-report.js
 *
 * Generates the Qualifying Programs Report PDF using Puppeteer.
 *
 * USAGE (as a module from the Express backend):
 *   import { generateReport } from '../report-builder/generate-report.js';
 *   const pdfBuffer = await generateReport(reportData);
 *   res.set('Content-Type', 'application/pdf');
 *   res.send(pdfBuffer);
 *
 * RAILWAY DEPLOYMENT NOTES:
 *   - Install: npm install puppeteer
 *   - Railway's Linux environment supports headless Chromium via Puppeteer.
 *   - Puppeteer will auto-download Chrome on npm install.
 *   - The --no-sandbox flag is required for Railway/Docker environments.
 */

import puppeteer from 'puppeteer';
import { generateReportHTML } from './template.js';
import { writeFileSync } from 'fs';

/**
 * Generate a PDF buffer from report data.
 * @param {Object} reportData - The facility + programs data object
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
export async function generateReport(reportData) {
  const html = generateReportHTML(reportData);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Save HTML preview to a file (useful for debugging template)
 */
export function saveHTMLPreview(reportData, outputPath) {
  const html = generateReportHTML(reportData);
  writeFileSync(outputPath, html, 'utf8');
  console.log(`HTML preview saved to: ${outputPath}`);
}
