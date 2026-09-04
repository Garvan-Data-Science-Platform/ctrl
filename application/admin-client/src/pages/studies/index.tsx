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
  Tooltip,
  Typography,
} from '@mui/material'
import { useNotification } from '@refinedev/core'
import { axiosInstance } from '../../providers/dataProvider'
import { useState, useEffect } from 'react'
import { StudyEntry, useStudyStore } from '../../studyStore'
import { AddCircle, ArrowDropDown, Delete, Edit, Info } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { SensitiveTextField } from '../../components/SensitiveTextField'
import { useSearchParams } from 'react-router'
import { LogoUploader } from '../../components/LogoUploader'
import { RESOURCES } from '../../constants'
import {
  emailRules,
  urlRules,
  studyNameRules,
  studyDescriptionRules,
  redcapTokenRules,
} from '@common/src/validation'

const StudyCard = ({
  studyIdx,
  advancedOpen = false,
}: {
  studyIdx: number
  advancedOpen?: boolean
}) => {
  const { studies, setActiveStudyIndex, activeStudyIndex, setStudies } = useStudyStore()
  const study: StudyEntry = studies[studyIdx]

  const { open } = useNotification()
  const queryClient = useQueryClient()
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newName, setNewName] = useState(study.name)
  const [newDesc, setNewDesc] = useState(study.description)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactUsEmail, setContactUsEmail] = useState(study.contactUsEmail || '')
  const [redcapURL, setRedcapURL] = useState(study.redcapURL || '')
  const [redcapToken, setRedcapToken] = useState('')
  const [settingsChanged, setSettingsChanged] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(advancedOpen)

  useEffect(() => {
    setRedcapURL(study.redcapURL || '')
    setRedcapToken('')
    setSettingsChanged(false)
  }, [study.redcapURL, study.hasRedcapToken, study.contactUsEmail])

  useEffect(() => {
    setAccordionOpen(advancedOpen)
  }, [advancedOpen])

  const handleUpdate = (updateData: Partial<StudyEntry> & { redcapToken?: string }) => {
    axiosInstance
      .patch(`/studies/${study.id}`, updateData)
      .then(() => {
        if (activeStudyIndex > studies.length) {
          setActiveStudyIndex(0)
        }
        queryClient.invalidateQueries({
          queryKey: ['studies'],
        })
        const newStudies = [...studies]
        // Destructure out the token so that it doesn't go into the store
        const { redcapToken, ...sanitisedUpdateData } = updateData

        newStudies[studyIdx] = {
          ...newStudies[studyIdx],
          ...sanitisedUpdateData,
          ...(redcapToken ? { hasRedcapToken: true } : {}),
        }
        setStudies(newStudies)
        setRedcapToken('')
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
        queryClient.invalidateQueries({
          queryKey: ['studies'],
        })
      })
      .catch((e) => {
        open?.({ type: 'error', message: `Error deleting study: ${e}` })
      })
    setDeleteDialogOpen(false)
  }

  const urlRule = urlRules(false)
  const isUrlInvalid = Boolean(
    redcapURL && urlRule.pattern && !urlRule.pattern.value.test(redcapURL),
  )

  const emailRule = emailRules(false)
  const isEmailInvalid = Boolean(
    contactUsEmail && emailRule.pattern && !emailRule.pattern.value.test(contactUsEmail),
  )

  const studyNameRule = studyNameRules(false)
  const isStudyNameInvalid = Boolean(
    newName && studyNameRule.pattern && !studyNameRule.pattern.value.test(newName),
  )

  const studyDescriptionRule = studyDescriptionRules(false)
  const isStudyDescriptionInvalid = Boolean(
    newDesc && studyDescriptionRule.pattern && !studyDescriptionRule.pattern.value.test(newDesc),
  )

  const redcapTokenRule = redcapTokenRules(false)
  const isRedcapTokenInvalid = Boolean(
    redcapToken && redcapTokenRule.pattern && !redcapTokenRule.pattern.value.test(redcapToken),
  )

  const handleSettingsApply = () => {
    if (isUrlInvalid) {
      open?.({
        type: 'error',
        message: urlRule.pattern.message as string,
      })
      return
    }
    if (isEmailInvalid) {
      open?.({
        type: 'error',
        message: emailRule.pattern.message as string,
      })
      return
    }
    const updatePayload: Partial<StudyEntry> & { redcapToken?: string } = {
      redcapURL,
      contactUsEmail,
    }

    if (redcapToken) {
      updatePayload.redcapToken = redcapToken
    }
    handleUpdate(updatePayload)
    setSettingsChanged(false)
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
              error={isStudyNameInvalid}
              helperText={isStudyNameInvalid ? (studyNameRule.pattern?.message as string) : ''}
            ></TextField>
            <Button
              disabled={isStudyNameInvalid}
              data-cy="edit-name-save"
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
              error={isStudyDescriptionInvalid}
              helperText={
                isStudyDescriptionInvalid ? (studyDescriptionRule.pattern?.message as string) : ''
              }
            ></TextField>
            <Button
              disabled={isStudyDescriptionInvalid}
              data-cy="edit-description-save"
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
            <Typography>Participant Portal</Typography>
            <TextField
              margin="normal"
              InputLabelProps={{ shrink: true }}
              type="text"
              label={
                <>
                  {"'Contact Us' Email "}
                  <Tooltip title="Messages from the 'Contact Us' form are sent to this address">
                    <Info />
                  </Tooltip>
                </>
              }
              name="contactUsEmail"
              data-cy="contactUsEmail"
              error={isEmailInvalid}
              helperText={isEmailInvalid ? (emailRule.pattern?.message as string) : ''}
              value={contactUsEmail}
              onChange={(e) => {
                setContactUsEmail(e.target.value)
                setSettingsChanged(true)
              }}
            />
            <Typography>Redcap Integration</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }} id="redcap">
              <TextField
                margin="normal"
                InputLabelProps={{ shrink: true }}
                type="text"
                label={'Redcap API URL'}
                name="redcapURL"
                data-cy="redcapURL"
                error={isUrlInvalid}
                helperText={isUrlInvalid ? (urlRule.pattern?.message as string) : ''}
                value={redcapURL}
                onChange={(e) => {
                  setRedcapURL(e.target.value)
                  setSettingsChanged(true)
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
                placeholder={'Enter new token here'}
                error={isRedcapTokenInvalid}
                helperText={
                  isRedcapTokenInvalid
                    ? (redcapTokenRule.pattern?.message as string)
                    : study.hasRedcapToken
                      ? 'A token has been saved. Enter a new value to overwrite it.'
                      : 'No token has been saved.'
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setRedcapToken(e.target.value)
                  setSettingsChanged(true)
                }}
              />
              <Button
                sx={{ mt: 1, alignSelf: 'flex-start' }}
                variant="contained"
                size="small"
                disabled={
                  !settingsChanged ||
                  isEmailInvalid ||
                  isUrlInvalid ||
                  isRedcapTokenInvalid ||
                  (redcapToken.length > 0 && redcapToken.length !== 32)
                }
                onClick={handleSettingsApply}
                data-cy="settings-apply"
              >
                Apply
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
      <Tooltip
        title={studies.length < 2 ? 'You cannot delete the only study you are part of.' : ''}
      >
        <span style={{ position: 'absolute', right: 10, top: 10 }}>
          <IconButton
            disabled={studies.length < 2}
            onClick={() => {
              setDeleteDialogOpen(true)
            }}
            data-cy="delete-study"
          >
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
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

  const studyNameRule = studyNameRules(true)
  const isNewStudyNameInvalid = Boolean(
    newStudyName && studyNameRule.pattern && !studyNameRule.pattern.value.test(newStudyName),
  )
  const queryClient = useQueryClient()

  const handleCreateNewStudy = (e: React.FormEvent) => {
    e.preventDefault()
    axiosInstance
      .post('studies', { name: newStudyName })
      .then(() => {
        handleCloseNewStudyDialog()
        queryClient.invalidateQueries({
          queryKey: ['studies'],
        })
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
              error={isNewStudyNameInvalid}
              helperText={isNewStudyNameInvalid ? (studyNameRule.pattern?.message as string) : ''}
            />
            <Stack direction="row" justifyContent="space-between">
              <Button
                variant="contained"
                type="submit"
                data-cy="study-create"
                disabled={isNewStudyNameInvalid || !newStudyName}
              >
                Create
              </Button>
              <Button onClick={handleCloseNewStudyDialog}>Cancel</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Typography variant="h4">Studies</Typography>
      <Stack gap={1} sx={{ mt: 2 }}>
        {studies.map((study, idx) => (
          <StudyCard
            studyIdx={idx}
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
