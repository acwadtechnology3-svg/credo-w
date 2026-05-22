import { supabase } from '../lib/supabase.js'
import { roundMoney } from '../lib/money.js'
import { PURCHASE_STATUS } from '../lib/packageRules.js'
import { purchaseRepository } from '../repositories/purchase.repository.js'
import { checkoutRepository } from '../repositories/checkout.repository.js'
import { purchaseStepService } from './purchaseStep.service.js'
import { PURCHASE_STEPS } from '../lib/packageRules.js'
import { walletService } from './wallet.service.js'

const STUCK_MS = 10 * 60 * 1000

export const purchaseRecoveryService = {
  async expireCheckoutSessions() {
    return checkoutRepository.expireStale(new Date().toISOString())
  },

  async scanStuckPurchases() {
    const since = new Date(Date.now() - STUCK_MS).toISOString()
    const stuck = await purchaseRepository.findStuckProcessing(since)
    for (const row of stuck) {
      await purchaseRepository.transition(
        row.id,
        row.status,
        PURCHASE_STATUS.MANUAL_REVIEW,
        { reason: 'stuck_processing_timeout' }
      )
      await this.logReconciliation({
        userId: row.user_id,
        purchaseTransactionId: row.id,
        issueType: 'stuck_purchase',
        metadata: { status: row.status, created_at: row.created_at },
      })
    }
    return stuck.length
  },

  async logReconciliation({
    userId,
    walletId = null,
    purchaseTransactionId = null,
    expectedBalance = null,
    actualBalance = null,
    issueType,
    metadata = {},
  }) {
    const discrepancy =
      expectedBalance != null && actualBalance != null
        ? roundMoney(actualBalance - expectedBalance)
        : null

    const { error } = await supabase.from('wallet_reconciliation_logs').insert({
      user_id: userId,
      wallet_id: walletId,
      purchase_transaction_id: purchaseTransactionId,
      expected_balance: expectedBalance,
      actual_balance: actualBalance,
      discrepancy,
      issue_type: issueType,
      metadata_json: metadata,
    })
    if (error && !/wallet_reconciliation_logs|42P01/i.test(error.message || '')) {
      console.warn('[reconciliation] log failed:', error.message)
    }
  },

  async verifyWalletAfterDebit(userId, purchaseId, expectedBalanceAfter) {
    try {
      const wallet = await walletService.getWallet(userId, 'CMONEY')
      const actual = roundMoney(wallet.balance)
      const expected = roundMoney(expectedBalanceAfter)
      if (actual !== expected) {
        await this.logReconciliation({
          userId,
          walletId: wallet.id,
          purchaseTransactionId: purchaseId,
          expectedBalance: expected,
          actualBalance: actual,
          issueType: 'balance_mismatch',
        })
      }
    } catch (e) {
      console.warn('[reconciliation] verify wallet:', e.message)
    }
  },

  async compensateWallet(userId, amount, purchaseId, packageName) {
    await purchaseStepService.start(purchaseId, PURCHASE_STEPS.COMPENSATE_WALLET)
    try {
      await walletService.credit(
        userId,
        'CMONEY',
        roundMoney(amount),
        'PURCHASE_REVERSAL',
        `Reversal: ${packageName}`,
        purchaseId
      )
      await purchaseStepService.complete(purchaseId, PURCHASE_STEPS.COMPENSATE_WALLET)
    } catch (e) {
      await purchaseStepService.fail(purchaseId, PURCHASE_STEPS.COMPENSATE_WALLET, e.message)
      await this.logReconciliation({
        userId,
        purchaseTransactionId: purchaseId,
        issueType: 'reversal_failed',
        metadata: { error: e.message },
      })
    }
  },
}
