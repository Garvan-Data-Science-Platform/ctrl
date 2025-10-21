import { Add, Delete } from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { generateInviteEmail } from '@common/src/generateInviteTemplate'
import { Recipient } from '@common/types/invite'
import { axiosInstance } from '../providers/dataProvider'
import { GetInviteTextResponse } from '@common/types/api/participants'
import { useCurrentStudyId } from '../studyStore'

interface InviteModalProps {
  onSend: (recipients: Recipient[], subjectText: string, explanatoryText: string) => void
  onCancel: () => void
  initialRecipients?: Recipient[]
}

export function InviteModal({ onSend, onCancel, initialRecipients = [] }: InviteModalProps) {
  const validateEmail = (email: string) => {
    const r = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) //eslint-disable-line
    return r.test(email)
  }

  const [recipients, setRecipients] = useState<Recipient[]>(
    initialRecipients.filter((r) => validateEmail(r.email)),
  )
  const emails = recipients.map((val) => val.email)
  const [fieldValue, setFieldValue] = useState<string>('')
  const [idFieldValue, setIdFieldValue] = useState<string>('')
  const [invalid, setInvalid] = useState(false)
  const [emailText, setEmailText] = useState('')
  const [emailTitle, setEmailTitle] = useState('')
  const studyId = useCurrentStudyId()

  const handleAdd = () => {
    if (!validateEmail(fieldValue)) {
      setInvalid(true)
    } else if (!emails.includes(fieldValue)) {
      setRecipients((current) => {
        const c = structuredClone(current)
        c.push({ email: fieldValue, prefill: { studyParticipant: { externalId: idFieldValue } } })
        return c
      })
      setFieldValue('')
      setIdFieldValue('')
    }
  }

  useEffect(() => {
    axiosInstance.get(`/studies/${studyId}/invites/text`).then((res) => {
      const data: GetInviteTextResponse = res.data
      setEmailText(data.inviteEmailText)
      setEmailTitle(data.inviteEmailSubject)
    })
  }, [])

  useEffect(() => {
    if (invalid) {
      setInvalid(!validateEmail(fieldValue))
    }
  }, [fieldValue])

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('Text').split('\n')
    setRecipients((current) => {
      const c = structuredClone(current)
      for (const p of pasted) {
        let split = p.split(',')
        if (split.length == 1) {
          split = split[0].split('\t')
        }
        const email = split[0]
        let id
        if (split.length > 1) {
          id = split[1]
        }
        if (!emails.includes(email) && validateEmail(email)) {
          c.push({ email, prefill: { studyParticipant: { externalId: id } } })
        }
      }
      return c
    })
  }

  const { html: emailPreview } = generateInviteEmail(
    'http://exampleregisterurl',
    emailTitle,
    emailText,
  )

  return (
    <Box sx={{ width: 1000, display: 'flex', flexDirection: 'row' }} data-cy="invite-modal">
      <Box sx={{ flex: 1.3 }}>
        <Typography variant="h4">Invite Participants</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'row', mt: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="tom@example.com"
            error={invalid}
            onKeyUp={(event) => {
              if (event.key == 'Enter') {
                handleAdd()
              }
            }}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            data-cy="email-field"
            onPasteCapture={handlePaste}
            sx={{ minWidth: 240 }}
            label="Email"
          />
          <TextField
            label="ID (optional)"
            value={idFieldValue}
            onChange={(e) => setIdFieldValue(e.target.value)}
            onKeyUp={(event) => {
              if (event.key == 'Enter') {
                handleAdd()
              }
            }}
            sx={{ minWidth: 120 }}
            data-cy="id-field"
          />

          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <IconButton data-cy="add-button" onClick={handleAdd}>
              <Add />
            </IconButton>
          </Box>
        </Box>
        {invalid && (
          <Typography variant="caption" color="error">
            Invalid email <br />
          </Typography>
        )}
        <Typography variant="caption">
          Enter manually or paste from spreadsheet.{' '}
          <Tooltip title="The ID field is for providing an external participant ID (e.g. from REDCap) that will be stored alongside the CTRL generated Participant ID, for reference purposes only.">
            <Typography variant="caption" color="primary">
              About ID
            </Typography>
          </Tooltip>
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Recipients{emails.length > 0 && ` (${emails.length})`}:
        </Typography>
        <List
          dense
          sx={{ height: 180, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}
          data-cy="recipients-list"
        >
          {recipients.map((recipient, idx) => {
            return (
              <ListItem
                secondaryAction={
                  <IconButton
                    onClick={() => {
                      setRecipients(recipients.filter((r) => r.email != recipient.email))
                    }}
                    data-cy="remove-button"
                  >
                    <Delete />
                  </IconButton>
                }
                key={`email_${idx}`}
                sx={{ display: 'flex', flexDirection: 'row' }}
              >
                <Typography>
                  {recipient.email}{' '}
                  {recipient.prefill.studyParticipant?.externalId &&
                    `(${recipient.prefill.studyParticipant.externalId})`}
                </Typography>
              </ListItem>
            )
          })}
        </List>
        <TextField
          label="Email Subject"
          fullWidth
          multiline
          sx={{ mt: 3 }}
          value={emailTitle}
          onChange={(e) => setEmailTitle(e.target.value)}
          data-cy="email-subject"
        />
        <TextField
          label="Email text"
          fullWidth
          multiline
          minRows={4}
          maxRows={4}
          sx={{ mt: 1, mb: 2 }}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          data-cy="email-text"
        />
        <Box sx={{ mt: 2, justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
          <Button
            variant="contained"
            disabled={!(emails.length > 0 || fieldValue)}
            onClick={() => {
              if (fieldValue) {
                if (!validateEmail(fieldValue)) {
                  setInvalid(true)
                } else {
                  onSend(
                    [
                      ...recipients,
                      {
                        email: fieldValue,
                        prefill: { studyParticipant: { externalId: idFieldValue } },
                      },
                    ],
                    emailTitle,
                    emailText,
                  )
                }
              } else {
                onSend(recipients, emailTitle, emailText)
              }
            }}
            data-cy="send-button"
          >
            Send Invites
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onCancel}
            data-cy="invite-modal-cancel"
          >
            Cancel
          </Button>
        </Box>
      </Box>
      <Box sx={{ flex: 1, ml: 2, mt: 5 }}>
        <Typography variant="h5" textAlign="center">
          Email Preview
        </Typography>
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          <div
            dangerouslySetInnerHTML={{
              __html: emailPreview.replaceAll('href="http://exampleregisterurl"', ''),
            }}
          ></div>
        </Box>
      </Box>
    </Box>
  )
}
