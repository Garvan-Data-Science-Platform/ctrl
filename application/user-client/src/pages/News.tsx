import { Box, Container } from '@mui/material'
import NavBar from '../components/NavBar'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '../store'

export default function News() {
  const { newsLink } = useAppStore()
  const navigate = useNavigate()

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
