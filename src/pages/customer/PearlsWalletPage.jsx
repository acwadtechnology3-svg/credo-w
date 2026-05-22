import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPearlsWallet,
  getPearlRewards,
  getPearlMissions,
  claimMission,
  redeemPearlReward,
  getPearlsTx,
  getPearlAchievements,
} from '../../api/pearls.api'
import { useState, useEffect } from 'react'
import { toast } from '../../components/shared/Toast'

const useCounter = (target, duration = 1000) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) {
      setCount(0)
      return
    }
    let start = 0
    const step = Math.max(1, Math.ceil(target / (duration / 16)))
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      setCount(start)
      if (start >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function PearlsWalletPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('missions')
  const [confirmRedeem, setConfirmRedeem] = useState(null)

  const { data: wallet } = useQuery({
    queryKey: ['pearls-wallet'],
    queryFn: getPearlsWallet,
    refetchInterval: 30000,
  })
  const { data: missions } = useQuery({ queryKey: ['pearl-missions'], queryFn: getPearlMissions })
  const { data: rewards } = useQuery({ queryKey: ['pearl-rewards'], queryFn: getPearlRewards })
  const { data: txData } = useQuery({
    queryKey: ['pearl-tx'],
    queryFn: () => getPearlsTx({ limit: 15 }),
  })
  const { data: achievements } = useQuery({
    queryKey: ['pearl-achievements'],
    queryFn: getPearlAchievements,
  })

  const animatedBalance = useCounter(wallet?.available_balance || 0)

  const claimMutation = useMutation({
    mutationFn: claimMission,
    onSuccess: (data) => {
      toast.success(`+${data.earned} ⬡ claimed`)
      qc.invalidateQueries({ queryKey: ['pearl-missions'] })
      qc.invalidateQueries({ queryKey: ['pearls-wallet'] })
    },
  })

  const redeemMutation = useMutation({
    mutationFn: redeemPearlReward,
    onSuccess: (data) => {
      if (data.voucherCode) toast.success(`Code: ${data.voucherCode}`)
      else toast.success('Reward redeemed!')
      qc.invalidateQueries({ queryKey: ['pearls-wallet'] })
      qc.invalidateQueries({ queryKey: ['pearl-rewards'] })
      setConfirmRedeem(null)
    },
  })

  const GOLD = '#C9A84C'
  const GOLD_L = '#E8C96A'
  const S2 = '#141414'
  const S3 = '#1C1C1C'
  const BORDER = 'rgba(201,168,76,0.18)'
  const T2 = '#9A9690'
  const T3 = '#5A5754'

  const tierPts = { bronze: 0, silver: 1000, gold: 5000, diamond: 20000 }
  const tierNext = { bronze: 'silver', silver: 'gold', gold: 'diamond', diamond: null }
  const tierIcon = { bronze: '🪨', silver: '🥈', gold: '🥇', diamond: '💎' }
  const tierMult = { bronze: '1×', silver: '1.25×', gold: '1.5×', diamond: '2×' }
  const currentTier = wallet?.tier || 'bronze'
  const nextTier = tierNext[currentTier]
  const pctToNext = nextTier
    ? Math.min(
        100,
        Math.round(
          ((wallet?.lifetime_earned || 0) - tierPts[currentTier]) /
            (tierPts[nextTier] - tierPts[currentTier]) *
            100
        )
      )
    : 100

  const typeColor = { earn: GOLD_L, spend: '#5CB85C', expire: '#E05252', admin: '#9A9690' }
  const typePrefix = { earn: '+', spend: '−', expire: '−', admin: '±' }
  const sourceLabel = {
    package_1: 'Package أحادي',
    package_3: 'Package ثلاثي',
    package_7: 'Package سباعي',
    upgrade_2: 'Upgrade ثنائي',
    upgrade_4: 'Upgrade رباعي',
    referral_join: 'Referral joined',
    rank_up: 'Rank advancement',
    fast_start: 'Fast Start bonus',
    daily_streak: 'Daily streak',
    mission_complete: 'Mission completed',
    course_complete: 'Course finished',
    achievement: 'Achievement unlocked',
    admin_grant: 'Admin grant',
    marketplace: 'Marketplace redeem',
    expiry_cron: 'Pearls expired',
  }

  const card = {
    background: S2,
    border: '0.5px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    padding: '14px 16px',
  }

  const streakDays = Math.min(wallet?.current_streak || 0, 7)

  return (
    <div
      style={{
        background: '#0D0D0D',
        minHeight: '100vh',
        color: '#F0EDE6',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.12)',
              border: `0.5px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ⬡
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#F0EDE6' }}>Pearls Wallet</div>
            <div style={{ fontSize: '11px', color: T3 }}>Credo W Rewards</div>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '0.5px solid rgba(201,168,76,0.3)',
            borderRadius: '20px',
            padding: '5px 14px',
            fontSize: '12px',
            color: GOLD_L,
          }}
        >
          {tierIcon[currentTier]} {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} ·{' '}
          {tierMult[currentTier]} multiplier
        </div>
      </div>

      <div
        style={{
          background: '#1A1500',
          border: `0.5px solid ${BORDER}`,
          borderRadius: '18px',
          padding: '22px 24px 18px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#8A6F2E',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          Available Pearls
        </div>
        <div
          style={{
            fontSize: '42px',
            fontWeight: '500',
            color: GOLD_L,
            letterSpacing: '-1px',
            lineHeight: 1,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '22px', color: GOLD }}>⬡</span>
          <span>{animatedBalance.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '12px', color: T3, marginBottom: '16px' }}>Updated just now</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {[
            {
              label: 'Lifetime Earned',
              val: `${(wallet?.lifetime_earned || 0).toLocaleString()} ⬡`,
              color: GOLD,
            },
            {
              label: 'Used',
              val: `${(wallet?.lifetime_used || 0).toLocaleString()} ⬡`,
              color: '#5CB85C',
            },
            {
              label: 'Expiring 30d',
              val: `${(wallet?.expiring_soon || 0).toLocaleString()} ⬡`,
              color: wallet?.expiring_soon > 0 ? '#E05252' : T3,
            },
          ].map((s) => (
            <div key={s.label} style={{ background: S2, padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: T3, marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {(wallet?.expiring_soon || 0) > 0 && (
        <div
          style={{
            background: 'rgba(224,82,82,0.06)',
            border: '0.5px solid rgba(224,82,82,0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#E88080' }}>
            ⚠️ {wallet.expiring_soon} Pearls expire within 30 days
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            style={{
              fontSize: '11px',
              color: GOLD,
              background: 'rgba(201,168,76,0.1)',
              border: `0.5px solid ${BORDER}`,
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Redeem now
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={card}>
          <div
            style={{
              fontSize: '10px',
              color: T3,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Daily Streak
          </div>
          <div style={{ fontSize: '28px', fontWeight: '500', color: GOLD_L, marginBottom: '10px' }}>
            {wallet?.current_streak || 0}{' '}
            <span style={{ fontSize: '12px', color: T3 }}>days</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div
                key={d + i}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: '500',
                  background: i < streakDays ? 'rgba(201,168,76,0.2)' : S3,
                  color: i < streakDays ? GOLD_L : T3,
                  border: i < streakDays ? '0.5px solid rgba(201,168,76,0.3)' : 'none',
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <div
            style={{
              fontSize: '10px',
              color: T3,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Tier Progress
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: GOLD_L }}>
              {tierIcon[currentTier]} {currentTier}
            </span>
            <span style={{ fontSize: '11px', color: T3 }}>
              {nextTier ? `${tierIcon[nextTier]} ${nextTier}` : '✓ Max'}
            </span>
          </div>
          <div style={{ height: '6px', background: S3, borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
            <div
              style={{
                height: '6px',
                background: 'linear-gradient(90deg, #8A6F2E, #E8C96A)',
                borderRadius: '3px',
                width: `${pctToNext}%`,
                transition: 'width 1s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: T3 }}>
            <span>{(wallet?.lifetime_earned || 0).toLocaleString()} ⬡</span>
            <span>
              {nextTier
                ? `${Math.max(0, tierPts[nextTier] - (wallet?.lifetime_earned || 0)).toLocaleString()} to go`
                : 'Diamond!'}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '14px',
          background: S2,
          borderRadius: '10px',
          padding: '3px',
        }}
      >
        {[
          ['missions', 'Missions'],
          ['marketplace', 'Marketplace'],
          ['history', 'History'],
          ['achievements', 'Achievements'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '7px 4px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '500' : '400',
              background: activeTab === tab ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: activeTab === tab ? GOLD_L : T3,
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'missions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {(missions || []).map((m) => (
            <div
              key={m.id}
              style={{
                background: S2,
                border: `0.5px solid ${m.is_completed ? 'rgba(92,184,92,0.2)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>{m.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#F0EDE6', marginBottom: '2px' }}>
                {m.title}
              </div>
              <div style={{ fontSize: '10px', color: T3, marginBottom: '8px' }}>{m.description}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: m.is_completed && !m.pearl_claimed ? '8px' : '0',
                }}
              >
                <div style={{ flex: 1, height: '3px', background: S3, borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '3px',
                      borderRadius: '2px',
                      background: m.is_completed ? '#5CB85C' : GOLD,
                      width: `${Math.min(100, Math.round((m.current_count / m.target_count) * 100))}%`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: m.is_completed ? '#5CB85C' : GOLD,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.is_completed && m.pearl_claimed ? '✓ claimed' : `+${m.pearl_reward} ⬡`}
                </div>
              </div>
              {m.is_completed && !m.pearl_claimed && (
                <button
                  type="button"
                  onClick={() => claimMutation.mutate(m.id)}
                  disabled={claimMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '5px',
                    background: 'rgba(201,168,76,0.15)',
                    border: `0.5px solid ${BORDER}`,
                    borderRadius: '6px',
                    color: GOLD,
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Claim {m.pearl_reward} ⬡
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {(rewards || []).map((r) => {
            const canAfford = (wallet?.available_balance || 0) >= r.pearl_cost
            const outOfStock = r.stock !== -1 && r.redeemed_count >= r.stock
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => !outOfStock && canAfford && setConfirmRedeem(r)}
                onKeyDown={(e) => e.key === 'Enter' && !outOfStock && canAfford && setConfirmRedeem(r)}
                style={{
                  background: S2,
                  border: `0.5px solid ${r.is_limited ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: canAfford && !outOfStock ? 'pointer' : 'default',
                  opacity: outOfStock ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '52px',
                    background: S3,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '8px',
                  }}
                >
                  {r.type === 'voucher'
                    ? '🏷️'
                    : r.type === 'discount'
                      ? '💸'
                      : r.type === 'course'
                        ? '🎓'
                        : r.type === 'event'
                          ? '🎫'
                          : r.type === 'ai_tool'
                            ? '🤖'
                            : r.type === 'travel'
                              ? '✈️'
                              : r.type === 'badge'
                                ? '🏅'
                                : '🎁'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#F0EDE6', marginBottom: '2px' }}>
                  {r.title}
                </div>
                <div style={{ fontSize: '10px', color: T3, marginBottom: '8px' }}>{r.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: canAfford ? GOLD : '#E05252' }}>
                    ⬡ {r.pearl_cost.toLocaleString()}
                  </div>
                  {r.is_limited && r.stock !== -1 && (
                    <span
                      style={{
                        fontSize: '9px',
                        background: 'rgba(201,168,76,0.15)',
                        color: GOLD,
                        border: `0.5px solid ${BORDER}`,
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      {r.stock - r.redeemed_count} left
                    </span>
                  )}
                  {outOfStock && <span style={{ fontSize: '9px', color: '#E05252' }}>Sold out</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div
          style={{
            background: S2,
            border: '0.5px solid rgba(255,255,255,0.05)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {(txData?.data || []).map((tx) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderBottom: '0.5px solid rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background:
                      tx.type === 'earn'
                        ? 'rgba(201,168,76,0.1)'
                        : tx.type === 'spend'
                          ? 'rgba(92,184,92,0.1)'
                          : 'rgba(224,82,82,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  {tx.type === 'earn' ? '⬡' : tx.type === 'spend' ? '🛍️' : '⏳'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#F0EDE6' }}>
                    {sourceLabel[tx.source] || tx.source}
                  </div>
                  <div style={{ fontSize: '10px', color: T3 }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: typeColor[tx.type] || T2 }}>
                {typePrefix[tx.type]}
                {Math.abs(tx.amount).toLocaleString()} ⬡
              </div>
            </div>
          ))}
          {(!txData?.data || txData.data.length === 0) && (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: T3 }}>
              No transactions yet
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {(achievements || []).map((a) => (
            <div
              key={a.id}
              style={{
                background: S2,
                border: `0.5px solid ${a.is_unlocked ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: '12px',
                padding: '12px',
                opacity: a.is_unlocked ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '5px' }}>{a.is_unlocked ? a.icon : '🔒'}</div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: a.is_unlocked ? '#F0EDE6' : T3,
                  marginBottom: '2px',
                }}
              >
                {a.title}
              </div>
              <div style={{ fontSize: '10px', color: T3 }}>{a.description}</div>
              {a.pearl_reward > 0 && (
                <div style={{ fontSize: '11px', color: GOLD, marginTop: '6px' }}>+{a.pearl_reward} ⬡</div>
              )}
              {a.is_unlocked && (
                <div style={{ fontSize: '10px', color: '#5CB85C', marginTop: '3px' }}>
                  ✓ Unlocked {new Date(a.unlocked_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmRedeem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#1A1A1A',
              border: `0.5px solid ${BORDER}`,
              borderRadius: '16px',
              padding: '24px',
              width: '340px',
              maxWidth: '90vw',
            }}
          >
            <div style={{ fontSize: '30px', textAlign: 'center', marginBottom: '10px' }}>⬡</div>
            <h3
              style={{
                fontWeight: '500',
                fontSize: '16px',
                textAlign: 'center',
                marginBottom: '6px',
                color: '#F0EDE6',
              }}
            >
              Redeem {confirmRedeem.title}
            </h3>
            <p style={{ fontSize: '13px', color: T2, textAlign: 'center', marginBottom: '16px' }}>
              {confirmRedeem.description}
            </p>
            <div
              style={{
                background: S3,
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', color: T2 }}>Cost</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: GOLD }}>
                ⬡ {confirmRedeem.pearl_cost.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirmRedeem(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: T2,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => redeemMutation.mutate(confirmRedeem.id)}
                disabled={redeemMutation.isPending}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: GOLD,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {redeemMutation.isPending ? 'Redeeming...' : 'Redeem ⬡'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
