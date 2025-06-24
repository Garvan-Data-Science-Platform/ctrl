import React, { useState } from 'react'
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
} from '@mui/material'
import { useAppStore } from '../store'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../apiClient'

export interface StudyInvite {
  id: string
  studyId: number
  studyName: string
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
  const { setActiveStudyIndex } = useAppStore()

  const queryClient = useQueryClient()
  const [invitesStatus, setInvitesStatus] = useState<any>({})

  const onAccept = async (invite: StudyInvite) => {
    await apiClient.post(`/invites/${invite.id}/accept`)
    setInvitesStatus({ ...invitesStatus, [invite.id]: 'Accepted' })
    queryClient.invalidateQueries({ queryKey: ['invites'] })
    queryClient.invalidateQueries({ queryKey: ['studies'] })
  }
  const onDecline = async (invite: StudyInvite) => {
    await apiClient.post(`/invites/${invite.id}/decline`)
    setInvitesStatus({ ...invitesStatus, [invite.id]: 'Declined' })
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>You've been invited to join a new study</DialogTitle>
      <DialogContent>
        <List>
          {invites.map((invite) => (
            <ListItem key={invite.id} alignItems="flex-start" disableGutters>
              <ListItemText primary={invite.studyName} />
              {invitesStatus[invite.id] ? (
                <Typography>{invitesStatus[invite.id]}</Typography>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onAccept(invite)}
                    size="small"
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
