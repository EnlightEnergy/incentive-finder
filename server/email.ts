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
