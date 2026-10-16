import { Box, Container, Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { useAppStore } from '../store'

export default function News() {
  const { newsLink } = useAppStore()
  const navigate = useNavigate()

  // A link back to this portal would load the portal inside its own news frame.
  const linksToThisPortal =
    !!newsLink && new URL(newsLink, window.location.href).origin === window.location.origin

  useEffect(() => {
    document.title = 'News and Information | CTRL'
    if (!newsLink) {
      navigate('/')
    }
  }, [newsLink, navigate])

  return (
    <>
      <NavBar />
      <Container maxWidth="lg">
        <Box height="80vh" sx={{ mt: 2 }}>
          {linksToThisPortal ? (
            <Typography data-cy="news-unavailable">
              News and information is not available at the moment.
            </Typography>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={newsLink || ''}
              frameBorder="0"
              allow="autoplay; encrypted-media"
            ></iframe>
          )}
        </Box>
      </Container>
    </>
  )
}
