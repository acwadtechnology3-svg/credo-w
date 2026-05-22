import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getWalletSummary, getPinStatus } from '../../api/earnings.api'
import WalletCard from '../../components/wallet/WalletCard'
import TransactionRow from '../../components/wallet/TransactionRow'
import TransferFlow from '../../components/wallet/TransferFlow'
import WalletActionBar from '../../components/wallet/WalletActionBar'
import ReceivePanel from '../../components/wallet/ReceivePanel'
import ExchangeFlow from '../../components/wallet/ExchangeFlow'
import PinPanel from '../../components/wallet/PinPanel'
import Icon from '../../components/ui/Icon'
import SupportQuickLink from '../../components/support/SupportQuickLink'

function exportTransactionsCsv(rows) {
  const headers = ['Date', 'Category', 'Description', 'Amount', 'Wallet']
  const lines = rows.map((t) => [
    t.created_at,
    t.category,
    (t.description || '').replace(/"/g, '""'),
    t.amt,
    t.wallet,
  ])
  const csv = [headers, ...lines].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function WalletPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const [activeWallet, setActiveWallet] = useState('cmoney')
  const [activeAction, setActiveAction] = useState(null)
  const [transferStep, setTransferStep] = useState(0)

  const sendTo = searchParams.get('send') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-summary'],
    queryFn: getWalletSummary,
  })

  useEffect(() => {
    if (sendTo) {
      setActiveAction('transfer')
      setTransferStep(1)
    }
  }, [sendTo])

  const cmoneyBal = data?.cmoney?.balance ?? 0
  const earningsBal = data?.earnings?.balance ?? 0

  const closePanel = () => {
    setActiveAction(null)
    setTransferStep(0)
  }

  const openAction = async (id) => {
    if (id === 'withdraw') {
      navigate('/withdrawal')
      return
    }
    if (id === 'transfer') {
      try {
        const st = await getPinStatus()
        if (!st?.has_pin) {
          setActiveAction('pin')
          setTransferStep(0)
          return
        }
      } catch {
        /* continue to transfer */
      }
      setActiveAction('transfer')
      setTransferStep(1)
      return
    }
    setActiveAction(id)
    setTransferStep(0)
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ['wallet-summary'] })

  const filteredTx = (data?.transactions || []).filter((t) => {
    if (activeWallet === 'all') return true
    return t.wallet === activeWallet
  })

  const fmtIn = (n) => `+${Number(n || 0).toLocaleString('en-US')}`
  const fmtOut = (n) => `−${Number(n || 0).toLocaleString('en-US')}`

  const hasPanel = activeAction && activeAction !== 'withdraw'

  return (
    <div className="franchise-page-canvas smart-wallet-page page-enter">
      <SupportQuickLink category="financial" label="مساعدة المحفظة والسحب" />
      <div className="smart-wallet-grid">
        <WalletCard
          type="cmoney"
          active={activeWallet === 'cmoney'}
          onClick={() => setActiveWallet('cmoney')}
          balance={cmoneyBal}
          label="C Money Wallet"
          subtitle="محفظة التحويلات الداخلية"
          currency="C"
          gradient="linear-gradient(135deg, #1A1A2E 0%, #2D1F5C 50%, #7B6CF6 130%)"
          accentColor="#C4B8FF"
          actionLabel="تحويل"
          actionIcon="send"
          onAction={() => openAction('transfer')}
          stats={[
            ['الواردة شهرياً', fmtIn(data?.cmoney?.monthlyIn), 'C'],
            ['الصادرة شهرياً', fmtOut(data?.cmoney?.monthlyOut), 'C'],
            ['عدد العمليات', String(data?.cmoney?.txCount ?? 0), ''],
          ]}
        />
        <WalletCard
          type="earnings"
          active={activeWallet === 'earnings'}
          onClick={() => setActiveWallet('earnings')}
          balance={earningsBal}
          label="Earnings Wallet"
          subtitle="محفظة الأرباح والعمولات"
          currency="ج.م"
          gradient="linear-gradient(135deg, #0A1F1A 0%, #1B4F3F 50%, #2BD9A0 130%)"
          accentColor="#2BD9A0"
          actionLabel="سحب"
          actionIcon="upload"
          onAction={() => navigate('/withdrawal')}
          stats={[
            ['عمولة مباشرة', fmtIn(data?.earnings?.direct), 'ج.م'],
            ['عمولة توازن', fmtIn(data?.earnings?.team), 'ج.م'],
            ['عمولة مستويات', fmtIn(data?.earnings?.level), 'ج.م'],
          ]}
        />
      </div>

      <div className={`smart-wallet-main ${hasPanel ? 'has-transfer' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WalletActionBar activeAction={activeAction} onSelect={openAction} />

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--line)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>
                  سجل العمليات
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {filteredTx.length} عملية · آخر 30 يوماً
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    padding: 3,
                    background: 'var(--surface-0)',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                  }}
                >
                  {[
                    ['cmoney', 'C Money'],
                    ['earnings', 'الأرباح'],
                    ['all', 'الكل'],
                  ].map(([id, l]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveWallet(id)}
                      style={{
                        padding: '6px 10px',
                        border: 0,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: activeWallet === id ? 'var(--surface-2)' : 'transparent',
                        color: activeWallet === id ? 'var(--text-1)' : 'var(--text-3)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={filteredTx.length === 0}
                  onClick={() => exportTransactionsCsv(filteredTx)}
                >
                  <Icon name="download" size={11} />
                  CSV
                </button>
              </div>
            </div>
            <div>
              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                  جاري التحميل...
                </div>
              ) : filteredTx.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
                  لا توجد عمليات
                </div>
              ) : (
                filteredTx.map((t) => <TransactionRow key={t.id} tx={t} />)
              )}
            </div>
          </div>
        </div>

        {hasPanel && (
          <div
            className="card anim-scale-in"
            style={{ padding: 0, alignSelf: 'start', position: 'sticky', top: 100, overflow: 'hidden' }}
          >
            {activeAction === 'transfer' && transferStep > 0 && (
              <TransferFlow
                step={transferStep}
                setStep={setTransferStep}
                balance={cmoneyBal}
                initialRecipient={sendTo}
                onClose={closePanel}
                onSuccess={refresh}
              />
            )}
            {activeAction === 'receive' && <ReceivePanel onClose={closePanel} />}
            {activeAction === 'exchange' && (
              <ExchangeFlow
                earningsBalance={earningsBal}
                cmoneyBalance={cmoneyBal}
                onClose={closePanel}
                onSuccess={refresh}
              />
            )}
            {activeAction === 'pin' && (
              <PinPanel
                onClose={closePanel}
                onSuccess={() => {
                  refresh()
                  qc.invalidateQueries({ queryKey: ['pin-status'] })
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
