import Icon from '../ui/Icon'

const CAT_LABELS = {
  TRANSFER_OUT: 'تحويل صادر',
  TRANSFER_IN: 'تحويل وارد',
  TEAM_COMMISSION: 'عمولة توازن',
  DIRECT_COMMISSION: 'عمولة مباشرة',
  LEVEL_BONUS: 'عمولة مستويات',
  RANK_BONUS: 'مكافأة رتبة',
  FAST_START: 'مكافأة البداية',
  RETAIL_PROFIT: 'ربح تجزئة',
  WITHDRAWAL: 'سحب',
  PURCHASE: 'شراء',
  DEPOSIT: 'إيداع',
  EXCHANGE_IN: 'تبادل وارد',
  EXCHANGE_OUT: 'تبادل صادر',
}

const CAT_ICONS = {
  TRANSFER_OUT: 'send',
  TRANSFER_IN: 'arrow-down',
  TEAM_COMMISSION: 'trend-up',
  DIRECT_COMMISSION: 'sparkles',
  LEVEL_BONUS: 'layers',
  WITHDRAWAL: 'upload',
  PURCHASE: 'cart',
  EXCHANGE_IN: 'cycle',
  EXCHANGE_OUT: 'cycle',
}

function parseParty(description, out) {
  if (!description) return '—'
  const toMatch = description.match(/Transfer to (.+)/i)
  const fromMatch = description.match(/Transfer from (.+)/i)
  if (out && toMatch) return toMatch[1]
  if (!out && fromMatch) return fromMatch[1]
  return description
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

export default function TransactionRow({ tx }) {
  const out = tx.amt < 0
  const catLabel = CAT_LABELS[tx.category] || tx.category
  const catIcon = CAT_ICONS[tx.category] || 'circle'
  const catColor =
    tx.category === 'TEAM_COMMISSION' || tx.category === 'DIRECT_COMMISSION'
      ? 'var(--success)'
      : out
        ? 'var(--danger)'
        : 'var(--lavender)'

  const txRef = tx.id ? `TRX-${String(tx.id).slice(0, 8).toUpperCase()}` : '—'

  return (
    <div
      className="wallet-tx-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        borderBottom: '1px solid var(--line-soft)',
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(196,184,255,0.025)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--surface-2)',
          display: 'grid',
          placeItems: 'center',
          color: catColor,
          flexShrink: 0,
          border: '1px solid var(--line)',
        }}
      >
        <Icon name={catIcon} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{catLabel}</span>
            <span
              className="pill"
              style={{
                fontSize: 9,
                padding: '1px 6px',
                background: tx.wallet === 'cmoney' ? 'var(--info-soft)' : 'var(--success-soft)',
                color: tx.wallet === 'cmoney' ? 'var(--lavender)' : 'var(--success)',
                borderColor: tx.wallet === 'cmoney' ? 'var(--info-edge)' : 'var(--success-edge)',
              }}
            >
              {tx.wallet === 'cmoney' ? 'C Money' : 'الأرباح'}
            </span>
          </div>
          <span
            className="font-num"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: tx.amt > 0 ? 'var(--success)' : 'var(--text-1)',
              flexShrink: 0,
            }}
          >
            {tx.amt > 0 ? '+' : ''}
            {Math.abs(tx.amt).toLocaleString('en-US')}{' '}
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {tx.wallet === 'cmoney' ? 'C' : 'ج.م'}
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 3,
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {out ? 'إلى' : 'من'}{' '}
            <span className="font-mono" style={{ color: 'var(--text-2)' }}>
              {parseParty(tx.description, out)}
            </span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-4)' }}>
              {txRef}
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {formatDate(tx.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
