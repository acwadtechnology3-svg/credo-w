/** Agency hierarchy + permission matrix (operational layer) */

export const AGENCY_ROLES = {
  owner: { rank: 100, label: 'Agency Owner', label_ar: 'مالك الوكالة' },
  founder: { rank: 100, label: 'Founder', label_ar: 'المؤسس' },
  agency_admin: { rank: 95, label: 'Agency Admin', label_ar: 'مدير الوكالة' },
  manager: { rank: 90, label: 'Manager', label_ar: 'مدير' },
  leader: { rank: 85, label: 'Leader', label_ar: 'قائد' },
  recruiter: { rank: 70, label: 'Recruiter', label_ar: 'مجند' },
  moderator: { rank: 65, label: 'Moderator', label_ar: 'مشرف' },
  mentor: { rank: 60, label: 'Mentor', label_ar: 'موجه' },
  elite_member: { rank: 40, label: 'Elite', label_ar: 'نخبة' },
  member: { rank: 10, label: 'Member', label_ar: 'عضو' },
  observer: { rank: 5, label: 'Observer', label_ar: 'مراقب' },
  co_leader: { rank: 90, label: 'Co-Leader', label_ar: 'نائب' },
  officer: { rank: 80, label: 'Officer', label_ar: 'ضابط' },
}

export const ROLE_PERMISSIONS = {
  owner: ['all'],
  founder: ['all'],
  agency_admin: [
    'recruit',
    'invite',
    'manage_placements',
    'analytics',
    'moderate',
    'reports',
    'assign_roles',
    'approve_joins',
    'manage_settings',
  ],
  manager: [
    'recruit',
    'invite',
    'manage_placements',
    'analytics',
    'moderate',
    'reports',
    'assign_roles',
    'approve_joins',
  ],
  leader: ['recruit', 'invite', 'manage_placements', 'analytics', 'approve_joins', 'view_members'],
  co_leader: [
    'recruit',
    'invite',
    'manage_placements',
    'analytics',
    'moderate',
    'reports',
    'assign_roles',
    'approve_joins',
  ],
  recruiter: ['recruit', 'invite', 'view_analytics', 'view_tree'],
  moderator: ['moderate', 'view_members', 'reports', 'approve_joins'],
  mentor: ['invite', 'view_members'],
  elite_member: ['view_members', 'view_tree'],
  member: ['view_members'],
  observer: ['view_members', 'view_tree'],
  officer: ['invite', 'moderate', 'analytics'],
}

const ROLE_ALIASES = {
  founder: 'owner',
  co_leader: 'agency_admin',
  leader: 'leader',
  officer: 'manager',
}

export function normalizeAgencyRole(role) {
  return ROLE_ALIASES[role] || role
}

export function hasAgencyPermission(role, permission) {
  const normalized = normalizeAgencyRole(role)
  const perms = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member
  return perms.includes('all') || perms.includes(permission)
}

export function canManageAgencyRole(actorRole, targetRole) {
  const a = AGENCY_ROLES[normalizeAgencyRole(actorRole)]?.rank ?? 0
  const t = AGENCY_ROLES[normalizeAgencyRole(targetRole)]?.rank ?? 0
  return a > t
}

export function canCreateAgency(platformRole) {
  return ['super_admin', 'admin'].includes(platformRole)
}

export function canManageAgencies(platformRole) {
  return ['super_admin', 'admin', 'franchise'].includes(platformRole)
}

export function isAgencyStaffPlatformRole(platformRole) {
  return ['super_admin', 'admin', 'franchise'].includes(platformRole)
}
