import {
  Button,
  Card,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material'
import NavBar from '../components/NavBar'
import EmailIcon from '@mui/icons-material/Email'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useEffect, useState } from 'react'
import { apiClient } from '../apiClient'
import { ContactUsRequest } from '@common/types/api/mailer'

export default function Contact({ disableHeader }: { disableHeader: boolean }) {
  const store = useAppStore()
  const nav = useNavigate()
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (store.contactMessageText == '') return
    setSending(true)
    const body: ContactUsRequest = {
      content: store.contactMessageText,
      studyId: Number(store.studies?.[store.activeStudyIndex].id),
    }
    const res = (await apiClient.post('/mailer/contact-us', body)) as any
    if (!res || res.status < 200 || res.status >= 300) {
      alert(`Error sending message. ${res.message}`)
      setSending(false)
    } else {
      store.updateContactMessageText('')
      nav('/message_sent')
    }
  }

  useEffect(() => {
    document.title = 'Contact us | CTRL'
  }, [])

  return (
    <>
      {!disableHeader && <NavBar />}

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
            position: 'relative',
            opacity: sending ? 0.6 : 1,
            pointerEvents: sending ? 'none' : 'auto',
          }}
        >
          <EmailIcon fontSize="large" />
          <Typography>Please enter your message</Typography>
          <TextField
            value={store.contactMessageText}
            onChange={(e) => store.updateContactMessageText(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            fullWidth
            multiline
            rows={10}
            sx={{ mt: 2 }}
            disabled={sending}
            helperText={
              store.contactMessageText.length > 990
                ? `${store.contactMessageText.length} / 1000 Characters`
                : undefined
            }
            data-cy="message-box"
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSend}
            disabled={sending}
            data-cy="send-button"
          >
            Send
          </Button>
          <Link to="/" tabIndex={sending ? -1 : 0} style={{ width: '100%' }}>
            <Button
              color="info"
              fullWidth
              onClick={() => store.updateContactMessageText('')}
              disabled={sending}
            >
              Cancel
            </Button>
          </Link>
          {sending && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.7)',
                zIndex: 2,
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Card>
      </Container>
    </>
  )
}
