import { supabase } from '../lib/supabase.js'
import { notifyUser } from '../lib/notify.js'

const NOTIF_SELECT = `
  id, user_id, type, title, body, is_read, created_at, sender_id, parent_id,
  sender:sender_id (id, username, full_name, profile_image),
  recipient:user_id (id, username, full_name)
`

async function assertCanReply(actorId, notification) {
  if (!notification) return { ok: false, status: 404, error: 'Notification not found' }
  if (notification.user_id !== actorId) {
    return { ok: false, status: 403, error: 'You can only reply to messages sent to you' }
  }
  if (!['team_message', 'team_reply'].includes(notification.type)) {
    return { ok: false, status: 400, error: 'This notification cannot be replied to' }
  }
  const replyToId = notification.parent_id || notification.id
  const senderId = notification.sender_id
  if (!senderId) {
    return { ok: false, status: 400, error: 'Cannot identify the sender for this message' }
  }
  return { ok: true, replyToId, senderId }
}

export const notificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId
      const [{ data, count, error }, { count: unreadCount, error: unreadErr }] =
        await Promise.all([
          supabase
            .from('notifications')
            .select(NOTIF_SELECT, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false),
        ])

      if (error) throw error
      if (unreadErr) throw unreadErr

      return res.json({ notifications: data || [], total: count, unreadCount })
    } catch (err) {
      console.error('getNotifications error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getNotification(req, res) {
    try {
      const userId = req.user.userId
      const { id } = req.params

      const { data: notification, error } = await supabase
        .from('notifications')
        .select(NOTIF_SELECT)
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      if (!notification) return res.status(404).json({ error: 'Notification not found' })

      const threadRootId = notification.parent_id || notification.id

      const { data: thread } = await supabase
        .from('notifications')
        .select(NOTIF_SELECT)
        .or(`id.eq.${threadRootId},parent_id.eq.${threadRootId}`)
        .order('created_at', { ascending: true })

      const canReply = ['team_message', 'team_reply'].includes(notification.type) && !!notification.sender_id

      if (!notification.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId)
        notification.is_read = true
      }

      return res.json({ notification, thread: thread || [], canReply })
    } catch (err) {
      console.error('getNotification error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getSentMessages(req, res) {
    try {
      const userId = req.user.userId

      const { data: sent, error } = await supabase
        .from('notifications')
        .select(
          `
          id, title, body, created_at, type,
          recipient:user_id (id, username, full_name)
        `
        )
        .eq('sender_id', userId)
        .is('parent_id', null)
        .in('type', ['team_message'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const ids = (sent || []).map((s) => s.id)
      let repliesByParent = {}

      if (ids.length > 0) {
        const { data: replies } = await supabase
          .from('notifications')
          .select('id, parent_id, body, created_at, is_read, user_id, sender:sender_id(username, full_name)')
          .in('parent_id', ids)
          .order('created_at', { ascending: true })

        for (const r of replies || []) {
          if (!repliesByParent[r.parent_id]) repliesByParent[r.parent_id] = []
          repliesByParent[r.parent_id].push(r)
        }
      }

      const messages = (sent || []).map((m) => {
        const replies = repliesByParent[m.id] || []
        const unreadReplies = replies.filter((r) => r.user_id === userId && !r.is_read).length
        return {
          ...m,
          replies,
          reply_count: replies.length,
          unread_replies: unreadReplies,
        }
      })

      const unreadRepliesTotal = messages.reduce((n, m) => n + m.unread_replies, 0)

      return res.json({ messages, unreadRepliesTotal })
    } catch (err) {
      console.error('getSentMessages error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async replyToNotification(req, res) {
    try {
      const userId = req.user.userId
      const { id } = req.params
      const { body } = req.body

      if (!body?.trim()) {
        return res.status(400).json({ error: 'Reply message is required' })
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, sender_id, parent_id')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      const access = await assertCanReply(userId, notification)
      if (!access.ok) return res.status(access.status).json({ error: access.error })

      const { data: sender } = await supabase
        .from('users')
        .select('username, full_name')
        .eq('id', userId)
        .maybeSingle()

      const senderLabel = sender?.full_name || sender?.username || 'عضو'
      const replyBody = body.trim().slice(0, 500)
      const rootTitle = notification.title || 'رسالة الفريق'

      await notifyUser(access.senderId, {
        type: 'team_reply',
        title: `رد على: ${rootTitle}`.slice(0, 120),
        body: replyBody,
        senderId: userId,
        parentId: access.replyToId,
      })

      return res.json({ message: 'Reply sent' })
    } catch (err) {
      console.error('replyToNotification error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async markRead(req, res) {
    try {
      const { ids } = req.body
      if (ids && ids.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', ids)
          .eq('user_id', req.user.userId)
      } else {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', req.user.userId)
          .eq('is_read', false)
      }
      return res.json({ message: 'Marked as read' })
    } catch (err) {
      console.error('markRead error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteNotification(req, res) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
      return res.json({ message: 'Deleted' })
    } catch (err) {
      console.error('deleteNotification error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
