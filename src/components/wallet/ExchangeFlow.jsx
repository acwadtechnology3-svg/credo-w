import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { exchangeWallets } from '../../api/earnings.api'
import Icon from '../ui/Icon'

export default function ExchangeFlow({ earningsBalance, cmoneyBalance, onClose, onSuccess }) {
  const [direction, setDirection] = useState('earnings-to-cmoney')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const from = direction === 'earnings-to-cmoney' ? 'EARNINGS' : 'CMONEY'
  const to = direction === 'earnings-to-cmoney' ? 'CMONEY' : 'EARNINGS'
  const maxBal = direction === 'earnings-to-cmoney' ? earningsBalance : cmoneyBalance
  const needsPin = from === 'CMONEY'

  const mutation = useMutation({
    mutationFn: () =>
      exchangeWallets({
        from,
        to,
        amount: parseFloat(amount),
        pin: needsPin ? pin : undefined,
        current_password: !needsPin ? password : undefined,
      }),
    onSuccess: () => {
      setDone(true)
      onSuccess?.()
    },
    onError: (err) => setError(err.response?.data?.error || 'فشل التبادل'),
  })

  if (done) {
    return (
      <div className="wallet-panel" style={{ minHeight: 420 }}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'var(--success-soft)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--success)',
            }}
          >
            <Icon name="check" size={36} />
          </div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            تم التبادل
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            {Number(amount).toLocaleString('en-US')} تم نقلها بين المحافظ
          </p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            تم
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-panel" style={{ minHeight: 480 }}>
      <div className="wallet-panel-header">
        <div>
          <div className="t-eyebrow">تبادل</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            بين المحافظ
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" aria-label="إغلاق">
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ padding: 22 }} className="anim-fade-up">
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <div
          style={{
            display: 'flex',
            padding: 3,
            background: 'var(--surface-0)',
            borderRadius: 8,
            border: '1px solid var(--line)',
            marginBottom: 16,
          }}
        >
          {[
            ['earnings-to-cmoney', 'أرباح ← C Money'],
            ['cmoney-to-earnings', 'C Money ← أرباح'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDirection(id)}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: 0,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: direction === id ? 'var(--surface-2)' : 'transparent',
                color: direction === id ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
          الرصيد المتاح:{' '}
          <span className="font-num" style={{ color: 'var(--lavender)', fontWeight: 700 }}>
            {maxBal.toLocaleString('en-US')} {from === 'CMONEY' ? 'C' : 'ج.م'}
          </span>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: 'var(--surface-0)',
            border: '1px solid var(--line)',
            marginBottom: 14,
          }}
        >
          <input
            className="font-num"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: 40,
              fontWeight: 800,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--text-1)',
            }}
          />
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
            ≈ {(Number(amount) || 0).toLocaleString('en-US')} ج.م (1:1)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {[100, 250, 500, maxBal].map((a, i) => (
            <button
              key={i}
              type="button"
              className="btn btn-sm"
              style={{ flex: 1, minWidth: 56 }}
              onClick={() => setAmount(String(Math.floor(a)))}
            >
              {i === 3 ? 'كامل' : a.toLocaleString('en-US')}
            </button>
          ))}
        </div>

        {needsPin ? (
          <label className="field" style={{ marginBottom: 14 }}>
            <span>PIN المحفظة</span>
            <input
              className="input font-mono"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
        ) : (
          <label className="field" style={{ marginBottom: 14 }}>
            <span>كلمة مرور الحساب</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              Number(amount) > maxBal ||
              (needsPin ? pin.length < 6 : !password) ||
              mutation.isPending
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'جاري التبادل...' : 'تأكيد التبادل'}
          </button>
        </div>
      </div>
    </div>
  )
}
