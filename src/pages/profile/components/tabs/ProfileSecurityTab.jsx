import { motion } from 'framer-motion'

export default function ProfileSecurityTab({
  pwForm,
  setPwForm,
  pinForm,
  setPinForm,
  pinStatus,
  onChangePassword,
  onSetPin,
  pwPending,
  pinPending,
}) {
  return (
    <motion.div className="pi-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pi-glass" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Change Password</h3>
        {['current_password', 'new_password', 'confirm_password'].map((key) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </label>
            <input
              type="password"
              className="pi-form-input"
              value={pwForm[key]}
              onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
            />
          </div>
        ))}
        <button
          type="button"
          className="pi-btn pi-btn-primary"
          style={{ width: '100%' }}
          onClick={onChangePassword}
          disabled={pwPending}
        >
          {pwPending ? 'Changing…' : 'Change Password'}
        </button>
      </div>

      <div className="pi-glass" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>C Money PIN</h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
          {pinStatus?.has_pin
            ? '✓ PIN is set. Update below.'
            : '⚠ Set a 6-digit PIN to enable C Money transfers.'}
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
            New 6-digit PIN
          </label>
          <input
            type="password"
            maxLength={6}
            className="pi-form-input"
            placeholder="••••••"
            value={pinForm.pin}
            onChange={(e) =>
              setPinForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))
            }
            style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
            Confirm with password
          </label>
          <input
            type="password"
            className="pi-form-input"
            value={pinForm.current_password}
            onChange={(e) => setPinForm((p) => ({ ...p, current_password: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className="pi-btn pi-btn-primary"
          style={{ width: '100%' }}
          onClick={onSetPin}
          disabled={pinPending || pinForm.pin.length !== 6}
        >
          {pinPending ? 'Setting…' : pinStatus?.has_pin ? 'Update PIN' : 'Set PIN'}
        </button>
      </div>
    </motion.div>
  )
}
