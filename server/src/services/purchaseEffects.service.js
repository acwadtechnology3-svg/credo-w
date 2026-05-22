import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { getLevelName } from '../lib/packageRules.js'
import { purchaseStepService } from './purchaseStep.service.js'
import { PURCHASE_STEPS } from '../lib/packageRules.js'
import { bvService } from './bv.service.js'
import { rankService } from './rank.service.js'
import { pearlsService } from './pearls.service.js'
import { progressionEngine } from './progressionEngine.service.js'
import { walletService } from './wallet.service.js'

/**
 * Side effects after payment — failures logged on steps, non-blocking where noted.
 */
export const purchaseEffectsService = {
  async runPostPaymentEffects({
    purchaseId,
    userId,
    user,
    pkg,
    snapshot,
    order,
    upgrade,
  }) {
    const isUpgrade = pkg.is_upgrade_only
    let mlmHandled = false

    await purchaseStepService.start(purchaseId, PURCHASE_STEPS.CREDIT_BV)
    try {
      const { mlmPropagationService } = await import('./mlm/mlmPropagation.service.js')
      await mlmPropagationService.emitPackagePurchase({
        userId,
        user,
        pkg,
        order,
        purchaseTransactionId: purchaseId,
        isUpgrade,
      })
      mlmHandled = true
      await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.CREDIT_BV)
    } catch (mlmErr) {
      if (/mlm_events|42P01/i.test(mlmErr.message || '')) {
        if (pkg.bv_points > 0) {
          try {
            await bvService.creditBV(userId, pkg.bv_points, order.id)
            await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.CREDIT_BV)
          } catch (e) {
            await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.CREDIT_BV, e.message)
            await this.enqueueJob('retry_bv', { purchaseId, orderId: order.id, bv: pkg.bv_points })
          }
        } else {
          await purchaseStepService.skip(purchaseId, PURCHASE_STEPS.CREDIT_BV, 'no_bv')
        }
      } else {
        console.warn('[purchase] MLM propagation:', mlmErr.message)
        await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.CREDIT_BV, mlmErr.message)
      }
    }

    if (!mlmHandled) {
      if (pkg.direct_commission_egp > 0 && user.sponsor_id) {
        await purchaseStepService.start(purchaseId, PURCHASE_STEPS.DIRECT_COMMISSION)
        try {
          await walletService.credit(
            user.sponsor_id,
            'EARNINGS',
            roundMoney(pkg.direct_commission_egp),
            'DIRECT_COMMISSION',
            `Direct commission — ${pkg.name} by ${user.user_code}`,
            order.id
          )
          await supabase.from('notifications').insert({
            user_id: user.sponsor_id,
            type: 'DIRECT_COMMISSION',
            title: 'عمولة مباشرة جديدة! 💰',
            body: `أحد أعضاء فريقك اشترى باقة ${pkg.name} — EGP ${pkg.direct_commission_egp} أضيفت لمحفظتك`,
          })
          await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.DIRECT_COMMISSION)
        } catch (e) {
          await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.DIRECT_COMMISSION, e.message)
        }
      } else {
        await purchaseStepService.skip(purchaseId, PURCHASE_STEPS.DIRECT_COMMISSION, 'no_commission')
      }

      await purchaseStepService.start(purchaseId, PURCHASE_STEPS.RANK_CHECK)
      try {
        await rankService.checkAndUpdateRank(userId)
        await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.RANK_CHECK)
      } catch (e) {
        await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.RANK_CHECK, e.message)
      }
    } else {
      await purchaseStepService.skip(purchaseId, PURCHASE_STEPS.DIRECT_COMMISSION, 'mlm_engine')
      await purchaseStepService.skip(purchaseId, PURCHASE_STEPS.RANK_CHECK, 'mlm_engine')
    }

    await purchaseStepService.start(purchaseId, PURCHASE_STEPS.PEARLS)
    try {
      await pearlsService.onPackagePurchased(userId, pkg, order.id, pkg.is_upgrade_only)
      await progressionEngine.onPurchase(userId, pkg, order.id, pkg.is_upgrade_only)
      await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.PEARLS)
    } catch (e) {
      await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.PEARLS, e.message)
    }

    const isFirstPurchase =
      upgrade?.previousLevel === 0 || (!pkg.is_upgrade_only && (upgrade?.previousLevel ?? 0) === 0)
    try {
      const { treeActivationService } = await import('./treeActivation.service.js')
      await treeActivationService.activateForUser(userId, { isFirstPurchase })
    } catch (treeErr) {
      console.warn('[purchase] tree activation:', treeErr.message)
    }

    try {
      const { emitOrgEvent, trackOrgAction, getUserAgencyId } = await import('../lib/organizationEvents.js')
      const { organizationGamificationService } = await import('./organizationGamification.service.js')
      const agencyId = await getUserAgencyId(userId)
      const eventType = pkg.is_upgrade_only ? 'package_upgraded' : 'package_purchased'
      await emitOrgEvent(userId, eventType, {
        title: pkg.is_upgrade_only ? `ترقية إلى ${pkg.name}` : `اشتراك ${pkg.name}`,
        body: `+${pkg.bv_points} BV`,
        payload: { packageLevel: pkg.package_level, orderId: order.id },
      })
      await organizationGamificationService.grantXp(userId, {
        agencyId,
        amount: pkg.is_upgrade_only ? 80 : 150,
        source: eventType,
        referenceId: order.id,
        idempotencyKey: `org-xp:${order.id}`,
      })
      await trackOrgAction(userId, 'bv_credit', { increment: pkg.bv_points })
      if (!pkg.is_upgrade_only) await trackOrgAction(userId, 'package_purchase')
      else await trackOrgAction(userId, 'package_upgrade')
    } catch (orgErr) {
      console.warn('[purchase] org gamification:', orgErr.message)
    }

    await supabase
      .from('users')
      .update({ team_foundation_status: 'not_applicable' })
      .eq('id', userId)

    try {
      const { data: member } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (member?.agency_id) {
        await supabase
          .from('users')
          .update({ agency_onboarding_status: 'pending' })
          .eq('id', userId)
        if (isFirstPurchase) {
          const { agencyOnboardingEngine } = await import('./agencyOnboardingEngine.service.js')
          await agencyOnboardingEngine.launchAfterFirstPackage(userId)
        }
        try {
          const { emitLiveEvent } = await import('./agencyGroups.service.js')
          await emitLiveEvent(member.agency_id, 'package_upgraded', {
            userId,
            payload: { packageLevel: pkg.package_level, name: pkg.name },
          })
        } catch {
          /* optional */
        }
      }
    } catch (agencyErr) {
      console.warn('[purchase] agency onboarding:', agencyErr.message)
    }

    await purchaseStepService.start(purchaseId, PURCHASE_STEPS.NOTIFY_USER)
    try {
      const isUpgrade = pkg.is_upgrade_only
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'PACKAGE_PURCHASED',
        title: isUpgrade
          ? `تمت الترقية إلى ${getLevelName(upgrade.newLevel)}! 🎉`
          : `تم الاشتراك في باقة ${pkg.name}! 🎉`,
        body: `${isUpgrade ? `تمت ترقيتك من ${getLevelName(upgrade.previousLevel)} إلى ${getLevelName(upgrade.newLevel)}` : `اشتراكك في باقة ${pkg.name} ناجح`}. تمت إضافة ${pkg.bv_points} BV`,
      })
      await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.NOTIFY_USER)
    } catch (e) {
      await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.NOTIFY_USER, e.message)
    }
  },

  async enqueueJob(jobType, payload) {
    const { error } = await supabase.from('purchase_job_queue').insert({
      job_type: jobType,
      payload_json: payload,
      status: 'pending',
    })
    if (error && !/purchase_job_queue|42P01/i.test(error.message || '')) {
      console.warn('[purchase] enqueue job failed:', error.message)
    }
  },
}
