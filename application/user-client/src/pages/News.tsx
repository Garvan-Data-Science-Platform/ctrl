import { Box, Container } from '@mui/material'
import NavBar from '../components/NavBar'
import { useEffect } from 'react'
import { useAppStore } from '../store'

export default function News() {
  const { newsLink } = useAppStore()
  useEffect(() => {
    document.title = 'News and Information | CTRL'
  }, [])
  return (
    <>
      <NavBar />
      <Container maxWidth="lg">
        <Box height="80vh" sx={{ mt: 2 }}>
          <iframe
            width="100%"
            height="100%"
            src={newsLink || ''}
            frameBorder="0"
            allow="autoplay; encrypted-media"
          ></iframe>
        </Box>
      </Container>
    </>
  )
}
