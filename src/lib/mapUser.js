/** First name for greetings (first word of full_name or username). */
export function getDisplayFirstName(user) {
  if (!user) return ''
  const full = (user.full_name || user.name || user.username || '').trim()
  if (!full) return ''
  const first = full.split(/\s+/)[0]
  if (/^[a-z]/.test(first)) {
    return first.charAt(0).toUpperCase() + first.slice(1)
  }
  return first
}

/** Map API user → UI auth store shape */
export function mapUserForStore(apiUser) {
  const fullName = apiUser.full_name || apiUser.username || 'User'
  const parts = fullName.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0][0] || ''}${parts[1][0] || ''}`
      : fullName.slice(0, 2)

  return {
    id: apiUser.user_code || apiUser.id,
    uuid: apiUser.id,
    user_code: apiUser.user_code,
    username: apiUser.username,
    name: fullName,
    full_name: fullName,
    initials: initials.toUpperCase(),
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.status,
    rank: apiUser.rank?.name || apiUser.ranks?.name || 'Member',
    rankData: apiUser.rank || apiUser.ranks,
    profile_image: apiUser.profile_image,
    currency: apiUser.currency,
    country: apiUser.country,
    cycleEarnings: 0,
  }
}
