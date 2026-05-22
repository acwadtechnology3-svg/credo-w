import { supabase } from '../lib/supabase.js'
import { walletService } from '../services/wallet.service.js'

export const withdrawalController = {
  async getWithdrawals(req, res) {
    try {
      const { status, from, to } = req.query
      let query = supabase
        .from('withdrawals')
        .select('*, bank_accounts(account_name, bank_name, account_number)')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data } = await query

      const requested = (data || [])
        .filter((w) => ['requested', 'processing'].includes(w.status))
        .reduce((s, w) => s + parseFloat(w.amount), 0)
      const paid = (data || [])
        .filter((w) => w.status === 'paid')
        .reduce((s, w) => s + parseFloat(w.payable_amount || 0), 0)

      const earningsWallet = await walletService.getWallet(req.user.userId, 'EARNINGS')

      return res.json({
        available_balance: parseFloat(earningsWallet?.balance || 0),
        requested_amount: Math.round(requested * 100) / 100,
        paid_amount: Math.round(paid * 100) / 100,
        withdrawals: data || [],
      })
    } catch (err) {
      console.error('getWithdrawals error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async requestWithdrawal(req, res) {
    try {
      const { amount, bank_account_id } = req.body
      const userId = req.user.userId

      const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'min_withdrawal_egp')
        .single()
      const minAmount = parseFloat(setting?.value || 500)

      if (parseFloat(amount) < minAmount) {
        return res.status(400).json({ error: `Minimum withdrawal is EGP ${minAmount}` })
      }

      const wallet = await walletService.getWallet(userId, 'EARNINGS')
      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: 'Insufficient earnings balance' })
      }

      const { data: feeSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'withdrawal_processing_fee_pct')
        .single()
      const feePct = parseFloat(feeSetting?.value || 2)
      const processingFee = parseFloat(amount) * (feePct / 100)
      const payableAmount = parseFloat(amount) - processingFee

      await walletService.credit(
        userId,
        'EARNINGS',
        -parseFloat(amount),
        'WITHDRAWAL',
        'Withdrawal request'
      )

      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: parseFloat(amount),
          processing_fee: Math.round(processingFee * 100) / 100,
          payable_amount: Math.round(payableAmount * 100) / 100,
          bank_account_id,
          status: 'requested',
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'WITHDRAWAL',
        title: 'Withdrawal requested',
        body: `EGP ${payableAmount.toFixed(2)} withdrawal request submitted`,
      })

      return res.status(201).json({ message: 'Withdrawal requested', withdrawal })
    } catch (err) {
      console.error('requestWithdrawal error:', err)
      if (err.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Insufficient earnings balance' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getBankAccounts(req, res) {
    try {
      const { data } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', req.user.userId)
        .order('is_default', { ascending: false })
      return res.json(data || [])
    } catch (err) {
      console.error('getBankAccounts error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async addBankAccount(req, res) {
    try {
      const { account_name, bank_name, account_number, is_default } = req.body
      if (is_default) {
        await supabase
          .from('bank_accounts')
          .update({ is_default: false })
          .eq('user_id', req.user.userId)
      }
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: req.user.userId,
          account_name,
          bank_name,
          account_number,
          is_default: !!is_default,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('addBankAccount error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteBankAccount(req, res) {
    try {
      await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
      return res.json({ message: 'Deleted' })
    } catch (err) {
      console.error('deleteBankAccount error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
