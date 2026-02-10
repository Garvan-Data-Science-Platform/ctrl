import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNotification } from '@refinedev/core'
import { axiosInstance } from '../../providers/dataProvider'
import { useState, useEffect } from 'react'
import { StudyEntry, useStudyStore } from '../../studyStore'
import { AddCircle, ArrowDropDown, Delete, Edit } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { SensitiveTextField } from '../../components/SensitiveTextField'
import { useSearchParams } from 'react-router-dom'
import { LogoUploader } from '../../components/LogoUploader'
import { RESOURCES } from '../../constants'

const StudyCard = ({
  study,
  advancedOpen = false,
}: {
  study: StudyEntry
  advancedOpen?: boolean
}) => {
  const { open } = useNotification()
  const queryClient = useQueryClient()
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newName, setNewName] = useState(study.name)
  const [newDesc, setNewDesc] = useState(study.description)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { studies, setActiveStudyIndex, activeStudyIndex } = useStudyStore()
  const [redcapURL, setRedcapURL] = useState(study.redcapURL || '')
  const [redcapToken, setRedcapToken] = useState(study.redcapToken || '')
  const [redcapChanged, setRedcapChanged] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(advancedOpen)

  useEffect(() => {
    setRedcapURL(study.redcapURL || '')
    setRedcapToken(study.redcapToken || '')
    setRedcapChanged(false)
  }, [study.redcapURL, study.redcapToken])

  useEffect(() => {
    setAccordionOpen(advancedOpen)
  }, [advancedOpen])

  const handleUpdate = (updateData: Partial<StudyEntry>) => {
    axiosInstance
      .patch(`/studies/${study.id}`, updateData)
      .then(() => {
        if (activeStudyIndex > studies.length) {
          setActiveStudyIndex(0)
        }
        queryClient.invalidateQueries(['studies'])
        open?.({ type: 'success', message: 'Updated successfully' })
      })
      .catch((e) => {
        open?.({ type: 'error', message: `Error updating study: ${e.response.data.details}` })
      })
      .finally(() => {
        setEditingName(false)
        setEditingDescription(false)
      })
  }

  const handleDelete = () => {
    axiosInstance
      .delete(`/studies/${study.id}`)
      .then(() => {
        if (activeStudyIndex == studies.length - 1) {
          setActiveStudyIndex(0)
        }
        queryClient.invalidateQueries(['studies'])
      })
      .catch((e) => {
        open?.({ type: 'error', message: `Error deleting study: ${e}` })
      })
    setDeleteDialogOpen(false)
  }

  const handleRedcapApply = () => {
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/
    if (redcapURL && !urlRegex.test(redcapURL)) {
      open?.({
        type: 'error',
        message: "Invalid Redcap API URL format. Must start with 'http(s)://'",
      })
      return
    }
    handleUpdate({
      redcapURL,
      redcapToken,
    })
    setRedcapChanged(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        p: 2,
        bgcolor: 'action.hover',
        borderRadius: 3,
        position: 'relative',
      }}
    >
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
        }}
      >
        <DialogTitle>Delete Study</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {study.name}? <br />
          <Typography variant="caption">
            All participants will lose access to the survey, and you will no longer be able to view
            survey responses and participant information associated with this study. This action is
            reversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button data-cy="confirm-delete" color="error" onClick={handleDelete} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <LogoUploader
        resource={RESOURCES.STUDIES}
        url={`/studies/${study.id}/logo`}
        hasLogo={!!study.logo}
      />
      <Box>
        {editingName ? (
          <Box>
            <TextField
              size="small"
              defaultValue={study.name}
              onChange={(e) => {
                setNewName(e.target.value)
              }}
              data-cy="edit-name-field"
            ></TextField>
            <Button
              onClick={() => {
                handleUpdate({ name: newName })
              }}
            >
              Save
            </Button>
          </Box>
        ) : (
          <Typography fontWeight="bold">
            {study.name}{' '}
            <IconButton
              disabled={editingDescription}
              size="small"
              onClick={() => {
                setEditingName(true)
              }}
              data-cy="edit-name"
            >
              <Edit />
            </IconButton>
          </Typography>
        )}
        {editingDescription ? (
          <Box>
            <TextField
              size="small"
              fullWidth
              multiline
              defaultValue={study.description}
              onChange={(e) => {
                setNewDesc(e.target.value)
              }}
              data-cy="edit-description-field"
            ></TextField>
            <Button
              onClick={() => {
                handleUpdate({ description: newDesc || '' })
              }}
            >
              Save
            </Button>
          </Box>
        ) : (
          <Typography whiteSpace="pre-wrap">
            {study.description || 'No description'}
            <IconButton
              disabled={editingName}
              size="small"
              onClick={() => setEditingDescription(true)}
              data-cy="edit-description"
            >
              <Edit />
            </IconButton>
          </Typography>
        )}
        {study.description && (
          <Typography variant="caption">
            This description appears on the user portal dashboard.
          </Typography>
        )}
        <Accordion
          sx={{ mt: 1, bgcolor: 'transparent', boxShadow: 0, border: 0 }}
          expanded={accordionOpen}
          onChange={(_, expanded) => setAccordionOpen(expanded)}
        >
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            sx={{ padding: 0, flexDirection: 'row-reverse' }}
            data-cy="advanced-toggle"
          >
            <Typography component="span">Advanced Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Redcap Integration</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }} id="redcap">
              <TextField
                margin="normal"
                InputLabelProps={{ shrink: true }}
                type="text"
                label={'Redcap API URL'}
                name="redcapURL"
                data-cy="redcapURL"
                value={redcapURL}
                onChange={(e) => {
                  setRedcapURL(e.target.value)
                  setRedcapChanged(true)
                }}
              />
              <SensitiveTextField
                margin="dense"
                InputLabelProps={{ shrink: true }}
                type="text"
                label={'Redcap API Token'}
                name="redcapToken"
                data-cy="redcapToken"
                value={redcapToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setRedcapToken(e.target.value)
                  setRedcapChanged(true)
                }}
              />
              <Button
                sx={{ mt: 1, alignSelf: 'flex-start' }}
                variant="contained"
                size="small"
                disabled={!redcapChanged}
                onClick={handleRedcapApply}
                data-cy="redcap-apply"
              >
                Apply
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
      <IconButton
        disabled={studies.length < 2}
        sx={{ position: 'absolute', right: 10, top: 10 }}
        onClick={() => {
          setDeleteDialogOpen(true)
        }}
        data-cy="delete-study"
      >
        <Delete />
      </IconButton>
    </Box>
  )
}

