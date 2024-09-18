import { Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import { useQuery } from '@tanstack/react-query'
import type { UserProfile } from '../../../common/src'
import ProfileData from '../../../common/example_responses/getUserProfile.json'

export default function Profile() {
  const { isPending, error, data } = useQuery({
    queryKey: ['profile'],
    //queryFn: () => fetch('/api/user/profile').then((res) => res.json()) as Promise<UserProfile>,
    queryFn: () => ProfileData as UserProfile,
  })

  if (isPending) return 'Loading'

  if (error) return <Typography>Error loading user profile: {error.message}</Typography>

  return (
    <>
      <NavBar />
      <Typography>My Personal Details {data.state}</Typography>
    </>
  )
}
