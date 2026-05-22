/** P4 team hierarchy permissions */

export const TEAM_ROLES = {
  founder: { rank: 100, label: 'Founder', label_ar: 'المؤسس' },
  co_leader: { rank: 90, label: 'Co-Leader', label_ar: 'نائب القائد' },
  leader: { rank: 90, label: 'Leader', label_ar: 'قائد' },
  recruiter: { rank: 70, label: 'Recruiter', label_ar: 'مجند' },
  mentor: { rank: 60, label: 'Mentor', label_ar: 'موجه' },
  elite_member: { rank: 40, label: 'Elite', label_ar: 'نخبة' },
  officer: { rank: 80, label: 'Officer', label_ar: 'ضابط' },
  member: { rank: 10, label: 'Member', label_ar: 'عضو' },
}

export const ROLE_PERMISSIONS = {
  founder: ['all'],
  co_leader: ['invite', 'moderate', 'analytics', 'announce', 'assign_roles'],
  leader: ['invite', 'moderate', 'analytics', 'announce', 'assign_roles'],
  recruiter: ['invite', 'view_analytics'],
  mentor: ['invite', 'view_members'],
  elite_member: ['view_members'],
  officer: ['invite', 'moderate', 'analytics'],
  member: ['view_members'],
}

export function hasTeamPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member
  return perms.includes('all') || perms.includes(permission)
}

export function canManageRole(actorRole, targetRole) {
  const a = TEAM_ROLES[actorRole]?.rank ?? 0
  const t = TEAM_ROLES[targetRole]?.rank ?? 0
  return a > t
}
