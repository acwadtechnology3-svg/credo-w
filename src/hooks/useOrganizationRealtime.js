import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useSocket } from './useSocket'

export function useOrganizationRealtime(agencyId) {
  const socket = useSocket()
  const qc = useQueryClient()
  const [liveFeed, setLiveFeed] = useState([])
  const userId = useAuthStore((s) => s.user?.id)

  const pushFeed = useCallback((item) => {
    setLiveFeed((prev) => [item, ...prev].slice(0, 20))
  }, [])

  useEffect(() => {
    if (!socket) return

    if (agencyId) {
      socket.emit('agency:join', { agencyId })
    }

    const onActivity = (payload) => {
      pushFeed(payload)
      qc.invalidateQueries({ queryKey: ['org-activity'] })
      qc.invalidateQueries({ queryKey: ['organization-hub'] })
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    }

    const onPresence = () => {
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    }

    socket.on('org:activity', onActivity)
    socket.on('org:presence', onPresence)
    socket.on('progression:celebration', () => {
      qc.invalidateQueries({ queryKey: ['organization-hub'] })
    })

    return () => {
      socket.off('org:activity', onActivity)
      socket.off('org:presence', onPresence)
      if (agencyId) socket.emit('agency:leave', { agencyId })
    }
  }, [socket, agencyId, pushFeed, qc])

  return { liveFeed, userId }
}
