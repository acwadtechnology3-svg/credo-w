import { supabase } from '../lib/supabase.js'
import { hasAgencyPermission } from '../lib/agencyRoles.js'

/**
 * Requires authenticated user with agency membership (or platform admin).
 * Sets req.agencyMembership on success.
 */
export function requireAgencyMember(permission = null) {
  return async (req, res, next) => {
    try {
      const agencyId = req.params.agencyId
      if (!agencyId) return res.status(400).json({ error: 'agencyId required' })

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.userId)
        .single()

      if (['super_admin', 'admin'].includes(user?.role)) {
        req.agencyMembership = { role: 'platform_admin', agency_id: agencyId }
        return next()
      }

      const { data: membership } = await supabase
        .from('agency_members')
        .select('role, agency_id, status')
        .eq('agency_id', agencyId)
        .eq('user_id', req.user.userId)
        .eq('status', 'active')
        .maybeSingle()

      if (!membership) {
        return res.status(403).json({ error: 'Not an agency member' })
      }

      if (permission && !hasAgencyPermission(membership.role, permission)) {
        return res.status(403).json({ error: 'Insufficient agency permissions' })
      }

      req.agencyMembership = membership
      next()
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }
}
