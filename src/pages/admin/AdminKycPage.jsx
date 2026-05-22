import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKycRequests, processKyc } from '../../api/admin.api'

export default function AdminKycPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc', statusFilter],
    queryFn: () => getKycRequests({ status: statusFilter, limit: 50 }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, action }) => processKyc(id, { action, rejection_reason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kyc'] })
      setSelected(null)
      setReason('')
    },
  })

  const statusColor = {
    pending: '#BA7517',
    under_review: '#378ADD',
    verified: '#27500A',
    rejected: '#c00',
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '500' }}>KYC Verification Requests</h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['pending', 'under_review', 'verified', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                background: statusFilter === s ? '#534AB7' : '#f5f5f5',
                color: statusFilter === s ? '#fff' : '#555',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '12px' }}>
            Review KYC — {selected.users?.username}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {selected.national_id_front_url && (
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>ID Front</div>
                <a href={selected.national_id_front_url} target="_blank" rel="noreferrer">
                  <img
                    src={selected.national_id_front_url}
                    alt="ID Front"
                    style={{
                      width: '160px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #eee',
                    }}
                  />
                </a>
              </div>
            )}
            {selected.national_id_back_url && (
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>ID Back</div>
                <a href={selected.national_id_back_url} target="_blank" rel="noreferrer">
                  <img
                    src={selected.national_id_back_url}
                    alt="ID Back"
                    style={{
                      width: '160px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #eee',
                    }}
                  />
                </a>
              </div>
            )}
            {selected.selfie_url && (
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Selfie</div>
                <a href={selected.selfie_url} target="_blank" rel="noreferrer">
                  <img
                    src={selected.selfie_url}
                    alt="Selfie"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #eee',
                    }}
                  />
                </a>
              </div>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
            National ID on file: <strong>{selected.users?.national_id}</strong>
          </div>
          <input
            placeholder="Rejection reason (required if rejecting)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate({ id: selected.id, action: 'under_review' })}
              style={{
                padding: '8px 16px',
                background: '#E6F1FB',
                color: '#0C447C',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Mark Under Review
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate({ id: selected.id, action: 'verified' })}
              style={{
                padding: '8px 16px',
                background: '#EAF3DE',
                color: '#27500A',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => {
                if (!reason.trim()) return alert('Rejection reason required')
                mutation.mutate({ id: selected.id, action: 'rejected' })
              }}
              style={{
                padding: '8px 16px',
                background: '#FCEBEB',
                color: '#c00',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: '12px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Submitted', 'Username', 'Email', 'National ID', 'Documents', 'Status', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: '#888',
                      fontWeight: '500',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  Loading...
                </td>
              </tr>
            ) : (data?.data || []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  No KYC requests
                </td>
              </tr>
            ) : (
              (data?.data || []).map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '8px 12px', color: '#888' }}>
                    {new Date(k.submitted_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '500' }}>{k.users?.username}</td>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{k.users?.email}</td>
                  <td
                    style={{
                      padding: '8px 12px',
                      color: '#555',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  >
                    {k.users?.national_id}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {[k.national_id_front_url, k.national_id_back_url, k.selfie_url].filter(Boolean).length}{' '}
                    docs
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        color: statusColor[k.status] || '#888',
                        fontWeight: '500',
                        fontSize: '11px',
                      }}
                    >
                      {k.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {['pending', 'under_review'].includes(k.status) && (
                      <button
                        type="button"
                        onClick={() => setSelected(k)}
                        style={{
                          background: '#EEEDFE',
                          color: '#3C3489',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Review
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
