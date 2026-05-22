import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { appendMessageToThread, patchMessageDeleted } from '../agency-comms/messageCache.js'
import { isSocketsEnabled } from '../config/demoMode.js'

let socketInstance = null

export const useSocket = () => {
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const qc = useQueryClient()

  useEffect(() => {
    if (!isSocketsEnabled) return undefined

    if (!isAuthenticated || !token) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      return
    }

    if (socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.DEV ? 'http://localhost:5173' : 'http://localhost:3001')

    socketInstance = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected')
    })

    socketInstance.on('wallet:updated', () => {
      qc.invalidateQueries({ queryKey: ['wallet-summary'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['withdrawals'] })
    })

    socketInstance.on('notification:new', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['sent-messages'] })
    })

    socketInstance.on('support:message:new', (payload) => {
      const ticketId = payload?.ticket?.id
      qc.invalidateQueries({ queryKey: ['support-unread'] })
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      if (ticketId) {
        qc.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
        qc.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] })
      }
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    })

    socketInstance.on('support:ticket:new', () => {
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    })

    socketInstance.on('support:ticket:updated', (payload) => {
      const ticketId = payload?.ticket?.id
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      if (ticketId) {
        qc.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
        qc.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] })
      }
    })

    socketInstance.on('progression:celebration', () => {
      qc.invalidateQueries({ queryKey: ['progression-hub'] })
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
      qc.invalidateQueries({ queryKey: ['organization-hub'] })
    })

    socketInstance.on('org:activity', () => {
      qc.invalidateQueries({ queryKey: ['org-activity'] })
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    })

    socketInstance.on('org:presence', () => {
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    })

    socketInstance.on('mlm:commission', () => {
      qc.invalidateQueries({ queryKey: ['mlm-dashboard'] })
      qc.invalidateQueries({ queryKey: ['wallet-summary'] })
    })

    socketInstance.on('mlm:propagation', () => {
      qc.invalidateQueries({ queryKey: ['mlm-dashboard'] })
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    })

    socketInstance.on('mlm:rank_promoted', () => {
      qc.invalidateQueries({ queryKey: ['mlm-dashboard'] })
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
    })

    socketInstance.on('agency-group:message', (payload) => {
      const { agencyId, channelId, message } = payload || {}
      if (agencyId && channelId && message) {
        appendMessageToThread(qc, agencyId, channelId, message)
      }
    })

    socketInstance.on('agency-group:delete', (payload) => {
      const { agencyId, channelId, messageId, scope } = payload || {}
      if (agencyId && channelId && messageId && scope === 'everyone') {
        patchMessageDeleted(qc, agencyId, channelId, messageId, {
          scope: 'everyone',
          deleted_label: 'تم حذف هذه الرسالة',
        })
      }
    })

    window.__credoSocket = socketInstance

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
    }
  }, [isAuthenticated, token, qc])

  return socketInstance
}
