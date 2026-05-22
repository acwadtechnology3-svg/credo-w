import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { ToastContainer, toast } from './components/shared/Toast'
import { useInitAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import PackagesPage from './pages/packages/PackagesPage'
import HybridPaymentPage from './pages/finance/HybridPaymentPage'
import FinanceEcosystemPage from './pages/finance/FinanceEcosystemPage'
import PackageDetailPage from './pages/packages/PackageDetailPage'
import BuyPage from './pages/shop/BuyPage'
import CartPage from './pages/shop/CartPage'
import OrdersPage from './pages/shop/OrdersPage'
import ShippingPage from './pages/shop/ShippingPage'
import SubscriptionsPage from './pages/shop/SubscriptionsPage'
import NewReferralPage from './pages/team/NewReferralPage'
import ReferralsPage from './pages/team/ReferralsPage'
import GenealogyPage from './pages/team/GenealogyPage'
import PlacementTreePage from './pages/team/PlacementTreePage'
import TreeJoinRequestsPage from './pages/team/TreeJoinRequestsPage'
import OrganizationHubPage from './pages/organization/OrganizationHubPage'
import MlmIntelligencePage from './pages/mlm/MlmIntelligencePage'
import EnrollerTreePage from './pages/team/EnrollerTreePage'
import BusinessVolumePage from './pages/team/BusinessVolumePage'
import PersonalVolumePage from './pages/team/PersonalVolumePage'
import WalletPage from './pages/earnings/WalletPage'
import RetailProfitPage from './pages/earnings/RetailProfitPage'
import FastStartPage from './pages/earnings/FastStartPage'
import LevelBonusPage from './pages/earnings/LevelBonusPage'
import TeamCommissionPage from './pages/earnings/TeamCommissionPage'
import RankBonusPage from './pages/earnings/RankBonusPage'
import WithdrawalPage from './pages/withdrawal/WithdrawalPage'
import BankAccountsPage from './pages/withdrawal/BankAccountsPage'
import PearlsWalletPage from './pages/customer/PearlsWalletPage'
import ProgressionHubPage from './pages/progression/ProgressionHubPage'
import CareerPathPage from './pages/progression/CareerPathPage'
import VouchersPage from './pages/customer/VouchersPage'
import CommunityPage from './pages/customer/CommunityPage'
import MembershipPage from './pages/customer/MembershipPage'
import ProfilePage from './pages/profile/ProfilePage'
import MarketingToolsPage from './pages/marketing/MarketingToolsPage'
import SupportCenterPage from './pages/support/SupportCenterPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import MessagesSentPage from './pages/messages/MessagesSentPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage'
import AdminCommissionsPage from './pages/admin/AdminCommissionsPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminProductFormPage from './pages/admin/AdminProductFormPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'
import AdminVouchersPage from './pages/admin/AdminVouchersPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminAuditPage from './pages/admin/AdminAuditPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCourseFormPage from './pages/admin/AdminCourseFormPage'
import AdminCourseLessonsPage from './pages/admin/AdminCourseLessonsPage'
import AdminCourseEnrollmentsPage from './pages/admin/AdminCourseEnrollmentsPage'
import CoursesPage from './pages/courses/CoursesPage'
import CourseDetailPage from './pages/courses/CourseDetailPage'
import CourseLearnPage from './pages/courses/CourseLearnPage'
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage'
import AdminDepositsPage from './pages/admin/AdminDepositsPage'
import AdminKycPage from './pages/admin/AdminKycPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import FranchiseDashboardPage from './pages/franchise/FranchiseDashboardPage'
import SAOverviewPage from './pages/superAdmin/SAOverviewPage'
import SABusinessHubPage from './pages/superAdmin/SABusinessHubPage'
import SAUpgradeRulesPage from './pages/superAdmin/SAUpgradeRulesPage'
import SAFeatureFlagsPage from './pages/superAdmin/SAFeatureFlagsPage'
import SAPaymentMethodsPage from './pages/superAdmin/SAPaymentMethodsPage'
import SAPromotionsPage from './pages/superAdmin/SAPromotionsPage'
import SAGamificationPage from './pages/superAdmin/SAGamificationPage'
import SAProgressionPage from './pages/superAdmin/SAProgressionPage'
import SAPackagesPage from './pages/superAdmin/SAPackagesPage'
import SARanksPage from './pages/superAdmin/SARanksPage'
import SALevelBonusPage from './pages/superAdmin/SALevelBonusPage'
import SASettingsPage from './pages/superAdmin/SASettingsPage'
import SAAdminsPage from './pages/superAdmin/SAAdminsPage'
import SAOperationsPage from './pages/superAdmin/SAOperationsPage'
import SANetworkPage from './pages/superAdmin/SANetworkPage'
import SuperAdminLayout from './pages/superAdmin/SuperAdminLayout'
import AdminShellLayout from './components/layout/AdminShellLayout'
import LandingPage from './pages/public/LandingPage'
import InviteLandingPage from './pages/public/InviteLandingPage'
import EcosystemPublicLayout from './ecosystem/EcosystemPublicLayout'
import EcosystemPageView from './ecosystem/EcosystemPageView'
import StartPage from './ecosystem/StartPage'
import PackagesRoute from './pages/ecosystem/PackagesRoute'
import SupportRoute from './pages/ecosystem/SupportRoute'
import AgencyDiscoveryPage from './pages/agencies/AgencyDiscoveryPage'
import AgencyProfilePage from './pages/agencies/AgencyProfilePage'
import AgencyOnboardingPage from './pages/agencies/AgencyOnboardingPage'
import AgencyLeaderboardPage from './pages/agencies/AgencyLeaderboardPage'
import AgencyCommsPage from './pages/agencies/AgencyCommsPage'
import PageLoader from './components/shared/PageLoader'
import DemoModeBanner from './components/shared/DemoModeBanner'
import { useAuthStore } from './store/authStore'
import I18nProvider from './components/i18n/I18nProvider'
import i18n from './i18n/index.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      onError: (error) => {
        const msg =
          error?.response?.data?.error ||
          i18n.t('errors:generic', { defaultValue: 'Operation failed' })
        toast.error(msg)
      },
    },
  },
})

function LegacyTeamProfileRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/agencies/profile/${slug}`} replace />
}

function LandingRoute() {
  return <LandingPage />
}

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/start" element={<EcosystemPublicLayout />}>
          <Route index element={<StartPage />} />
        </Route>
        <Route path="/packages" element={<PackagesRoute />} />
        <Route path="/support" element={<SupportRoute />} />
        <Route element={<EcosystemPublicLayout />}>
          <Route path="/ecosystem" element={<EcosystemPageView pageId="ecosystem" />} />
          <Route path="/agencies" element={<EcosystemPageView pageId="agencies" />} />
          <Route path="/partners" element={<EcosystemPageView pageId="partners" />} />
          <Route path="/about" element={<EcosystemPageView pageId="about" />} />
          <Route path="/faq" element={<EcosystemPageView pageId="faq" />} />
          <Route path="/ai" element={<EcosystemPageView pageId="ai" />} />
          <Route path="/rewards" element={<EcosystemPageView pageId="rewards" />} />
          <Route path="/academy" element={<EcosystemPageView pageId="academy" />} />
          <Route path="/community" element={<EcosystemPageView pageId="community" />} />
        </Route>
        <Route path="/invite/:code" element={<InviteLandingPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/packages/:level" element={<PackageDetailPage />} />
            <Route path="/packages/pay" element={<HybridPaymentPage />} />
            <Route path="/shop/buy" element={<BuyPage />} />
            <Route path="/shop/cart" element={<CartPage />} />
            <Route path="/shop/orders" element={<OrdersPage />} />
            <Route path="/shop/shipping" element={<ShippingPage />} />
            <Route path="/shop/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/agencies/discover" element={<AgencyDiscoveryPage />} />
            <Route path="/agencies/leaderboard" element={<AgencyLeaderboardPage />} />
            <Route path="/agencies/profile/:slug" element={<AgencyProfilePage />} />
            <Route path="/agencies/onboarding" element={<AgencyOnboardingPage />} />
            <Route path="/agencies/comms" element={<AgencyCommsPage />} />
            <Route path="/teams/found" element={<Navigate to="/agencies/discover" replace />} />
            <Route path="/teams/discover" element={<Navigate to="/agencies/discover" replace />} />
            <Route path="/teams/profile/:slug" element={<LegacyTeamProfileRedirect />} />
            <Route path="/join/agency/:slug" element={<Navigate to="/register" replace />} />
            <Route path="/team/new-referral" element={<NewReferralPage />} />
            <Route path="/team/referrals" element={<ReferralsPage />} />
            <Route path="/team/genealogy" element={<GenealogyPage />} />
            <Route path="/team/placement-tree" element={<PlacementTreePage />} />
            <Route path="/team/join-requests" element={<TreeJoinRequestsPage />} />
            <Route path="/organization" element={<OrganizationHubPage />} />
            <Route path="/mlm" element={<MlmIntelligencePage />} />
            <Route path="/team/enroller-tree" element={<EnrollerTreePage />} />
            <Route path="/team/bv" element={<BusinessVolumePage />} />
            <Route path="/team/pv" element={<PersonalVolumePage />} />
            <Route path="/earnings/wallet" element={<WalletPage />} />
            <Route path="/finance" element={<FinanceEcosystemPage />} />
            <Route path="/earnings/retail-profit" element={<RetailProfitPage />} />
            <Route path="/earnings/fast-start" element={<FastStartPage />} />
            <Route path="/earnings/level-bonus" element={<LevelBonusPage />} />
            <Route path="/earnings/team-commission" element={<TeamCommissionPage />} />
            <Route path="/earnings/rank-bonus" element={<RankBonusPage />} />
            <Route path="/withdrawal" element={<WithdrawalPage />} />
            <Route path="/withdrawal/accounts" element={<BankAccountsPage />} />
            <Route path="/customer/pearls" element={<PearlsWalletPage />} />
            <Route path="/pearls" element={<PearlsWalletPage />} />
            <Route path="/progression" element={<ProgressionHubPage />} />
            <Route path="/progression/career" element={<CareerPathPage />} />
            <Route path="/customer/vouchers" element={<VouchersPage />} />
            <Route path="/customer/community" element={<CommunityPage />} />
            <Route path="/customer/membership" element={<MembershipPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/marketing" element={<MarketingToolsPage />} />
            <Route path="/help-center" element={<SupportCenterPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/learn" element={<CourseLearnPage />} />
            <Route path="/messages/sent" element={<MessagesSentPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['franchise', 'admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/franchise" element={<FranchiseDashboardPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<SAOverviewPage />} />
            <Route path="/super-admin/business" element={<SABusinessHubPage />} />
            <Route path="/super-admin/gamification" element={<SAGamificationPage />} />
            <Route path="/super-admin/progression" element={<SAProgressionPage />} />
            <Route path="/super-admin/packages" element={<SAPackagesPage />} />
            <Route path="/super-admin/upgrades" element={<SAUpgradeRulesPage />} />
            <Route path="/super-admin/payments" element={<SAPaymentMethodsPage />} />
            <Route path="/super-admin/promotions" element={<SAPromotionsPage />} />
            <Route path="/super-admin/feature-flags" element={<SAFeatureFlagsPage />} />
            <Route path="/super-admin/ranks" element={<SARanksPage />} />
            <Route path="/super-admin/level-bonus" element={<SALevelBonusPage />} />
            <Route path="/super-admin/settings" element={<SASettingsPage />} />
            <Route path="/super-admin/admins" element={<SAAdminsPage />} />
            <Route path="/super-admin/operations" element={<SAOperationsPage />} />
            <Route path="/super-admin/network" element={<SANetworkPage />} />
            <Route path="/super-admin/support" element={<AdminSupportPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
          <Route element={<AdminShellLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
            <Route path="/admin/deposits" element={<AdminDepositsPage />} />
            <Route path="/admin/kyc" element={<AdminKycPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/new" element={<AdminProductFormPage />} />
            <Route path="/admin/products/:productId/edit" element={<AdminProductFormPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/banners" element={<AdminBannersPage />} />
            <Route path="/admin/vouchers" element={<AdminVouchersPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/finance" element={<AdminFinancePage />} />
            <Route path="/admin/courses/enrollments" element={<AdminCourseEnrollmentsPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AdminShellLayout />}>
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/courses/new" element={<AdminCourseFormPage />} />
            <Route path="/admin/courses/:courseId/edit" element={<AdminCourseFormPage />} />
            <Route path="/admin/courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppWrapper() {
  useInitAuth()
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AppWrapper />
          <ToastContainer />
          <DemoModeBanner />
        </QueryClientProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