const StudiesPage = () => {
  const { studies } = useStudyStore()
  const { open } = useNotification()
  const [searchParams] = useSearchParams()
  const advancedStudyId = searchParams.get('advanced')

  const [newStudyDialogOpen, setNewStudyDialogOpen] = useState(false)
  const [newStudyName, setNewStudyName] = useState('')

  const queryClient = useQueryClient()

  const handleCreateNewStudy = (e: React.FormEvent) => {
    e.preventDefault()
    axiosInstance
      .post('studies', { name: newStudyName })
      .then(() => {
        handleCloseNewStudyDialog()
        queryClient.invalidateQueries(['studies'])
      })
      .catch((e) => {
        open?.({
          type: 'error',
          message: `Error creating study: ${e.response.data.details}`,
        })
      })
  }

  const handleCloseNewStudyDialog = () => {
    setNewStudyDialogOpen(false)
  }

  return (
    <Container maxWidth="sm" sx={{ ml: 1, mt: 3 }}>
      <Dialog open={newStudyDialogOpen} onClose={handleCloseNewStudyDialog}>
        <DialogTitle>Create New Study</DialogTitle>
        <DialogContent>
          <Stack spacing={2} p={1} component="form" onSubmit={handleCreateNewStudy}>
            <TextField
              required
              label="Study Name"
              value={newStudyName}
              onChange={(e) => setNewStudyName(e.target.value)}
              data-cy="study-name"
            />
            <Stack direction="row" justifyContent="space-between">
              <Button variant="contained" type="submit" data-cy="study-create">
                Create
              </Button>
              <Button onClick={handleCloseNewStudyDialog}>Cancel</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Typography variant="h4">Studies</Typography>
      <Stack gap={1} sx={{ mt: 2 }}>
        {studies.map((study) => (
          <StudyCard
            study={study}
            key={`studybox_${study.id}`}
            advancedOpen={advancedStudyId === String(study.id)}
          />
        ))}
      </Stack>

      <Button
        sx={{ mt: 2 }}
        startIcon={<AddCircle />}
        onClick={() => {
          setNewStudyDialogOpen(true)
        }}
        data-cy="new-study-button"
      >
        New study
      </Button>
    </Container>
  )
}

export default StudiesPage
