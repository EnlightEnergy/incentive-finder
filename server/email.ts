/**
 * email.ts
 *
 * Mailgun-based email delivery for report sending.
 * Activate by setting MAILGUN_API_KEY and MAILGUN_DOMAIN in Railway variables.
 *
 * BCC: hello@enlightingenergy.com is always BCC'd on every report email.
 */

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? 'mg.enlightingenergy.com';
const ENLIGHTING_BCC = 'hello@enlightingenergy.com';

// Display name is the company — not the individual rep
const FROM_ADDRESS = 'Enlighting Energy <hello@enlightingenergy.com>';

interface ProgramEntry {
  name: string;
  category: string;
  administrator: string;
  incentiveStructure?: string;
  deadline?: string;
  nextStep?: string;
}

interface ProgramGroup {
  measure: string;
  entries: ProgramEntry[];
}

interface SendReportEmailParams {
  to: string;
  bcc?: string;
  recipientName?: string | null;
  matchResult: {
    facility?: Record<string, string>;
    programs?: ProgramGroup[];
    programCount: number;
    summary?: string;
  };
  pdfBuffer?: Buffer; // Attach the PDF when available
}

/**
 * Build a plain-text program listing for the email body.
 */
function buildProgramList(programs: ProgramGroup[]): string {
  if (!programs || programs.length === 0) return '';

  return programs
    .map((group) => {
      const header = `── ${group.measure} ──────────────────────`;
      const entries = group.entries
        .map((p) => {
          const lines = [`  • ${p.name} [${p.category}]`];
          if (p.administrator) lines.push(`    Administered by: ${p.administrator}`);
          if (p.incentiveStructure) lines.push(`    Incentive: ${p.incentiveStructure}`);
          if (p.deadline) lines.push(`    Deadline: ${p.deadline}`);
          if (p.nextStep) lines.push(`    Next step: ${p.nextStep}`);
          return lines.join('\n');
        })
        .join('\n\n');
      return `${header}\n\n${entries}`;
    })
    .join('\n\n');
}

/**
 * Build an HTML version of the program listing.
 */
