import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getPinStatus, setPin, verifyAccountPassword } from '../../api/earnings.api'
import Icon from '../ui/Icon'

export default function PinPanel({ onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [pendingCheck, setPendingCheck] = useState(false)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: pinStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['pin-status'],
    queryFn: getPinStatus,
  })

  const isFirstTime = pinStatus?.has_pin === false

  useEffect(() => {
    setPasswordVerified(false)
    setPasswordError('')

    if (!password || password.length < 4) {
      setPendingCheck(false)
      setCheckingPassword(false)
      return
    }

    setPendingCheck(true)

    const t = setTimeout(async () => {
      setPendingCheck(false)
      setCheckingPassword(true)
      try {
        await verifyAccountPassword(password)
        setPasswordVerified(true)
        setPasswordError('')
      } catch (err) {
        setPasswordVerified(false)
        setPasswordError(err.response?.data?.error || 'كلمة المرور غير صحيحة')
      } finally {
        setCheckingPassword(false)
      }
    }, 400)

    return () => clearTimeout(t)
  }, [password])

  const isVerifying = pendingCheck || checkingPassword

  const mutation = useMutation({
    mutationFn: () => setPin({ current_password: password, pin }),
    onSuccess: () => {
      setError('')
      setSuccess(true)
      onSuccess?.()
      setTimeout(() => onClose(), 1200)
    },
    onError: (err) => setError(err.response?.data?.error || 'فشل حفظ PIN'),
  })

  const canSubmit =
    passwordVerified && pin.length === 6 && confirm === pin && !mutation.isPending

  const title = isFirstTime ? 'إنشاء PIN' : 'تعديل / إعادة PIN'
  const subtitle = isFirstTime
    ? 'أدخل كلمة مرور الحساب أولاً ثم أنشئ PIN جديد'
    : 'تحقق من كلمة المرور قبل تغيير PIN'

  return (
    <div className="wallet-panel" style={{ minHeight: 420 }}>
      <div className="wallet-panel-header">
        <div>
          <div className="t-eyebrow">C Money</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {statusLoading ? '...' : title}
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" aria-label="إغلاق">
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ padding: 22 }} className="anim-fade-up">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--info-soft)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--lavender)',
            border: '1px solid var(--line-purple)',
            marginBottom: 12,
          }}
        >
          <Icon name="shield" size={22} />
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>{subtitle}</p>

        {success && (
          <div style={{ color: 'var(--success)', fontSize: 12, marginBottom: 12 }}>تم حفظ PIN بنجاح</div>
        )}
        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <label className="field" style={{ marginBottom: passwordVerified ? 14 : 18 }}>
          <span>كلمة مرور الحساب</span>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                paddingInlineEnd: passwordVerified || isVerifying ? 44 : undefined,
                borderColor: passwordVerified
                  ? 'var(--success-edge)'
                  : passwordError
                    ? 'var(--danger)'
                    : undefined,
              }}
            />
            <div
              style={{
                position: 'absolute',
                insetInlineEnd: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {isVerifying && (
                <span className="pin-verify-spinner" aria-hidden="true" />
              )}
              {passwordVerified && !isVerifying && (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#051A12',
                  }}
                >
                  <Icon name="check" size={14} />
                </div>
              )}
            </div>
          </div>
          {isVerifying && !passwordVerified && (
            <span
              className="pin-verify-status pin-verify-status--loading"
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="pin-verify-spinner" aria-hidden="true" />
              جاري التحقق...
            </span>
          )}
          {password.length > 0 && password.length < 4 && !isVerifying && (
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, display: 'block' }}>
              أكمل كتابة كلمة المرور
            </span>
          )}
          {passwordError && !isVerifying && (
            <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6, display: 'block' }}>
              {passwordError}
            </span>
          )}
          {passwordVerified && !isVerifying && (
            <span style={{ fontSize: 11, color: 'var(--success)', marginTop: 6, display: 'block' }}>
              تم التحقق — يمكنك إدخال PIN الجديد
            </span>
          )}
        </label>

        {passwordVerified && (
          <div className="anim-fade-up">
            <label className="field" style={{ marginBottom: 12 }}>
              <span>{isFirstTime ? 'PIN جديد (6 أرقام)' : 'PIN جديد (6 أرقام)'}</span>
              <input
                className="input font-mono"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </label>
            <label className="field" style={{ marginBottom: 18 }}>
              <span>تأكيد PIN</span>
              <input
                className="input font-mono"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  borderColor:
                    confirm.length === 6 && confirm !== pin ? 'var(--danger)' : undefined,
                }}
              />
              {confirm.length === 6 && confirm !== pin && (
                <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                  PIN غير متطابق
                </span>
              )}
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'جاري الحفظ...' : isFirstTime ? 'إنشاء PIN' : 'حفظ PIN'}
          </button>
        </div>
      </div>
    </div>
  )
}
