import { Box, Button, Card, Container, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function ResetConfirmation() {
  return (
    <>
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ mt: 5, mb: 2 }}>
              <img src="./australian-genomics-logo.png" height={40} />
            </Box>
            <Typography>
              An email with password reset link has been sent to the address you provided.
            </Typography>
          </Box>
          <Button variant="contained" sx={{ mt: 3, mb: 3 }} component={Link} to="/login">
            Return to login
          </Button>
        </Card>
      </Container>
    </>
  )
}
