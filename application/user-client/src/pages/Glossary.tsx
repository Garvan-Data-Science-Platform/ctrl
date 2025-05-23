import { Box, Card, Container, Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import { useEffect } from 'react'

export default function Glossary() {
  useEffect(() => {
    document.title = 'Glossary | CTRL'
  }, [])

  return (
    <>
      <NavBar />
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h3" sx={{ mt: 2, mb: 2 }}>
            Glossary
          </Typography>

          <Card sx={{ boxShadow: '0', p: 1, pl: 3 }} raised={false}>
            <dl>
              <dt>
                <Typography fontWeight={'bold'}>DNA</Typography>
              </dt>
              <dd>
                <Typography fontStyle="italic">noun</Typography>
                <Typography>
                  a self-replicating material that is present in nearly all living organisms as the
                  main constituent of chromosomes. It is the carrier of genetic information.
                </Typography>
              </dd>
              <dt>
                <Typography fontWeight={'bold'}>Genetic</Typography>
              </dt>
              <dd>
                <Typography fontStyle="italic">adjective</Typography>
                <Typography>
                  1. relating to genes or heredity. <br />
                  2. relating to origin, or arising from a common origin.
                </Typography>
              </dd>
            </dl>
          </Card>
        </Box>
      </Container>
    </>
  )
}
