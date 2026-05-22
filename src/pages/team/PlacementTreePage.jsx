import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getPlacementTree } from '../../api/team.api'
import { getTreeAccess } from '../../api/tree.api'
import PlacementTreeCanvas from '../../components/team/PlacementTreeCanvas'
import LockedTreeExperience from '../../components/tree/LockedTreeExperience'
import TreeEntryWizard from '../../components/tree/TreeEntryWizard'
import TreeOnboardingWizard from '../../components/tree/TreeOnboardingWizard'
import TeamAnalyticsPanel from '../../components/tree/TeamAnalyticsPanel'
import NetworkActivityTicker from '../../components/tree/NetworkActivityTicker'
import { useNetworkRealtime } from '../../hooks/useNetworkRealtime'
import Tree3DScene from '../../components/tree/Tree3DScene'
import TreeNetworkFlow from '../../components/organization/TreeNetworkFlow'
import OrganizationActivityFeed from '../../components/organization/OrganizationActivityFeed'
import { useOrganizationRealtime } from '../../hooks/useOrganizationRealtime'
import { useAuthStore } from '../../store/authStore'
import JoinNetworkModal from '../../components/tree/JoinNetworkModal'

export default function PlacementTreePage() {
  const [joinOpen, setJoinOpen] = useState(false)
  const [viewMode, setViewMode] = useState('flow')
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ['tree-access'],
    queryFn: getTreeAccess,
  })

  const showLiveTree = access?.canViewLiveTree
  const { liveFeed: orgFeed } = useOrganizationRealtime(user?.agency_id || user?.agencyId)
  const { liveFeed: networkFeed } = useNetworkRealtime(user?.agency_id || user?.agencyId)
  const liveFeed = [...networkFeed, ...orgFeed]

  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['placement-tree'],
    queryFn: getPlacementTree,
    enabled: !!showLiveTree,
  })

  if (accessLoading) {
    return (
      <div className="module-page page-enter" dir="rtl">
        <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '3rem' }}>جاري تحميل الشبكة...</p>
      </div>
    )
  }

  if (!access?.hasActivePackage) {
    return (
      <div className="module-page page-enter tree-network-page" dir="rtl">
        <LockedTreeExperience
          growthPreview={access?.growthPreview}
          onJoinNetwork={() => setJoinOpen(true)}
        />
        <JoinNetworkModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      </div>
    )
  }

  if (access?.needsEntryWizard) {
    return (
      <div className="module-page page-enter tree-network-page" dir="rtl">
        <TreeEntryWizard
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['tree-access'] })
            queryClient.invalidateQueries({ queryKey: ['placement-tree'] })
          }}
        />
      </div>
    )
  }

  if (access?.needsOnboarding) {
    return (
      <div className="module-page page-enter tree-network-page" dir="rtl">
        <TreeOnboardingWizard
          steps={access.onboarding?.steps || []}
          currentStepKey={access.onboarding?.currentStepKey}
          completedSteps={access.onboarding?.completedSteps || []}
          tree={treeData?.tree}
          vizConfig={access.visualizationConfig}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['tree-access'] })
            queryClient.invalidateQueries({ queryKey: ['placement-tree'] })
          }}
        />
      </div>
    )
  }

  return (
    <div className="module-page page-enter tree-network-page" dir="rtl">
      <NetworkActivityTicker liveItems={liveFeed} />
      <div className="tree-live-header">
        <div>
          <h2 className="font-display" style={{ fontSize: 20, marginBottom: 4 }}>
            شبكتك الثنائية
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            شجرة حية — عقد متوهجة وتدفق BV
          </p>
        </div>
        <div className="tree-live-header__actions">
          <Link to="/team/join-requests" className="tree-locked__btn tree-locked__btn--secondary" style={{ textDecoration: 'none' }}>
            طلبات الانضمام
          </Link>
          <Link to="/organization" className="tree-locked__btn tree-locked__btn--primary" style={{ textDecoration: 'none' }}>
            مركز المنظمة
          </Link>
          <div className="tree-view-toggle">
            <button type="button" className={viewMode === 'flow' ? 'active' : ''} onClick={() => setViewMode('flow')}>
              حية
            </button>
            <button type="button" className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')}>
              3D
            </button>
            <button type="button" className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')}>
              2D
            </button>
          </div>
        </div>
      </div>

      {treeLoading ? (
        <div className="module-card module-card-body">
          <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '3rem 0' }}>جاري تحميل الشجرة...</p>
        </div>
      ) : !treeData?.tree ? (
        <div className="module-card module-card-body">
          <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '3rem 0' }}>
            جاري تفعيل موضعك — حدّث الصفحة أو تواصل مع الدعم
          </p>
        </div>
      ) : (
        <div className="tree-live-layout">
          <div>
            {viewMode === 'flow' ? (
              <TreeNetworkFlow />
            ) : viewMode === '3d' ? (
              <Tree3DScene tree={treeData.tree} config={access?.visualizationConfig} className="tree-live-3d" />
            ) : (
              <PlacementTreeCanvas tree={treeData.tree} />
            )}
          </div>
          <div className="tree-live-sidebar">
            <TeamAnalyticsPanel />
            <OrganizationActivityFeed liveItems={liveFeed} />
          </div>
        </div>
      )}
    </div>
  )
}
