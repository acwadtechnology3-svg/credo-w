import { supabase } from './supabase.js'
import { emitToUser } from './socket.js'

/** Insert notification and push real-time event to the user. */
export async function notifyUser(userId, { type, title, body, senderId = null, parentId = null }) {
  const row = {
    user_id: userId,
    type,
    title,
    body,
    sender_id: senderId || null,
    parent_id: parentId || null,
  }

  const { data, error } = await supabase.from('notifications').insert(row).select().single()

  if (!error && data) {
    emitToUser(userId, 'notification:new', data)
  }
  return data
}
