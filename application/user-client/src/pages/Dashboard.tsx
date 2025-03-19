import {
  alpha,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material'
import NavBar from '../components/NavBar'
import type { GetUserSurveyStepsResponse } from '@common/types/api/surveys'
import { useQuery } from '@tanstack/react-query'
import CheckCircle from '@mui/icons-material/CheckCircle'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import Circle from '@mui/icons-material/Circle'
import { Link } from 'react-router-dom'
import { GetParticipantProfileResponse } from '@common/types/api/users'
import { apiClient } from '../apiClient'

export default function Dashboard() {
  const { isPending, error, data } = useQuery({
    queryKey: ['consent_forms'],
    queryFn: () =>
      apiClient
        .get('/surveys/steps/1')
        .then((res) => res.data) as Promise<GetUserSurveyStepsResponse>,
  })

  const { data: pdata } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: () =>
      apiClient
        .get('/profiles/current')
        .then((res) => res.data) as Promise<GetParticipantProfileResponse>,
  })

  const renderReviewStatus = (status: 'completed' | 'viewed' | 'review_required') => {
    if (['viewed', 'completed'].includes(status)) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle sx={{ mr: 2, color: '#92cd8a', fontSize: 30 }} />
          <Typography>Reviewed</Typography>
        </Box>
      )
    } else {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Circle sx={{ mr: 2, color: '#f8d05c', fontSize: 30 }} />
          <Typography>Requires Review</Typography>
        </Box>
      )
    }
  }

  if (isPending) {
    return (
      <>
        <NavBar />
        <Container>
          <CircularProgress sx={{ mt: 20 }} />
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <NavBar />
        <Container>
          <Typography>Error: {error.message}</Typography>
        </Container>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <Container maxWidth="md">
        <Typography variant="h3" textAlign="left" sx={{ mt: 3, mb: 3 }}>
          Welcome {pdata?.data?.firstName}
        </Typography>
        {data?.data.map((val, idx) => (
          <Card
            key={idx}
            sx={{
              boxShadow: '0',
              p: 3,
              mt: 1,
              backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.05),
            }}
            data-cy={`step-card-${idx}`}
          >
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 24,
                        minWidth: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'primary.light',
                        bgcolor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      <Typography lineHeight="24px" fontWeight="bold">
                        {idx + 1}
                      </Typography>
                    </Box>
                    <Typography lineHeight="24px">{val.title}</Typography>
                  </Box>
                  {val.tooltip && (
                    <Tooltip title={val.tooltip}>
                      <InfoOutlined />
                    </Tooltip>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  {renderReviewStatus(val.status)}
                  <Typography>
                    {val.last_updated
                      ? new Date(Date.parse(val.last_updated)).toLocaleDateString()
                      : '-'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  component={Link}
                  to={`/consent_form/${idx}`}
                  fullWidth
                  variant="contained"
                  data-cy={`step-button-${idx}`}
                >
                  {val.status == 'completed'
                    ? 'Edit'
                    : val.status == 'review_required'
                      ? 'Review'
                      : 'View'}
                </Button>
              </Grid>
            </Grid>
          </Card>
        ))}
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" sx={{ mt: 3 }}>
            View Responses
          </Button>
        </Box>
      </Container>
    </>
  )
}
