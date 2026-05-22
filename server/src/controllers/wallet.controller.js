import { supabase } from '../lib/supabase.js'
import { walletService } from '../services/wallet.service.js'
import bcrypt from 'bcrypt'

async function verifyCmoneyPin(senderId, pin) {
  const { data: sender } = await supabase
    .from('users')
    .select('cmoney_pin_hash, cmoney_pin_attempts, cmoney_locked_until')
    .eq('id', senderId)
    .single()

  if (sender.cmoney_locked_until && new Date(sender.cmoney_locked_until) > new Date()) {
    const err = new Error('PIN locked. Try again later.')
    err.status = 423
    throw err
  }
  if (!sender.cmoney_pin_hash) {
    const err = new Error('C Money PIN not set. Set it in your profile first.')
    err.status = 400
    throw err
  }

  const pinValid = await bcrypt.compare(String(pin), sender.cmoney_pin_hash)
  if (!pinValid) {
    const attempts = (sender.cmoney_pin_attempts || 0) + 1
    const updateData = { cmoney_pin_attempts: attempts }
    if (attempts >= 5) {
      updateData.cmoney_locked_until = new Date(Date.now() + 30 * 60 * 1000)
      updateData.cmoney_pin_attempts = 0
    }
    await supabase.from('users').update(updateData).eq('id', senderId)
    const err = new Error(`Invalid PIN. ${5 - attempts} attempts remaining.`)
    err.status = 401
    throw err
  }

  await supabase
    .from('users')
    .update({ cmoney_pin_attempts: 0, cmoney_locked_until: null })
    .eq('id', senderId)
}

async function verifyPassword(userId, password) {
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single()
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    const err = new Error('Invalid password')
    err.status = 401
    throw err
  }
}

