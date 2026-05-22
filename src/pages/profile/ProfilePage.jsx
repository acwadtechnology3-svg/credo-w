import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import {
  getProfile,
  getProfileHub,
  updateProfile,
  uploadProfileAvatar,
  changePassword,
  setPin,
  hasPin,
} from '../../api/profile.api'
import { useAuthStore } from '../../store/authStore'
import { refreshAuthUser } from '../../lib/refreshAuthUser'
import { GlowBg } from '../../components/ui/GlowBg'
import ProfileParticles from './components/ProfileParticles'
import ProfileHeroCard from './components/ProfileHeroCard'
import ProfileTabNav from './components/ProfileTabNav'
import ProfileOverviewTab from './components/tabs/ProfileOverviewTab'
import ProfileTeamTab from './components/tabs/ProfileTeamTab'
import ProfileAchievementsTab from './components/tabs/ProfileAchievementsTab'
import ProfileWalletsTab from './components/tabs/ProfileWalletsTab'
import ProfilePackagesTab from './components/tabs/ProfilePackagesTab'
import ProfileActivityTab from './components/tabs/ProfileActivityTab'
import ProfileRewardsTab from './components/tabs/ProfileRewardsTab'
import ProfileSecurityTab from './components/tabs/ProfileSecurityTab'
import ProfileInviteTab from './components/tabs/ProfileInviteTab'

const PROFILE_TABS = new Set([
  'overview',
  'team',
  'invite',
  'achievements',
  'wallets',
  'packages',
  'activity',
  'rewards',
  'security',
])

export default function ProfilePage() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const authUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && PROFILE_TABS.has(tab)) setActiveTab(tab)
  }, [searchParams])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [profileForm, setProfileForm] = useState(null)
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [pinForm, setPinForm] = useState({ pin: '', current_password: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const {
    data: hub,
    isLoading: hubLoading,
    refetch: refetchHub,
  } = useQuery({
    queryKey: ['profile-hub'],
    queryFn: getProfileHub,
  })

  useEffect(() => {
    if (profile && !profileForm) {
      setProfileForm({
        full_name: profile.full_name,
        title: profile.title,
        phone: profile.phone,
        country: profile.country,
        currency: profile.currency,
      })
    }
  }, [profile, profileForm])

  useEffect(() => {
    if (profile?.profile_image) setAvatarPreview(profile.profile_image)
  }, [profile?.profile_image])

  const { data: pinStatus } = useQuery({ queryKey: ['has-pin'], queryFn: hasPin })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['profile-hub'] })
      if (data?.user?.profile_image === null) setAvatarPreview(null)
      await refreshAuthUser()
      setMsg('Profile updated!')
      setErr('')
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setMsg('Password changed!')
      setErr('')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const avatarMutation = useMutation({
    mutationFn: uploadProfileAvatar,
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['profile'] })
      await qc.invalidateQueries({ queryKey: ['profile-hub'] })
      setAvatarPreview(data.profile_image)
      await refreshAuthUser()
      setMsg('Profile photo updated!')
      setErr('')
    },
    onError: (e) => setErr(e.response?.data?.error || 'Upload failed'),
    onSettled: () => setUploadingAvatar(false),
  })

  const pinMutation = useMutation({
    mutationFn: setPin,
    onSuccess: () => {
      setMsg('PIN set!')
      setErr('')
      setPinForm({ pin: '', current_password: '' })
      qc.invalidateQueries({ queryKey: ['has-pin'] })
    },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  })

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setErr('Image must be under 3MB')
      return
    }
    setUploadingAvatar(true)
    setErr('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      avatarMutation.mutate({ base64: ev.target.result, filename: file.name })
    }
    reader.onerror = () => {
      setUploadingAvatar(false)
      setErr('Could not read image file')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (profileLoading || hubLoading) {
    return (
      <div className="profile-identity module-page page-enter" dir="ltr">
        <GlowBg />
        <p style={{ color: 'var(--text-2)', position: 'relative', zIndex: 1 }}>Loading identity…</p>
      </div>
    )
  }

  const displayAvatar = avatarPreview ?? profile?.profile_image ?? authUser?.profile_image
  const displayInitials =
    authUser?.initials ||
    (profile?.full_name || 'U')
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'U'

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProfileOverviewTab
            hub={hub}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            onSave={() => updateMutation.mutate(profileForm)}
            saving={updateMutation.isPending}
            onRefresh={() => refetchHub()}
          />
        )
      case 'team':
        return <ProfileTeamTab hub={hub} onRefresh={() => refetchHub()} />
      case 'invite':
        return <ProfileInviteTab hub={hub} />
      case 'achievements':
        return <ProfileAchievementsTab hub={hub} />
      case 'wallets':
        return <ProfileWalletsTab hub={hub} />
      case 'packages':
        return <ProfilePackagesTab hub={hub} />
      case 'activity':
        return <ProfileActivityTab hub={hub} />
      case 'rewards':
        return <ProfileRewardsTab hub={hub} />
      case 'security':
        return (
          <ProfileSecurityTab
            pwForm={pwForm}
            setPwForm={setPwForm}
            pinForm={pinForm}
            setPinForm={setPinForm}
            pinStatus={pinStatus}
            onChangePassword={() => pwMutation.mutate(pwForm)}
            onSetPin={() => pinMutation.mutate(pinForm)}
            pwPending={pwMutation.isPending}
            pinPending={pinMutation.isPending}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="profile-identity module-page page-enter" dir="ltr">
      <GlowBg />
      <ProfileParticles />

      <header style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>
        <p className="t-eyebrow" style={{ color: 'var(--text-3)', marginBottom: 4 }}>
          IDENTITY COMMAND
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--text-1), var(--lavender))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}
        >
          Player Profile
        </h1>
      </header>

      {msg && <div className="pi-msg ok" style={{ position: 'relative', zIndex: 1 }}>✓ {msg}</div>}
      {err && <div className="pi-msg err" style={{ position: 'relative', zIndex: 1 }}>{err}</div>}

      <ProfileHeroCard
        hub={hub}
        displayAvatar={displayAvatar}
        displayInitials={displayInitials}
        uploadingAvatar={uploadingAvatar}
        onAvatarChange={handleAvatarChange}
      />

      <ProfileTabNav active={activeTab} onChange={(t) => { setActiveTab(t); setMsg(''); setErr('') }} />

      <AnimatePresence mode="wait">
        <div key={activeTab}>{renderTab()}</div>
      </AnimatePresence>
    </div>
  )
}
