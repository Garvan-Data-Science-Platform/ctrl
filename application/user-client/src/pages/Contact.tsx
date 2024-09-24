import { Button, Card, Container, TextField, Typography } from '@mui/material'
import NavBar from '../components/NavBar'
import EmailIcon from '@mui/icons-material/Email'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

export default function Contact() {
  const store = useAppStore()
  const nav = useNavigate()
  const handleSend = () => {
    console.log('Send message: ', store.contactMessageText)
    store.updateContactMessageText('')
    nav('/message_sent')
  }
  return (
    <>
      <NavBar />

      <Container>
        <Card
          sx={{
            p: 6,
            maxWidth: 400,
            mr: 'auto',
            ml: 'auto',
            mt: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <EmailIcon fontSize="large" />
          <Typography>Please enter your message</Typography>
          <TextField
            value={store.contactMessageText}
            onChange={(e) => store.updateContactMessageText(e.target.value)}
            fullWidth
            multiline
            rows={10}
            sx={{ mt: 2 }}
          ></TextField>
          <Button fullWidth variant="contained" onClick={handleSend}>
            Send
          </Button>
          <Link to="/">
            <Button color="info" fullWidth onClick={() => store.updateContactMessageText('')}>
              Cancel
            </Button>
          </Link>
        </Card>
      </Container>
    </>
  )
}
