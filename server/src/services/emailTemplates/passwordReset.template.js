/**
 * Password Reset Email Template
 * @param {Object} data
 * @param {string} data.userName - Name of the user
 * @param {string} data.resetUrl - Full password reset URL
 * @param {number} [data.expiryMinutes=60] - Expiry time in minutes
 */
export const getPasswordResetEmailTemplate = ({
  userName = 'User',
  resetUrl,
  expiryMinutes = 60
}) => {
  return `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Instique Password</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 36px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: left; border-bottom: 3px solid #3b82f6;">
                <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  Instique <span style="color: #60a5fa; font-weight: 400; font-size: 18px;">| Security</span>
                </div>
              </td>
            </tr>

            <!-- Main Body -->
            <tr>
              <td style="padding: 36px 40px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
                  Password Reset Request
                </h1>
                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Hello ${userName},
                </p>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  We received a request to reset your Instique account password. Click the button below to choose a new password.
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); text-align: center;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px;">
                  <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
                    ⏱️ <strong>Security Notice:</strong> This link will expire in <strong>${expiryMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                  </p>
                </div>

                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 28px 0; font-size: 12px; color: #2563eb; word-break: break-all; line-height: 1.5; background: #f1f5f9; padding: 10px 14px; border-radius: 6px;">
                  <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
                </p>

                <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">Instique Security Team</p>
                </div>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                  Powered by <strong>Instique</strong>
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
