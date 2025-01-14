import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function ErrorPage() {
  return (
    <Box sx={{ mt: 20 }}>
      <Typography>An unexpected error occurred</Typography>
      <Button component={Link} to="/">
        Home
      </Button>
    </Box>
  )
}
