import { Add, Delete } from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

interface InviteModalProps {
  onSend: (emails: string[]) => void
  onCancel: () => void
}

export function InviteModal({ onSend, onCancel }: InviteModalProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [fieldValue, setFieldValue] = useState<string>('')

  const handleAdd = () => {
    if (fieldValue.includes('@') && !emails.includes(fieldValue)) {
      setEmails((current) => {
        const c = structuredClone(current)
        c.push(fieldValue)
        return c
      })
      setFieldValue('')
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('Text').split('\n')
    setEmails((current) => {
      const c = structuredClone(current)
      for (const p of pasted) {
        if (!c.includes(p)) {
          c.push(p)
        }
      }
      return c
    })
  }

  return (
    <Box sx={{ width: 400 }} onPasteCapture={handlePaste} data-cy="invite-modal">
      <Typography variant="h4">Invite Participants</Typography>

      <TextField
        fullWidth
        placeholder="tom@example.com"
        helperText="Enter manually or paste from excel"
        sx={{ mt: 2, mb: 2 }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton data-cy="add-button" onClick={handleAdd}>
                  <Add />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        onKeyUp={(event) => {
          if (event.key == 'Enter') {
            handleAdd()
          }
        }}
        value={fieldValue}
        onChange={(e) => setFieldValue(e.target.value)}
        data-cy="email-field"
      ></TextField>
      <Typography sx={{ mt: 1 }}>Recipients:</Typography>
      <List
        dense
        sx={{ height: 180, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}
        data-cy="recipients-list"
      >
        {emails.map((email, idx) => {
          return (
            <ListItem
              secondaryAction={
                <IconButton
                  onClick={() => {
                    setEmails(emails.filter((e) => e != email))
                  }}
                  data-cy="remove-button"
                >
                  <Delete />
                </IconButton>
              }
              key={`email_${idx}`}
              sx={{ display: 'flex', flexDirection: 'row' }}
            >
              <Typography>{email}</Typography>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ mt: 2, justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
        <Button
          variant="contained"
          disabled={!(emails.length > 0 || fieldValue)}
          onClick={() => {
            if (fieldValue) {
              onSend([...emails, fieldValue])
            } else {
              onSend(emails)
            }
          }}
          data-cy="send-button"
        >
          Send Invites
        </Button>
        <Button variant="contained" color="error" onClick={onCancel} data-cy="invite-modal-cancel">
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
