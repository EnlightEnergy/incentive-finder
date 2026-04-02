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
    if (cat.includes('Federal')) return '#C84EC4';
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
  // Pick the first non-Federal-Tax-Credit program to feature (179D and other post-project
  // deductions should not be highlighted as the top action item)
  const allEntries = (matchResult.programs ?? []).flatMap((g) => g.entries);
  const topProgram = allEntries.find((e) => !e.category?.includes('Federal')) ?? allEntries[0] ?? null;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const safeAttachmentName = `${facilityName} incentive programs report | Enlighting (${today}).pdf`.replace(/[/\\?%*:|"<>]/g, '-');

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
  const subject = `Your Qualifying Report for "${facilityName}" - ${count} Program${count !== 1 ? 's' : ''} Found`;

  const programListText = buildProgramList(matchResult.programs ?? []);
  const programListHTML = buildProgramListHTML(matchResult.programs ?? []);

  // ── Plain text version ────────────────────────────────────────────────────
  const text = `${greeting}

Your Qualifying Programs Report for ${facilityName} is ready — We found ${count} program${count !== 1 ? 's' : ''} that apply to your ${measures}.${
    topProgram
      ? `\n\nThe one to act on first is ${topProgram.name}${topProgram.preApprovalRequired ? ' &#8212; it requires pre-approval before your project starts, so timing matters.' : '.'}`
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
William Tran
Vice President, Business Development
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
      <img src="https://incentive-finder-production.up.railway.app/Enlighting_Logo_White_Web_1763150856949.png" alt="Enlighting Energy" style="height:40px;width:auto;display:block;margin-bottom:8px;" />
      <div style="font-size:13px;font-weight:700;color:#fff;">California Commercial Incentive Specialists</div>
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
        We found <strong>${count} program${count !== 1 ? 's' : ''}</strong> that apply to your ${measures}.${
    topProgram
      ? ` The one to act on first is <strong>${topProgram.name}</strong>${topProgram.preApprovalRequired ? ' &#8212; it requires pre-approval before your project starts, so timing matters.' : '.'}`
      : ''
  }
      </p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1C2B5E;margin:24px 0 8px;border-bottom:2px solid #C84EC4;padding-bottom:8px;">
        Your Qualifying Programs
      </h2>

      ${programListHTML}

      ${pdfBuffer ? '<p style="font-size:13px;color:#555;margin-top:8px;">The full formatted report is attached as a PDF.</p>' : ''}

      <p style="font-size:14px;color:#333;margin:24px 0 8px;">
        Happy to walk through any of these with you${recipientName ? `, ${recipientName}` : ''}. Just reply to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:16px 32px;border-top:1px solid #e0e0e0;">
      <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
        <strong style="color:#1C2B5E;">William Tran</strong><br>
        Enlighting Energy<br>
        805-724-5299<br>
        <a href="https://enlightingenergy.com" style="color:#C84EC4;">enlightingenergy.com</a>
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
    fd.append('h-Reply-To', 'hello@enlightingenergy.com');
    fd.append('subject', subject);
    fd.append('text', text);
    fd.append('html', html);
    fd.append(
      'attachment',
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      safeAttachmentName
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
    formData.append('h-Reply-To', 'hello@enlightingenergy.com');
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

export async function sendLeadNotification({
  company,
  contactName,
  email,
  phone,
  address,
  utility,
  measure,
  sqft,
  hours,
  baselineDesc,
}: {
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  utility?: string;
  measure?: string;
  sqft?: number;
  hours?: number;
  baselineDesc?: string;
}): Promise<void> {
  if (!MAILGUN_API_KEY) {
    console.warn('[email] MAILGUN_API_KEY not set — skipping lead notification');
    return;
  }

  const subject = `New Lead: ${company} — ${contactName}`;

  const textBody = [
    `New lead submitted on californiaenergyincentives.com`,
    ``,
    `Company:      ${company}`,
    `Contact:      ${contactName}`,
    `Email:        ${email}`,
    phone      ? `Phone:        ${phone}`      : null,
    address    ? `Address:      ${address}`    : null,
    utility    ? `Utility:      ${utility}`    : null,
    measure    ? `Measure:      ${measure}`    : null,
    sqft       ? `Sq Ft:        ${sqft}`       : null,
    hours      ? `Op Hours/Yr:  ${hours}`      : null,
    baselineDesc ? `Baseline:     ${baselineDesc}` : null,
  ].filter(Boolean).join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1C2B5E;">New Lead: ${company}</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 12px;font-weight:bold;">Company</td><td style="padding:6px 12px;">${company}</td></tr>
        <tr style="background:#f5f5f5;"><td style="padding:6px 12px;font-weight:bold;">Contact</td><td style="padding:6px 12px;">${contactName}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone      ? `<tr style="background:#f5f5f5;"><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;">${phone}</td></tr>` : ''}
        ${address    ? `<tr><td style="padding:6px 12px;font-weight:bold;">Address</td><td style="padding:6px 12px;">${address}</td></tr>` : ''}
        ${utility    ? `<tr style="background:#f5f5f5;"><td style="padding:6px 12px;font-weight:bold;">Utility</td><td style="padding:6px 12px;">${utility}</td></tr>` : ''}
        ${measure    ? `<tr><td style="padding:6px 12px;font-weight:bold;">Measure</td><td style="padding:6px 12px;">${measure}</td></tr>` : ''}
        ${sqft       ? `<tr style="background:#f5f5f5;"><td style="padding:6px 12px;font-weight:bold;">Sq Ft</td><td style="padding:6px 12px;">${sqft}</td></tr>` : ''}
        ${hours      ? `<tr><td style="padding:6px 12px;font-weight:bold;">Op Hours/Yr</td><td style="padding:6px 12px;">${hours}</td></tr>` : ''}
        ${baselineDesc ? `<tr style="background:#f5f5f5;"><td style="padding:6px 12px;font-weight:bold;">Baseline</td><td style="padding:6px 12px;">${baselineDesc}</td></tr>` : ''}
      </table>
    </div>
  `;

  const to = 'derek@enlightingenergy.com';
  const formData = new FormData();
  formData.append('from', FROM_ADDRESS);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', textBody);
  formData.append('html', htmlBody);

  const response = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa('api:' + MAILGUN_API_KEY),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mailgun error: ${err}`);
  }

  console.log(`[email] Lead notification sent for ${company} - ${contactName}`);
}
