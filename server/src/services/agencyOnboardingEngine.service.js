import { supabase } from '../lib/supabase.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'
import { agencyPackageGateService } from './agencyPackageGate.service.js'

export const AGENCY_ONBOARDING_STEPS = [
  { key: 'welcome', title_ar: 'مرحباً بك', sort: 1 },
  { key: 'what_is_credo', title_ar: 'ما هو Credo W', sort: 2 },
  { key: 'agency_system', title_ar: 'نظام الوكالات', sort: 3 },
  { key: 'bv_pv_cv', title_ar: 'BV / PV / CV', sort: 4 },
  { key: 'placement', title_ar: 'التعيين في الشجرة', sort: 5 },
  { key: 'sponsor', title_ar: 'الراعي', sort: 6 },
  { key: 'binary_tree', title_ar: 'الشجرة الثنائية', sort: 7 },
  { key: 'earnings', title_ar: 'الأرباح', sort: 8 },
  { key: 'rank_system', title_ar: 'نظام الرتب', sort: 9 },
  { key: 'first_recruitment', title_ar: 'مهمة التجنيد الأولى', sort: 10 },
]

const STEP_KEYS = AGENCY_ONBOARDING_STEPS.map((s) => s.key)

export const agencyOnboardingEngine = {
  async launchAfterFirstPackage(userId) {
    const gate = await agencyPackageGateService.getParticipationContext(userId)
    if (!gate.hasActivePackage || !gate.agencyId) return null

    const { data: existing } = await supabase
      .from('agency_member_onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.is_completed) return existing

    const row = {
      user_id: userId,
      agency_id: gate.agencyId,
      current_step_key: existing?.current_step_key || 'welcome',
      completed_steps: existing?.completed_steps || [],
      is_completed: false,
      started_at: existing?.started_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { launched_by: 'first_package_purchase' },
    }

    const { data, error } = await supabase
      .from('agency_member_onboarding_progress')
      .upsert(row)
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('users')
      .update({ agency_onboarding_status: 'in_progress' })
      .eq('id', userId)

    await agencyRealtimeService.emit(gate.agencyId, 'package_activated', {
      targetUserId: userId,
      payload: { onboarding_launched: true },
    })

    return data
  },

  async getProgress(userId) {
    const gate = await agencyPackageGateService.getParticipationContext(userId)

    const { data: progress } = await supabase
      .from('agency_member_onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const completed = new Set(progress?.completed_steps || [])
    const steps = AGENCY_ONBOARDING_STEPS.map((s) => ({
      ...s,
      completed: completed.has(s.key),
      current: progress?.current_step_key === s.key,
    }))

    return {
      steps,
      progress: progress || null,
      package_gate: {
        locked: !gate.hasActivePackage,
        lockedCta: gate.lockedCta,
        canParticipate: gate.canParticipateInAgency,
      },
      percent_complete: progress?.is_completed
        ? 100
        : Math.round((completed.size / STEP_KEYS.length) * 100),
    }
  },

  async completeStep(userId, stepKey) {
    if (!STEP_KEYS.includes(stepKey)) {
      throw Object.assign(new Error('Invalid onboarding step'), { status: 400 })
    }

    const gate = await agencyPackageGateService.getParticipationContext(userId)
    if (!gate.hasActivePackage) {
      throw Object.assign(new Error(gate.lockedCta || 'Package required'), {
        status: 403,
        code: 'PACKAGE_REQUIRED',
      })
    }
    if (!gate.agencyId) {
      throw Object.assign(new Error('Agency membership required'), { status: 403 })
    }

    const { data: existing } = await supabase
      .from('agency_member_onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const completed = [...new Set([...(existing?.completed_steps || []), stepKey])]
    const idx = STEP_KEYS.indexOf(stepKey)
    const nextKey = STEP_KEYS[idx + 1] || stepKey
    const isCompleted = completed.length >= STEP_KEYS.length

    const { data, error } = await supabase
      .from('agency_member_onboarding_progress')
      .upsert({
        user_id: userId,
        agency_id: gate.agencyId,
        current_step_key: isCompleted ? 'first_recruitment' : nextKey,
        completed_steps: completed,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        started_at: existing?.started_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    if (isCompleted) {
      await supabase
        .from('users')
        .update({ agency_onboarding_status: 'completed' })
        .eq('id', userId)
      await supabase.from('agency_member_onboarding').upsert({
        user_id: userId,
        agency_id: gate.agencyId,
        completed_checklist: true,
        completed_at: new Date().toISOString(),
      })
    }

    return this.getProgress(userId)
  },

  async skipToEnd(userId) {
    const gate = await agencyPackageGateService.getParticipationContext(userId)
    if (!gate.agencyId) throw Object.assign(new Error('Not in agency'), { status: 400 })

    await supabase.from('agency_member_onboarding_progress').upsert({
      user_id: userId,
      agency_id: gate.agencyId,
      current_step_key: 'first_recruitment',
      completed_steps: STEP_KEYS,
      is_completed: true,
      completed_at: new Date().toISOString(),
      interrupted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await supabase
      .from('users')
      .update({ agency_onboarding_status: 'completed' })
      .eq('id', userId)

    return this.getProgress(userId)
  },
}
