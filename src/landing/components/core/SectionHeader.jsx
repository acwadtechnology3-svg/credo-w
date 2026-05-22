import Reveal from './Reveal'

export default function SectionHeader({
  eyebrow,
  title,
  titleEn,
  subtitle,
  align = 'center',
  id,
  size = 'lg', // lg | md
}) {
  const isCenter = align === 'center'
  const wrapClass = `ld-section-header ld-section-header--${align} ld-section-header--${size}`

  return (
    <header id={id} className={wrapClass}>
      {eyebrow && (
        <Reveal delay={0}>
          <p className="ld-eyebrow">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <h2 className={size === 'lg' ? 'ld-heading-lg' : 'ld-heading-md'}>{title}</h2>
        {titleEn && <p className="ld-en-sub">{titleEn}</p>}
      </Reveal>
      {subtitle && (
        <Reveal delay={0.16}>
          <p className="ld-body ld-section-header__subtitle">{subtitle}</p>
        </Reveal>
      )}
    </header>
  )
}
