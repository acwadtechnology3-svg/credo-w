import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSARanks, updateSARank } from '../../api/superAdmin.api'

const fields = [
  { key: 'pbv_required', label: 'PBV' },
  { key: 'matching_bv_required', label: 'Matching BV' },
  { key: 'directs_required', label: 'Directs' },
  { key: 'commission_pct', label: 'Commission %' },
  { key: 'weekly_cap_egp', label: 'Weekly Cap' },
  { key: 'monthly_cap_egp', label: 'Monthly Cap' },
  { key: 'rank_bonus_usd', label: 'Rank Bonus $' },
]

export default function SARanksPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  const { data, isLoading } = useQuery({ queryKey: ['sa-ranks'], queryFn: getSARanks })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateSARank(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ranks'] })
      setEditingId(null)
      setEditValues({})
    },
  })

  const thStyle = {
    padding: '8px 10px',
    textAlign: 'left',
    color: '#888',
    fontWeight: '400',
    fontSize: '11px',
    borderBottom: '1px solid #2a2a3e',
  }
  const tdStyle = {
    padding: '8px 10px',
    color: '#EEEDFE',
    fontSize: '12px',
    borderBottom: '1px solid #1a1a2e',
  }
  const inputStyle = {
    width: '100%',
    padding: '4px 6px',
    background: '#0f0f1a',
    border: '1px solid #534AB7',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#EEEDFE',
  }

  return (
    <div>
      <h1 style={{ color: '#EEEDFE', fontSize: '18px', fontWeight: '500', marginBottom: '20px' }}>
        Ranks Configuration
      </h1>
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          borderRadius: '12px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Rank</th>
              {fields.map((f) => (
                <th key={f.key} style={thStyle}>
                  {f.label}
                </th>
              ))}
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data || []).map((rank) => (
                <tr key={rank.id}>
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#DCDCAA' }}>{rank.name}</td>
                  {fields.map((f) => (
                    <td key={f.key} style={tdStyle}>
                      {editingId === rank.id ? (
                        <input
                          type="number"
                          value={editValues[f.key] ?? rank[f.key]}
                          onChange={(e) =>
                            setEditValues((p) => ({ ...p, [f.key]: e.target.value }))
                          }
                          style={inputStyle}
                        />
                      ) : (
                        <span
                          style={{
                            color: f.key.includes('pct')
                              ? '#27500A'
                              : f.key.includes('cap')
                                ? '#BA7517'
                                : '#EEEDFE',
                          }}
                        >
                          {parseFloat(rank[f.key] || 0).toLocaleString()}
                          {f.key.includes('pct') ? '%' : ''}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={tdStyle}>
                    {editingId === rank.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => updateMutation.mutate({ id: rank.id, body: editValues })}
                          style={{
                            background: '#534AB7',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            color: '#EEEDFE',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditValues({})
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid #2a2a3e',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(rank.id)
                          setEditValues({})
                        }}
                        style={{
                          background: '#EEEDFE20',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          color: '#EEEDFE',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
