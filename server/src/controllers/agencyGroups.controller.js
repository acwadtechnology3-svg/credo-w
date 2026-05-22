import { agencyGroupsService } from '../services/agencyGroups.service.js'
import { getStorageSupabase } from '../lib/supabase.js'

export const agencyGroupsController = {
  async workspace(req, res) {
    try {
      const data = await agencyGroupsService.getWorkspace(req.user.userId, req.params.agencyId)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message, code: err.code })
    }
  },

  async messages(req, res) {
    try {
      const data = await agencyGroupsService.getMessages(
        req.user.userId,
        req.params.agencyId,
        req.params.channelId,
        { before: req.query.before, limit: parseInt(req.query.limit, 10) || 50 }
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async sendMessage(req, res) {
    try {
      const msg = await agencyGroupsService.sendMessage(
        req.user.userId,
        req.params.agencyId,
        req.params.channelId,
        req.body
      )
      return res.json({ message: msg })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async upload(req, res) {
    try {
      const { file_base64, file_name, mime_type, message_type } = req.body
      if (!file_base64 || !file_name) {
        return res.status(400).json({ error: 'file required' })
      }
      const mime = mime_type || 'image/jpeg'
      const buffer = Buffer.from(file_base64.replace(/^data:[^;]+;base64,/, ''), 'base64')
      if (buffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'الملف أكبر من 8MB' })
      }
      const ext = file_name.split('.').pop() || 'bin'
      const path = `agency-groups/${req.params.agencyId}/${Date.now()}-${ext}`
      const storage = getStorageSupabase()
      const { error: uploadErr } = await storage.storage
        .from('uploads')
        .upload(path, buffer, { contentType: mime, upsert: false })
      if (uploadErr) return res.status(500).json({ error: uploadErr.message })
      const { data: urlData } = storage.storage.from('uploads').getPublicUrl(path)
      const msgType =
        message_type ||
        (mime.startsWith('audio/') ? 'voice' : mime.startsWith('image/') ? 'image' : 'file')

      const msg = await agencyGroupsService.sendMessage(
        req.user.userId,
        req.params.agencyId,
        req.params.channelId,
        {
          body: file_name,
          message_type: msgType,
          metadata: { file_url: urlData.publicUrl },
          attachments: [
            {
              file_url: urlData.publicUrl,
              file_name,
              mime_type: mime,
              size_bytes: buffer.length,
            },
          ],
        }
      )
      return res.json({ message: msg })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async reaction(req, res) {
    try {
      const result = await agencyGroupsService.toggleReaction(
        req.user.userId,
        req.params.agencyId,
        req.params.messageId,
        req.body.emoji
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async pin(req, res) {
    try {
      const result = await agencyGroupsService.pinMessage(
        req.user.userId,
        req.params.agencyId,
        req.params.messageId,
        req.body.pinned !== false
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async deleteMessage(req, res) {
    try {
      const scope = req.body?.scope || req.query?.scope || 'self'
      const result = await agencyGroupsService.deleteMessage(
        req.user.userId,
        req.params.agencyId,
        req.params.messageId,
        { scope }
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async mute(req, res) {
    try {
      const result = await agencyGroupsService.moderateMute(
        req.user.userId,
        req.params.agencyId,
        req.params.userId,
        req.body
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async ban(req, res) {
    try {
      const result = await agencyGroupsService.moderateBan(
        req.user.userId,
        req.params.agencyId,
        req.params.userId,
        req.body
      )
      return res.json(result)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async warn(req, res) {
    try {
      const data = await agencyGroupsService.warnUser(
        req.user.userId,
        req.params.agencyId,
        req.params.userId,
        req.body
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async search(req, res) {
    try {
      const data = await agencyGroupsService.search(req.user.userId, req.params.agencyId, {
        q: req.query.q,
        type: req.query.type,
        channelId: req.query.channel_id,
      })
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async analytics(req, res) {
    try {
      const data = await agencyGroupsService.getAnalytics(req.user.userId, req.params.agencyId)
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async ai(req, res) {
    try {
      const data = await agencyGroupsService.aiAssist(
        req.user.userId,
        req.params.agencyId,
        req.params.channelId,
        req.body.question
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async members(req, res) {
    try {
      const data = await agencyGroupsService.listMembers(req.user.userId, req.params.agencyId)
      return res.json({ members: data })
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },

  async createEventRoom(req, res) {
    try {
      const data = await agencyGroupsService.createEventRoom(
        req.user.userId,
        req.params.agencyId,
        req.body
      )
      return res.json(data)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  },
}
