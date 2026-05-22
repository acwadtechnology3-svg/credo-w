import { Check, Minus } from 'lucide-react'
import Reveal from '../core/Reveal'
import { COMPARISON_ROWS } from '../../data/packagesContent'

function CellValue({ value }) {
  if (value === '—') {
    return (
      <span className="ld-pkg-compare__empty">
        <Minus size={14} aria-hidden />
      </span>
    )
  }
  if (value.includes('LEGACY') || value.includes('Expansion Slot')) {
    return <span className="ld-pkg-compare__text">{value}</span>
  }
  return (
    <span className="ld-pkg-compare__check">
      <Check size={14} strokeWidth={2.5} aria-hidden />
      <span className="ld-pkg-compare__text">{value}</span>
    </span>
  )
}

export default function PackageComparison() {
  const cols = ['أحادي', 'ثلاثي', 'سباعي']

  return (
    <Reveal>
      <div id="compare" className="ld-pkg-compare">
        <h3 className="ld-heading-md ld-pkg-compare__title">مقارنة مستويات المنظومة</h3>
        <p className="ld-body ld-pkg-compare__sub">
          ليست خطط اشتراك — بل طبقات وصول وتوسّع داخل Credo W
        </p>
        <div className="ld-pkg-compare__scroll">
          <table className="ld-pkg-compare__table">
            <thead>
              <tr>
                <th scope="col">القدرة</th>
                {cols.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, ri) => (
                <tr key={row.key} style={{ animationDelay: `${ri * 40}ms` }}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((v, vi) => (
                    <td key={vi}>
                      <CellValue value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Reveal>
  )
}