function buildProgramListHTML(programs: ProgramGroup[]): string {
  if (!programs || programs.length === 0) return '';

  const categoryColor = (cat: string) => {
    if (cat.includes('Utility')) return '#1C2B5E';
    if (cat.includes('Federal')) return '#c05c00';
    if (cat.includes('State')) return '#2d6a4f';
    if (cat.includes('Financing')) return '#4B3082';
    return '#555';
  };

  const rows = programs
    .map((group) =>
      `<tr>
        <td colspan="4" style="padding:12px 16px 6px;font-weight:700;font-size:13px;color:#1C2B5E;background:#f0f4ff;border-top:2px solid #C84EC4;">
          ${group.measure}
        </td>
      </tr>` +
      group.entries
        .map(
          (p) =>
            `<tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 16px;font-weight:600;color:#222;">${p.name}</td>
              <td style="padding:10px 8px;white-space:nowrap;">
                <span style="background:#eef;color:${categoryColor(p.category)};padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;">${p.category}</span>
              </td>
              <td style="padding:10px 8px;color:#555;font-size:12px;">${p.administrator ?? ''}</td>
              <td style="padding:10px 8px;color:#555;font-size:12px;">${p.deadline ?? 'Ongoing'}</td>
            </tr>`
        )
        .join('')
    )
    .join('');

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #dde;border-radius:6px;overflow:hidden;margin:20px 0;">
      <thead>
        <tr style="background:#1C2B5E;color:#fff;">
          <th style="padding:10px 16px;text-align:left;font-size:12px;">Program</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;">Type</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;">Administrator</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;">Deadline</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export async function sendReportEmail({
  to,
  bcc = ENLIGHTING_BCC,
  recipientName,
  matchResult,
  pdfBuffer,
}: SendReportEmailParams): Promise<void> {
  if (!MAILGUN_API_KEY) {
    console.warn('[email] MAILGUN_API_KEY not set — skipping email send');
    return;
  }

  const facilityName = matchResult.facility?.name ?? matchResult.facility?.facilityName ?? 'your facility';
  const count = matchResult.programCount;
  const measures = matchResult.programs?.map((g) => g.measure).join(' and ') ?? 'your projects';
  const topProgram = matchResult.programs?.[0]?.entries?.[0] ?? null;

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const subject = `Your Qualifying Programs Report — ${count} program${count !== 1 ? 's' : ''} found`;

  const programListText = buildProgramList(matchResult.programs ?? []);
  const programListHTML = buildProgramListHTML(matchResult.programs ?? []);

  // ── Plain text version ────────────────────────────────────────────────────
  const text = `${greeting}

Your Qualifying Programs Report for ${facilityName} is ready — I found ${count} program${count !== 1 ? 's' : ''} that apply to your ${measures}.${
    topProgram
      ? `\n\nThe one to act on first is ${topProgram.name}${(topProgram as any).preApprovalRequired ? ' — it requires pre-approval before your project starts, so timing matters.' : '.'}`
      : ''
  }

─────────────────────────────────
YOUR QUALIFYING PROGRAMS
─────────────────────────────────

${programListText}

─────────────────────────────────

${pdfBuffer ? 'The full formatted report is attached as a PDF.' : ''}

Happy to walk through any of these programs with you or help you move one forward — just reply here.

Best,
Derek Doyle
Enlighting Energy
805-724-5299
enlightingenergy.com`;

  // ── HTML version ──────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Helvetica Neue,Arial,sans-serif;background:#f8f8f8;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1C2B5E;padding:28px 32px;">
      <div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:4px;">Enlighting Energy</div>
      <div style="font-size:12px;color:#aac;">California Commercial Incentive Specialists</div>
    </div>

    <!-- Stat bar -->
    <div style="background:#C84EC4;padding:20px 32px;text-align:center;">
      <div style="font-size:40px;font-weight:900;color:#fff;line-height:1;">${count}</div>
      <div style="font-size:14px;color:#ffe;margin-top:4px;">Qualifying Programs Found for ${facilityName}</div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#333;margin:0 0 12px;">${greeting}</p>
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        I found <strong>${count} program${count !== 1 ? 's' : ''}</strong> that apply to your ${measures}.${
    topProgram
      ? ` The one to act on first is <strong>${topProgram.name}</strong>${(topProgram as any).preApprovalRequired ? ' — it requires pre-approval before your project starts, so timing matters.' : '.'}`
      : ''
  }
      </p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1C2B5E;margin:24px 0 8px;border-bottom:2px solid #C84EC4;padding-bottom:8px;">
        Your Qualifying Programs
      </h2>

      ${programListHTML}

      ${pdfBuffer ? '<p style="font-size:13px;color:#555;margin-top:8px;">The full formatted report is attached as a PDF.</p>' : ''}

      <p style="font-size:14px;color:#333;margin:24px 0 8px;">
        Happy to walk through any of these with you — just reply to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:16px 32px;border-top:1px solid #e0e0e0;">
      <p style="margin:0;font-size:12px;color:#888;">
        <strong style="color:#1C2B5E;">Derek Doyle</strong> · Enlighting Energy<br>
        805-724-5299 · <a href="https://enlightingenergy.com" style="color:#C84EC4;">enlightingenergy.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const authHeader = 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

  if (pdfBuffer) {
    // Multipart with PDF attachment
    const { Blob } = await import('buffer');
    const fd = new FormData();
    fd.append('from', FROM_ADDRESS);
    fd.append('to', to);
    fd.append('bcc', bcc);
    fd.append('subject', subject);
    fd.append('text', text);
    fd.append('html', html);
    fd.append(
      'attachment',
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      'qualifying-programs-report.pdf'
    );

    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: fd,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mailgun error: ${err}`);
    }
  } else {
    // No PDF — plain form post
    const formData = new URLSearchParams();
    formData.append('from', FROM_ADDRESS);
    formData.append('to', to);
    formData.append('bcc', bcc);
    formData.append('subject', subject);
    formData.append('text', text);
    formData.append('html', html);

    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mailgun error: ${err}`);
    }
  }

  console.log(`[email] Report sent to ${to} (BCC: ${bcc})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal lead notification — sent to hello@enlightingenergy.com whenever
// a prospect submits their facility profile through the chat.
// ─────────────────────────────────────────────────────────────────────────────

interface SendLeadNotificationParams {
  email: string;
  contactName?: string | null;
  company?: string | null;
  facilityType?: string | null;
  zipCode?: string | null;
  utility?: string | null;
  measures?: string[] | null;
  squareFootage?: string | number | null;
  programCount?: number | null;
}

export async function sendLeadNotification({
  email,
  contactName,
  company,
  facilityType,
  zipCode,
  utility,
  measures,
  squareFootage,
  programCount,
}: SendLeadNotificationParams): Promise<void> {
  if (!MAILGUN_API_KEY) {
    console.warn('[email] MAILGUN_API_KEY not set — skipping lead notification');
    return;
  }

  const name = contactName ?? 'Unknown';
  const biz = company ?? 'Unknown';
  const measureList = Array.isArray(measures) && measures.length > 0
    ? measures.join(', ')
    : 'Not specified';

  const subject = `New Lead: ${name} — ${biz}`;

  const text = `New lead submitted via californiaenergyincentives.com

Name:          ${name}
Email:         ${email}
Business:      ${biz}
Facility Type: ${facilityType ?? 'Not specified'}
ZIP Code:      ${zipCode ?? 'Not specified'}
Utility:       ${utility ?? 'Not specified'}
Measures:      ${measureList}
Sq Footage:    ${squareFootage ?? 'Not specified'}
Programs Found:${programCount != null ? String(programCount) : 'N/A'}

Reply directly to ${email} to follow up.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Helvetica Neue,Arial,sans-serif;background:#f8f8f8;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
    <div style="background:#1C2B5E;padding:20px 28px;">
      <div style="font-size:16px;font-weight:900;color:#fff;">New Lead — Enlighting Energy</div>
      <div style="font-size:12px;color:#aac;margin-top:2px;">Submitted via californiaenergyincentives.com</div>
    </div>
    <div style="padding:24px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${[
          ['Name', name],
          ['Email', `<a href="mailto:${email}" style="color:#C84EC4;">${email}</a>`],
          ['Business', biz],
          ['Facility Type', facilityType ?? '—'],
          ['ZIP Code', zipCode ?? '—'],
          ['Utility', utility ?? '—'],
          ['Measures', measureList],
          ['Sq Footage', squareFootage != null ? String(squareFootage) : '—'],
          ['Programs Found', programCount != null ? String(programCount) : '—'],
        ].map(([label, value]) => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:9px 8px 9px 0;font-size:12px;color:#888;white-space:nowrap;width:120px;">${label}</td>
          <td style="padding:9px 0;font-size:13px;color:#222;font-weight:600;">${value}</td>
        </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#555;">
        <a href="mailto:${email}" style="background:#1C2B5E;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:700;">Reply to ${name}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const authHeader = 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

  const formData = new URLSearchParams();
  formData.append('from', FROM_ADDRESS);
  formData.append('to', ENLIGHTING_BCC);
  formData.append('h:Reply-To', email);
  formData.append('subject', subject);
  formData.append('text', text);
  formData.append('html', html);

  const response = await fetch(mailgunUrl, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mailgun lead notification error: ${err}`);
  }

  console.log(`[email] Lead notification sent for ${email}`);
}
