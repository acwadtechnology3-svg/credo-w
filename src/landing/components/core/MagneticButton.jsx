import { Link } from 'react-router-dom'
import useMagnetic from '../../hooks/useMagnetic'

export function MagneticLink({ to, children, className = 'ld-btn-primary', ...rest }) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic(0.28)

  return (
    <Link
      ref={ref}
      to={to}
      className={className}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transition: 'transform 0.2s ease-out' }}
      {...rest}
    >
      {children}
    </Link>
  )
}

export function MagneticButton({ children, className = 'ld-btn-ghost', onClick, type = 'button', ...rest }) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic(0.22)

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transition: 'transform 0.2s ease-out' }}
      {...rest}
    >
      {children}
    </button>
  )
}
