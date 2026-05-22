import { supportService } from '../services/support.service.js'
import { getStorageSupabase } from '../lib/supabase.js'

const ADMIN_ROLES = ['admin', 'super_admin']

function isStaff(role) {
  return ADMIN_ROLES.includes(role)
}

export const supportController = {
  async getStats(req, res) {
    try {
      const stats = await supportService.getStats()
      return res.json(stats)
    } catch (err) {
      console.error('support stats:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async aiAssist(req, res) {
    try {
      const { message, category } = req.body
      const result = await supportService.aiAssist(message, category)
      return res.json(result)
    } catch (err) {
      console.error('aiAssist:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createTicket(req, res) {
    try {
      const { department, category, subject, message, context, escalateFromAi } = req.body
      const body = message?.trim()
      if (!body || body.length < 3) {
        return res.status(400).json({ error: 'الرسالة قصيرة جداً' })
      }
      const result = await supportService.createTicket(req.user.userId, {
        department: department || category,
        subject,
        message: body,
        context: { ...context, page: context?.page || req.headers['x-page-path'] },
        escalateFromAi,
      })
      return res.status(201).json(result)
    } catch (err) {
      console.error('createTicket:', err)
      return res.status(500).json({ error: err.message || 'Server error' })
    }
  },

  async getMyTickets(req, res) {
    try {
      const tickets = await supportService.listMyTickets(req.user.userId)
      return res.json(tickets)
    } catch (err) {
      console.error('getMyTickets:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getUnread(req, res) {
    try {
      const count = await supportService.getUnreadCount(req.user.userId, req.user.role)
      return res.json({ count })
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAllTickets(req, res) {
    try {
      const tickets = await supportService.listAllTickets(req.query)
      return res.json(tickets)
    } catch (err) {
      console.error('getAllTickets:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getTicket(req, res) {
    try {
      const detail = await supportService.getTicket(req.params.id, req.user)
      if (!detail) return res.status(404).json({ error: 'Not found' })
      if (!isStaff(req.user.role)) {
        await supportService.markRead(req.params.id, req.user.userId, req.user.role)
      }
      return res.json(detail)
    } catch (err) {
      console.error('getTicket:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async sendMessage(req, res) {
    try {
      const { body, message_type, reply_to_id, metadata, is_internal } = req.body
      if (!body?.trim() && message_type === 'text') {
        return res.status(400).json({ error: 'Message required' })
      }
      const result = await supportService.sendMessage(req.params.id, req.user, {
        body,
        message_type,
        reply_to_id,
        metadata,
        is_internal,
      })
      return res.json(result)
    } catch (err) {
      console.error('sendMessage:', err)
      const rls = err.code === '42501'
      const status = err.message === 'Forbidden' ? 403 : 500
      return res.status(status).json({
        error: rls
          ? 'صلاحيات الدردشة محجوبة (RLS). شغّل server/src/db/fix-support-messages-rls.sql في Supabase، أو ضع SUPABASE_SERVICE_KEY = service_role في .env.'
          : err.message || 'Server error',
      })
    }
  },

  async updateTicket(req, res) {
    try {
      const ticket = await supportService.updateTicket(req.params.id, req.user, req.body)
      return res.json({ ticket })
    } catch (err) {
      console.error('updateTicket:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async replyTicket(req, res) {
    try {
      const { admin_reply, status } = req.body
      await supportService.sendMessage(req.params.id, req.user, {
        body: admin_reply,
        message_type: 'text',
      })
      const ticket = await supportService.updateTicket(req.params.id, req.user, {
        status: status || 'resolved',
      })
      return res.json({ message: 'Replied', ticket })
    } catch (err) {
      console.error('replyTicket:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async uploadFile(req, res) {
    try {
      const { file_base64, file_name, mime_type } = req.body
      if (!file_base64 || !file_name) {
        return res.status(400).json({ error: 'file required' })
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
      const mime = mime_type || 'image/jpeg'
      if (!allowed.some((m) => mime.startsWith(m.split('/')[0]) || mime === m)) {
        return res.status(400).json({ error: 'نوع الملف غير مدعوم' })
      }
      const buffer = Buffer.from(file_base64.replace(/^data:[^;]+;base64,/, ''), 'base64')
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'الملف أكبر من 5MB' })
      }
      const ext = file_name.split('.').pop() || 'bin'
      const path = `support/${req.params.id}/${Date.now()}.${ext}`
      const storage = getStorageSupabase()
      const { error: uploadErr } = await storage.storage
        .from('uploads')
        .upload(path, buffer, { contentType: mime, upsert: false })
      if (uploadErr) {
        return res.status(500).json({ error: uploadErr.message })
      }
      const { data: urlData } = storage.storage.from('uploads').getPublicUrl(path)
      const att = await supportService.uploadAttachment(req.params.id, req.user.userId, {
        file_url: urlData.publicUrl,
        file_name,
        mime_type: mime,
        size_bytes: buffer.length,
      })
      const msgType = mime.startsWith('image/') ? 'image' : 'file'
      const result = await supportService.sendMessage(req.params.id, req.user, {
        body: file_name,
        message_type: msgType,
        metadata: { attachment_id: att.id, file_url: urlData.publicUrl },
      })
      return res.json({ attachment: att, ...result })
    } catch (err) {
      console.error('uploadFile:', err)
      return res.status(500).json({ error: err.message || 'Upload failed' })
    }
  },

  async getUserContext(req, res) {
    try {
      const ctx = await supportService.getAdminContext(req.params.userId)
      return res.json(ctx)
    } catch (err) {
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
