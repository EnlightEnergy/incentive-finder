/**
 * email.ts
 *
 * SendGrid-based email delivery for report sending.
 * Activate by setting SENDGRID_API_KEY in Railway variables.
 *
 * BCC: hello@enlightingenergy.com is always BCC'd on every report email.
 */
 
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ENLIGHTING_BCC = 'hello@enlightingenergy.com';
 
// Display name is the company — not the individual rep
const FROM_ADDRESS = { email: 'hello@enlightingenergy.com', name: 'Enlighting Energy' };
 
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
  if (!SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set — skipping email send');
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
      ? `\n\nThe one to act on first is ${topProgram.name}${topProgram.preApprovalRequired ? ' — it requires pre-approval before your project starts, so timing matters.' : '.'}`
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
      ? ` The one to act on first is <strong>${topProgram.name}</strong>${topProgram.preApprovalRequired ? ' — it requires pre-approval before your project starts, so timing matters.' : '.'}`
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
 
  // ── SendGrid API v3 ───────────────────────────────────────────────────────
  const body: Record<string, unknown> = {
    personalizations: [
      {
        to: [{ email: to }],
        bcc: [{ email: bcc }],
      },
    ],
    from: FROM_ADDRESS,
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  };
 
  if (pdfBuffer) {
    body.attachments = [
      {
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        filename: 'qualifying-programs-report.pdf',
        disposition: 'attachment',
      },
    ];
  }
 
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
 
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SendGrid error: ${err}`);
  }
 
  console.log(`[email] Report sent to ${to} (BCC: ${bcc})`);
}
 
