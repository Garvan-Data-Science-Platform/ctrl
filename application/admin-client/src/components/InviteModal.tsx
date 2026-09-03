import { Add, Delete, MoreHoriz } from '@mui/icons-material'
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
import { previewParticipantInviteEmail } from '@common/src/emails/preview'
import { Recipient } from '@common/types/invite'
import { axiosInstance } from '../providers/dataProvider'
import { GetInviteTextResponse } from '@common/types/api/participants'
import { useCurrentStudyId } from '../studyStore'
import {
  emailRules,
  externalIdRules,
  inviteEmailSubjectRules,
  inviteEmailTextRules,
} from '@common/src/validation'
import { useNotification } from '@refinedev/core'

interface InviteModalProps {
  onSend: (recipients: Recipient[], subjectText: string, explanatoryText: string) => void
  onCancel: () => void
  initialRecipients?: Recipient[]
}

export function InviteModal({ onSend, onCancel, initialRecipients = [] }: InviteModalProps) {
  const emailRule = emailRules(true)
  const externalIdRule = externalIdRules(false)
  const inviteEmailSubjectRule = inviteEmailSubjectRules(true)
  const inviteEmailTextRule = inviteEmailTextRules(true)

  // helper for filtering arrays and pasting
  const isEmailValidHelper = (email: string) =>
    emailRule.pattern ? emailRule.pattern.value.test(email) : false

  const { open } = useNotification()

  const [recipients, setRecipients] = useState<Recipient[]>(
    initialRecipients.filter((r) => isEmailValidHelper(r.email)),
  )
  const emails = recipients.map((val) => val.email)
  const [fieldValue, setFieldValue] = useState<string>('')
  const [idFieldValue, setIdFieldValue] = useState<string>('')
  const [emailText, setEmailText] = useState('')
  const [emailTitle, setEmailTitle] = useState('')
  const studyId = useCurrentStudyId()

  const isEmailInvalid = Boolean(
    fieldValue && emailRule.pattern && !emailRule.pattern.value.test(fieldValue),
  )
  const isExternalIdInvalid = Boolean(
    idFieldValue && externalIdRule.pattern && !externalIdRule.pattern.value.test(idFieldValue),
  )
  const isInviteEmailSubjectInvalid = Boolean(
    emailTitle &&
      inviteEmailSubjectRule.pattern &&
      !inviteEmailSubjectRule.pattern.value.test(emailTitle),
  )
  const isInviteEmailTextInvalid = Boolean(
    emailText && inviteEmailTextRule.pattern && !inviteEmailTextRule.pattern.value.test(emailText),
  )

  const handleAdd = () => {
    if (!fieldValue || isEmailInvalid || isExternalIdInvalid) return
    if (!emails.includes(fieldValue)) {
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

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('Text')
    // handle windows carriage returns '\r'
    const rows = pasted.replace(/r/g, '').split('\n')
    let skippedCount = 0

    setRecipients((current) => {
      const newRecipients = structuredClone(current)

      const currentEmails = [...emails]

      for (const row of rows) {
        // skip empty lines
        if (!row.trim()) continue

        // handle comma- and tab-separated
        let split = row.split(',')
        if (split.length === 1) {
          split = row.split('\t')
        }

        const email = split[0]?.trim()

        const id = split.length > 1 ? split[1]?.trim() : undefined

        const isPastedEmailValid = isEmailValidHelper(email)
        const isPastedIdValid = id
          ? externalIdRule.pattern
            ? externalIdRule.pattern.value.test(id)
            : true
          : true

        const isDuplicate = currentEmails.includes(email)

        if (email && isPastedEmailValid && isPastedIdValid && !isDuplicate) {
          newRecipients.push({ email, prefill: { studyParticipant: { externalId: id } } })
        } else {
          // increment skipped count if errors or duplicates
          skippedCount++
        }
      }
      return newRecipients
    })
    if (skippedCount > 0) {
      open?.({
        type: 'error',
        message: `Skipped ${skippedCount} entry(s) due to invalid formatting or duplicates.`,
      })
    }
  }

  const { html: emailPreview } = previewParticipantInviteEmail(
    'http://exampleregisterurl',
    emailTitle,
    emailText,
  )

  return (
    <Box sx={{ width: 1000, display: 'flex', flexDirection: 'row' }} data-cy="invite-modal">
      <Box sx={{ flex: 1.3 }}>
        <Typography variant="h4" sx={{ color: 'text.primary' }}>
          Invite Participants
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'row', mt: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="tom@example.com"
            error={isEmailInvalid}
            helperText={isEmailInvalid ? (emailRule.pattern?.message as string) : ''}
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
            error={isExternalIdInvalid}
            helperText={isExternalIdInvalid ? (externalIdRule.pattern?.message as string) : ''}
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
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Enter manually or paste from spreadsheet.{' '}
          <Tooltip title="The ID field is for providing an external participant ID (e.g. from REDCap) that will be stored alongside the CTRL generated Participant ID, for reference purposes only.">
            <Typography variant="caption" color="primary">
              About ID
            </Typography>
          </Tooltip>
        </Typography>
        <Typography sx={{ mt: 1, color: 'text.primary' }}>
          Recipients{emails.length > 0 && ` (${emails.length})`}:
        </Typography>
        <List
          dense
          sx={{ height: 180, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 2 }}
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
                <Typography sx={{ color: 'text.primary' }}>
                  {recipient.email}
                  {recipient.prefill.studyParticipant?.externalId &&
                    `(${recipient.prefill.studyParticipant.externalId})`}
                </Typography>
                {recipient.prefill.profile && (
                  <Tooltip title={Object.values(recipient.prefill.profile || {}).join('\n')}>
                    <MoreHoriz sx={{ ml: 4 }} data-cy="prefill-details" />
                  </Tooltip>
                )}
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
          error={isInviteEmailSubjectInvalid}
          helperText={
            isInviteEmailSubjectInvalid ? (inviteEmailSubjectRule.pattern?.message as string) : ''
          }
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
          error={isInviteEmailTextInvalid}
          helperText={
            isInviteEmailTextInvalid ? (inviteEmailTextRule.pattern?.message as string) : ''
          }
        />
        <Box sx={{ mt: 2, justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
          <Button
            variant="contained"
            disabled={
              !(emails.length > 0 || fieldValue) ||
              isEmailInvalid ||
              isExternalIdInvalid ||
              isInviteEmailSubjectInvalid ||
              isInviteEmailTextInvalid
            }
            onClick={() => {
              if (fieldValue) {
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
        <Typography variant="h5" textAlign="center" sx={{ color: 'text.primary' }}>
          Email Preview
        </Typography>
        <Box
          sx={{
            overflow: 'auto',
            height: 600,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <iframe
            title="Email Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
            srcDoc={emailPreview.replaceAll('href="http://exampleregisterurl"', '')}
          />
        </Box>
      </Box>
    </Box>
  )
}
