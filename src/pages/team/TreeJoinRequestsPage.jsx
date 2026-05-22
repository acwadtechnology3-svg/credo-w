import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listJoinRequests, approveJoinRequest, rejectJoinRequest, cancelJoinRequest } from '../../api/tree.api'
import { toast } from '../../components/shared/Toast'

const STATUS_LABEL = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  expired: 'منتهي',
  cancelled: 'ملغى',
}

function RequestCard({ req, mode, onAction }) {
  const person = mode === 'sponsor' ? req.requester : req.sponsor
  const canApprove = mode === 'sponsor' && req.status === 'pending'

  return (
    <div className="join-req-card module-card module-card-body">
      <div className="join-req-card__head">
        <div>
          <strong>{person?.full_name || person?.username}</strong>
          <span className="join-req-card__code">{person?.user_code}</span>
        </div>
        <span className={`join-req-card__status join-req-card__status--${req.status}`}>
          {STATUS_LABEL[req.status] || req.status}
        </span>
      </div>
      {req.agency?.name && (
        <p className="join-req-card__meta">الوكالة: {req.agency.name}</p>
      )}
      <p className="join-req-card__meta">
        الجانب: {req.placement_side} · الراعي: {req.sponsor?.user_code}
      </p>
      {req.message && <p className="join-req-card__message">{req.message}</p>}
      {mode === 'requester' && req.status === 'pending' && (
        <p className="join-req-card__hint">
          يتطلب الموافقة باقة نشطة ومؤكدة الدفع
          {person?.current_package_level > 0 ? ' ✓' : ' — اشترِ باقة أولاً'}
        </p>
      )}
      <div className="join-req-card__actions">
        {canApprove && (
          <>
            <button type="button" className="tree-locked__btn tree-locked__btn--primary" onClick={() => onAction('approve', req.id)}>
              موافقة
            </button>
            <button type="button" className="tree-locked__btn tree-locked__btn--secondary" onClick={() => onAction('reject', req.id)}>
              رفض
            </button>
          </>
        )}
        {mode === 'requester' && req.status === 'pending' && (
          <button type="button" className="tree-locked__btn tree-locked__btn--secondary" onClick={() => onAction('cancel', req.id)}>
            إلغاء الطلب
          </button>
        )}
      </div>
    </div>
  )
}

export default function TreeJoinRequestsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('mine')

  const { data: mine, isLoading: loadingMine } = useQuery({
    queryKey: ['join-requests', 'requester'],
    queryFn: () => listJoinRequests('requester'),
  })
  const { data: incoming, isLoading: loadingIn } = useQuery({
    queryKey: ['join-requests', 'sponsor'],
    queryFn: () => listJoinRequests('sponsor'),
  })

  const actionMut = useMutation({
    mutationFn: async ({ action, id }) => {
      if (action === 'approve') return approveJoinRequest(id)
      if (action === 'reject') return rejectJoinRequest(id, '')
      return cancelJoinRequest(id)
    },
    onSuccess: (_, { action }) => {
      toast.success(action === 'approve' ? 'تمت الموافقة' : action === 'reject' ? 'تم الرفض' : 'تم الإلغاء')
      queryClient.invalidateQueries({ queryKey: ['join-requests'] })
      queryClient.invalidateQueries({ queryKey: ['tree-access'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const requests = tab === 'mine' ? mine?.requests : incoming?.requests
  const loading = tab === 'mine' ? loadingMine : loadingIn

  return (
    <div className="module-page page-enter" dir="rtl">
      <h2 className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>
        🔥 طلبات انضمام الشجرة
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
        الطلبات المعلقة، الدعوات، الموافقات، وحالة الوضع
      </p>

      <div className="join-req-tabs">
        <button type="button" className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
          طلباتي
        </button>
        <button type="button" className={tab === 'incoming' ? 'active' : ''} onClick={() => setTab('incoming')}>
          واردة إليّ
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '2rem' }}>جاري التحميل...</p>
      ) : !requests?.length ? (
        <div className="module-card module-card-body">
          <p style={{ textAlign: 'center', color: 'var(--text-3)' }}>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="join-req-list">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              mode={tab === 'incoming' ? 'sponsor' : 'requester'}
              onAction={(action, id) => actionMut.mutate({ action, id })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
