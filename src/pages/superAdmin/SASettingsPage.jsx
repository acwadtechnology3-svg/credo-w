import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSASettings, updateSASetting } from '../../api/superAdmin.api'

export default function SASettingsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState({})
  const { data, isLoading } = useQuery({ queryKey: ['sa-settings'], queryFn: getSASettings })

  const mutation = useMutation({
    mutationFn: ({ key, value }) => updateSASetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-settings'] })
      setEditing({})
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
  const tdStyle = { padding: '8px 10px', color: '#EEEDFE', fontSize: '12px' }
  const inputStyle = {
    padding: '5px 8px',
    background: '#0f0f1a',
    border: '1px solid #534AB7',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#EEEDFE',
    width: '140px',
  }

  return (
    <div>
      <h1 style={{ color: '#EEEDFE', fontSize: '18px', fontWeight: '500', marginBottom: '20px' }}>
        Financial & Platform Settings
      </h1>
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Key', 'Value', 'Description', 'Action'].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data || []).map((s) => (
                <tr key={s.key} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#534AB7' }}>{s.key}</td>
                  <td style={tdStyle}>
                    {editing[s.key] !== undefined ? (
                      <input
                        value={editing[s.key]}
                        onChange={(e) => setEditing((p) => ({ ...p, [s.key]: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      s.value
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#888' }}>{s.description}</td>
                  <td style={tdStyle}>
                    {editing[s.key] !== undefined ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => mutation.mutate({ key: s.key, value: editing[s.key] })}
                          disabled={mutation.isPending}
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
                          onClick={() =>
                            setEditing((p) => {
                              const next = { ...p }
                              delete next[s.key]
                              return next
                            })
                          }
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
                        onClick={() => setEditing((p) => ({ ...p, [s.key]: s.value }))}
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
