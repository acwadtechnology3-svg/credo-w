import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSetting } from '../../api/admin.api'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState({})
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings })

  const mutation = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      setEditing({})
    },
  })

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>System Settings</h2>
      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Key', 'Value', 'Description', 'Action'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: '#888',
                    fontWeight: '500',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              (data || []).map((s) => (
                <tr key={s.key} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td
                    style={{
                      padding: '10px 14px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#534AB7',
                    }}
                  >
                    {s.key}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {editing[s.key] !== undefined ? (
                      <input
                        value={editing[s.key]}
                        onChange={(e) => setEditing((p) => ({ ...p, [s.key]: e.target.value }))}
                        style={{
                          padding: '5px 8px',
                          border: '1px solid #534AB7',
                          borderRadius: '6px',
                          fontSize: '13px',
                          width: '120px',
                        }}
                      />
                    ) : (
                      <strong>{s.value}</strong>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#888', fontSize: '12px' }}>
                    {s.description}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {editing[s.key] !== undefined ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => mutation.mutate({ key: s.key, value: editing[s.key] })}
                          style={{
                            background: '#534AB7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditing((p) => {
                              const n = { ...p }
                              delete n[s.key]
                              return n
                            })
                          }
                          style={{
                            background: '#f5f5f5',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
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
                          background: '#EEEDFE',
                          color: '#3C3489',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
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
