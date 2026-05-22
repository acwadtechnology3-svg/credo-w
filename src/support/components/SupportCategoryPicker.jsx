import Icon from '../../components/ui/Icon'
import { SUPPORT_CATEGORIES } from '../constants'

export default function SupportCategoryPicker({ selected, onSelect, disabled }) {
  return (
    <section className="support-categories-section" aria-labelledby="support-categories-heading">
      <div className="support-categories-section-head">
        <div>
          <h2 id="support-categories-heading" className="support-categories-title">
            نوع الطلب
          </h2>
          <p className="support-categories-desc">
            اختر القسم المناسب — ستظهر رسائل جاهزة لتبدأ المحادثة بسرعة
          </p>
        </div>
        {selected && (
          <span className="support-categories-selected-pill">
            <span className="support-categories-selected-dot" />
            تم الاختيار
          </span>
        )}
      </div>

      <div className="support-categories-grid">
        {SUPPORT_CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id
          const isFeatured = cat.featured
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              className={[
                'support-cat-card',
                isSelected ? 'selected' : '',
                isFeatured ? 'featured' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--cat-color': cat.color }}
              onClick={() => onSelect(cat.id)}
              aria-pressed={isSelected}
            >
              <span className="support-cat-card-glow" aria-hidden />
              <span className="support-cat-icon-wrap">
                <Icon name={cat.icon} size={20} />
              </span>
              <span className="support-cat-label">{cat.label}</span>
              <span className="support-cat-hint">{cat.hint}</span>
              {isFeatured && <span className="support-cat-tag">مميز</span>}
              {isSelected && (
                <span className="support-cat-check" aria-hidden>
                  <Icon name="check" size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
