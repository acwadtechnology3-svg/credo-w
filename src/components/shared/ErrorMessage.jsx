export default function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div
      style={{
        background: '#FCEBEB',
        border: '1px solid #F7C1C1',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <span style={{ fontSize: '13px', color: '#c00' }}>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: '#c00',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
