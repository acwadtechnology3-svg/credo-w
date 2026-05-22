const PLACEMENT_SIDES = new Set(['LEFT', 'RIGHT', 'AUTO'])

export function validatePlacementSide(side) {
  const normalized = (side || 'AUTO').toUpperCase()
  if (!PLACEMENT_SIDES.has(normalized)) {
    throw Object.assign(new Error('placement_side must be LEFT, RIGHT, or AUTO'), { status: 400 })
  }
  return normalized
}

export function validateJoinRequestBody(body) {
  if (!body.agency_id && !body.agencyId) {
    throw Object.assign(new Error('agency_id required'), { status: 400 })
  }
  if (body.placement_side) validatePlacementSide(body.placement_side)
  return {
    agencyId: body.agency_id || body.agencyId,
    sponsorUserId: body.sponsor_user_id || body.sponsorId || null,
    placementSide: validatePlacementSide(body.placement_side),
    message: body.message,
    inviteCode: body.invite_code || body.inviteCode || null,
  }
}

export function validateAgencyCreatePayload(body) {
  if (!body.name?.trim()) throw Object.assign(new Error('Agency name required'), { status: 400 })
  if (!body.owner_id) throw Object.assign(new Error('owner_id required'), { status: 400 })
  return body
}

export function validateManualPlacement(body) {
  if (!body.userId) throw Object.assign(new Error('userId required'), { status: 400 })
  if (!body.sponsorId) throw Object.assign(new Error('sponsorId required'), { status: 400 })
  if (!body.agencyId) throw Object.assign(new Error('agencyId required'), { status: 400 })
  return {
    userId: body.userId,
    sponsorId: body.sponsorId,
    agencyId: body.agencyId,
    placementSide: validatePlacementSide(body.placementSide),
  }
}
