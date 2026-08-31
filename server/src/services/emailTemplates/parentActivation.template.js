/**
 * Parent Account Activation Email Template
 * @param {Object} data
 * @param {string} data.parentName - Name of the parent
 * @param {string} data.schoolName - Name of the school
 * @param {string} data.studentName - Name of the admitted student
 * @param {string} data.className - Class and section (e.g. "Grade 5A")
 * @param {string} data.activationUrl - Full URL with activation token
 * @param {string} [data.expiryHours=24] - Token validity in hours
 */
export const getParentActivationEmailTemplate = ({
  parentName,
  schoolName = 'Instique School',
  studentName,
  className = 'General',
  activationUrl,
  expiryHours = 24
}) => {
  return `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Instique — Set Up Your Parent Account</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
            
            <!-- Header with Gradient & Branding -->
            <tr>
              <td style="padding: 36px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: left; border-bottom: 3px solid #3b82f6;">
                <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  Instique <span style="color: #60a5fa; font-weight: 400; font-size: 18px;">| Parent Portal</span>
                </div>
                <div style="margin-top: 6px; font-size: 14px; color: #94a3b8;">
                  ${schoolName}
                </div>
              </td>
            </tr>

            <!-- Main Body -->
            <tr>
              <td style="padding: 36px 40px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
                  Hello ${parentName || 'Parent'},
                </h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Your parent account for <strong>${schoolName}</strong> has been successfully created.
                </p>

                <!-- Student Info Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; margin-bottom: 28px; padding: 16px 20px;">
                  <tr>
                    <td style="padding: 4px 0;">
                      <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Student</span>
                      <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 2px;">${studentName}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 4px 0;">
                      <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Class / Section</span>
                      <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 2px;">${className}</div>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  You can now activate your Instique Parent Portal account and create your password to stay connected with your child's academic progress, attendance, timetables, and fee notices.
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${activationUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); text-align: center;">
                        Set Up Your Account
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Expiry Note -->
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px;">
                  <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
                    ⏱️ <strong>Important:</strong> This activation link expires in <strong>${expiryHours} hours</strong> for security reasons.
                  </p>
                </div>

                <!-- Fallback URL -->
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                  If the button above does not work, copy and paste this link into your web browser:
                </p>
                <p style="margin: 0 0 28px 0; font-size: 12px; color: #2563eb; word-break: break-all; line-height: 1.5; background: #f1f5f9; padding: 10px 14px; border-radius: 6px;">
                  <a href="${activationUrl}" style="color: #2563eb; text-decoration: underline;">${activationUrl}</a>
                </p>

                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  If you did not expect this email, please contact your school administrator.
                </p>

                <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">Regards,</p>
                  <p style="margin: 2px 0 0 0; font-size: 14px; color: #64748b;">${schoolName}</p>
                </div>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                  Powered by <strong>Instique</strong> — School ERP & Communication Platform
                </p>
                <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">
                  © ${new Date().getFullYear()} Instique. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
