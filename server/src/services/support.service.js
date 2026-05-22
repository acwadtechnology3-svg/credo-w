import { supabase } from '../lib/supabase.js'
import { notifyUser } from '../lib/notify.js'
import { emitToUser, getIO } from '../lib/socket.js'
import { getAiSuggestion } from './supportAi.service.js'

const ADMIN_ROLES = ['admin', 'super_admin']
const VALID_STATUS = [
  'open',
  'pending',
  'in_review',
  'waiting_user',
  'resolved',
  'closed',
  'in_progress',
]
const VALID_PRIORITY = ['low', 'medium', 'high', 'critical']

/** PostgREST hint: support_tickets has user_id + assigned_agent_id → users */
const TICKET_USER = 'users!user_id'
const MESSAGE_SENDER = 'users!sender_id'

const DEPARTMENT_MAP = {
  technical: 'technical',
  financial: 'financial',
  agency: 'agency',
  packages: 'packages',
  rewards: 'rewards',
  withdrawal: 'withdrawal',
  kyc: 'kyc',
  reports: 'reports',
  administration: 'administration',
  credo_ai: 'credo_ai',
}

export async function buildUserContext(userId, extra = {}) {
  const { data: user } = await supabase
    .from('users')
    .select(
      'id, username, email, full_name, role, status, current_package_level, agency_id, membership_status, ranks(name)'
    )
    .eq('id', userId)
    .single()

  const { data: wallets } = await supabase
    .from('wallets')
    .select('type, balance')
    .eq('user_id', userId)

  let agencyName = null
  if (user?.agency_id) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('name, slug')
      .eq('id', user.agency_id)
      .maybeSingle()
    agencyName = agency?.name
  }

  let recentTx = []
  try {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('type, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    recentTx = data || []
  } catch {
    recentTx = []
  }

  return {
    user_id: userId,
    username: user?.username,
    email: user?.email,
    full_name: user?.full_name,
    role: user?.role,
    status: user?.status,
    package_level: user?.current_package_level,
    rank: user?.ranks?.name,
    agency_id: user?.agency_id,
    agency_name: agencyName,
    membership: user?.membership_status,
    wallets: wallets || [],
    recent_activity: recentTx || [],
    captured_at: new Date().toISOString(),
    ...extra,
  }
}

async function logActivity(ticketId, actorId, action, details = {}) {
  await supabase.from('support_activity_logs').insert({
    ticket_id: ticketId,
    actor_id: actorId,
    action,
    details,
  })
}

function emitTicketEvent(ticket, event, payload) {
  emitToUser(ticket.user_id, event, payload)
  if (ticket.assigned_agent_id) {
    emitToUser(ticket.assigned_agent_id, event, payload)
  }
  try {
    getIO().to('support:staff').emit(event, payload)
  } catch {
    /* socket optional */
  }
}

