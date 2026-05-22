import { useAuthStore } from '../../store/authStore'
import AdminLayout from './AdminLayout'
import SuperAdminLayout from '../../pages/superAdmin/SuperAdminLayout'

/** Admin routes: super_admin gets full SA shell + modules; admin gets admin-only shell. */
export default function AdminShellLayout() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'super_admin') return <SuperAdminLayout />
  return <AdminLayout />
}
