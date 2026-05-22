/**
 * Premium Arabic welcome email for Dr. Mina Saad — RTL, table layout, Gmail-safe.
 */

import { resolveDashboardUrl, resolveLogoUrl, resolveSupportEmail } from './welcomeEmail.js'

const BRAND = {
  black: '#050505',
  charcoal: '#141414',
  charcoalMid: '#1E1E1E',
  charcoalLight: '#2A2A2A',
  gold: '#D4AF37',
  goldDark: '#B8941F',
  goldMuted: '#8A7330',
  white: '#FFFFFF',
  textMuted: '#C8C8C8',
  textDim: '#8A8A8A',
}

export const MINA_WELCOME_SUBJECT = 'ترحيب خاص من Credo W'
export const MINA_WELCOME_RECIPIENT = 'Poposaad9990@gmail.com'

/**
 * @param {{
 *   logoUrl?: string
 *   supportEmail?: string
 *   dashboardUrl?: string
 *   useCidLogo?: boolean
 * }} [options]
 */
export function buildMinaWelcomeEmailHtml(options = {}) {
  const supportEmail = options.supportEmail || resolveSupportEmail()
  const logoUrl = options.useCidLogo
    ? 'cid:credo-logo'
    : options.logoUrl || resolveLogoUrl()
  const dashboardUrl = options.dashboardUrl || resolveDashboardUrl()

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${MINA_WELCOME_SUBJECT}</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; direction: rtl; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .hero-title { font-size: 26px !important; line-height: 36px !important; }
      .content-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .cta-btn a { padding: 14px 28px !important; font-size: 15px !important; }
      .signature-block { font-size: 15px !important; }
    }
  </style>
