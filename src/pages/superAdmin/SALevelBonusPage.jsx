import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLevelBonus, updateLevelBonus } from '../../api/superAdmin.api'

export default function SALevelBonusPage() {
  const qc = useQueryClient()
  const [values, setValues] = useState({ l1: '7', l2: '5', l3: '3', l4: '2', l5: '1' })
  const [saved, setSaved] = useState(false)

  const { data } = useQuery({ queryKey: ['sa-level-bonus'], queryFn: getLevelBonus })

  useEffect(() => {
    if (!data?.length) return
    const map = {}
    data.forEach((s) => {
      const level = s.key.replace('level_bonus_l', '').replace('_pct', '')
      map[`l${level}`] = s.value
    })
    setValues((p) => ({ ...p, ...map }))
  }, [data])

  const mutation = useMutation({
    mutationFn: updateLevelBonus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-level-bonus'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const inputStyle = {
    width: '100px',
    padding: '10px 12px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#EEEDFE',
    textAlign: 'center',
    fontWeight: '600',
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ color: '#EEEDFE', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
        Level Bonus Configuration
      </h1>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>
        Set the unilevel commission percentage for each level (5 levels max).
      </p>

      {saved && (
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
          Settings saved
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#534AB7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#EEEDFE',
                flexShrink: 0,
              }}
            >
              L{i}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                Level {i} — {i === 1 ? 'Direct referrals' : `${i} levels deep`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={values[`l${i}`]}
                  onChange={(e) => setValues((p) => ({ ...p, [`l${i}`]: e.target.value }))}
                  style={inputStyle}
                />
                <span style={{ color: '#888', fontSize: '18px', fontWeight: '600' }}>%</span>
              </div>
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#DCDCAA',
                minWidth: '60px',
                textAlign: 'right',
              }}
            >
              {values[`l${i}`]}%
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate(values)}
        disabled={mutation.isPending}
        style={{
          width: '100%',
          padding: '12px',
          background: '#534AB7',
          border: 'none',
          borderRadius: '10px',
          color: '#EEEDFE',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        {mutation.isPending ? 'Saving...' : 'Save Level Bonus Settings'}
      </button>
    </div>
  )
}
