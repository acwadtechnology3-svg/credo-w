export default function EmptyState({ title = 'No data found', description = '', action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center',
        color: '#888',
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
      <p style={{ fontWeight: '500', fontSize: '14px', color: '#333', margin: '0 0 6px' }}>{title}</p>
      {description && <p style={{ fontSize: '13px', margin: '0 0 16px' }}>{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            background: 'var(--credo-purple)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
