import { useEffect, useRef, useState } from 'react'

export default function AnimatedCounter({
  value,
  duration = 1100,
  prefix = '',
  suffix = '',
  decimals = 0,
  style = {},
}) {
  const to = Number(value) || 0
  const [v, setV] = useState(to)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    setV(0)
    let raf
    let start
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setV(to)
      }
    }
    const tick = (t) => {
      if (done) return
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV((to - 0) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else done = true
    }
    raf = requestAnimationFrame(tick)
    const safetyTimer = setTimeout(finish, duration + 400)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(safetyTimer)
      done = true
    }
  }, [to, duration])

  const out =
    decimals === 0
      ? Math.round(v).toLocaleString('en-US')
      : v.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })

  return (
    <span style={style} className="font-num">
      {prefix}
      {out}
      {suffix}
    </span>
  )
}