export const supportService = {
  async getStats() {
    const [{ count: open }, { count: resolved }] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'pending', 'in_review', 'waiting_user', 'in_progress']),
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved'),
    ])
    return {
      open_tickets: open || 0,
      resolved_tickets: resolved || 0,
      avg_response_minutes: 12,
      satisfaction_pct: 97,
    }
  },

  async aiAssist(message, category) {
    return getAiSuggestion(message, DEPARTMENT_MAP[category] || category)
  },

  async createTicket(userId, { department, subject, message, context, escalateFromAi }) {
    const dept = DEPARTMENT_MAP[department] || department || 'general'
    const ctx = await buildUserContext(userId, context || {})

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        category: dept,
        department: dept,
        subject: subject || message?.slice(0, 120) || 'طلب دعم',
        message: message?.trim(),
        status: 'open',
        priority: dept === 'withdrawal' || dept === 'kyc' ? 'high' : 'medium',
        context_json: ctx,
        ai_escalated: !!escalateFromAi,
        escalated_at: escalateFromAi ? new Date().toISOString() : null,
        last_message_at: new Date().toISOString(),
        unread_admin: 1,
      })
      .select(`*, ${TICKET_USER}(username, full_name, email)`)
      .single()

    if (error) throw error

    const { data: msg } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId,
        sender_role: 'user',
        body: message?.trim(),
        message_type: 'text',
      })
      .select()
      .single()

    await logActivity(ticket.id, userId, 'ticket_created', { department: dept })

    emitTicketEvent(ticket, 'support:ticket:new', { ticket, message: msg })

    return { ticket, message: msg }
  },

  async listMyTickets(userId) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('pinned', { ascending: false })
      .order('last_message_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async listAllTickets({ status, department, priority, search, limit = 100 }) {
    let q = supabase
      .from('support_tickets')
      .select(
        `*, ${TICKET_USER}(id, username, email, full_name, current_package_level, agency_id, status)`
      )
      .order('last_message_at', { ascending: false })
      .limit(limit)

    if (status) q = q.eq('status', status)
    if (department) q = q.eq('department', department)
    if (priority) q = q.eq('priority', priority)

    const { data, error } = await q
    if (error) throw error

    let rows = data || []
    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter(
        (t) =>
          t.ticket_number?.toLowerCase().includes(s) ||
          t.subject?.toLowerCase().includes(s) ||
          t.users?.username?.toLowerCase().includes(s)
      )
    }
    return rows
  },

  async getTicket(ticketId, requester) {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select(
        `*, ${TICKET_USER}(id, username, email, full_name, current_package_level, agency_id, profile_image)`
      )
      .eq('id', ticketId)
      .single()

    if (error || !ticket) return null
    const isStaff = ADMIN_ROLES.includes(requester.role)
    if (!isStaff && ticket.user_id !== requester.userId) return null

    const { data: messages } = await supabase
      .from('support_messages')
      .select(`*, ${MESSAGE_SENDER}(username, full_name, profile_image)`)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const { data: attachments } = await supabase
      .from('support_attachments')
      .select('*')
      .eq('ticket_id', ticketId)

    return { ticket, messages: messages || [], attachments: attachments || [] }
  },

  async sendMessage(ticketId, sender, { body, message_type, reply_to_id, metadata, is_internal }) {
    const detail = await this.getTicket(ticketId, sender)
    if (!detail) throw new Error('Ticket not found')
    const { ticket } = detail
    const isStaff = ADMIN_ROLES.includes(sender.role)

    if (!isStaff && ticket.user_id !== sender.userId) {
      throw new Error('Forbidden')
    }
    if (ticket.status === 'closed' && !isStaff) {
      throw new Error('Ticket is closed')
    }

    const { data: msg, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: sender.userId,
        sender_role: isStaff ? sender.role : 'user',
        body: body?.trim() || '',
        message_type: message_type || 'text',
        reply_to_id: reply_to_id || null,
        metadata: metadata || {},
        is_internal: isStaff ? !!is_internal : false,
      })
      .select(`*, ${MESSAGE_SENDER}(username, full_name, profile_image)`)
      .single()

    if (error) throw error

    const updates = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (isStaff) {
      updates.unread_user = (ticket.unread_user || 0) + 1
      if (ticket.status === 'open') updates.status = 'waiting_user'
    } else {
      updates.unread_admin = (ticket.unread_admin || 0) + 1
      if (['resolved', 'closed'].includes(ticket.status)) updates.status = 'open'
    }

    const { data: updated } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single()

    await logActivity(ticketId, sender.userId, 'message_sent', { message_type })

    const payload = { ticket: updated, message: msg }
    emitTicketEvent(updated, 'support:message:new', payload)

    if (!isStaff) {
      try {
        getIO().to('support:staff').emit('support:message:new', payload)
      } catch {
        /* */
      }
    } else {
      await notifyUser(ticket.user_id, {
        type: 'SUPPORT',
        title: 'رد جديد من الدعم',
        body: (body || '').slice(0, 120),
        parentId: ticketId,
      })
    }

    return { message: msg, ticket: updated }
  },

  async updateTicket(ticketId, actor, patch) {
    const allowed = {}
    if (patch.status && VALID_STATUS.includes(patch.status)) allowed.status = patch.status
    if (patch.priority && VALID_PRIORITY.includes(patch.priority)) allowed.priority = patch.priority
    if (patch.assigned_agent_id !== undefined) allowed.assigned_agent_id = patch.assigned_agent_id
    if (patch.pinned !== undefined) allowed.pinned = patch.pinned
    allowed.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('support_tickets')
      .update(allowed)
      .eq('id', ticketId)
      .select(`*, ${TICKET_USER}(username, email)`)
      .single()

    if (error) throw error
    await logActivity(ticketId, actor.userId, 'ticket_updated', allowed)
    emitTicketEvent(data, 'support:ticket:updated', { ticket: data })

    if (allowed.status === 'resolved') {
      await notifyUser(data.user_id, {
        type: 'SUPPORT',
        title: 'تم حل تذكرتك',
        body: data.subject || 'تذكرة الدعم',
        parentId: ticketId,
      })
    }

    return data
  },

  async markRead(ticketId, userId, role) {
    const isStaff = ADMIN_ROLES.includes(role)
    const field = isStaff ? 'unread_admin' : 'unread_user'
    await supabase.from('support_tickets').update({ [field]: 0 }).eq('id', ticketId)
  },

  async uploadAttachment(ticketId, userId, { file_url, file_name, mime_type, size_bytes, message_id }) {
    const { data, error } = await supabase
      .from('support_attachments')
      .insert({
        ticket_id: ticketId,
        message_id: message_id || null,
        file_url,
        file_name,
        mime_type,
        size_bytes,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getUnreadCount(userId, role) {
    const isStaff = ADMIN_ROLES.includes(role)
    const field = isStaff ? 'unread_admin' : 'unread_user'
    let q = supabase.from('support_tickets').select('id', { count: 'exact', head: true })
    q = q.gt(field, 0)
    if (!isStaff) q = q.eq('user_id', userId)
    const { count } = await q
    return count || 0
  },

  async getAdminContext(userId) {
    return buildUserContext(userId, {})
  },
}
