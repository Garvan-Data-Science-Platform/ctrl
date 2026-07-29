import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router'

export default function RegisterErrorPage() {
  return (
    <Box sx={{ mt: 20 }}>
      <Typography>
        You need to be invited to register with CTRL. Please check your emails for an invitation
        with a registration link.
      </Typography>
      <Button component={Link} to="/">
        Home
      </Button>
    </Box>
  )
}
