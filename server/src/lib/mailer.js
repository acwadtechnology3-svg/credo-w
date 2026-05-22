import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import {
  buildWelcomeEmailHtml,
  getWelcomeEmailText,
  WELCOME_EMAIL_SUBJECT,
  resolveDashboardUrl,
  resolveSupportEmail,
} from '../mail/templates/welcomeEmail.js'
import {
  buildMinaWelcomeEmailHtml,
  getMinaWelcomeEmailText,
  MINA_WELCOME_RECIPIENT,
  MINA_WELCOME_SUBJECT,
} from '../mail/templates/minaWelcomeEmail.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EMAIL_LOGO_PATH = path.join(__dirname, '../../../public/credo-email-logo.png')

let transporter

function requireSmtpConfig() {
  const email = process.env.SMTP_EMAIL?.trim()
  const password = process.env.SMTP_PASSWORD?.trim()

  if (!email || !password) {
    throw new Error('SMTP_EMAIL and SMTP_PASSWORD must be set in environment')
  }

  return { email, password }
}

/** Reusable Gmail SMTP transporter (singleton). */
export function getTransporter() {
  if (transporter) return transporter

  const { email, password } = requireSmtpConfig()

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: email,
      pass: password,
    },
  })

  return transporter
}

/**
 * Send an email via Gmail SMTP.
 * @param {{ to: string, subject: string, html?: string, text?: string, attachments?: import('nodemailer').Attachment[] }} options
 */
export async function sendMail({ to, subject, html, text, attachments }) {
  const { email } = requireSmtpConfig()
  const transport = getTransporter()

  return transport.sendMail({
    from: `"Credo W" <${email}>`,
    to,
    subject,
    html,
    text,
    attachments,
  })
}

function getLogoAttachment() {
  if (!fs.existsSync(EMAIL_LOGO_PATH)) return null
  return {
    filename: 'credo-logo.png',
    path: EMAIL_LOGO_PATH,
    cid: 'credo-logo',
  }
}

/**
 * Send the premium welcome onboarding email.
 * @param {{ to: string, recipientName?: string, dashboardUrl?: string }} options
 */
export async function sendWelcomeEmail({ to, recipientName, dashboardUrl }) {
  const logoAttachment = getLogoAttachment()
  const useCidLogo = !!logoAttachment

  const html = buildWelcomeEmailHtml({
    recipientName,
    dashboardUrl,
    useCidLogo,
  })
  const text = getWelcomeEmailText({ recipientName, dashboardUrl })

  return sendMail({
    to,
    subject: WELCOME_EMAIL_SUBJECT,
    html,
    text,
    attachments: logoAttachment ? [logoAttachment] : undefined,
  })
}

/**
 * Send the Arabic welcome email to Dr. Mina Saad.
 */
export async function sendMinaWelcomeEmail() {
  const logoAttachment = getLogoAttachment()
  const useCidLogo = !!logoAttachment

  const html = buildMinaWelcomeEmailHtml({
    useCidLogo,
    dashboardUrl: resolveDashboardUrl(),
    supportEmail: resolveSupportEmail(),
  })
  const text = getMinaWelcomeEmailText()

  return sendMail({
    to: MINA_WELCOME_RECIPIENT,
    subject: MINA_WELCOME_SUBJECT,
    html,
    text,
    attachments: logoAttachment ? [logoAttachment] : undefined,
  })
}
