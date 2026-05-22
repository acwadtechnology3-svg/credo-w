import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { getLevelName, PURCHASE_STATUS, PENDING_PURCHASE_WINDOW_MS, PURCHASE_STEPS } from '../lib/packageRules.js'
import { TERMINAL_STATUSES, normalizePurchaseStatus } from '../lib/purchaseStateMachine.js'
import { purchaseError, PurchaseErrorCodes } from '../lib/purchaseErrors.js'
import { normalizePackage, packageService } from './package.service.js'
import { checkoutService } from './checkout.service.js'
import { purchaseRepository } from '../repositories/purchase.repository.js'
import { checkoutRepository } from '../repositories/checkout.repository.js'
import { purchaseStepService } from './purchaseStep.service.js'
import { walletService } from './wallet.service.js'
import { purchaseEffectsService } from './purchaseEffects.service.js'
import { purchaseRecoveryService } from './purchaseRecovery.service.js'

async function createOrder(userId, userCode, amount) {
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const orderRef = `PO-${userCode}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      order_ref: orderRef,
      user_id: userId,
      subtotal: amount,
      tax_amount: 0,
      discount_amount: 0,
      total: amount,
      status: 'processing',
      payment_method: 'cmoney',
      bv_credited: false,
    })
    .select()
    .single()

  if (error) throw error
  return { order, orderRef }
}

function formatResponse(purchase, order, orderRef, upgrade, snapshot) {
  const isUpgrade = snapshot?.is_upgrade_only
  return {
    success: true,
    message: isUpgrade
      ? `تمت الترقية بنجاح إلى ${getLevelName(upgrade.newLevel)}`
      : `تم الاشتراك في ${snapshot?.name ?? 'الباقة'} بنجاح`,
    purchase: {
      id: purchase.id,
      status: normalizePurchaseStatus(purchase.status),
      idempotency_key: purchase.idempotency_key,
      checkout_session_id: purchase.checkout_session_id,
    },
    order: order ? { id: order.id, order_ref: orderRef } : null,
    membership: upgrade,
    snapshot_id: snapshot?.id,
  }
}

export const purchaseOrchestrator = {
  /**
   * P1 primary entry: checkout session + idempotency.
   */
  async executePurchase({
    userId,
    packageId,
    checkoutSessionId,
    idempotencyKey,
    paymentMethod = 'cmoney',
  }) {
    if (!idempotencyKey || idempotencyKey.length < 8) {
      throw purchaseError('idempotency_key مطلوب', PurchaseErrorCodes.INVALID_IDEMPOTENCY)
    }
    if (!checkoutSessionId) {
      throw purchaseError('checkout_session_id مطلوب', PurchaseErrorCodes.SESSION_REQUIRED)
    }

    const existing = await purchaseRepository.findByIdempotencyKey(idempotencyKey)
    if (existing) {
      if (normalizePurchaseStatus(existing.status) === PURCHASE_STATUS.COMPLETED) {
        const { data: order } = existing.order_id
          ? await supabase.from('orders').select('id, order_ref').eq('id', existing.order_id).single()
          : { data: null }
        const { data: snapshot } = existing.package_snapshot_id
          ? await supabase.from('package_snapshots').select('*').eq('id', existing.package_snapshot_id).single()
          : { data: null }
        return formatResponse(
          existing,
          order,
          order?.order_ref,
          {
            previousLevel: existing.previous_level,
            newLevel: existing.resulting_level,
            slotsAdded: existing.slots_added,
            totalSlots: null,
            packageName: snapshot?.name,
          },
          snapshot
        )
      }
      if (!TERMINAL_STATUSES.has(normalizePurchaseStatus(existing.status))) {
        throw purchaseError('عملية شراء قيد المعالجة', PurchaseErrorCodes.PURCHASE_IN_PROGRESS)
      }
    }

    const since = new Date(Date.now() - PENDING_PURCHASE_WINDOW_MS).toISOString()
    const inFlight = await purchaseRepository.findInFlightForUser(userId, since)
    if (inFlight && inFlight.id !== existing?.id) {
      throw purchaseError('لديك عملية شراء جارية', PurchaseErrorCodes.PURCHASE_LOCKED)
    }

    const { session, snapshot: sessionSnapshot } = await checkoutService.validateSessionForPurchase(
      userId,
      checkoutSessionId,
      packageId
    )

    const pkg = normalizePackage({
      id: sessionSnapshot.package_id,
      name: sessionSnapshot.name,
      description: sessionSnapshot.description,
      price_egp: sessionSnapshot.price_egp,
      bv_points: sessionSnapshot.bv_points,
      pv_points: sessionSnapshot.pv_points,
      direct_commission_egp: sessionSnapshot.direct_commission_egp,
      package_level: sessionSnapshot.package_level,
      slots: sessionSnapshot.slots,
      is_upgrade_only: sessionSnapshot.is_upgrade_only,
      required_current_level: sessionSnapshot.required_current_level,
      can_upgrade_to_level: sessionSnapshot.can_upgrade_to_level,
      rules_version: sessionSnapshot.rules_version,
      permissions_json: sessionSnapshot.permissions_json,
      is_active: true,
    })

    const price = roundMoney(session.amount_locked)
    const amountWallet = paymentMethod === 'cmoney' ? price : 0

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'id, user_code, status, current_package_level, current_slots, total_slots_purchased, sponsor_id'
      )
      .eq('id', userId)
      .single()

    if (userError || !user) throw purchaseError('User not found', PurchaseErrorCodes.USER_NOT_FOUND, 404)
    if (user.status === 'suspended') {
      throw purchaseError('الحساب موقوف', PurchaseErrorCodes.USER_SUSPENDED, 403)
    }

    const validation = await packageService.validatePurchase(user, pkg)
    const ruleResult = validation.ruleResult

    const currentLevel = user.current_package_level || 0
    if (currentLevel !== session.current_level_snapshot) {
      throw purchaseError(
        'تغيّر مستواك أثناء الشراء — ابدأ جلسة شراء جديدة',
        PurchaseErrorCodes.CHECKOUT_MISMATCH
      )
    }

    const newLevel =
      ruleResult?.resultingLevel ??
      (pkg.is_upgrade_only ? pkg.can_upgrade_to_level : pkg.package_level)

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('type', 'CMONEY')
      .single()

    if (roundMoney(wallet?.balance || 0) < amountWallet) {
      throw purchaseError('رصيد C Money غير كافٍ', PurchaseErrorCodes.INSUFFICIENT_BALANCE)
    }

    let purchase
    try {
      purchase = await purchaseRepository.create({
        user_id: userId,
        package_id: packageId,
        checkout_session_id: checkoutSessionId,
        package_snapshot_id: sessionSnapshot.id,
        payment_method: paymentMethod,
        amount: price,
        amount_total: price,
        amount_wallet: amountWallet,
        amount_external: 0,
        previous_level: currentLevel,
        resulting_level: newLevel,
        slots_added: pkg.slots,
        status: PURCHASE_STATUS.INITIATED,
        idempotency_key: idempotencyKey,
      })
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        const dup = await purchaseRepository.findByIdempotencyKey(idempotencyKey)
        if (dup) return this.executePurchase({ userId, packageId, checkoutSessionId, idempotencyKey, paymentMethod })
      }
      throw insertErr
    }

    await supabase
      .from('package_snapshots')
      .update({ purchase_transaction_id: purchase.id })
      .eq('id', sessionSnapshot.id)

    let order = null
    let orderRef = null

    try {
      await purchaseRepository.transition(
        purchase.id,
        PURCHASE_STATUS.INITIATED,
        PURCHASE_STATUS.ELIGIBILITY_CHECKED
      )
      await purchaseRepository.transition(
        purchase.id,
        PURCHASE_STATUS.ELIGIBILITY_CHECKED,
        PURCHASE_STATUS.PAYMENT_PENDING
      )

      await purchaseStepService.start(purchase.id, PURCHASE_STEPS.CREATE_ORDER)
      const orderResult = await createOrder(userId, user.user_code, price)
      order = orderResult.order
      orderRef = orderResult.orderRef
      await purchaseRepository.update(purchase.id, { order_id: order.id })
      await purchaseStepService.complete(purchase.id, PURCHASE_STEPS.CREATE_ORDER)

      await purchaseStepService.start(purchase.id, PURCHASE_STEPS.WALLET_DEBIT)
      const balanceAfter = await walletService.debit(
        userId,
        'CMONEY',
        amountWallet,
        'PURCHASE',
        `Package: ${pkg.name}`,
        purchase.id
      )
      await purchaseStepService.complete(purchase.id, PURCHASE_STEPS.WALLET_DEBIT)

      await purchaseRepository.transition(
        purchase.id,
        PURCHASE_STATUS.PAYMENT_PENDING,
        PURCHASE_STATUS.PAYMENT_CONFIRMED,
        { balance_after: balanceAfter }
      )
      await purchaseRecoveryService.verifyWalletAfterDebit(userId, purchase.id, balanceAfter)

      await purchaseRepository.transition(
        purchase.id,
        PURCHASE_STATUS.PAYMENT_CONFIRMED,
        PURCHASE_STATUS.PROCESSING
      )

      await purchaseStepService.start(purchase.id, PURCHASE_STEPS.APPLY_MEMBERSHIP)
      const upgrade = await packageService.applyMembership({
        userId,
        packageId,
        pkg,
        orderId: order.id,
        purchaseTransactionId: purchase.id,
        packageSnapshotId: sessionSnapshot.id,
        currentLevel,
        newLevel,
      })
      await purchaseStepService.complete(purchase.id, PURCHASE_STEPS.APPLY_MEMBERSHIP)

      await supabase.from('orders').update({ status: 'delivered', bv_credited: true }).eq('id', order.id)

      await purchaseEffectsService.runPostPaymentEffects({
        purchaseId: purchase.id,
        userId,
        user,
        pkg,
        snapshot: sessionSnapshot,
        order,
        upgrade,
      })

      purchase = await purchaseRepository.transition(
        purchase.id,
        PURCHASE_STATUS.PROCESSING,
        PURCHASE_STATUS.COMPLETED,
        { resulting_level: upgrade.newLevel, slots_added: upgrade.slotsAdded }
      )

      await purchaseRepository.update(purchase.id, {
        resulting_level: upgrade.newLevel,
        slots_added: upgrade.slotsAdded,
      })

      await checkoutRepository.markCompleted(checkoutSessionId)

      return formatResponse(purchase, order, orderRef, upgrade, sessionSnapshot)
    } catch (err) {
      console.error('[orchestrator] failed:', err.message, purchase.id)

      try {
        await purchaseRepository.transition(
          purchase.id,
          normalizePurchaseStatus(purchase.status),
          PURCHASE_STATUS.COMPENSATING,
          { error: err.message }
        )
      } catch {
        await purchaseRepository.update(purchase.id, {
          status: PURCHASE_STATUS.FAILED,
          failure_reason: err.message,
          completed_at: new Date().toISOString(),
        })
      }

      if (order?.id) {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      }

      await purchaseRecoveryService.compensateWallet(userId, amountWallet, purchase.id, pkg.name)

      try {
        await purchaseRepository.transition(
          purchase.id,
          PURCHASE_STATUS.COMPENSATING,
          PURCHASE_STATUS.FAILED,
          { failure: err.message }
        )
      } catch {
        await purchaseRepository.update(purchase.id, {
          status: PURCHASE_STATUS.FAILED,
          failure_reason: err.message,
          completed_at: new Date().toISOString(),
        })
      }

      await checkoutRepository.expireActiveForUser(userId)

      if (err.code === 'INSUFFICIENT_BALANCE') {
        throw purchaseError('رصيد C Money غير كافٍ', PurchaseErrorCodes.INSUFFICIENT_BALANCE)
      }
      if (err.code === 'DUPLICATE_TRANSACTION') {
        throw purchaseError('تم خصم هذه العملية مسبقاً', PurchaseErrorCodes.DUPLICATE_TRANSACTION)
      }
      throw err
    }
  },

  /** Legacy P0: auto-create checkout session then purchase. */
  async executeFromLegacy({ userId, packageId, idempotencyKey, paymentMethod = 'cmoney' }) {
    const { session } = await checkoutService.createSession(userId, packageId)
    return this.executePurchase({
      userId,
      packageId,
      checkoutSessionId: session.id,
      idempotencyKey,
      paymentMethod,
    })
  },

  /** @deprecated alias for legacy routes */
  async executePackagePurchase(opts) {
    return this.executeFromLegacy(opts)
  },

  async getPurchase(userId, purchaseId) {
    const purchase = await purchaseRepository.findById(purchaseId, userId)
    if (!purchase) throw purchaseError('عملية الشراء غير موجودة', 'NOT_FOUND', 404)

    const { data: steps } = await supabase
      .from('purchase_steps')
      .select('step_name, status, error_message, started_at, completed_at')
      .eq('purchase_transaction_id', purchaseId)
      .order('started_at')

    const { data: transitions } = await supabase
      .from('purchase_transition_log')
      .select('from_status, to_status, created_at')
      .eq('purchase_transaction_id', purchaseId)
      .order('created_at')

    return {
      purchase: {
        ...purchase,
        status: normalizePurchaseStatus(purchase.status),
      },
      steps: steps || [],
      transitions: transitions || [],
    }
  },
}
