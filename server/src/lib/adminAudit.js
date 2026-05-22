import { supabase } from './supabase.js'

/**
 * Immutable admin audit trail for P2 business control.
 */
export async function logAdminAction({
  actorId,
  action,
  entity,
  entityId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  metadata = {},
}) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    ip_address: ipAddress,
  })

  if (error) {
    console.warn('[adminAudit]', error.message)
  }

  if (Object.keys(metadata).length) {
    try {
      await supabase.from('business_events').insert({
        event_type: 'admin_action',
        user_id: actorId,
        entity_type: entity,
        entity_id: entityId,
        payload_json: { action, ...metadata },
      })
    } catch {
      /* business_events may not exist yet */
    }
  }
}
