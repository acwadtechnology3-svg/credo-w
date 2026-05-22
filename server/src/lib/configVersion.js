import { supabase } from './supabase.js'

/**
 * Snapshot config before mutation — preserves historical purchases/ranks.
 */
export async function snapshotConfigVersion(entityType, entityId, snapshot, changedBy, reason = null) {
  const version = (snapshot.config_version ?? 1)

  await supabase.from('config_version_snapshots').insert({
    entity_type: entityType,
    entity_id: entityId,
    version,
    snapshot_json: snapshot,
    changed_by: changedBy,
    change_reason: reason,
  }).catch((e) => {
    if (!/config_version_snapshots|42P01|23505/i.test(e.message || '')) {
      console.warn('[configVersion] snapshot:', e.message)
    }
  })

  const { data, error } = await supabase
    .from(entityType === 'package' ? 'packages' : entityType === 'rank' ? 'ranks' : 'packages')
    .update({
      config_version: version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entityId)
    .select()
    .single()

  if (error && !/config_version/i.test(error.message || '')) throw error
  return data
}
