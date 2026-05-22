import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { createJoinRequest } from '../../api/tree.api'
import { toast } from '../shared/Toast'

export default function JoinNetworkModal({ open, onClose }) {
  const [sponsorCode, setSponsorCode] = useState('')
  const [side, setSide] = useState('AUTO')
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationFn: () =>
      createJoinRequest({
        sponsorCode: sponsorCode.trim(),
        placementSide: side,
        message,
      }),
    onSuccess: () => {
      toast.success('تم إرسال طلب الانضمام')
      queryClient.invalidateQueries({ queryKey: ['tree-access'] })
      queryClient.invalidateQueries({ queryKey: ['join-requests'] })
      onClose()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشل الإرسال'),
  })

  if (!open) return null

  return (
    <div className="tree-modal-backdrop" onClick={onClose} role="presentation">
      <motion.div
        className="tree-modal"
        dir="rtl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display">🔗 انضم لشبكة موجودة</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
          أدخل رمز الراعي (USR-...) — يُوافق بعد تأكيد باقتك النشطة
        </p>
        <label className="tree-modal__field">
          رمز الراعي
          <input
            value={sponsorCode}
            onChange={(e) => setSponsorCode(e.target.value)}
            placeholder="USR-000123"
          />
        </label>
        <label className="tree-modal__field">
          الجانب المفضل
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="AUTO">تلقائي (أضعف رجل)</option>
            <option value="LEFT">يسار</option>
            <option value="RIGHT">يمين</option>
          </select>
        </label>
        <label className="tree-modal__field">
          رسالة (اختياري)
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        </label>
        <div className="tree-modal__actions">
          <button type="button" className="tree-locked__btn tree-locked__btn--secondary" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="tree-locked__btn tree-locked__btn--primary"
            disabled={!sponsorCode.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            إرسال طلب الانضمام
          </button>
        </div>
      </motion.div>
    </div>
  )
}
