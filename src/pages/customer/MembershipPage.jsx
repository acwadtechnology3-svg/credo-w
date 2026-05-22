import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMembership, getAvailableSubscriptions, subscribe } from '../../api/customer.api'
import { toast } from '../../components/shared/Toast'

export default function MembershipPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['membership'], queryFn: getMembership })
  const { data: subs } = useQuery({
    queryKey: ['available-subs'],
    queryFn: getAvailableSubscriptions,
  })

  const mutation = useMutation({
    mutationFn: subscribe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership'] })
      toast.success('Subscribed!')
    },
  })

  const sub = data?.subscription
  const user = data?.user

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Membership</h2>

      {sub ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>PLAN NAME</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#534AB7' }}>
                {sub.subscriptions?.name?.toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>START DATE</div>
              <div style={{ fontWeight: '500', fontSize: '13px' }}>
                {new Date(sub.start_date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>EXPIRY DATE</div>
              <div
                style={{
                  fontWeight: '500',
                  fontSize: '13px',
                  color: new Date(sub.expiry_date) < new Date() ? '#c00' : '#27500A',
                }}
              >
                {new Date(sub.expiry_date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
            <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '10px', color: '#534AB7' }}>
              Customer Profile
            </div>
            {[
              ['Name', user?.full_name],
              ['Email', user?.email],
              ['Phone', user?.phone],
              ['Country', user?.country],
              ['Currency', user?.currency],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '6px 0',
                  borderBottom: '1px solid #f8f8f8',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: '#888', width: '100px', flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#333' }}>{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#FAEEDA',
            border: '1px solid #FAC775',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#412402',
          }}
        >
          ⚠ No active membership. Subscribe to a plan below.
        </div>
      )}

      <h3 style={{ fontWeight: '500', fontSize: '14px', marginBottom: '12px' }}>Available Plans</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(subs || []).map((s) => (
          <div
            key={s.id}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {s.description} · {s.duration_days} days
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontWeight: '600', color: '#534AB7' }}>
                EGP {parseFloat(s.price_egp).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => mutation.mutate(s.id)}
                disabled={mutation.isPending}
                style={{
                  background: '#534AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