</head>
<body dir="rtl" style="margin:0;padding:0;background-color:${BRAND.black};font-family:'Segoe UI',Tahoma,'Helvetica Neue',Arial,sans-serif;direction:rtl;text-align:right;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    يسعدنا في Credo W أن نرحب بسيادتكم بكل فخر واعتزاز — ترحيب خاص من فريق Credo W.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="background-color:${BRAND.black};direction:rtl;">
    <tr>
      <td align="center" style="padding:36px 16px;">

        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="max-width:600px;width:100%;background-color:${BRAND.charcoal};border:1px solid ${BRAND.charcoalLight};border-radius:14px;overflow:hidden;direction:rtl;">

          <!-- Logo header -->
          <tr>
            <td align="center" class="content-pad" style="padding:32px 44px 24px;background-color:${BRAND.charcoal};border-bottom:1px solid ${BRAND.charcoalLight};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" dir="rtl">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" alt="Credo W" width="76" height="76" style="display:block;width:76px;height:76px;border-radius:16px;border:2px solid ${BRAND.goldMuted};" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <p style="margin:0;font-size:12px;letter-spacing:5px;color:${BRAND.gold};font-weight:700;">CREDO W</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" class="content-pad" style="padding:44px 44px 36px;background-color:${BRAND.charcoalMid};background-image:linear-gradient(155deg, ${BRAND.charcoalMid} 0%, #2A2418 50%, ${BRAND.charcoalMid} 100%);border-bottom:1px solid ${BRAND.goldMuted};">
              <p style="margin:0 0 14px;font-size:12px;letter-spacing:2px;color:${BRAND.gold};font-weight:600;">ترحيب خاص</p>
              <h1 class="hero-title" style="margin:0 0 18px;font-size:32px;line-height:44px;font-weight:700;color:${BRAND.white};letter-spacing:0;">مرحباً بكم في عائلة<br /><span style="color:${BRAND.gold};">Credo W</span></h1>
              <p style="margin:0;font-size:15px;line-height:28px;color:${BRAND.textMuted};max-width:440px;">شراكة استثنائية تُبنى على الثقة والطموح والتميز.</p>
            </td>
          </tr>

          <!-- Gold accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Salutation -->
          <tr>
            <td class="content-pad" style="padding:40px 44px 12px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 8px;font-size:20px;line-height:32px;color:${BRAND.white};font-weight:700;">الأستاذ الدكتور مينا سعد</p>
              <p style="margin:0 0 28px;font-size:16px;line-height:28px;color:${BRAND.gold};font-weight:600;">المدير العام المحترم</p>
              <p style="margin:0 0 24px;font-size:17px;line-height:30px;color:${BRAND.textMuted};">تحية طيبة وبعد،</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content-pad" style="padding:0 44px 32px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 22px;font-size:17px;line-height:32px;color:${BRAND.textMuted};">
                يسعدنا في <strong style="color:${BRAND.gold};font-weight:700;">Credo W</strong> أن نرحب بسيادتكم بكل فخر واعتزاز، ونتمنى أن تكون هذه بداية لعلاقة مميزة مليئة بالنجاح والتعاون المثمر.
              </p>
              <p style="margin:0 0 22px;font-size:17px;line-height:32px;color:${BRAND.textMuted};">
                وجود شخصيات قيادية بخبرتكم ورؤيتكم الملهمة يمثل إضافة حقيقية، ونحن على ثقة بأن المرحلة القادمة ستحمل الكثير من الإنجازات والفرص الاستثنائية.
              </p>
              <p style="margin:0;font-size:17px;line-height:32px;color:${BRAND.textMuted};">
                في <strong style="color:${BRAND.white};font-weight:600;">Credo W</strong> نؤمن بأن النجاح الحقيقي يُبنى بالشراكات القوية والأفكار الطموحة، ولذلك نتطلع بكل حماس للتواصل والتعاون مع سيادتكم.
              </p>
            </td>
          </tr>

          <!-- Highlight card -->
          <tr>
            <td class="content-pad" style="padding:8px 44px 36px;background-color:${BRAND.charcoal};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="background-color:${BRAND.charcoalMid};border-radius:10px;border:1px solid ${BRAND.goldMuted};direction:rtl;">
                <tr>
                  <td style="padding:22px 28px;border-bottom:1px solid ${BRAND.charcoalLight};">
                    <p style="margin:0;font-size:14px;line-height:24px;color:${BRAND.gold};font-weight:700;letter-spacing:0.5px;">رؤيتنا المشتركة</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px;">
                    <p style="margin:0;font-size:15px;line-height:28px;color:${BRAND.white};font-weight:600;">◆ &nbsp;شراكات قوية تُحقق النمو المستدام</p>
                    <p style="margin:14px 0 0;font-size:15px;line-height:28px;color:${BRAND.white};font-weight:600;">◆ &nbsp;أفكار طموحة تُحوّل الطموح إلى إنجاز</p>
                    <p style="margin:14px 0 0;font-size:15px;line-height:28px;color:${BRAND.white};font-weight:600;">◆ &nbsp;تعاون مثمر يصنع الفرق</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td class="content-pad signature-block" style="padding:8px 44px 28px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 12px;font-size:17px;line-height:30px;color:${BRAND.textMuted};">نتمنى لكم دوام النجاح والتوفيق</p>
              <p style="margin:0;font-size:17px;line-height:30px;color:${BRAND.white};font-weight:600;">مع خالص التقدير والاحترام</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" class="content-pad" style="padding:12px 44px 48px;background-color:${BRAND.charcoal};">
              <p style="margin:0 0 22px;font-size:16px;line-height:26px;color:${BRAND.textMuted};text-align:center;">نتطلع للتواصل مع سيادتكم</p>
              <table role="presentation" class="cta-btn" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td align="center" style="border-radius:8px;background:linear-gradient(180deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%);">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:17px 44px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:15px;font-weight:700;color:${BRAND.black};text-decoration:none;letter-spacing:0;border-radius:8px;mso-padding-alt:0;">
                      <span style="mso-text-raise:16pt;">زيارة منصة Credo W</span>
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:13px;line-height:22px;color:${BRAND.textDim};text-align:center;">
                أو تواصل معنا مباشرة:<br />
                <a href="mailto:${supportEmail}" style="color:${BRAND.gold};text-decoration:underline;font-weight:600;">${supportEmail}</a>
              </p>
            </td>
          </tr>

          <!-- Signature footer -->
          <tr>
            <td align="center" class="content-pad" style="padding:24px 44px;background-color:${BRAND.charcoalMid};border-top:1px solid ${BRAND.charcoalLight};">
              <p style="margin:0;font-size:18px;line-height:28px;color:${BRAND.gold};font-weight:700;letter-spacing:1px;">Credo W Team</p>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td class="content-pad" style="padding:28px 44px 36px;background-color:${BRAND.black};border-top:1px solid ${BRAND.charcoalLight};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:11px;line-height:20px;color:#555555;text-align:center;">
                      © ${new Date().getFullYear()} Credo W. جميع الحقوق محفوظة.<br />
                      هذه رسالة ترحيبية من فريق Credo W.
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

export function getMinaWelcomeEmailText() {
  const supportEmail = resolveSupportEmail()

  return `ترحيب خاص من Credo W

الأستاذ الدكتور مينا سعد
المدير العام المحترم

تحية طيبة وبعد،

يسعدنا في Credo W أن نرحب بسيادتكم بكل فخر واعتزاز، ونتمنى أن تكون هذه بداية لعلاقة مميزة مليئة بالنجاح والتعاون المثمر.

وجود شخصيات قيادية بخبرتكم ورؤيتكم الملهمة يمثل إضافة حقيقية، ونحن على ثقة بأن المرحلة القادمة ستحمل الكثير من الإنجازات والفرص الاستثنائية.

في Credo W نؤمن بأن النجاح الحقيقي يُبنى بالشراكات القوية والأفكار الطموحة، ولذلك نتطلع بكل حماس للتواصل والتعاون مع سيادتكم.

نتمنى لكم دوام النجاح والتوفيق
مع خالص التقدير والاحترام

Credo W Team

---
للتواصل: ${supportEmail}
© ${new Date().getFullYear()} Credo W`
}
