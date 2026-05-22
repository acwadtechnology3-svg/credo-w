import { supabase } from '../lib/supabase.js'
import { CHECKOUT_STATUS } from '../lib/packageRules.js'

export const checkoutRepository = {
  async expireActiveForUser(userId) {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({
        status: CHECKOUT_STATUS.EXPIRED,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', CHECKOUT_STATUS.ACTIVE)
    if (error && !/checkout_sessions|does not exist|42P01/i.test(error.message || '')) {
      throw error
    }
  },

  async create(row) {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async findById(id, userId = null) {
    let q = supabase.from('checkout_sessions').select('*').eq('id', id)
    if (userId) q = q.eq('user_id', userId)
    const { data, error } = await q.maybeSingle()
    if (error) throw error
    return data
  },

  async findActiveForUser(userId) {
    const { data } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', CHECKOUT_STATUS.ACTIVE)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data
  },

  async markCompleted(id) {
    return supabase
      .from('checkout_sessions')
      .update({
        status: CHECKOUT_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
  },

  async expireStale(nowIso) {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .update({
        status: CHECKOUT_STATUS.EXPIRED,
        completed_at: new Date().toISOString(),
      })
      .eq('status', CHECKOUT_STATUS.ACTIVE)
      .lt('expires_at', nowIso)
      .select('id')
    if (error && !/checkout_sessions|42P01/i.test(error.message || '')) throw error
    return data?.length ?? 0
  },
}
