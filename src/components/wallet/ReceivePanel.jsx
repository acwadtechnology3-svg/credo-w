import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReceiveInfo } from '../../api/earnings.api'
import Icon from '../ui/Icon'

export default function ReceivePanel({ onClose }) {
  const [copied, setCopied] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['receive-info'], queryFn: getReceiveInfo })

  const copyLink = async () => {
    if (!data?.share_link) return
    try {
      await navigator.clipboard.writeText(data.share_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="wallet-panel" style={{ minHeight: 420 }}>
      <div className="wallet-panel-header">
        <div>
          <div className="t-eyebrow">استلام C Money</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            QR + Link
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" aria-label="إغلاق">
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ padding: 22, textAlign: 'center' }}>
        {isLoading ? (
          <div style={{ color: 'var(--text-3)', padding: '2rem' }}>جاري التحميل...</div>
        ) : (
          <>
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: '#fff',
                display: 'inline-block',
                marginBottom: 16,
                border: '1px solid var(--line)',
              }}
            >
              <img
                src={data.qr_url}
                alt="QR للاستلام"
                width={200}
                height={200}
                style={{ display: 'block', borderRadius: 8 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>رمز المستخدم</div>
              <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--lavender)' }}>
                {data.user_code || data.username}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{data.full_name}</div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-0)',
                border: '1px solid var(--line)',
                fontSize: 11,
                color: 'var(--text-3)',
                wordBreak: 'break-all',
                marginBottom: 14,
                textAlign: 'start',
              }}
            >
              {data.share_link}
            </div>

            <button type="button" className="btn btn-primary" onClick={copyLink}>
              <Icon name="link" size={12} />
              {copied ? 'تم النسخ!' : 'نسخ الرابط'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 14, lineHeight: 1.6 }}>
              شارك الرابط أو QR مع أي عضو ليحوّل لك C Money مباشرة إلى محفظتك.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
