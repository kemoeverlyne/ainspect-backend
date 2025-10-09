// Email service for user invitations
// In a production environment, you would integrate with a service like SendGrid, AWS SES, or similar

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  inviterName: string;
  role: string;
  companyName: string;
  invitationToken: string;
  invitationUrl: string;
  expiresAt: Date;
}

export function createInvitationEmail(data: InvitationEmailData): EmailTemplate {
  const {
    recipientEmail,
    recipientName,
    inviterName,
    role,
    companyName,
    invitationToken,
    invitationUrl,
    expiresAt
  } = data;

  const subject = `You've been invited to join ${companyName} as ${role.replace('_', ' ')}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #e5e7eb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ${companyName}</h1>
            </div>
            <div class="content">
                <h2>You've been invited to join our team!</h2>
                <p>Hi ${recipientName || 'there'},</p>
                <p>${inviterName} has invited you to join <strong>${companyName}</strong> as a <strong>${role.replace('_', ' ')}</strong>.</p>
                <p>AInspect is a professional home inspection software that helps inspection teams manage their workflow, create comprehensive reports, and collaborate effectively.</p>
                
                <h3>Your Role: ${role.replace('_', ' ')}</h3>
                <p>As a ${role.replace('_', ' ')}, you'll have access to:</p>
                <ul>
                    ${getRoleFeatures(role).map(feature => `<li>${feature}</li>`).join('')}
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>

                <p><strong>Important:</strong> This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.</p>
                
                <p>If you have any questions, please contact ${inviterName} or our support team.</p>
                
                <p>Welcome aboard!</p>
                <p>The ${companyName} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email from AInspect Professional Home Inspection Software.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to ${companyName}!
    
    ${inviterName} has invited you to join ${companyName} as a ${role.replace('_', ' ')}.
    
    To accept this invitation, visit: ${invitationUrl}
    
    This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
    
    If you have any questions, please contact ${inviterName} or our support team.
    
    Welcome aboard!
    The ${companyName} Team
  `;

  return {
    to: recipientEmail,
    subject,
    html,
    text
  };
}

function getRoleFeatures(role: string): string[] {
  switch (role) {
    case 'super_admin':
      return [
        'Full system administration access',
        'User and team management',
        'Branch office management',
        'System configuration and settings',
        'Complete inspection oversight',
        'Advanced reporting and analytics'
      ];
    case 'manager':
      return [
        'Team management within your branch',
        'Inspector oversight and assignment',
        'Inspection review and approval',
        'Performance monitoring',
        'Report generation for your team'
      ];
    case 'inspector':
      return [
        'Create and manage home inspections',
        'AI-powered photo analysis',
        'Professional report generation',
        'Client communication tools',
        'Mobile-friendly inspection interface'
      ];
    case 'read_only':
      return [
        'View inspection reports',
        'Access team dashboards',
        'Monitor inspection progress',
        'Export basic reports'
      ];
    default:
      return ['Access to the inspection platform'];
  }
}

// Simulate email sending - in production, integrate with actual email service
export async function sendEmail(emailTemplate: EmailTemplate): Promise<boolean> {
  try {
    // Simulate API call to email service
    console.log('📧 Email Service: Sending email to', emailTemplate.to);
    console.log('Subject:', emailTemplate.subject);
    console.log('HTML Content Length:', emailTemplate.html.length);
    
    // In production, you would make an actual API call here:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: emailTemplate.to }] }],
    //     from: { email: process.env.FROM_EMAIL },
    //     subject: emailTemplate.subject,
    //     content: [
    //       { type: 'text/plain', value: emailTemplate.text },
    //       { type: 'text/html', value: emailTemplate.html }
    //     ]
    //   })
    // });
    
    // Simulate successful sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}