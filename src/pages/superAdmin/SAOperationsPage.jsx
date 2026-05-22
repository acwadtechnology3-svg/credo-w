import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { setMaintenance, reverseCommission, grantBV } from '../../api/superAdmin.api'

export default function SAOperationsPage() {
  const [maintenanceOn, setMaintenanceOn] = useState(false)
  const [maintenanceMsg, setMaintenanceMsg] = useState('')
  const [reverseForm, setReverseForm] = useState({ user_id: '', amount: '', reason: '' })
  const [bvForm, setBvForm] = useState({ user_id: '', amount: '', side: 'LEFT', reason: '' })
  const [msg, setMsg] = useState('')

  const cardStyle = {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  }
  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#EEEDFE',
    marginBottom: '8px',
  }
  const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '3px' }

  const maintenanceMutation = useMutation({
    mutationFn: () => setMaintenance(maintenanceOn, maintenanceMsg),
    onSuccess: (r) => setMsg(r.message),
  })

  const reverseMutation = useMutation({
    mutationFn: reverseCommission,
    onSuccess: (r) => {
      setMsg(r.message)
      setReverseForm({ user_id: '', amount: '', reason: '' })
    },
  })

  const bvMutation = useMutation({
    mutationFn: grantBV,
    onSuccess: (r) => {
      setMsg(r.message)
      setBvForm({ user_id: '', amount: '', side: 'LEFT', reason: '' })
    },
  })

  return (
    <div>
      <h1 style={{ color: '#EEEDFE', fontSize: '18px', fontWeight: '500', marginBottom: '20px' }}>
        Operations
      </h1>

      {msg && (
        <div
          style={{
            background: '#27500A20',
            border: '1px solid #639922',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#C0DD97',
            marginBottom: '16px',
          }}
        >
          ✓ {msg}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ color: '#EEEDFE', fontWeight: '500', marginBottom: '12px' }}>
          🔧 Maintenance Mode
        </div>
        <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={maintenanceOn}
            onChange={(e) => setMaintenanceOn(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Enable maintenance mode (blocks all API calls except auth & super-admin)
        </label>
        <input
          placeholder="Maintenance message shown to users..."
          value={maintenanceMsg}
          onChange={(e) => setMaintenanceMsg(e.target.value)}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => maintenanceMutation.mutate()}
          style={{
            background: maintenanceOn ? '#c00' : '#534AB7',
            color: '#EEEDFE',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {maintenanceOn ? '⚠ Enable Maintenance' : 'Disable Maintenance'}
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ color: '#EEEDFE', fontWeight: '500', marginBottom: '12px' }}>
          ↩ Commission Reversal
        </div>
        <label style={labelStyle}>User ID</label>
        <input
          placeholder="User UUID..."
          value={reverseForm.user_id}
          onChange={(e) => setReverseForm((p) => ({ ...p, user_id: e.target.value }))}
          style={inputStyle}
        />
        <label style={labelStyle}>Amount (EGP)</label>
        <input
          type="number"
          placeholder="Amount to reverse..."
          value={reverseForm.amount}
          onChange={(e) => setReverseForm((p) => ({ ...p, amount: e.target.value }))}
          style={inputStyle}
        />
        <label style={labelStyle}>Reason (required)</label>
        <input
          placeholder="Reason for reversal..."
          value={reverseForm.reason}
          onChange={(e) => setReverseForm((p) => ({ ...p, reason: e.target.value }))}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => reverseMutation.mutate(reverseForm)}
          disabled={
            !reverseForm.user_id || !reverseForm.amount || !reverseForm.reason || reverseMutation.isPending
          }
          style={{
            background: '#BA7517',
            color: '#EEEDFE',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Reverse Commission
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ color: '#EEEDFE', fontWeight: '500', marginBottom: '12px' }}>➕ Manual BV Grant</div>
        <label style={labelStyle}>User ID</label>
        <input
          placeholder="User UUID..."
          value={bvForm.user_id}
          onChange={(e) => setBvForm((p) => ({ ...p, user_id: e.target.value }))}
          style={inputStyle}
        />
        <label style={labelStyle}>BV Amount</label>
        <input
          type="number"
          value={bvForm.amount}
          onChange={(e) => setBvForm((p) => ({ ...p, amount: e.target.value }))}
          style={inputStyle}
        />
        <label style={labelStyle}>Side</label>
        <select
          value={bvForm.side}
          onChange={(e) => setBvForm((p) => ({ ...p, side: e.target.value }))}
          style={inputStyle}
        >
          <option value="LEFT">LEFT (Side A)</option>
          <option value="RIGHT">RIGHT (Side B)</option>
        </select>
        <label style={labelStyle}>Reason (required)</label>
        <input
          placeholder="Reason..."
          value={bvForm.reason}
          onChange={(e) => setBvForm((p) => ({ ...p, reason: e.target.value }))}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => bvMutation.mutate(bvForm)}
          disabled={!bvForm.user_id || !bvForm.amount || !bvForm.reason || bvMutation.isPending}
          style={{
            background: '#534AB7',
            color: '#EEEDFE',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Grant BV
        </button>
      </div>
    </div>
  )
}
