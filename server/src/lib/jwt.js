import jwt from 'jsonwebtoken'
import 'dotenv/config'

const ACCESS_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

export const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' })

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET)

export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET)
