import { useEffect, useState } from 'react'

/** Avatar with profile image or initials fallback. */
export default function UserAvatar({
  src,
  initials = 'U',
  size = 40,
  fontSize,
  className = '',
  style = {},
  imageStyle = {},
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const px = typeof size === 'number' ? `${size}px` : size
  const fs = fontSize ?? (typeof size === 'number' ? Math.round(size * 0.32) : 13)

  useEffect(() => {
    setImgFailed(false)
  }, [src])

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt=""
        className={className}
        onError={() => setImgFailed(true)}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
          ...style,
          ...imageStyle,
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7B6CF6, #C4B8FF)',
        display: 'grid',
        placeItems: 'center',
        color: '#0A0A0A',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: fs,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  )
}
