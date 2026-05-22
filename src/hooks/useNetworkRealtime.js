import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from './useSocket'

/** Socket + query invalidation for live tree / network feed */
export function useNetworkRealtime(agencyId) {
  const socket = useSocket()
  const qc = useQueryClient()
  const [liveFeed, setLiveFeed] = useState([])

  const pushFeed = useCallback((item) => {
    setLiveFeed((prev) => [item, ...prev].slice(0, 25))
  }, [])

  useEffect(() => {
    if (!socket) return

    const invalidateTree = () => {
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
      qc.invalidateQueries({ queryKey: ['placement-tree'] })
      qc.invalidateQueries({ queryKey: ['tree-analytics'] })
      qc.invalidateQueries({ queryKey: ['network-activity'] })
    }

    const onActivity = (payload) => {
      pushFeed({
        id: payload.feed_id || Date.now(),
        title: payload.title || 'نشاط شبكة',
        body: payload.body,
        icon: payload.icon || '⚡',
        severity: payload.severity || 'info',
        created_at: new Date().toISOString(),
      })
      invalidateTree()
    }

    socket.on('org:activity', onActivity)
    socket.on('network:activity', onActivity)
    socket.on('placement_completed', invalidateTree)
    socket.on('package_activated', invalidateTree)

    return () => {
      socket.off('org:activity', onActivity)
      socket.off('network:activity', onActivity)
      socket.off('placement_completed', invalidateTree)
      socket.off('package_activated', invalidateTree)
    }
  }, [socket, pushFeed, qc])

  return { liveFeed }
}
