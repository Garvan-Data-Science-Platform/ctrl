import { Box, Card, Container, Typography } from '@mui/material'
import NavBar from '../components/NavBar'

export default function Glossary() {
  return (
    <>
      <NavBar />
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h3" sx={{ mt: 2, mb: 2 }}>
            Glossary
          </Typography>

          <Card sx={{ boxShadow: '0', p: 1 }} raised={false}>
            <table style={{ tableLayout: 'fixed', borderSpacing: '1em' }}>
              <tr>
                <td style={{ width: 100, verticalAlign: 'top' }}>
                  <Typography fontWeight={'bold'}>DNA</Typography>
                </td>
                <td>
                  <Typography fontStyle="italic">noun</Typography>
                  <Typography>
                    a self-replicating material that is present in nearly all living organisms as
                    the main constituent of chromosomes. It is the carrier of genetic information.
                  </Typography>
                </td>
              </tr>
              <tr>
                <td style={{ width: 100, verticalAlign: 'top' }}>
                  <Typography fontWeight={'bold'}>Genetic</Typography>
                </td>
                <td>
                  <Typography fontStyle="italic">adjective</Typography>
                  <Typography>
                    1. relating to genes or heredity. <br />
                    2. relating to origin, or arising from a common origin.
                  </Typography>
                </td>
              </tr>
            </table>
          </Card>
        </Box>
      </Container>
    </>
  )
}
