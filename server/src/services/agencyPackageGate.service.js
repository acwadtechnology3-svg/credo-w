import { supabase } from '../lib/supabase.js'

const LOCKED_CTA_AR =
  'اشترِ باقة لتفعيل منظمتك وفتح الشجرة الثنائية والأرباح الكاملة'

export const agencyPackageGateService = {
  async getParticipationContext(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, user_code, username, status, sponsor_id, agency_id, current_package_level, membership_status, tree_status, agency_onboarding_status'
      )
      .eq('id', userId)
      .single()

    if (error) throw error

    const hasActivePackage =
      user.status === 'active' &&
      user.membership_status === 'active' &&
      (user.current_package_level || 0) > 0

    const { data: purchase } = await supabase
      .from('purchase_transactions')
      .select('id, status, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: membership } = await supabase
      .from('agency_members')
      .select('agency_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    return {
      user,
      hasActivePackage,
      hasVerifiedAccount: user.status === 'active',
      hasCompletedPurchase: !!purchase,
      isAgencyMember: !!membership,
      agencyId: membership?.agency_id || user.agency_id || null,
      agencyRole: membership?.role || null,
      lockedReason: !hasActivePackage
        ? 'no_package'
        : user.status !== 'active'
          ? 'account_not_verified'
          : null,
      lockedCta: !hasActivePackage ? LOCKED_CTA_AR : null,
      canParticipateInAgency: hasActivePackage && user.status === 'active' && !!membership,
      canUsePlacement: hasActivePackage && user.status === 'active',
    }
  },

  async assertAgencyParticipation(userId, { requirePackage = true, requireMembership = false } = {}) {
    const ctx = await this.getParticipationContext(userId)
    if (!ctx.hasVerifiedAccount) {
      throw Object.assign(new Error('الحساب غير مُفعّل'), { status: 403, code: 'ACCOUNT_NOT_VERIFIED' })
    }
    if (requirePackage && !ctx.hasActivePackage) {
      throw Object.assign(new Error(LOCKED_CTA_AR), {
        status: 403,
        code: 'PACKAGE_REQUIRED',
        lockedCta: LOCKED_CTA_AR,
      })
    }
    if (requireMembership && !ctx.isAgencyMember) {
      throw Object.assign(new Error('يجب الانضمام لوكالة أولاً'), {
        status: 403,
        code: 'AGENCY_MEMBERSHIP_REQUIRED',
      })
    }
    return ctx
  },
}