export const walletController = {
  async getSummary(req, res) {
    try {
      const userId = req.user.userId
      const since = new Date()
      since.setDate(since.getDate() - 30)

      const { data: wallets } = await supabase
        .from('wallets')
        .select('id, type, balance')
        .eq('user_id', userId)

      const earningsWallet = wallets?.find((w) => w.type === 'EARNINGS')
      const cmoneyWallet = wallets?.find((w) => w.type === 'CMONEY')
      const walletById = Object.fromEntries((wallets || []).map((w) => [w.id, w.type]))

      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      const allTxs = txs || []
      const cmoneyTxs = allTxs.filter((t) => walletById[t.wallet_id] === 'CMONEY')
      const earningsTxs = allTxs.filter((t) => walletById[t.wallet_id] === 'EARNINGS')

      const sumCat = (list, cats) =>
        list
          .filter((t) => cats.includes(t.category))
          .reduce((s, t) => s + parseFloat(t.amount || 0), 0)

      const monthlyIn = cmoneyTxs
        .filter((t) => parseFloat(t.amount) > 0)
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      const monthlyOut = cmoneyTxs
        .filter((t) => parseFloat(t.amount) < 0)
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0)

      const transactions = allTxs.map((t) => ({
        ...t,
        wallet: walletById[t.wallet_id] === 'CMONEY' ? 'cmoney' : 'earnings',
        amt: parseFloat(t.amount),
      }))

      return res.json({
        earnings: {
          balance: parseFloat(earningsWallet?.balance || 0),
          direct:
            Math.round(sumCat(earningsTxs, ['DIRECT_COMMISSION', 'RETAIL_PROFIT']) * 100) / 100,
          team: Math.round(sumCat(earningsTxs, ['TEAM_COMMISSION']) * 100) / 100,
          level: Math.round(sumCat(earningsTxs, ['LEVEL_BONUS']) * 100) / 100,
        },
        cmoney: {
          balance: parseFloat(cmoneyWallet?.balance || 0),
          monthlyIn: Math.round(monthlyIn * 100) / 100,
          monthlyOut: Math.round(monthlyOut * 100) / 100,
          txCount: cmoneyTxs.length,
        },
        transactions,
      })
    } catch (err) {
      console.error('getSummary error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async lookupUser(req, res) {
    try {
      const q = String(req.query.q || '').trim()
      if (q.length < 2) {
        return res.status(400).json({ error: 'أدخل اسم مستخدم أو رمز المستخدم' })
      }

      let query = supabase
        .from('users')
        .select('id, username, user_code, full_name, status, ranks(name)')
        .eq('status', 'active')
        .limit(1)

      if (q.includes('-') || q.toUpperCase().startsWith('USR')) {
        query = query.eq('user_code', q.toUpperCase())
      } else {
        query = query.eq('username', q.replace(/^@/, ''))
      }

      const { data: user, error } = await query.single()
      if (error || !user) return res.status(404).json({ error: 'المستخدم غير موجود' })
      if (user.id === req.user.userId) {
        return res.status(400).json({ error: 'لا يمكن التحويل لنفسك' })
      }

      return res.json({
        id: user.id,
        username: user.username,
        user_code: user.user_code,
        full_name: user.full_name || user.username,
        rank: user.ranks?.name || 'Member',
      })
    } catch (err) {
      console.error('lookupUser error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getWallets(req, res) {
    try {
      const { data } = await supabase
        .from('wallets')
        .select('type, balance')
        .eq('user_id', req.user.userId)
      return res.json(data || [])
    } catch (err) {
      console.error('getWallets error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async receiveInfo(req, res) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('username, user_code, full_name')
        .eq('id', req.user.userId)
        .single()

      const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
      const payTo = user.user_code || user.username
      const shareLink = `${origin}/earnings/wallet?send=${encodeURIComponent(payTo)}`

      return res.json({
        username: user.username,
        user_code: user.user_code,
        full_name: user.full_name || user.username,
        share_link: shareLink,
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareLink)}`,
      })
    } catch (err) {
      console.error('receiveInfo error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async exchangeWallets(req, res) {
    try {
      const { from, to, amount, pin, current_password } = req.body
      const userId = req.user.userId
      const amt = parseFloat(amount)

      if (!from || !to || !amount) {
        return res.status(400).json({ error: 'from, to and amount required' })
      }
      if (!['EARNINGS', 'CMONEY'].includes(from) || !['EARNINGS', 'CMONEY'].includes(to)) {
        return res.status(400).json({ error: 'Invalid wallet type' })
      }
      if (from === to) {
        return res.status(400).json({ error: 'Cannot exchange to the same wallet' })
      }
      if (amt <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' })
      }

      if (from === 'CMONEY') {
        if (!pin) return res.status(400).json({ error: 'PIN required' })
        try {
          await verifyCmoneyPin(userId, pin)
        } catch (e) {
          return res.status(e.status || 401).json({ error: e.message })
        }
      } else {
        if (!current_password) {
          return res.status(400).json({ error: 'Password required to move from earnings' })
        }
        try {
          await verifyPassword(userId, current_password)
        } catch (e) {
          return res.status(e.status || 401).json({ error: e.message })
        }
      }

      const fromLabel = from === 'CMONEY' ? 'C Money' : 'الأرباح'
      const toLabel = to === 'CMONEY' ? 'C Money' : 'الأرباح'

      await walletService.credit(userId, from, -amt, 'EXCHANGE_OUT', `تبادل من ${fromLabel} إلى ${toLabel}`)
      await walletService.credit(userId, to, amt, 'EXCHANGE_IN', `تبادل من ${fromLabel} إلى ${toLabel}`)

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'EXCHANGE',
        title: 'تم التبادل',
        body: `EGP ${amt} من ${fromLabel} إلى ${toLabel}`,
      })

      return res.json({ message: 'Exchange completed', amount: amt, from, to })
    } catch (err) {
      console.error('exchangeWallets error:', err)
      if (err.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Insufficient balance' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async transferCMoney(req, res) {
    try {
      const { to_username, amount, pin } = req.body
      const senderId = req.user.userId

      if (!to_username || !amount || !pin) {
        return res.status(400).json({ error: 'username, amount and PIN required' })
      }
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' })
      }

      try {
        await verifyCmoneyPin(senderId, pin)
      } catch (e) {
        return res.status(e.status || 401).json({ error: e.message })
      }

      const { data: sender } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', senderId)
        .single()

      const q = String(to_username).trim()
      let recvQuery = supabase.from('users').select('id, username, status').limit(1)
      if (q.includes('-') || q.toUpperCase().startsWith('USR')) {
        recvQuery = recvQuery.eq('user_code', q.toUpperCase())
      } else {
        recvQuery = recvQuery.eq('username', q.replace(/^@/, ''))
      }
      const { data: receiver, error: recvErr } = await recvQuery.single()
      if (recvErr || !receiver) return res.status(404).json({ error: 'User not found' })
      if (receiver.id === senderId) {
        return res.status(400).json({ error: 'Cannot transfer to yourself' })
      }
      if (receiver.status !== 'active') {
        return res.status(400).json({ error: 'Receiver account not active' })
      }

      const senderWallet = await walletService.getWallet(senderId, 'CMONEY')
      if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: 'Insufficient C Money balance' })
      }

      await walletService.credit(
        senderId,
        'CMONEY',
        -parseFloat(amount),
        'TRANSFER_OUT',
        `Transfer to ${receiver.username}`
      )

      await walletService.credit(
        receiver.id,
        'CMONEY',
        parseFloat(amount),
        'TRANSFER_IN',
        `Transfer from ${sender.username}`
      )

      await supabase.from('notifications').insert([
        {
          user_id: senderId,
          type: 'TRANSFER',
          title: 'C Money sent',
          body: `EGP ${amount} sent to ${receiver.username}`,
        },
        {
          user_id: receiver.id,
          type: 'TRANSFER',
          title: 'C Money received',
          body: `EGP ${amount} received from ${sender.username}`,
        },
      ])

      return res.json({
        message: `EGP ${amount} transferred to ${receiver.username} successfully`,
      })
    } catch (err) {
      console.error('Transfer error:', err)
      if (err.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Insufficient C Money balance' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getPinStatus(req, res) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('cmoney_pin_hash')
        .eq('id', req.user.userId)
        .single()
      return res.json({ has_pin: !!user?.cmoney_pin_hash })
    } catch (err) {
      console.error('getPinStatus error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async verifyAccountPassword(req, res) {
    try {
      const { current_password } = req.body
      if (!current_password) {
        return res.status(400).json({ error: 'كلمة المرور مطلوبة', valid: false })
      }
      try {
        await verifyPassword(req.user.userId, current_password)
        const { data: user } = await supabase
          .from('users')
          .select('cmoney_pin_hash')
          .eq('id', req.user.userId)
          .single()
        return res.json({ valid: true, has_pin: !!user?.cmoney_pin_hash })
      } catch {
        return res.status(401).json({ valid: false, error: 'كلمة المرور غير صحيحة' })
      }
    } catch (err) {
      console.error('verifyAccountPassword error:', err)
      return res.status(500).json({ error: 'Server error', valid: false })
    }
  },

  async setPin(req, res) {
    try {
      const { pin, current_password } = req.body
      if (!pin || String(pin).length !== 6 || isNaN(pin)) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' })
      }

      try {
        await verifyPassword(req.user.userId, current_password)
      } catch {
        return res.status(401).json({ error: 'Invalid password' })
      }

      const pinHash = await bcrypt.hash(String(pin), 10)
      await supabase
        .from('users')
        .update({
          cmoney_pin_hash: pinHash,
          cmoney_pin_attempts: 0,
          cmoney_locked_until: null,
        })
        .eq('id', req.user.userId)

      return res.json({ message: 'C Money PIN set successfully' })
    } catch (err) {
      console.error('setPin error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
