import { useQuery } from '@tanstack/react-query'
import { getMarketingAssets } from '../../api/marketing.api'

export default function MarketingToolsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketing-assets'],
    queryFn: () => getMarketingAssets(),
  })

  const typeIcon = { presentation: '📊', video: '🎬', document: '📄' }
  const regionLabel = {
    egypt: '🇪🇬 Egypt',
    middle_east: '🌍 Middle East',
    global: '🌐 Global',
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Marketing Tools</h2>
      {isLoading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : (data || []).length === 0 ? (
        <div style={{ color: '#888', fontSize: '13px' }}>
          No assets yet. Run <code>server/src/db/phase8-seed.sql</code> in Supabase.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {(data || []).map((asset) => (
            <div
              key={asset.id}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#EEEDFE',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                }}
              >
                {typeIcon[asset.type] || '📁'}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '4px' }}>
                  {asset.title}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
                  {regionLabel[asset.region] || asset.region} · {asset.language?.toUpperCase()}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#f5f5f5',
                      border: '1px solid #eee',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: '#333',
                      textDecoration: 'none',
                    }}
                  >
                    VIEW
                  </a>
                  <a
                    href={asset.file_url}
                    download
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#534AB7',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: '#fff',
                      textDecoration: 'none',
                    }}
                  >
                    DOWNLOAD
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
