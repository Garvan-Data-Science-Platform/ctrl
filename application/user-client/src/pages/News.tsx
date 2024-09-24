import { Container, Typography } from '@mui/material'
import NavBar from '../components/NavBar'

export default function News() {
  return (
    <>
      <NavBar />
      <Container maxWidth="sm">
        <Typography variant="h4" sx={{ mt: 5 }}>
          {'Thank you for contacting the Australian Genomics research program'}
        </Typography>
        <Typography sx={{ mt: 5 }}>
          Your message has been sent to the CTRL site administrator and we aim to get back to you
          within 2 business days. A copy of your message has been sent to your email address.
        </Typography>
      </Container>
    </>
  )
}
