import Icon from '../ui/Icon'

export const WALLET_ACTIONS = [
  { id: 'transfer', icon: 'send', label: 'تحويل', sub: 'C Money' },
  { id: 'receive', icon: 'download', label: 'استلام', sub: 'QR + Link' },
  { id: 'withdraw', icon: 'upload', label: 'سحب', sub: 'للحساب البنكي' },
  { id: 'exchange', icon: 'cycle', label: 'تبادل', sub: 'بين المحافظ' },
  { id: 'pin', icon: 'shield', label: 'PIN', sub: 'تعديل / إعادة' },
]

export default function WalletActionBar({ activeAction, onSelect }) {
  return (
    <div className="wallet-action-bar card">
      <div className="wallet-action-grid">
        {WALLET_ACTIONS.map((a) => {
          const isActive = activeAction === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`wallet-action-btn ${isActive ? 'is-active' : ''}`}
            >
              <div className="wallet-action-icon">
                <Icon name={a.icon} size={16} />
              </div>
              <div className="wallet-action-text">
                <div className="wallet-action-label">{a.label}</div>
                <div className="wallet-action-sub">{a.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
