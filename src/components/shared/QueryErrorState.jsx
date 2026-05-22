export default function QueryErrorState({
  message = 'تعذّر تحميل البيانات',
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={compact ? 'pill bad' : 'card'}
      style={
        compact
          ? { justifyContent: 'center', width: '100%' }
          : { padding: '2rem', textAlign: 'center', color: 'var(--text-2)' }
      }
    >
      <p style={{ margin: onRetry ? '0 0 12px' : 0 }}>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}
