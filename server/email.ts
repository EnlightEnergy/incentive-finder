import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("WARNING: SENDGRID_API_KEY not set. Email notifications disabled.");
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Email sending disabled: SENDGRID_API_KEY not set');
    return false;
  }
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendLeadNotification(lead: {
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
}): Promise<boolean> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>New Lead Alert - Enlighting Incentive Finder</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #16a34a;">Lead Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${lead.company}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Contact:</td><td style="padding: 8px;">${lead.contactName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${lead.email}</td></tr>
          ${lead.phone ? `<tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${lead.phone}</td></tr>` : ''}
          ${lead.address ? `<tr><td style="padding: 8px; font-weight: bold;">Address:</td><td style="padding: 8px;">${lead.address}</td></tr>` : ''}
          ${lead.utility ? `<tr><td style="padding: 8px; font-weight: bold;">Utility:</td><td style="padding: 8px;">${lead.utility}</td></tr>` : ''}
          ${lead.measure ? `<tr><td style="padding: 8px; font-weight: bold;">Measure:</td><td style="padding: 8px;">${lead.measure}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;

  return await sendEmail({
    to: "hello@enlightingenergy.com",
    from: "noreply@enlightingenergy.com",
    subject: `New Lead: ${lead.company} - ${lead.contactName}`,
    text: `New lead from ${lead.company}. Contact: ${lead.contactName}, ${lead.email}`,
    html: emailHtml,
  });
}


// ── Report email via Mailgun ────────────────────────────────────────────────
// Activate by adding MAILGUN_API_KEY and MAILGUN_DOMAIN to Railway variables.
// BCC to hello@enlightingenergy.com on every send keeps Enlighting in the loop.

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? 'mg.enlightingenergy.com';
const ENLIGHTING_BCC = 'hello@enlightingenergy.com';
const FROM_ADDRESS = 'Derek Doyle <derek@enlightingenergy.com>';

interface SendReportEmailParams {
  to: string;
  bcc?: string;
  matchResult: {
    facility?: Record<string, string>;
    programs?: Array<{ measure: string; entries: any[] }>;
    programCount: number;
    summary?: string;
  };
}

export async function sendReportEmail({ to, bcc = ENLIGHTING_BCC, matchResult }: SendReportEmailParams): Promise<void> {
  if (!MAILGUN_API_KEY) {
    console.warn('[email] MAILGUN_API_KEY not set -- skipping email send');
    return;
  }

  const facilityName = matchResult.facility?.name ?? 'your facility';
  const count = matchResult.programCount;
  const topProgram = matchResult.programs?.[0]?.entries?.[0]?.name ?? null;
  const measures = matchResult.programs?.map((g) => g.measure).join(' and ') ?? 'your projects';

  const subject = `Your Qualifying Programs Report -- ${count} programs found`;
  const text = `Hi there,

Your Qualifying Programs Report for ${facilityName} is ready -- I found ${count} program${count !== 1 ? 's' : ''} that apply to your ${measures}.${topProgram ? `\n\nThe most time-sensitive one is ${topProgram} -- there's a pre-approval step required before your project starts, so it's worth acting on early.` : ''}

${matchResult.summary ?? ''}

Happy to walk through any of this with you or help move one of these programs forward -- just reply here.

Best,
Derek Doyle
Enlighting Energy
805-724-5299
enlightingenergy.com`;

  const formData = new URLSearchParams();
  formData.append('from', FROM_ADDRESS);
  formData.append('to', to);
  formData.append('bcc', bcc);
  formData.append('subject', subject);
  formData.append('text', text);

  const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mailgun error: ${err}`);
  }

  console.log(`[email] Report sent to ${to} (BCC: ${bcc})`);
}
