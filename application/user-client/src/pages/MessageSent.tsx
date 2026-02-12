import { Container, Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import { useEffect } from 'react'

export default function MessageSent() {
  useEffect(() => {
    document.title = 'Message Sent | CTRL'
  }, [])
  return (
    <>
      <NavBar />
      <Container maxWidth="sm">
        <Typography variant="h4" sx={{ mt: 5 }}>
          {'Message Sent'}
        </Typography>
        <Typography sx={{ mt: 5 }}>
          Your message has been sent to the CTRL study administrator. A copy of your message has
          been sent to your email address.
        </Typography>
      </Container>
    </>
  )
}
