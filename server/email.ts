// Reference: blueprint:javascript_sendgrid integration
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
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

// Lead notification email template
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
        <h1>🌟 New Lead Alert - Enlighting Incentive Finder</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #16a34a;">Lead Information</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold; width: 30%;">Company:</td>
            <td style="padding: 8px;">${lead.company}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Contact Name:</td>
            <td style="padding: 8px;">${lead.contactName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;"><a href="mailto:${lead.email}">${lead.email}</a></td>
          </tr>
          ${lead.phone ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Phone:</td>
            <td style="padding: 8px;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
          </tr>
          ` : ''}
          ${lead.address ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Address:</td>
            <td style="padding: 8px;">${lead.address}</td>
          </tr>
          ` : ''}
        </table>

        <h3 style="color: #16a34a;">Project Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${lead.utility ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold; width: 30%;">Utility:</td>
            <td style="padding: 8px;">${lead.utility}</td>
          </tr>
          ` : ''}
          ${lead.measure ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Energy Measure:</td>
            <td style="padding: 8px;">${lead.measure}</td>
          </tr>
          ` : ''}
          ${lead.sqft ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Square Footage:</td>
            <td style="padding: 8px;">${lead.sqft.toLocaleString()} sq ft</td>
          </tr>
          ` : ''}
          ${lead.hours ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Operating Hours:</td>
            <td style="padding: 8px;">${lead.hours} hours/week</td>
          </tr>
          ` : ''}
          ${lead.baselineDesc ? `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Baseline Description:</td>
            <td style="padding: 8px;">${lead.baselineDesc}</td>
          </tr>
          ` : ''}
        </table>

        <div style="background-color: #16a34a; color: white; padding: 15px; border-radius: 5px; text-align: center;">
          <h3 style="margin: 0;">⚡ Action Required: Follow up within 24 hours</h3>
          <p style="margin: 5px 0 0 0;">Contact the lead to schedule their free energy audit and discuss available incentives.</p>
        </div>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>Enlighting Incentive Finder - Automated Lead Notification</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  const emailText = `
New Lead Alert - Enlighting Incentive Finder

Lead Information:
Company: ${lead.company}
Contact: ${lead.contactName}
Email: ${lead.email}
${lead.phone ? `Phone: ${lead.phone}` : ''}
${lead.address ? `Address: ${lead.address}` : ''}

Project Details:
${lead.utility ? `Utility: ${lead.utility}` : ''}
${lead.measure ? `Energy Measure: ${lead.measure}` : ''}
${lead.sqft ? `Square Footage: ${lead.sqft.toLocaleString()} sq ft` : ''}
${lead.hours ? `Operating Hours: ${lead.hours} hours/week` : ''}
${lead.baselineDesc ? `Baseline Description: ${lead.baselineDesc}` : ''}

Action Required: Follow up within 24 hours to schedule their free energy audit.

Generated on ${new Date().toLocaleString()}
  `;

  return await sendEmail({
    to: "hello@enlightingenergy.com", // Enlighting sales team email
    from: "noreply@enlightingenergy.com", // Enlighting verified sender
    subject: `🌟 New Lead: ${lead.company} - ${lead.contactName}`,
    text: emailText,
    html: emailHtml,
  });
}