import { useState } from 'react'
import { motion } from 'framer-motion'

export default function EarningsSimulation({ defaults }) {
  const [leftBv, setLeftBv] = useState(defaults?.defaultLeftBv ?? 1200)
  const [rightBv, setRightBv] = useState(defaults?.defaultRightBv ?? 800)

  const matched = Math.min(leftBv, rightBv)
  const commission = Math.round(matched * 0.2)
  const weakerPct = Math.round((Math.min(leftBv, rightBv) / Math.max(leftBv, rightBv, 1)) * 100)

  return (
    <div className="tree-sim" dir="rtl">
      <div className="tree-sim__sliders">
        <label>
          BV الرجل الأيسر
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={leftBv}
            onChange={(e) => setLeftBv(Number(e.target.value))}
          />
          <span>{leftBv}</span>
        </label>
        <label>
          BV الرجل الأيمن
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={rightBv}
            onChange={(e) => setRightBv(Number(e.target.value))}
          />
          <span>{rightBv}</span>
        </label>
      </div>

      <div className="tree-sim__viz">
        <motion.div
          className="tree-sim__leg tree-sim__leg--left"
          animate={{ height: `${Math.min(100, leftBv / 50)}%` }}
        />
        <motion.div
          className="tree-sim__match"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span>{matched} BV</span>
          <small>مطابقة</small>
        </motion.div>
        <motion.div
          className="tree-sim__leg tree-sim__leg--right"
          animate={{ height: `${Math.min(100, rightBv / 50)}%` }}
        />
      </div>

      <div className="tree-sim__results">
        <div>
          <span>عمولة تقديرية</span>
          <strong>{commission} EGP</strong>
        </div>
        <div>
          <span>توازن الأرجل</span>
          <strong>{weakerPct}%</strong>
        </div>
      </div>
    </div>
  )
}
