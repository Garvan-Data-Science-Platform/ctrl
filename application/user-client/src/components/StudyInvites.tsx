import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  ListItemAvatar,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../apiClient'

export interface StudyInvite {
  id: string
  studyId: number
  studyName: string
  description?: string
}

interface StudyInvitesDialogProps {
  open: boolean
  invites: StudyInvite[]
  onClose: () => void
}

export const StudyInvitesDialog: React.FC<StudyInvitesDialogProps> = ({
  open,
  invites,
  onClose,
}) => {
  const queryClient = useQueryClient()
  const [invitesStatus, setInvitesStatus] = useState<any>({})
  const [userDismissed, setUserDismissed] = useState(false)

  const onAccept = async (invite: StudyInvite) => {
    await apiClient.post(`/invites/${invite.id}/accept`)
    setInvitesStatus({ ...invitesStatus, [invite.id]: 'Accepted' })
    queryClient.invalidateQueries({ queryKey: ['studies'] })
  }
  const onDecline = async (invite: StudyInvite) => {
    await apiClient.post(`/invites/${invite.id}/decline`)
    setInvitesStatus({ ...invitesStatus, [invite.id]: 'Declined' })
  }

  const handleClose = () => {
    setUserDismissed(true)
    onClose()
  }

  useEffect(() => {
    if (invites.length < 1) {
      onClose()
      // Reset dismissed state when all invites are processed
      setUserDismissed(false)
    }
  }, [invites])

  return (
    <Dialog open={open && !userDismissed} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>You've been invited to join a new study</DialogTitle>
      <DialogContent>
        <List>
          {invites.map((invite) => (
            <ListItem key={invite.id} alignItems="flex-start" disableGutters>
              <ListItemAvatar>
                <img
                  src={invite.studyId ? import.meta.env.VITE_BACKEND_URL + `/studies/${invite.studyId}/logo` : ''}
                  alt=""
                  style={{ maxWidth: '80px', maxHeight: '80px', width: 'auto', height: 'auto', objectFit: 'contain', marginRight: '16px' }}
                />
              </ListItemAvatar>
              <ListItemText primary={invite.studyName} secondary={invite.description} />

              {invitesStatus[invite.id] ? (
                <Typography>{invitesStatus[invite.id]}</Typography>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onAccept(invite)}
                    size="small"
                    data-cy="accept-invite"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => onDecline(invite)}
                    size="small"
                  >
                    Decline
                  </Button>
                </Stack>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
