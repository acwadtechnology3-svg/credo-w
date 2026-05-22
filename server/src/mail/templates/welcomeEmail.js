/**
 * Premium welcome email for Credo W — table layout, inline CSS, Gmail-safe.
 */

const BRAND = {
  black: '#050505',
  charcoal: '#141414',
  charcoalMid: '#1E1E1E',
  charcoalLight: '#2A2A2A',
  gold: '#D4AF37',
  goldDark: '#B8941F',
  goldMuted: '#8A7330',
  white: '#FFFFFF',
  textMuted: '#B5B5B5',
  textDim: '#7A7A7A',
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function resolveDashboardUrl() {
  const origin = (
    process.env.CLIENT_ORIGIN ||
    process.env.ALLOWED_ORIGIN ||
    'http://localhost:5173'
  ).replace(/\/$/, '')
  return `${origin}/dashboard`
}

export function resolveLogoUrl() {
  const explicit = process.env.EMAIL_LOGO_URL?.trim()
  if (explicit) return explicit

  const appOrigin = (
    process.env.CLIENT_ORIGIN ||
    process.env.ALLOWED_ORIGIN ||
    'http://localhost:5173'
  ).replace(/\/$/, '')

  return `${appOrigin}/credo-email-logo.png`
}

export function resolveSupportEmail() {
  return process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_EMAIL?.trim() || 'support@credow.com'
}

/**
 * @param {{
 *   recipientName?: string
 *   dashboardUrl?: string
 *   logoUrl?: string
 *   supportEmail?: string
 *   useCidLogo?: boolean
 * }} [options]
 */
export function buildWelcomeEmailHtml(options = {}) {
  const recipientName = escapeHtml(options.recipientName || 'Member')
  const dashboardUrl = escapeHtml(options.dashboardUrl || resolveDashboardUrl())
  const supportEmail = escapeHtml(options.supportEmail || resolveSupportEmail())
  const logoUrl = escapeHtml(
    options.useCidLogo ? 'cid:credo-logo' : options.logoUrl || resolveLogoUrl()
  )

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>Welcome to Credo W</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .hero-title { font-size: 28px !important; line-height: 34px !important; }
      .content-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .cta-btn a { padding: 14px 28px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.black};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Welcome to Credo W — your account is ready. Start building your business today.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.black};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:${BRAND.charcoal};border:1px solid ${BRAND.charcoalLight};border-radius:12px;overflow:hidden;">

          <!-- Logo header -->
          <tr>
            <td align="center" class="content-pad" style="padding:28px 40px 20px;background-color:${BRAND.charcoal};border-bottom:1px solid ${BRAND.charcoalLight};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" alt="Credo W" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:14px;border:1px solid ${BRAND.goldMuted};" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px;">
                    <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${BRAND.gold};font-weight:600;">Credo W</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gradient hero -->
          <tr>
            <td align="center" class="content-pad" style="padding:48px 40px 40px;background-color:${BRAND.charcoalMid};background-image:linear-gradient(145deg, ${BRAND.charcoalMid} 0%, #252015 45%, ${BRAND.charcoalMid} 100%);border-bottom:1px solid ${BRAND.goldMuted};">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.gold};font-weight:600;">Exclusive Access</p>
              <h1 class="hero-title" style="margin:0 0 16px;font-size:34px;line-height:40px;font-weight:700;color:${BRAND.white};letter-spacing:-0.5px;">Welcome to Credo&nbsp;W</h1>
              <p style="margin:0;font-size:16px;line-height:26px;color:${BRAND.textMuted};max-width:420px;">Hello <span style="color:${BRAND.white};font-weight:600;">${recipientName}</span>, your premium business platform awaits.</p>
            </td>
          </tr>

          <!-- Gold accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td class="content-pad" style="padding:40px 40px 8px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 20px;font-size:16px;line-height:28px;color:${BRAND.textMuted};">
                Your account has been <strong style="color:${BRAND.white};font-weight:600;">successfully created</strong>.
                You are now part of an elite network built for ambitious leaders.
              </p>
              <p style="margin:0 0 28px;font-size:16px;line-height:28px;color:${BRAND.textMuted};">
                <strong style="color:${BRAND.gold};font-weight:600;">Start building your business today</strong> — track performance, grow your team, and unlock premium rewards from your dashboard.
              </p>
            </td>
          </tr>

          <!-- Feature highlights -->
          <tr>
            <td class="content-pad" style="padding:8px 40px 32px;background-color:${BRAND.charcoal};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.charcoalMid};border-radius:8px;border:1px solid ${BRAND.charcoalLight};">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid ${BRAND.charcoalLight};">
                    <p style="margin:0;font-size:13px;line-height:20px;color:${BRAND.gold};letter-spacing:1px;text-transform:uppercase;font-weight:600;">Your next steps</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid ${BRAND.charcoalLight};">
                    <p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.white};font-weight:600;">✦ &nbsp;Access your dashboard</p>
                    <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:${BRAND.textDim};">Monitor earnings, team growth, and rank progress in real time.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid ${BRAND.charcoalLight};">
                    <p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.white};font-weight:600;">✦ &nbsp;Complete your profile</p>
                    <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:${BRAND.textDim};">Strengthen your presence across the Credo W ecosystem.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.white};font-weight:600;">✦ &nbsp;Invite your network</p>
                    <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:${BRAND.textDim};">Share your referral link and scale with confidence.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" class="content-pad" style="padding:8px 40px 48px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:${BRAND.textMuted};text-align:center;">Access your dashboard now</p>
              <table role="presentation" class="cta-btn" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td align="center" style="border-radius:6px;background:linear-gradient(180deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%);">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:16px 40px;font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:${BRAND.black};text-decoration:none;letter-spacing:0.6px;text-transform:uppercase;border-radius:6px;mso-padding-alt:0;">
                      <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->
                      <span style="mso-text-raise:16pt;">Open Dashboard</span>
                      <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%">&nbsp;</i><![endif]-->
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;line-height:18px;color:${BRAND.textDim};text-align:center;">
                Or copy this link:<br />
                <a href="${dashboardUrl}" style="color:${BRAND.gold};text-decoration:underline;word-break:break-all;">${dashboardUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="content-pad" style="padding:28px 40px 36px;background-color:${BRAND.black};border-top:1px solid ${BRAND.charcoalLight};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:${BRAND.textDim};letter-spacing:1px;text-transform:uppercase;">Need assistance?</p>
                    <p style="margin:0 0 16px;font-size:14px;line-height:22px;">
                      <a href="mailto:${supportEmail}" style="color:${BRAND.gold};text-decoration:none;font-weight:600;">${supportEmail}</a>
                    </p>
                    <p style="margin:0;font-size:11px;line-height:18px;color:#555555;">
                      © ${new Date().getFullYear()} Credo W. All rights reserved.<br />
                      This is a transactional message regarding your account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Plain-text fallback for clients without HTML support.
 */
export function getWelcomeEmailText(options = {}) {
  const recipientName = options.recipientName || 'Member'
  const dashboardUrl = options.dashboardUrl || resolveDashboardUrl()
  const supportEmail = options.supportEmail || resolveSupportEmail()

  return `Welcome to Credo W

Hello ${recipientName},

Your account has been successfully created.

Start building your business today — access your dashboard to track performance, grow your team, and unlock rewards.

Open Dashboard: ${dashboardUrl}

Questions? Contact us at ${supportEmail}

© ${new Date().getFullYear()} Credo W. All rights reserved.`
}

export const WELCOME_EMAIL_SUBJECT = 'Welcome to Credo W — Your Account Is Ready'
