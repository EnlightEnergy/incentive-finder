import puppeteer from 'puppeteer-core';
import { generateReportHTML } from './template.js';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

function findChromiumPath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/chromium',
    '/snap/bin/chromium',
  ].filter(Boolean);

  const found = candidates.find(p => existsSync(p));
  if (found) return found;

  // Last resort: ask the OS
  try {
    const which = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null').toString().trim();
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
    const pdfBuffer = await page.pdf({
      format: 'Letter', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
