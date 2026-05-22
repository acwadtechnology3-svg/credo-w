import { supabase } from '../lib/supabase.js'

export const purchaseStepService = {
  async start(purchaseId, stepName, metadata = {}) {
    const { data, error } = await supabase
      .from('purchase_steps')
      .insert({
        purchase_transaction_id: purchaseId,
        step_name: stepName,
        status: 'started',
        metadata_json: metadata,
      })
      .select()
      .single()
    if (error && !/purchase_steps|42P01/i.test(error.message || '')) throw error
    return data
  },

  async complete(purchaseId, stepName) {
    const { error } = await supabase
      .from('purchase_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('purchase_transaction_id', purchaseId)
      .eq('step_name', stepName)
      .eq('status', 'started')
    if (error && !/purchase_steps|42P01/i.test(error.message || '')) throw error
  },

  async fail(purchaseId, stepName, errorMessage) {
    const { error } = await supabase
      .from('purchase_steps')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('purchase_transaction_id', purchaseId)
      .eq('step_name', stepName)
      .eq('status', 'started')
    if (error && !/purchase_steps|42P01/i.test(error.message || '')) throw error
  },

  async skip(purchaseId, stepName, reason) {
    const { error } = await supabase
      .from('purchase_steps')
      .insert({
        purchase_transaction_id: purchaseId,
        step_name: stepName,
        status: 'skipped',
        error_message: reason,
        completed_at: new Date().toISOString(),
      })
    if (error && !/purchase_steps|42P01/i.test(error.message || '')) throw error
  },
}
