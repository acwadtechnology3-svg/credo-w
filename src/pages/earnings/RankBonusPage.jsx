import { useQuery } from '@tanstack/react-query'
import { getRankBonus } from '../../api/earnings.api'

export default function RankBonusPage() {
  const { data, isLoading } = useQuery({ queryKey: ['rank-bonus'], queryFn: getRankBonus })

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Rank Bonus</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(data?.ranks || []).map((rank) => (
          <div
            key={rank.id}
            style={{
              background: '#fff',
              border: `1px solid ${rank.achieved ? '#C0DD97' : '#eee'}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: rank.achieved ? '#EAF3DE' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                {rank.achieved ? '✓' : '✦'}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: '500',
                    fontSize: '13px',
                    color: rank.achieved ? '#27500A' : '#333',
                  }}
                >
                  {rank.name}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  PBV {rank.pbv_required} | Matching BV {rank.matching_bv_required} | Directs{' '}
                  {rank.directs_required}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: rank.achieved ? '#27500A' : '#888',
                background: rank.achieved ? '#EAF3DE' : '#f5f5f5',
                padding: '8px 16px',
                borderRadius: '8px',
              }}
            >
              ${rank.rank_bonus_usd}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
