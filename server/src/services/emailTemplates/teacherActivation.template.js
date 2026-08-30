/**
 * Teacher Account Activation Email Template
 * @param {Object} data
 * @param {string} data.teacherName - Full name of the teacher
 * @param {string} data.schoolName - Name of the school
 * @param {string} data.employeeId - Teacher's employee ID
 * @param {string} [data.department] - Teacher's department
 * @param {string} data.activationUrl - Full URL with activation token
 * @param {number} [data.expiryHours=24] - Token validity in hours
 */
export const getTeacherActivationEmailTemplate = ({
  teacherName,
  schoolName = 'Instique School',
  employeeId,
  department,
  activationUrl,
  expiryHours = 24,
}) => {
  return `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Instique — Set Up Your Teacher Account</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 36px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: left; border-bottom: 3px solid #10b981;">
                <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  Instique <span style="color: #6ee7b7; font-weight: 400; font-size: 18px;">| Staff Portal</span>
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
                  Hello ${teacherName || 'Teacher'},
                </h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Your teacher account for <strong>${schoolName}</strong> has been created by your school administrator.
                </p>

                <!-- Teacher Info Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; margin-bottom: 28px; padding: 0;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">School</span>
                      <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 2px;">${schoolName}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 20px 16px 20px;">
                      <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Employee ID</span>
                      <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 2px; font-family: 'Courier New', monospace;">${employeeId || '—'}</div>
                    </td>
                  </tr>
                  ${department ? `
                  <tr>
                    <td style="padding: 0 20px 16px 20px;">
                      <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Department</span>
                      <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 2px;">${department}</div>
                    </td>
                  </tr>` : ''}
                </table>

                <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Activate your Instique Staff Portal account to access your timetable, student attendance, homework, exams, and more.
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${activationUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); text-align: center;">
                        Set Up Your Account
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Expiry Notice -->
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px;">
                  <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
                    ⏱️ <strong>Important:</strong> This activation link expires in <strong>${expiryHours} hours</strong> for security reasons.
                  </p>
                </div>

                <!-- Fallback URL -->
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                  If the button above does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 28px 0; font-size: 12px; color: #059669; word-break: break-all; line-height: 1.5; background: #f1f5f9; padding: 10px 14px; border-radius: 6px;">
                  <a href="${activationUrl}" style="color: #059669; text-decoration: underline;">${activationUrl}</a>
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
                  Powered by <strong>Instique</strong> — School ERP &amp; Communication Platform
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
