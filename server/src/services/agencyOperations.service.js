import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'
import { canManageAgencies, hasAgencyPermission } from '../lib/agencyRoles.js'
import { createAgency, recalcAgencyStats, recalcAgencyRank } from './agencies.service.js'
import { agencyRealtimeService } from './agencyRealtime.service.js'

function generateInviteCode() {
  return `AG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

export const agencyOperationsService = {
  async create(staffUserId, platformRole, payload) {
    return createAgency(staffUserId, platformRole, payload)
  },

  async updateAgency(agencyId, actorId, platformRole, patch) {
    const canPlatform = canManageAgencies(platformRole)
    if (!canPlatform) {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', actorId)
        .eq('status', 'active')
        .single()
      if (!membership || !hasAgencyPermission(membership.role, 'manage_settings')) {
        throw Object.assign(new Error('Forbidden'), { status: 403 })
      }
    }

    const allowed = [
      'name',
      'motto',
      'slogan',
      'mission',
      'bio',
      'leadership_statement',
      'logo_url',
      'banner_url',
      'welcome_video_url',
      'intro_video_url',
      'primary_color',
      'secondary_color',
      'glow_theme',
      'agency_category',
      'region',
      'is_public',
      'is_discoverable',
      'max_members',
      'branding_json',
      'social_links',
      'permissions_json',
      'chat_prep',
      'owner_id',
      'leader_id',
      'founder_id',
    ]

    const update = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (patch[key] !== undefined) update[key] = patch[key]
    }

    const { data, error } = await supabase
      .from('agencies')
      .update(update)
      .eq('id', agencyId)
      .select()
      .single()

    if (error) throw error

    if (patch.owner_id) {
      await supabase
        .from('agency_members')
        .upsert(
          { agency_id: agencyId, user_id: patch.owner_id, role: 'owner', status: 'active' },
          { onConflict: 'user_id' }
        )
      await supabase.from('users').update({ agency_id: agencyId }).eq('id', patch.owner_id)
    }

    await recalcAgencyStats(agencyId)
    await agencyRealtimeService.emit(agencyId, 'agency_updated', {
      actorId,
      payload: { fields: Object.keys(update) },
    })

    return data
  },

  async deactivate(agencyId, actorId, platformRole, { reason } = {}) {
    if (!canManageAgencies(platformRole)) {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', actorId)
        .eq('status', 'active')
        .single()
      if (!membership || !hasAgencyPermission(membership.role, 'manage_settings')) {
        throw Object.assign(new Error('Forbidden'), { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('agencies')
      .update({
        status: 'inactive',
        is_discoverable: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('agency_activity_logs').insert({
      agency_id: agencyId,
      actor_id: actorId,
      action: 'agency_deactivated',
      details: { reason: reason || null },
    })

    await agencyRealtimeService.emit(agencyId, 'agency_deactivated', {
      actorId,
      payload: { reason },
    })

    return data
  },

  async getSettings(agencyId, requesterId, platformRole) {
    const canPlatform = canManageAgencies(platformRole)
    if (!canPlatform) {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', requesterId)
        .eq('status', 'active')
        .single()
      if (!membership) throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const { data: agency, error } = await supabase
      .from('agencies')
      .select(
        'id, slug, short_code, name, owner_id, founder_id, leader_id, max_members, status, is_public, is_discoverable, primary_color, secondary_color, glow_theme, branding_json, permissions_json, social_links, chat_prep'
      )
      .eq('id', agencyId)
      .single()

    if (error || !agency) throw Object.assign(new Error('Agency not found'), { status: 404 })

    const { data: publicInvite } = await supabase
      .from('agency_invitations')
      .select('code, invite_type, expires_at, is_active')
      .eq('agency_id', agencyId)
      .eq('invite_type', 'agency_link')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const branding = agency.branding_json || {}
    return {
      agency_id: agency.id,
      agency_code: agency.short_code,
      public_invite_code: publicInvite?.code || null,
      founder_id: agency.founder_id || agency.owner_id,
      sponsor_root_user_id: branding.sponsor_root_user_id || agency.founder_id,
      placement_structure: branding.placement_structure || 'binary',
      agency_theme: {
        primary_color: agency.primary_color,
        secondary_color: agency.secondary_color,
        glow_theme: agency.glow_theme,
      },
      visibility: {
        is_public: agency.is_public,
        is_discoverable: agency.is_discoverable,
        status: agency.status,
      },
      max_capacity: agency.max_members,
      onboarding_settings: branding.onboarding_settings || {
        require_cinematic: true,
        auto_launch_after_package: true,
      },
      permissions_json: agency.permissions_json,
      social_links: agency.social_links,
    }
  },

  async updateSettings(agencyId, actorId, platformRole, settings) {
    const canPlatform = canManageAgencies(platformRole)
    if (!canPlatform) {
      const { data: membership } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', actorId)
        .eq('status', 'active')
        .single()
      if (!membership || !hasAgencyPermission(membership.role, 'manage_settings')) {
        throw Object.assign(new Error('Forbidden'), { status: 403 })
      }
    }

    const { data: current } = await supabase
      .from('agencies')
      .select('branding_json, permissions_json')
      .eq('id', agencyId)
      .single()

    const branding = { ...(current?.branding_json || {}) }
    if (settings.sponsor_root_user_id !== undefined) {
      branding.sponsor_root_user_id = settings.sponsor_root_user_id
    }
    if (settings.placement_structure !== undefined) {
      branding.placement_structure = settings.placement_structure
    }
    if (settings.onboarding_settings !== undefined) {
      branding.onboarding_settings = settings.onboarding_settings
    }

    const patch = {
      branding_json: branding,
      updated_at: new Date().toISOString(),
    }

    if (settings.max_capacity !== undefined) patch.max_members = settings.max_capacity
    if (settings.visibility) {
      if (settings.visibility.is_public !== undefined) patch.is_public = settings.visibility.is_public
      if (settings.visibility.is_discoverable !== undefined) {
        patch.is_discoverable = settings.visibility.is_discoverable
      }
    }
    if (settings.agency_theme) {
      if (settings.agency_theme.primary_color) patch.primary_color = settings.agency_theme.primary_color
      if (settings.agency_theme.secondary_color) patch.secondary_color = settings.agency_theme.secondary_color
      if (settings.agency_theme.glow_theme) patch.glow_theme = settings.agency_theme.glow_theme
    }
    if (settings.permissions_json) patch.permissions_json = settings.permissions_json

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', agencyId)
      .select()
      .single()

    if (error) throw error

    if (settings.rotate_public_invite) {
      const code = generateInviteCode()
      await supabase
        .from('agency_invitations')
        .update({ is_active: false })
        .eq('agency_id', agencyId)
        .eq('invite_type', 'agency_link')
      await supabase.from('agency_invitations').insert({
        agency_id: agencyId,
        created_by: actorId,
        code,
        invite_type: 'agency_link',
        placement_side: 'AUTO',
        theme: 'elite',
      })
    }

    return this.getSettings(agencyId, actorId, platformRole)
  },

  async freeze(agencyId, actorId, platformRole) {
    if (!canManageAgencies(platformRole)) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
    const branding = {}
    const { data: cur } = await supabase
      .from('agencies')
      .select('branding_json')
      .eq('id', agencyId)
      .single()
    Object.assign(branding, cur?.branding_json || {}, { frozen: true, frozen_at: new Date().toISOString() })

    const { data, error } = await supabase
      .from('agencies')
      .update({ status: 'frozen', branding_json: branding, updated_at: new Date().toISOString() })
      .eq('id', agencyId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
