import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { appendMessageToThread, patchMessageDeleted } from '../agency-comms/messageCache.js'

export function useAgencyGroupSocket(agencyId, channelId, { onMessage, onTyping } = {}) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()

  const getSocket = useCallback(() => {
    try {
      return window.__credoSocket || null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!agencyId || !token) return undefined
    const socket = getSocket()
    if (!socket?.connected) return undefined

    socket.emit('agency:join', { agencyId })
    if (channelId) socket.emit('agency-group:join-channel', { agencyId, channelId })

    const onMsg = (payload) => {
      if (payload?.agencyId !== agencyId) return
      const ch = payload.channelId
      if (ch && payload.message) {
        appendMessageToThread(qc, agencyId, ch, payload.message)
      }
      onMessage?.(payload)
    }

    const onType = (payload) => {
      if (payload?.channelId === channelId) onTyping?.(payload)
    }

    const onDel = (payload) => {
      if (payload?.agencyId !== agencyId) return
      const ch = payload.channelId
      if (ch && payload.messageId) {
        patchMessageDeleted(qc, agencyId, ch, payload.messageId, {
          scope: payload.scope,
          deleted_label:
            payload.scope === 'everyone' ? 'تم حذف هذه الرسالة' : undefined,
        })
      }
      onMessage?.(payload)
    }

    socket.on('agency-group:message', onMsg)
    socket.on('agency-group:typing', onType)
    socket.on('agency-group:mention', onMsg)
    socket.on('agency-group:reply', onMsg)
    socket.on('agency-group:delete', onDel)

    return () => {
      socket.off('agency-group:message', onMsg)
      socket.off('agency-group:typing', onType)
      socket.off('agency-group:mention', onMsg)
      socket.off('agency-group:reply', onMsg)
      socket.off('agency-group:delete', onDel)
      if (channelId) socket.emit('agency-group:leave-channel', { channelId })
    }
  }, [agencyId, channelId, token, getSocket, qc, onMessage, onTyping])

  const emitTyping = useCallback(() => {
    const socket = getSocket()
    if (socket?.connected && agencyId && channelId) {
      socket.emit('agency-group:typing', { agencyId, channelId })
    }
  }, [agencyId, channelId, getSocket])

  return { emitTyping }
}
