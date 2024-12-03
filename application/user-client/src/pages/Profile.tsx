import { Button, Card, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import NavBar from '../components/NavBar'
import { useQuery } from '@tanstack/react-query'
import type { GetParticipantProfileResponse } from '@common/types/api/users'
import { Link } from 'react-router-dom'
import { apiClient } from '../apiClient'

export default function Profile() {
  const { data: pdata, error } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: () =>
      apiClient
        .get('/profiles/current')
        .then((res) => res.data) as Promise<GetParticipantProfileResponse>,
  })
  const data = pdata?.data

  if (!data) return 'Loading'

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
                      <Typography>{data.firstName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Middle Name
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.middleName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Family Name
                      </Typography>
                    </td>
                    <td>
                      <Typography>{data.lastName}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Typography fontWeight="bold" lineHeight={2.5}>
                        Date of Birth
                      </Typography>
                    </td>
                    <td>
                      <Typography>{new Date(data.dob).toLocaleDateString()}</Typography>
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
                      <Typography>{data.email}</Typography>
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
