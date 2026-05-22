import { supabase } from '../lib/supabase.js'
import { pearlsService } from './pearls.service.js'

export const treeOnboardingService = {
  async getActiveSteps() {
    const { data, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (error) throw error
    return data || []
  },

  async getProgress(userId) {
    const { data } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const steps = await this.getActiveSteps()
    return {
      progress: data,
      steps,
      isCompleted: data?.is_completed === true,
      currentStepKey: data?.current_step_key || steps[0]?.step_key,
      completedSteps: data?.completed_steps || [],
    }
  },

  async ensureProgress(userId, firstPurchaseId = null) {
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) return existing.id

    const steps = await this.getActiveSteps()
    const { data, error } = await supabase
      .from('onboarding_progress')
      .insert({
        user_id: userId,
        current_step_key: steps[0]?.step_key || 'welcome',
        first_purchase_id: firstPurchaseId,
      })
      .select('id')
      .single()

    if (error) throw error
    await this.logEvent(userId, 'onboarding_started', { step: steps[0]?.step_key })
    return data.id
  },

  async completeStep(userId, stepKey) {
    const { data: prog } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!prog) await this.ensureProgress(userId)

    const { data: refreshed } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    const completed = Array.isArray(refreshed.completed_steps)
      ? [...refreshed.completed_steps]
      : []
    if (!completed.includes(stepKey)) completed.push(stepKey)

    const steps = await this.getActiveSteps()
    const idx = steps.findIndex((s) => s.step_key === stepKey)
    const nextStep = steps[idx + 1]?.step_key || null
    const allDone = steps.every((s) => completed.includes(s.step_key))

    await supabase
      .from('onboarding_progress')
      .update({
        completed_steps: completed,
        current_step_key: nextStep || stepKey,
        is_completed: allDone,
        completed_at: allDone ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    await this.logEvent(userId, 'step_completed', { stepKey })
    await this.grantStepRewards(userId, stepKey)

    if (allDone) {
      await supabase
        .from('users')
        .update({ tree_onboarding_completed: true })
        .eq('id', userId)
      await this.logEvent(userId, 'onboarding_completed')
      try {
        const { emitOrgEvent, trackOrgAction } = await import('../lib/organizationEvents.js')
        const { organizationGamificationService } = await import('./organizationGamification.service.js')
        const { getUserAgencyId } = await import('../lib/organizationEvents.js')
        const agencyId = await getUserAgencyId(userId)
        await emitOrgEvent(userId, 'onboarding_completed', {
          title: 'اكتمل التعريف التفاعلي',
          body: 'أصبحت جاهزاً لقيادة شبكتك',
        })
        await organizationGamificationService.grantXp(userId, {
          agencyId,
          amount: 200,
          source: 'onboarding_complete',
          idempotencyKey: `onboarding:${userId}`,
        })
        await trackOrgAction(userId, 'onboarding_complete')
      } catch {
        /* optional */
      }
    }

    return { completedSteps: completed, nextStepKey: nextStep, isCompleted: allDone }
  },

  async skipToActivation(userId) {
    const steps = await this.getActiveSteps()
    const keys = steps.map((s) => s.step_key)
    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          user_id: userId,
          completed_steps: keys,
          current_step_key: 'activation',
          is_completed: true,
          completed_at: new Date().toISOString(),
          interrupted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    await supabase.from('users').update({ tree_onboarding_completed: true }).eq('id', userId)
    await this.logEvent(userId, 'onboarding_skipped')
    return { isCompleted: true }
  },

  async logEvent(userId, eventType, metadata = {}) {
    try {
      await supabase.from('onboarding_events').insert({
        user_id: userId,
        event_type: eventType,
        step_key: metadata.stepKey || metadata.step,
        metadata,
      })
    } catch {
      /* table may not exist */
    }
  },

  async grantStepRewards(userId, stepKey) {
    const { data: rewards } = await supabase
      .from('onboarding_rewards')
      .select('*')
      .eq('is_active', true)
      .or(`step_key.eq.${stepKey},step_key.is.null`)

    for (const r of rewards || []) {
      if (r.reward_type === 'pearls' && r.reward_value_json?.amount) {
        try {
          await pearlsService.earn(
            userId,
            'mission_complete',
            r.reward_value_json.amount,
            { reason: 'onboarding', stepKey },
            null
          )
        } catch {
          /* optional */
        }
      }
    }
  },

  async getVisualizationConfig() {
    const { data } = await supabase
      .from('tree_visualization_configs')
      .select('config_json')
      .eq('config_key', 'default')
      .eq('is_active', true)
      .maybeSingle()
    return data?.config_json || {}
  },

  /** Super admin: upsert step */
  async upsertStep(payload) {
    const { step_key, ...rest } = payload
    const { data, error } = await supabase
      .from('onboarding_steps')
      .upsert({ step_key, ...rest, updated_at: new Date().toISOString() }, {
        onConflict: 'step_key',
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
