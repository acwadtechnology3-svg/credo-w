export function GlowBg() {
  return (
    <>
      <div
        className="glow-blob"
        style={{
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, rgba(123,108,246,0.30), transparent 70%)',
          top: '-100px',
          insetInlineEnd: '-100px',
        }}
      />
      <div
        className="glow-blob"
        style={{
          width: 360,
          height: 360,
          background: 'radial-gradient(circle, rgba(107,228,255,0.18), transparent 70%)',
          bottom: '-100px',
          insetInlineStart: '-100px',
          animationDelay: '-6s',
        }}
      />
    </>
  )
}
