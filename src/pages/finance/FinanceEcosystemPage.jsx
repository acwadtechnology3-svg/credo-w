import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getFinanceWallets, getFinanceLedger } from '../../api/finance.api'
import PageLoader from '../../components/shared/PageLoader'
import '../../styles/wallet-page.css'

const WALLET_ICONS = {
  CMONEY: '💳',
  EARNINGS: '💰',
  BONUS: '🎁',
  LOCKED: '🔒',
  PENDING: '⏳',
  PROMO: '✨',
  CASHBACK: '↩️',
  RANK_REWARD: '🏅',
  PEARLS: '⬡',
}

export default function FinanceEcosystemPage() {
  const navigate = useNavigate()
  const [ledgerWallet, setLedgerWallet] = useState(null)

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['finance-ecosystem'],
    queryFn: getFinanceWallets,
  })

  const { data: ledger } = useQuery({
    queryKey: ['finance-ledger', ledgerWallet],
    queryFn: () => getFinanceLedger({ limit: 30, wallet_type: ledgerWallet || undefined }),
  })

  if (isLoading) return <PageLoader />

  const visible = (wallets || []).filter((w) => w.is_visible !== false)

  return (
    <div className="wallet-page finance-ecosystem" dir="rtl">
      <div className="finance-eco-header">
        <div>
          <h1>النظام المالي</h1>
          <p>محافظ متعددة · دفتر غير قابل للتعديل · دفع هجين</p>
        </div>
        <button type="button" className="finance-btn-gold" onClick={() => navigate('/packages')}>
          شراء باقة
        </button>
      </div>

      <div className="finance-wallet-grid">
        {visible.map((w) => (
          <button
            key={w.type}
            type="button"
            className={`finance-wallet-card ${ledgerWallet === w.type ? 'active' : ''}`}
            onClick={() => setLedgerWallet(w.type === ledgerWallet ? null : w.type)}
          >
            <div className="finance-wallet-card__icon">{WALLET_ICONS[w.type] || '💼'}</div>
            <div className="finance-wallet-card__meta">
              <span className="finance-wallet-card__name">{w.name_ar || w.name_en || w.type}</span>
              <span className="finance-wallet-card__type">{w.type}</span>
            </div>
            <div className="finance-wallet-card__balance">
              {(w.available_balance ?? w.balance).toLocaleString()}
              <small>EGP</small>
            </div>
            {w.available_balance < w.balance && (
              <div className="finance-wallet-card__hold">
                محجوز: {(w.balance - w.available_balance).toLocaleString()}
              </div>
            )}
            <div className="finance-wallet-card__perms">
              {w.can_pay_packages && <span>دفع</span>}
              {w.can_withdraw && <span>سحب</span>}
              {w.can_transfer && <span>تحويل</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="finance-ledger-panel">
        <h2>سجل الدفتر {ledgerWallet ? `— ${ledgerWallet}` : ''}</h2>
        <div className="finance-ledger-list">
          {(ledger || []).length === 0 ? (
            <p className="finance-muted">لا توجد حركات بعد</p>
          ) : (
            (ledger || []).map((e) => (
              <div key={e.id} className="finance-ledger-row">
                <div className="finance-ledger-row__icon">
                  {parseFloat(e.amount) >= 0 ? '↑' : '↓'}
                </div>
                <div className="finance-ledger-row__body">
                  <strong>{e.category}</strong>
                  <span>{e.description || e.ref_type}</span>
                  <time>{new Date(e.created_at).toLocaleString('ar-EG')}</time>
                </div>
                <div className="finance-ledger-row__amounts">
                  <span className={parseFloat(e.amount) >= 0 ? 'pos' : 'neg'}>
                    {parseFloat(e.amount) >= 0 ? '+' : ''}
                    {parseFloat(e.amount).toLocaleString()}
                  </span>
                  <span className="finance-muted">
                    {parseFloat(e.balance_before).toLocaleString()} →{' '}
                    {parseFloat(e.balance_after).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
