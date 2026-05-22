import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUserDetails } from '../../api/admin.api'
import UserDetailPanel from '../../components/admin/UserDetailPanel'

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUserDetails(userId),
  })

  return <UserDetailPanel userId={userId} data={data} isLoading={isLoading} backTo="/admin/users" />
}
