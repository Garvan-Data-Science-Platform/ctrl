import { Box, Button, List, ListItem, ListItemButton, ListItemText, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { HttpError, useList } from '@refinedev/core'
import { Participant } from '@common/types/api/participants/participant'

interface ParticipantSearchProps {
  buttonText: string
  onConfirm: (id: number) => void
  exclude: number[]
}

export function ParticipantSearch({ buttonText, onConfirm, exclude }: ParticipantSearchProps) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [selectedId, setSelectedId] = useState<number>()
  const [participants, setParticipants] = useState<Participant[]>([])

  const { data } = useList<Participant, HttpError>({ resource: 'participants' })

  useEffect(() => {
    const filtered = data?.data.filter((val) => {
      return (
        val.firstName.toLowerCase().includes(first.toLowerCase()) &&
        val.lastName.toLowerCase().includes(last.toLowerCase()) &&
        !exclude.includes(val.id)
      )
    })
    setParticipants(filtered || [])
  }, [data, first, last, exclude])

  return (
    <Box>
      <Box>
        <TextField
          label="First Name"
          value={first}
          onChange={(e) => {
            setFirst(e.target.value)
          }}
          data-cy="search-first"
        />
        <TextField
          label="Last Name"
          value={last}
          onChange={(e) => {
            setLast(e.target.value)
          }}
        />
      </Box>
      <Box
        sx={{
          maxHeight: 200,
          width: 800,
          overflow: 'auto',
          border: '1px lightgrey solid',
          borderRadius: 1,
          mt: 1,
        }}
        data-cy="participant-list"
      >
        <List>
          {participants.map((participant) => {
            return (
              <ListItem disablePadding key={`part_${participant.id}`}>
                <ListItemButton
                  selected={participant.id == selectedId}
                  onClick={() => {
                    setSelectedId(participant.id)
                  }}
                >
                  <ListItemText primary={`${participant.firstName} ${participant.lastName}`} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>
      <Button
        disabled={!selectedId}
        variant="outlined"
        onClick={() => onConfirm(selectedId || 0)}
        sx={{ mt: 1 }}
        data-cy="search-confirm-button"
      >
        {buttonText}
      </Button>
    </Box>
  )
}
