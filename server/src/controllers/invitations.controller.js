import { supabase } from '../lib/supabase.js'
import { mapInviteError } from '../lib/dbErrors.js'
import { invitationService } from '../services/invitation.service.js'

function handleInviteError(res, err, fallback = 'تعذّر إرسال الدعوة') {
  const mapped = mapInviteError(err)
  if (mapped) return res.status(mapped.status).json({ error: mapped.error, code: mapped.code })
  const status = err.status || 500
  return res.status(status).json({ error: err.message || fallback })
}

export const invitationsController = {
  async getHub(req, res) {
    try {
      const hub = await invitationService.getHub(req.user.userId)
      return res.json(hub)
    } catch (err) {
      console.error('invitations getHub:', err)
      return handleInviteError(res, err)
    }
  },

  async list(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 20
      const result = await invitationService.listInvitations(req.user.userId, {
        page,
        limit,
        status: req.query.status,
      })
      return res.json(result)
    } catch (err) {
      console.error('invitations list:', err)
      return handleInviteError(res, err)
    }
  },

  async create(req, res) {
    try {
      const result = await invitationService.createInvitation(req.user.userId, req.body, req)
      return res.status(201).json(result)
    } catch (err) {
      console.error('invitations create:', err)
      return handleInviteError(res, err)
    }
  },

  async getCard(req, res) {
    try {
      const card = await invitationService.getInvitationCard(req.user.userId, req.params.id)
      return res.json(card)
    } catch (err) {
      const status = err.status || 500
      return res.status(status).json({ error: err.message || 'Server error' })
    }
  },

  async resendEmail(req, res) {
    try {
      const card = await invitationService.getInvitationCard(req.user.userId, req.params.id)
      const { data: invitation } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('id', req.params.id)
        .single()
      await invitationService.sendInvitationEmail(
        invitation,
        card.inviter,
        card
      )
      return res.json({ message: 'Invitation email sent' })
    } catch (err) {
      const status = err.status || 500
      return res.status(status).json({ error: err.message || 'Server error' })
    }
  },

  async reject(req, res) {
    try {
      const data = await invitationService.rejectInvitation(req.user.userId, req.params.id)
      return res.json({ invitation: data })
    } catch (err) {
      const status = err.status || 500
      return res.status(status).json({ error: err.message || 'Server error' })
    }
  },

  async getPublic(req, res) {
    try {
      const payload = await invitationService.getPublicInvite(req.params.code, req)
      return res.json(payload)
    } catch (err) {
      const status = err.status || 500
      return res.status(status).json({ error: err.message || 'Server error' })
    }
  },

  async track(req, res) {
    try {
      const { event } = req.body
      if (!['opened', 'clicked'].includes(event)) {
        return res.status(400).json({ error: 'Invalid event' })
      }
      await invitationService.trackEvent(req.params.code, event, req)
      return res.json({ ok: true })
    } catch (err) {
      const status = err.status || 500
      return res.status(status).json({ error: err.message || 'Server error' })
    }
  },

  async getAdminSettings(req, res) {
    try {
      const settings = await invitationService.getInviteSettings()
      return res.json(settings)
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateAdminSettings(req, res) {
    try {
      const settings = await invitationService.updateAdminSettings(req.body)
      return res.json(settings)
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },
}
