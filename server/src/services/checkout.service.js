import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { CHECKOUT_TTL_MS } from '../lib/packageRules.js'
import { purchaseError, PurchaseErrorCodes } from '../lib/purchaseErrors.js'
import { normalizePackage, packageService } from './package.service.js'
import { createPackageSnapshot } from './packageSnapshot.service.js'
import { checkoutRepository } from '../repositories/checkout.repository.js'

export const checkoutService = {
  /**
   * Start checkout — locks price via snapshot, one active session per user.
   */
  async createSession(userId, packageId) {
    const { data: rawPkg } = await supabase.from('packages').select('*').eq('id', packageId).single()
    if (!rawPkg?.is_active) {
      throw purchaseError('الباقة غير متاحة', PurchaseErrorCodes.PACKAGE_NOT_FOUND, 404)
    }

    const pkg = normalizePackage(rawPkg)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, status, current_package_level')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw purchaseError('User not found', PurchaseErrorCodes.USER_NOT_FOUND, 404)
    }
    if (user.status === 'suspended') {
      throw purchaseError('الحساب موقوف', PurchaseErrorCodes.USER_SUSPENDED, 403)
    }

    const validation = await packageService.validatePurchase(user, pkg)
    const validatedPkg = validation.normalized || pkg
    const ruleResult = validation.ruleResult

    await checkoutRepository.expireActiveForUser(userId)

    const currentLevel = user.current_package_level || 0
    const snapshot = await createPackageSnapshot(userId, validatedPkg, null)
    const price = roundMoney(ruleResult?.expectedPrice ?? validatedPkg.price_egp)
    const resultingLevel =
      ruleResult?.resultingLevel ??
      (validatedPkg.is_upgrade_only ? validatedPkg.can_upgrade_to_level : validatedPkg.package_level)
    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS).toISOString()

    const session = await checkoutRepository.create({
      user_id: userId,
      package_id: packageId,
      package_snapshot_id: snapshot.id,
      current_level_snapshot: currentLevel,
      amount_locked: price,
      expires_at: expiresAt,
      status: 'active',
    })

    return {
      session: {
        id: session.id,
        package_id: packageId,
        package_snapshot_id: snapshot.id,
        current_level: currentLevel,
        resulting_level: resultingLevel,
        amount_locked: price,
        expires_at: expiresAt,
      },
      package: {
        id: pkg.id,
        name: snapshot.name,
        slots: snapshot.slots,
        bv_points: snapshot.bv_points,
        is_upgrade_only: snapshot.is_upgrade_only,
      },
    }
  },

  async validateSessionForPurchase(userId, checkoutSessionId, packageId) {
    const session = await checkoutRepository.findById(checkoutSessionId, userId)
    if (!session) {
      throw purchaseError('جلسة الشراء غير موجودة', PurchaseErrorCodes.CHECKOUT_NOT_FOUND, 404)
    }
    if (session.status !== 'active') {
      throw purchaseError('جلسة الشراء منتهية', PurchaseErrorCodes.CHECKOUT_EXPIRED, 400)
    }
    if (new Date(session.expires_at) < new Date()) {
      await checkoutRepository.expireActiveForUser(userId)
      throw purchaseError('انتهت صلاحية جلسة الشراء — ابدأ من جديد', PurchaseErrorCodes.CHECKOUT_EXPIRED, 400)
    }
    if (session.package_id !== packageId) {
      throw purchaseError('الباقة لا تطابق جلسة الشراء', PurchaseErrorCodes.CHECKOUT_MISMATCH, 400)
    }

    const { data: snapshot } = await supabase
      .from('package_snapshots')
      .select('*')
      .eq('id', session.package_snapshot_id)
      .single()

    if (!snapshot) {
      throw purchaseError('لقطة الباقة مفقودة', PurchaseErrorCodes.CHECKOUT_NOT_FOUND, 404)
    }

    const { data: livePkg } = await supabase
      .from('packages')
      .select('is_active')
      .eq('id', packageId)
      .single()

    if (!livePkg?.is_active) {
      throw purchaseError('الباقة لم تعد متاحة', PurchaseErrorCodes.PACKAGE_UNAVAILABLE, 400)
    }

    return { session, snapshot }
  },

  async getSession(userId, checkoutSessionId) {
    const row = await checkoutRepository.findById(checkoutSessionId, userId)
    if (!row) {
      throw purchaseError('جلسة الشراء غير موجودة', PurchaseErrorCodes.CHECKOUT_NOT_FOUND, 404)
    }
    const { session, snapshot } = await this.validateSessionForPurchase(
      userId,
      checkoutSessionId,
      row.package_id
    )
    return { session, snapshot }
  },
}
