import {
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { axiosInstance } from '../providers/dataProvider'
import { HttpError, useList } from '@refinedev/core'
import { Participant } from '@common/types/api/participants/participant'

export function ParticipantSearch({ buttonText, onConfirm, exclude }) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [results, setResults] = useState([])
  const [selectedId, setSelectedId] = useState<number>()
  const [participants, setParticipants] = useState<Participant[]>([])

  const { data, isLoading, isError } = useList<Participant, HttpError>({ resource: 'participants' })

  useEffect(() => {
    const filtered = data?.data.filter((val) => {
      return (
        val.firstName.toLowerCase().includes(first.toLowerCase()) &&
        val.lastName.toLowerCase().includes(last.toLowerCase()) &&
        !exclude.includes(val.id)
      )
    })
    setParticipants(filtered || [])
  }, [data, first, last])

  return (
    <Box>
      <Box>
        <TextField
          label="First Name"
          value={first}
          onChange={(e) => {
            setFirst(e.target.value)
          }}
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
        onClick={() => onConfirm(selectedId)}
        sx={{ mt: 1 }}
      >
        {buttonText}
      </Button>
    </Box>
  )
}
