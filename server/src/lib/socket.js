import { Server } from 'socket.io'
import { verifyAccessToken } from './jwt.js'

let io

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || DEV_ORIGINS.includes(origin)) return callback(null, true)
        if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
          return callback(null, true)
        }
        if (process.env.NODE_ENV !== 'production') return callback(null, true)
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token'))
    try {
      const payload = verifyAccessToken(token)
      socket.userId = payload.userId
      socket.role = payload.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`)
    if (['admin', 'super_admin'].includes(socket.role)) {
      socket.join('support:staff')
    }
    console.log(`Socket connected: ${socket.userId}`)

    try {
      const { treeNetworkService } = await import('../services/treeNetwork.service.js')
      await treeNetworkService.updatePresence(socket.userId, socket.id, true)
      socket.broadcast.emit('org:presence', { userId: socket.userId, isOnline: true })
    } catch {
      /* presence table optional */
    }

    socket.on('agency:join', async ({ agencyId }) => {
      if (!agencyId) return
      try {
        const { supabase } = await import('./supabase.js')
        const { data: membership } = await supabase
          .from('agency_members')
          .select('agency_id')
          .eq('user_id', socket.userId)
          .eq('agency_id', agencyId)
          .eq('status', 'active')
          .maybeSingle()

        const isStaff = ['super_admin', 'admin'].includes(socket.role)
        if (membership || isStaff) {
          socket.join(`agency:${agencyId}`)
          socket.emit('agency:joined', { agencyId })
        }
      } catch (err) {
        console.warn('agency:join failed:', err.message)
      }
    })

    socket.on('agency:leave', ({ agencyId }) => {
      if (agencyId) socket.leave(`agency:${agencyId}`)
    })

    socket.on('agency-group:join-channel', async ({ agencyId, channelId }) => {
      if (!agencyId || !channelId) return
      try {
        const { agencyGroupsService } = await import('../services/agencyGroups.service.js')
        await agencyGroupsService.assertGroupAccess(socket.userId, agencyId)
        socket.join(`agency-channel:${channelId}`)
        socket.emit('agency-group:channel-joined', { agencyId, channelId })
      } catch {
        /* access denied */
      }
    })

    socket.on('agency-group:leave-channel', ({ channelId }) => {
      if (channelId) socket.leave(`agency-channel:${channelId}`)
    })

    socket.on('agency-group:typing', ({ agencyId, channelId }) => {
      if (!channelId) return
      socket.to(`agency-channel:${channelId}`).emit('agency-group:typing', {
        agencyId,
        channelId,
        userId: socket.userId,
      })
    })

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.userId}`)
      try {
        const { treeNetworkService } = await import('../services/treeNetwork.service.js')
        await treeNetworkService.updatePresence(socket.userId, null, false)
        socket.broadcast.emit('org:presence', { userId: socket.userId, isOnline: false })
      } catch {
        /* optional */
      }
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket not initialized')
  return io
}

export const emitToUser = (userId, event, data) => {
  try {
    getIO().to(`user:${userId}`).emit(event, data)
  } catch (err) {
    console.error('Socket emit error:', err.message)
  }
}

export const emitToAgency = (agencyId, event, data) => {
  try {
    getIO().to(`agency:${agencyId}`).emit(event, data)
  } catch (err) {
    console.error('Socket agency emit error:', err.message)
  }
}
