import { verifyAccessToken } from '../lib/jwt.js'

/** Sets req.user when a valid Bearer token is present; continues without user otherwise. */
export const optionalAuthMiddleware = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next()
  }
  const token = header.split(' ')[1]
  try {
    req.user = verifyAccessToken(token)
  } catch {
    /* ignore invalid token for public routes */
  }
  next()
}
