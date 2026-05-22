export default function AdminPanel({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`admin-panel ${className}`.trim()}>
      {(title || actions) && (
        <div className="admin-panel__header">
          <div>
            {title && <h1 className="admin-panel__title">{title}</h1>}
            {subtitle && <p className="admin-panel__subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
