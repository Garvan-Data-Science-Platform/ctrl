import { Button, Card, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import NavBar from '../components/NavBar'
import { useQuery } from '@tanstack/react-query'
import type { GetParticipantProfileByIDResponse } from '@common/types/api/users'
import ProfileData from '@common/example_responses/getUserProfile.json'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { isPending, error, data } = useQuery({
    queryKey: ['profile', 'get'],
    //queryFn: () => fetch('/api/user/profile').then((res) => res.json()) as Promise<UserProfile>,
    queryFn: () => (ProfileData as unknown as GetParticipantProfileByIDResponse).data,
  })

  if (isPending) return 'Loading'

  if (error) return <Typography>Error loading user profile: {error.message}</Typography>

  return (
    <>
      <NavBar />
      <Container>
        <Typography variant="h3" sx={{ mt: 3, mb: 4, textAlign: 'left' }}>
          My Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: '0', p: 2 }} raised={false}>
              <table width={'100%'} style={{ textAlign: 'left', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        First Name
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.user.firstName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Middle Name
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.user.middleName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Family Name
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.user.lastName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Date of Birth
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.dob}</Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: '0', p: 2 }} raised={false}>
              <table width={'100%'} style={{ textAlign: 'left', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Email
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.user.email}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Mobile Phone
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.mobile}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Address
                      </Typography>
                    </td>
                    <td>
                      <Typography>
                        {data.addressLine &&
                          `${data.addressLine}, ${data.suburb}, ${data.state?.toUpperCase()}, ${data.postcode}`}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Preferred Contact Method
                      </Typography>
                    </td>
                    <td>
                      <Typography>
                        {data.preferredContact.charAt(0).toUpperCase() +
                          data.preferredContact.slice(1)}
                      </Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: '0', p: 2 }} raised={false}>
              <table width={'100%'} style={{ textAlign: 'left', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Participant ID
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.participantID}</Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ boxShadow: '0', p: 2 }} raised={false}>
              <table width={'100%'} style={{ textAlign: 'left', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td>
                      <Typography fontWeight="bold">
                        Registered as a parent/guardian or carer?
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.isParentOrGuardian ? 'Yes' : 'No'}</Typography>
                    </td>
                  </tr>
                  {data.isParentOrGuardian ? (
                    <>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                            Registered on behalf of
                          </Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            First Name
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.onBehalfOf?.firstName}</Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            Family Name
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.onBehalfOf?.lastName}</Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            Date of Birth
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.onBehalfOf?.dob}</Typography>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                            Nominated alternate contact
                          </Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            First Name
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.alternativeContact?.firstName}</Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            Family Name
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.alternativeContact?.lastName}</Typography>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Typography fontWeight="bold" lineHeight={2.5}>
                            Email
                          </Typography>
                        </td>
                        <td>
                          <Typography>{data.alternativeContact?.email}</Typography>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Link to="/profile/update">
        <Button size="large" variant="contained" sx={{ mt: 3 }}>
          Update
        </Button>
      </Link>
    </>
  )
}
