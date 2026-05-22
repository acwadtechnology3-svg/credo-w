import { motion } from 'framer-motion'

export default function TreeMemberPanel({ member, onClose }) {
  if (!member) return null

  return (
    <motion.div
      className="org-member-panel"
      dir="rtl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <button type="button" className="org-member-panel__close" onClick={onClose}>
        ×
      </button>
      <div className="org-member-panel__header">
        {member.profile_image ? (
          <img src={member.profile_image} alt="" className="org-member-panel__avatar" />
        ) : (
          <div className="org-member-panel__avatar-fallback">
            {(member.full_name || member.username || '?')[0]}
          </div>
        )}
        <div>
          <h3>{member.full_name || member.username}</h3>
          <span className="org-member-panel__code">{member.user_code}</span>
          {member.isOnline && <span className="org-member-panel__online">● متصل</span>}
        </div>
      </div>
      <dl className="org-member-panel__grid">
        <dt>الرتبة</dt>
        <dd>{member.rank}</dd>
        <dt>الباقة</dt>
        <dd>{member.packageLabel}</dd>
        <dt>الوكالة</dt>
        <dd>{member.agencyName || '—'} {member.agencyRole ? `(${member.agencyRole})` : ''}</dd>
        <dt>الراعي</dt>
        <dd>{member.sponsorName || '—'}</dd>
        <dt>الجانب</dt>
        <dd>{member.placementSide || '—'}</dd>
        <dt>BV يسار / يمين</dt>
        <dd>
          {Math.round(member.leftBv || 0)} / {Math.round(member.rightBv || 0)}
        </dd>
        <dt>CV</dt>
        <dd>{Math.round(member.cv || 0)}</dd>
        <dt>مباشرين</dt>
        <dd>{member.directCount}</dd>
        <dt>حجم الفريق</dt>
        <dd>{member.teamSize}</dd>
        <dt>تاريخ الانضمام</dt>
        <dd>{member.joinDate ? new Date(member.joinDate).toLocaleDateString('ar-EG') : '—'}</dd>
      </dl>
    </motion.div>
  )
}
