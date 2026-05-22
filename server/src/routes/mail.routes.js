import { Router } from 'express'
import { sendMail, sendWelcomeEmail, sendMinaWelcomeEmail } from '../lib/mailer.js'
import { MINA_WELCOME_RECIPIENT } from '../mail/templates/minaWelcomeEmail.js'

const router = Router()

router.get('/test-email', async (req, res) => {
  try {
    const to = process.env.SMTP_EMAIL?.trim()
    if (!to) {
      return res.status(500).json({ error: 'SMTP_EMAIL is not configured' })
    }

    const info = await sendMail({
      to,
      subject: 'SMTP Working',
      html: '<h1>Email Working ✅</h1><p>Gmail SMTP configured successfully.</p>',
    })

    res.json({
      success: true,
      message: `Test email sent to ${to}`,
      messageId: info.messageId,
    })
  } catch (err) {
    console.error('Test email failed:', err)
    const isProd = process.env.NODE_ENV === 'production'
    res.status(500).json({
      error: 'Failed to send test email',
      ...(isProd ? {} : { details: err.message }),
    })
  }
})

router.get('/send-mina-email', async (req, res) => {
  try {
    const info = await sendMinaWelcomeEmail()

    console.log('[send-mina-email] Success:', {
      to: MINA_WELCOME_RECIPIENT,
      messageId: info.messageId,
      response: info.response,
    })

    res.json({
      success: true,
      message: `Arabic welcome email sent to ${MINA_WELCOME_RECIPIENT}`,
      messageId: info.messageId,
      subject: 'ترحيب خاص من Credo W',
    })
  } catch (err) {
    console.error('[send-mina-email] Failed:', err)
    const isProd = process.env.NODE_ENV === 'production'
    res.status(500).json({
      success: false,
      error: 'Failed to send Mina welcome email',
      ...(isProd ? {} : { details: err.message }),
    })
  }
})

router.get('/test-welcome-email', async (req, res) => {
  try {
    const to = process.env.SMTP_EMAIL?.trim()
    if (!to) {
      return res.status(500).json({ error: 'SMTP_EMAIL is not configured' })
    }

    const info = await sendWelcomeEmail({
      to,
      recipientName: req.query.name?.trim() || 'Member',
    })

    res.json({
      success: true,
      message: `Welcome email sent to ${to}`,
      messageId: info.messageId,
    })
  } catch (err) {
    console.error('Welcome email failed:', err)
    const isProd = process.env.NODE_ENV === 'production'
    res.status(500).json({
      error: 'Failed to send welcome email',
      ...(isProd ? {} : { details: err.message }),
    })
  }
})

export { router as mailRouter }
