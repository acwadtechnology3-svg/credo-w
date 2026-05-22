import { Link } from 'react-router-dom'

/** Official Credo W logo asset (1024×1024) */
export const CREDO_LOGO_SRC = '/brand/credo-w-logo.jpg'

const HEIGHTS = {
  xs: 28,
  sm: 40,
  md: 52,
  lg: 72,
  xl: 96,
  '2xl': 128,
}

/**
 * Official Credo W logo — scales cleanly via height.
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'} size
 * @param {number} [height] — pixel height override
 * @param {string} [to] — wrap in home link when set
 */
export default function Logo({
  size = 'md',
  height,
  className = '',
  alt = 'Credo W',
  to,
  style,
}) {
  const h = height ?? HEIGHTS[size] ?? HEIGHTS.md

  const img = (
    <img
      src={CREDO_LOGO_SRC}
      alt={alt}
      className={`credo-logo${className ? ` ${className}` : ''}`}
      style={{ height: h, width: 'auto', ...style }}
      width={h}
      height={h}
      decoding="async"
    />
  )

  if (to) {
    return (
      <Link to={to} className="credo-logo-link" aria-label={alt}>
        {img}
      </Link>
    )
  }

  return img
}
