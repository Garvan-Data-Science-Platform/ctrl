import {
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
import { useState } from 'react'
import { StudyEntry, useStudyStore } from '../../studyStore'
import { AddCircle, Delete, Edit } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'

const StudyCard = ({ study }: { study: StudyEntry }) => {
  const { open } = useNotification()
  const queryClient = useQueryClient()
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newName, setNewName] = useState(study.name)
  const [newDesc, setNewDesc] = useState(study.description)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { studies, setActiveStudyIndex, activeStudyIndex } = useStudyStore()

  const handleUpdate = (updateData: Partial<StudyEntry>) => {
    axiosInstance
      .patch(`/studies/${study.id}`, updateData)
      .then(() => {
        if (activeStudyIndex > studies.length) {
          setActiveStudyIndex(0)
        }
        queryClient.invalidateQueries(['studies'])
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

  const uploadLogo = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axiosInstance.post(`/studies/${study.id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      open?.({ type: 'success', message: 'Updated logo' })
      queryClient.invalidateQueries(['studies'])
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to update logo: ${e.response.data.details}` })
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        p: 2,
        bgcolor: 'rgb(240,243,252)',
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
        <DialogContent>Are you sure you want to delete study: {study.name}</DialogContent>
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
      <Button component="label" sx={{ border: '1px solid grey', minWidth: 80, height: 80 }}>
        <input
          type="file"
          hidden
          accept=".png,.jpg,.jpeg,.tif"
          onChange={(e) => {
            uploadLogo(e.target.files?.item(0) as File)
          }}
          data-cy="logo-upload"
        />
        {study.logo ? (
          <Stack alignItems="center">
            <img
              src={import.meta.env.VITE_BACKEND_URL + `/studies/${study.id}/logo`}
              height={60}
              data-cy="logo-preview"
              id="logo-preview"
            />
            <Typography variant="caption">Update logo</Typography>
          </Stack>
        ) : (
          'Upload Logo'
        )}
      </Button>
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
          <Typography>
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
          <StudyCard study={study} key={`studybox_${study.id}`} />
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
