export default function PageLoader({ text = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        gap: '16px',
        color: '#888',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid #EEEDFE',
          borderTopColor: 'var(--credo-purple)',
          animation: 'cw-spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: '13px', margin: 0 }}>{text}</p>
      <style>{`@keyframes cw-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
