/**
 * Premium recruitment invitation email — elite guild / fintech hybrid.
 */

const BRAND = {
  black: '#050508',
  panel: '#12121a',
  panelEdge: '#1e1e2e',
  violet: '#7B6CF6',
  electric: '#5B9FFF',
  gold: '#D4AF37',
  text: '#F4F4F8',
  muted: '#9A9AB0',
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const INVITE_EMAIL_SUBJECT = '{name} invited you to join their elite Credo W team'

/**
 * @param {{ inviter: object, card: object }} options
 */
export function buildInviteEmailHtml({ inviter, card }) {
  const name = escapeHtml(inviter.full_name || inviter.username)
  const rank = escapeHtml(inviter.rank)
  const team = escapeHtml(inviter.team_name)
  const pkg = escapeHtml(inviter.package_label)
  const message = escapeHtml(
    card.invitation?.invitation_message ||
      "You've been hand-picked for an exclusive seat in our network."
  )
  const emoji = escapeHtml(card.invitation?.invite_emoji || '🔥')
  const side = escapeHtml(card.invitation?.resolved_side || card.invitation?.placement_side)
  const code = escapeHtml(card.invitation?.invite_code)
  const joinUrl = escapeHtml(card.urls?.registerUrl)
  const qrUrl = escapeHtml(card.urls?.qrUrl)
  const avatar = inviter.profile_image
    ? escapeHtml(inviter.profile_image)
    : null

  const avatarBlock = avatar
    ? `<img src="${avatar}" width="72" height="72" alt="" style="border-radius:50%;border:3px solid ${BRAND.gold};display:block;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${BRAND.violet},${BRAND.electric});border:3px solid ${BRAND.gold};line-height:72px;text-align:center;font-size:28px;color:#fff;">${emoji}</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exclusive Invitation — Credo W</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.black};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.black};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 24px;background:linear-gradient(145deg,${BRAND.panel} 0%,#0a0a12 100%);border:1px solid ${BRAND.panelEdge};border-radius:20px;box-shadow:0 0 40px rgba(123,108,246,0.25);">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.gold};">Private invitation</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${BRAND.text};line-height:1.2;">${emoji} You're invited to the inner circle</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.muted};">This is not a mass referral blast. <strong style="color:${BRAND.text};">${name}</strong> personally selected you for their network leg.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;background:rgba(123,108,246,0.08);border-radius:14px;border:1px solid rgba(123,108,246,0.35);">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right:16px;vertical-align:top;">${avatarBlock}</td>
                        <td style="vertical-align:top;">
                          <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.text};">${name}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:${BRAND.muted};">${rank} · ${pkg}</p>
                          <p style="margin:8px 0 0;font-size:12px;color:${BRAND.electric};">Clan: ${team}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:14px;font-style:italic;color:${BRAND.text};">"${message}"</p>
                    <p style="margin:12px 0 0;font-size:12px;color:${BRAND.muted};">Placement: <strong style="color:${BRAND.gold};">${side}</strong> · Code: <span style="font-family:monospace;color:${BRAND.text};">${code}</span></p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr>
                  <td width="50%" style="padding:12px;background:rgba(0,0,0,0.35);border-radius:10px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:${BRAND.muted};text-transform:uppercase;">Package path</p>
                    <p style="margin:6px 0 0;font-size:14px;color:${BRAND.text};">Premium commissions, pearls rewards & rank progression.</p>
                  </td>
                  <td width="8"></td>
                  <td width="50%" style="padding:12px;background:rgba(0,0,0,0.35);border-radius:10px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:${BRAND.muted};text-transform:uppercase;">Team preview</p>
                    <p style="margin:6px 0 0;font-size:14px;color:${BRAND.text};">Join under ${name}'s balanced binary tree.</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="border-radius:12px;background:linear-gradient(135deg,${BRAND.violet},${BRAND.electric});">
                    <a href="${joinUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">JOIN MY TEAM →</a>
                  </td>
                </tr>
              </table>

              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img src="${qrUrl}" width="140" height="140" alt="QR code" style="border-radius:12px;border:2px solid ${BRAND.panelEdge};" />
                    <p style="margin:8px 0 0;font-size:11px;color:${BRAND.muted};">Scan to accept · expires soon</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:#5a5a70;text-align:center;">Credo W · Elite network access. If you did not expect this invitation, you may ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function getInviteEmailText({ inviter, card }) {
  const name = inviter.full_name || inviter.username
  return `${name} invited you to Credo W.\n\nJoin: ${card.urls?.registerUrl}\nCode: ${card.invitation?.invite_code}\nPlacement: ${card.invitation?.resolved_side || card.invitation?.placement_side}\n`
}
