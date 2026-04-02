import puppeteer from 'puppeteer-core';
import { generateReportHTML } from './template.js';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

function findChromiumPath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/root/.nix-profile/bin/chromium',
    '/nix/var/nix/profiles/default/bin/chromium',
    '/usr/bin/chromium',
    '/usr/local/bin/chromium',
  ].filter(Boolean);

  const found = candidates.find(p => existsSync(p));
  if (found) return found;

  // Last resort: ask the OS
  try {
    const which = execSync('which chromium 2>/dev/null', { env: { ...process.env, PATH: '/root/.nix-profile/bin:/usr/local/bin:/usr/bin:/bin:' + (process.env.PATH || '') } }).toString().trim();
    if (which && existsSync(which)) return which;
  } catch {}

  throw new Error('Chromium not found. Tried: ' + candidates.join(', '));
}

export async function generateReport(reportData) {
  const html = generateReportHTML(reportData);
  const executablePath = findChromiumPath();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const pdfBuffer = await const facilityName = (reportData && reportData.facility && reportData.facility.name) ? reportData.facility.name.toUpperCase() : 'FACILITY';
    const reportDate = (reportData && reportData.facility && reportData.facility.reportDate) ? reportData.facility.reportDate : '';
    const headerHTML = '<div style="width:100%;box-sizing:border-box;font-size:8pt;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;display:flex;justify-content:space-between;align-items:center;padding:5px 54px;border-bottom:2px solid #1C2B5E;color:#1C2B5E;font-weight:700;text-transform:uppercase;letter-spacing:1px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"><span>' + facilityName + ' &middot; Qualifying Programs Report</span><span style="font-weight:400;color:#888;font-size:8pt;">' + reportDate + '</span></div>';
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHTML,
      footerTemplate: '<div></div>',
      margin: { top: '0.45in', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
