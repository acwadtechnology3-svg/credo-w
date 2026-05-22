import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { agencyGroupsController } from '../controllers/agencyGroups.controller.js'
import {
  agencyGroupMessageLimiter,
  agencyGroupModerationLimiter,
} from '../middleware/agencyGroupRateLimit.js'

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/workspace', agencyGroupsController.workspace)
router.get('/analytics', agencyGroupsController.analytics)
router.get('/members', agencyGroupsController.members)
router.get('/search', agencyGroupsController.search)
router.post('/event-rooms', agencyGroupModerationLimiter, agencyGroupsController.createEventRoom)

router.get('/channels/:channelId/messages', agencyGroupsController.messages)
router.post(
  '/channels/:channelId/messages',
  agencyGroupMessageLimiter,
  agencyGroupsController.sendMessage
)
router.post(
  '/channels/:channelId/upload',
  agencyGroupMessageLimiter,
  agencyGroupsController.upload
)
router.post(
  '/channels/:channelId/ai',
  agencyGroupMessageLimiter,
  agencyGroupsController.ai
)

router.post('/messages/:messageId/reactions', agencyGroupsController.reaction)
router.post('/messages/:messageId/pin', agencyGroupsController.pin)
router.delete('/messages/:messageId', agencyGroupsController.deleteMessage)
router.post('/messages/:messageId/delete', agencyGroupsController.deleteMessage)

router.post(
  '/moderation/:userId/mute',
  agencyGroupModerationLimiter,
  agencyGroupsController.mute
)
router.post(
  '/moderation/:userId/ban',
  agencyGroupModerationLimiter,
  agencyGroupsController.ban
)
router.post(
  '/moderation/:userId/warn',
  agencyGroupModerationLimiter,
  agencyGroupsController.warn
)

export { router as agencyGroupsRouter }
