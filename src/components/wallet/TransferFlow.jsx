import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Icon from '../ui/Icon'
import { lookupTransferUser, transferCMoney } from '../../api/earnings.api'

export default function TransferFlow({ step, setStep, balance, onClose, onSuccess, initialRecipient = '' }) {
  const [recipientQuery, setRecipientQuery] = useState(initialRecipient)
  const [recipient, setRecipient] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [pinShake, setPinShake] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [txRef, setTxRef] = useState('')

  const stepLabels = ['', 'المستلم', 'المبلغ', 'المراجعة', 'PIN', 'مكتمل']

  useEffect(() => {
    if (initialRecipient) setRecipientQuery(initialRecipient)
  }, [initialRecipient])

  useEffect(() => {
    if (step !== 1 || recipientQuery.length < 2) {
      setRecipient(null)
      setLookupError('')
      return
    }
    const t = setTimeout(async () => {
      try {
        setLookupError('')
        const user = await lookupTransferUser(recipientQuery)
        setRecipient(user)
      } catch (err) {
        setRecipient(null)
        setLookupError(err.response?.data?.error || 'المستخدم غير موجود')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [recipientQuery, step])

  const transferMutation = useMutation({
    mutationFn: () =>
      transferCMoney({
        to_username: recipient.username,
        amount: parseFloat(amount),
        pin,
      }),
    onSuccess: (data) => {
      setTxRef(data.message || 'TRX-OK')
      setStep(5)
      onSuccess?.()
    },
    onError: (err) => {
      setTransferError(err.response?.data?.error || 'فشل التحويل')
      setPinShake(true)
      setTimeout(() => setPinShake(false), 500)
      setPin('')
    },
  })

  const confirmPin = () => {
    if (pin.length < 6) return
    setTransferError('')
    transferMutation.mutate()
  }

  const initials = (recipient?.full_name || '?').trim().charAt(0)

  return (
    <div className="wallet-panel" style={{ minHeight: 540 }}>
      <div className="wallet-panel-header">
        <div>
          <div className="t-eyebrow">تحويل C Money</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {stepLabels[step]}
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" aria-label="إغلاق">
          <Icon name="x" size={14} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '14px 22px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ display: 'contents' }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                background:
                  step >= i ? (step === 5 && i === 5 ? 'var(--success)' : 'var(--purple)') : 'var(--surface-2)',
                color: step >= i ? '#fff' : 'var(--text-3)',
                border: step === i ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--line)',
                boxShadow: step === i ? '0 0 0 3px rgba(123,108,246,0.18)' : 'none',
                transition: 'all 220ms',
              }}
            >
              {step > i ? '✓' : i}
            </div>
            {i < 5 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: step > i ? 'var(--purple)' : 'var(--surface-2)',
                  borderRadius: 1,
                  transition: 'background 220ms',
                }}
              />
            )}
          </span>
        ))}
      </div>

      <div style={{ padding: 22 }}>
        {transferError && step === 4 && (
          <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
            {transferError}
          </div>
        )}

        {step === 1 && (
          <div className="anim-fade-up">
            <label className="field" style={{ marginBottom: 14 }}>
              <span>User ID المستلم</span>
              <input
                className="input font-mono"
                placeholder="username أو USR-XXXXXX"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                autoFocus
                style={{ fontSize: 15 }}
              />
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setRecipientQuery('USR-103021')}
              >
                <Icon name="team" size={11} />
                محمد سامي
              </button>
              <button type="button" className="btn btn-sm" disabled>
                <Icon name="qr" size={11} />
                QR
              </button>
            </div>

            {lookupError && (
              <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{lookupError}</div>
            )}

            {recipient && (
              <div
                className="anim-scale-in"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--success-soft)',
                  border: '1px solid var(--success-edge)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#0A0A0A',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {recipient.full_name} · {recipient.rank}
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {recipient.user_code || recipient.username} · موثّق
                  </div>
                </div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#051A12',
                  }}
                >
                  <Icon name="check" size={14} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={onClose}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!recipient}
                onClick={() => setStep(2)}
              >
                متابعة
                <Icon name="arrow-left" size={12} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade-up">
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
              الرصيد المتاح:{' '}
              <span
                className="font-mono"
                style={{ color: 'var(--lavender)', fontSize: 13, fontWeight: 700 }}
              >
                {balance.toLocaleString('en-US')} C
              </span>
            </div>

            <div
              style={{
                padding: 22,
                borderRadius: 14,
                background: 'var(--surface-0)',
                border: '1px solid var(--line)',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-3)',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                المبلغ بالـ C Money
              </div>
              <input
                className="font-num"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 48,
                  fontWeight: 800,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: 'var(--text-1)',
                  letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-num)',
                }}
              />
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                ≈ {(Number(amount) || 0).toLocaleString('en-US')} ج.م
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {[100, 250, 500, 1000, balance].map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-sm"
                  style={{ flex: 1, minWidth: 56, justifyContent: 'center' }}
                  onClick={() => setAmount(String(Math.floor(a)))}
                >
                  {i === 4 ? 'كامل' : a.toLocaleString('en-US')}
                </button>
              ))}
            </div>

            {amount && Number(amount) > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 10,
                  background: 'var(--surface-0)',
                  border: '1px solid var(--line)',
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                <span style={{ color: 'var(--text-3)' }}>الرصيد بعد التحويل</span>
                <span
                  className="font-num"
                  style={{
                    color: Number(amount) > balance ? 'var(--danger)' : 'var(--text-1)',
                    fontWeight: 700,
                  }}
                >
                  {(balance - Number(amount)).toLocaleString('en-US')} C
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button type="button" className="btn" onClick={() => setStep(1)}>
                <Icon name="arrow-right" size={12} />
                السابق
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!amount || Number(amount) <= 0 || Number(amount) > balance}
                onClick={() => setStep(3)}
              >
                متابعة
                <Icon name="arrow-left" size={12} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && recipient && (
          <div className="anim-fade-up">
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                border: '1px solid var(--line)',
                background: 'var(--surface-0)',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 18,
                  paddingBottom: 18,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>
                  سترسل
                </div>
                <div className="font-num metric-glow" style={{ fontSize: 44, fontWeight: 800, color: 'var(--lavender)' }}>
                  {Number(amount).toLocaleString('en-US')}{' '}
                  <span style={{ fontSize: 16, color: 'var(--text-3)' }}>C</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  ≈ {Number(amount).toLocaleString('en-US')} ج.م
                </div>
              </div>

              {[
                ['من', 'أنت', 'team'],
                ['إلى', `${recipient.full_name} · ${recipient.user_code || recipient.username}`, 'team'],
                ['الرسوم', '0 C · مجاناً', 'gift'],
                ['الوصول', 'فوري', 'zap'],
              ].map(([k, v, ic]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    fontSize: 12.5,
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--text-3)' }}>
                    <Icon name={ic} size={11} />
                    {k}
                  </span>
                  <span style={{ fontWeight: 600 }} className={k === 'من' || k === 'إلى' ? 'font-mono' : ''}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button type="button" className="btn" onClick={() => setStep(2)}>
                <Icon name="arrow-right" size={12} />
                السابق
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                <Icon name="shield" size={12} />
                تأكيد بالـ PIN
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="anim-fade-up" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 14px',
                borderRadius: 14,
                background: 'var(--info-soft)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--lavender)',
                border: '1px solid var(--line-purple)',
              }}
            >
              <Icon name="lock" size={24} />
            </div>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>
              أدخل PIN المحفظة
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 22, marginTop: 4 }}>
              6 أرقام · محمية
            </div>

            <div className={pinShake ? 'pin-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 38,
                    height: 50,
                    borderRadius: 10,
                    border: pin.length === i ? '2px solid var(--purple)' : '1px solid var(--line)',
                    background: pin[i] ? 'var(--info-soft)' : 'var(--surface-0)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: pin.length === i ? '0 0 0 3px rgba(123,108,246,0.18)' : 'none',
                    transition: 'all 150ms var(--ease-spring)',
                  }}
                >
                  {pin[i] && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: 'var(--lavender)',
                        boxShadow: '0 0 10px rgba(196,184,255,0.8)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                maxWidth: 260,
                margin: '0 auto 14px',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'face', 0, '⌫'].map((k, i) => {
                if (k === 'face') {
                  return (
                    <button key={i} type="button" className="btn" style={{ padding: 16, justifyContent: 'center', background: 'var(--surface-1)' }} disabled>
                      <Icon name="shield" size={16} />
                    </button>
                  )
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (k === '⌫') setPin(pin.slice(0, -1))
                      else if (pin.length < 6) setPin(pin + String(k))
                    }}
                    style={{
                      padding: 16,
                      justifyContent: 'center',
                      fontSize: 18,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      background: 'var(--surface-1)',
                    }}
                  >
                    {k}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 11 }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStep(3)}>
                <Icon name="arrow-right" size={11} />
                تعديل
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={pin.length < 6 || transferMutation.isPending}
                onClick={confirmPin}
              >
                {transferMutation.isPending ? 'جاري التحويل...' : 'تأكيد'}
                <Icon name="check" size={12} />
              </button>
            </div>
          </div>
        )}

        {step === 5 && recipient && (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 18px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'var(--success-soft)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--success)',
                  boxShadow: '0 0 0 6px rgba(43,217,160,0.10), 0 0 40px rgba(43,217,160,0.4)',
                }}
              >
                <Icon name="check" size={44} strokeWidth={2.4} />
              </div>
              <div className="transfer-success-ring" style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid var(--success)', opacity: 0.6 }} />
            </div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              تم التحويل
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20 }}>
              تم إرسال{' '}
              <strong style={{ color: 'var(--success)' }}>{Number(amount).toLocaleString('en-US')} C</strong> إلى{' '}
              <span className="font-mono" style={{ color: 'var(--lavender)' }}>
                {recipient.user_code || recipient.username}
              </span>
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-0)',
                border: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>العملية</span>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--lavender)' }}>
                {txRef}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button type="button" className="btn" onClick={onClose}>
                تحويل آخر
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                تم
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
