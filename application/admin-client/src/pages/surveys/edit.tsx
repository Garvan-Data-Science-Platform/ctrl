import { Add, AddCircle, Settings } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material'
import { SurveyElementType } from '@common/types/survey'
import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SurveyElementCard, SurveyDropSpace } from '../../components/SurveyElementCard'
import { useSurveyStore } from '../../surveyStore'
import { axiosInstance } from '../../providers/dataProvider'
import { useResource, useShow, useUpdate, useNavigation, useNotification } from '@refinedev/core'
import { useCurrentStudyId } from '../../studyStore'

export const SurveyEditor = () => {
  const {
    data: surveyData,
    setData,
    addStep,
    addElement,
    deleteElement,
    moveElement,
    moveStep,
    deleteStep,
    addChoice,
    deleteChoice,
    updateChoice,
    updateStepField,
    updateElementField,
  } = useSurveyStore()
  const [activeStep, setActiveStep] = useState(0)
  const [savePending, setSavePending] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [justLoaded, setJustLoaded] = useState(true)
  const [timeoutObject, setTimeoutObject] = useState()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const optionsOpen = Boolean(anchorEl)
  const handleOptionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleOptionsClose = () => {
    setAnchorEl(null)
  }

  const { list } = useNavigation()

  const { id } = useResource()

  const { queryResult } = useShow({ resource: 'surveys' })

  const { open } = useNotification()

  const studyId = useCurrentStudyId()

  const { mutate } = useUpdate({
    resource: 'surveys',
    successNotification: false,
    errorNotification: {
      message: 'Error reaching server, could not save your changes',
      type: 'error',
    },
    invalidates: ['resourceAll'],
  })

  const { data: queryData, isLoading } = queryResult

  const disabled = queryData?.data.status != 'DRAFT'

  useEffect(() => {
    if (queryData && !isLoading) {
      setJustLoaded(true)
    }
  }, [isLoading])

  useEffect(() => {
    if (queryData) {
      setData(queryData.data.data)
    }
  }, [queryData])

  useEffect(() => {
    if (justLoaded) {
      setTimeout(() => {
        setJustLoaded(false)
      }, 500)
      return
    }
    if (surveyData && !justLoaded) {
      setSavePending(true)
      clearTimeout(timeoutObject)
      const t = setTimeout(() => {
        mutate({ id, values: { data: surveyData }, invalidates: [] })
        setSavePending(false)
      }, 2000)
      setTimeoutObject(t as any)
    }
  }, [surveyData])

  type ElementLabels = {
    [key in SurveyElementType]: string
  }
  const elementsLabels: ElementLabels = {
    'question-checkbox': 'Checkbox question',
    'question-choices': 'Multi-choice question',
    subheading: 'Subheading',
    video: 'Video/Embedded',
  }

  const handlePublish = () => {
    axiosInstance
      .post(`studies/${studyId}/surveys/${id}/publish`)
      .then(() => {
        list('surveys')
      })
      .catch((error) => {
        open?.({
          type: 'error',
          message: `Could not publish survey: ${error.response.data.details.Question.message || error}`,
        })
      })
  }

  return isLoading ? null : (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Box sx={{ border: '1px solid lightgrey', height: '100vh', ml: -3, mt: -3 }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="outlined"
            data-cy="publish-button"
            disabled={savePending || disabled}
            onClick={() => setPublishDialogOpen(true)}
          >
            Publish
          </Button>
          <Button
            variant="outlined"
            data-cy="options-button"
            onClick={handleOptionsClick}
            disabled={savePending || disabled}
          >
            <Settings />
          </Button>
        </Box>
        <ListSubheader>Survey Steps</ListSubheader>
        <Divider />
        <List sx={{ width: 250 }} data-cy="step-list">
          {surveyData.map((val, index) => (
            <ListItem key={`step_${index}`} disablePadding>
              <ListItemButton onClick={() => setActiveStep(index)} selected={activeStep == index}>
                <ListItemText primary={val.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              disabled={disabled}
              onClick={() => {
                addStep()
                setActiveStep(surveyData.length)
              }}
            >
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText primary={'New Step'} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      {surveyData.length > 0 ? (
        <DndProvider backend={HTML5Backend}>
          <Box sx={{ flexGrow: 1, ml: 3 }} data-cy="survey-editor">
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Box sx={{ flexGrow: 1 }} />
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={optionsOpen}
                onClose={handleOptionsClose}
              >
                <MenuItem
                  disabled={activeStep == 0}
                  onClick={() => {
                    moveStep(activeStep, 'up')
                    setActiveStep(activeStep - 1)
                    handleOptionsClose()
                  }}
                >
                  Move survey step up
                </MenuItem>
                <MenuItem
                  disabled={activeStep == surveyData.length - 1}
                  onClick={() => {
                    moveStep(activeStep, 'down')
                    setActiveStep(activeStep + 1)
                    handleOptionsClose()
                  }}
                >
                  Move survey step down
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    const to_del = activeStep
                    setActiveStep(Math.max(0, activeStep - 1))
                    deleteStep(to_del)
                    handleOptionsClose()
                  }}
                >
                  Delete survey step
                </MenuItem>
              </Menu>
            </Box>
            <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)}>
              <DialogTitle>Publish new version</DialogTitle>
              <DialogContent>
                Only a published survey can be viewed/answered by participants. Once you publish a
                version it can't be edited. You can continue editing this survey in draft mode after
                publishing.
              </DialogContent>
              <DialogActions>
                <Button data-cy="publish-confirm" onClick={handlePublish}>
                  Publish
                </Button>
                <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
              </DialogActions>
            </Dialog>
            <TextField
              fullWidth
              label="Title"
              data-cy="step-title"
              onChange={(e) => updateStepField(activeStep, 'title', e.target.value)}
              value={surveyData[activeStep].title}
              disabled={disabled}
            ></TextField>
            <TextField
              fullWidth
              multiline
              sx={{ mt: 3 }}
              label="Description"
              data-cy="step-description"
              onChange={(e) => updateStepField(activeStep, 'text', e.target.value)}
              value={surveyData[activeStep].text}
              disabled={disabled}
            ></TextField>
            <Divider sx={{ mt: 3, mb: 1 }} />
            <SurveyDropSpace key={`space_${activeStep}_${-1}`} index={-1} />
            {surveyData[activeStep].elements.map((val, idx) => (
              <Box key={`el_${studyId}_${activeStep}_${idx}`}>
                <SurveyElementCard
                  element={val}
                  disabled={disabled}
                  handleDelete={() => {
                    deleteElement(activeStep, idx)
                  }}
                  handleMove={(dropIndex) => {
                    if (!disabled) {
                      moveElement(activeStep, idx, dropIndex)
                    }
                  }}
                  handleAddChoice={
                    val.type == 'question-choices'
                      ? () => {
                          addChoice(activeStep, idx)
                        }
                      : undefined
                  }
                  handleDeleteChoice={(choice) => deleteChoice(activeStep, idx, choice)}
                  handleUpdateField={(field, value) =>
                    updateElementField(activeStep, idx, field, value)
                  }
                  handleUpdateChoice={(choice, value) =>
                    updateChoice(activeStep, idx, choice, value)
                  }
                ></SurveyElementCard>
                <SurveyDropSpace key={`space_${activeStep}_${idx}`} index={idx} />
              </Box>
            ))}
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {Object.entries(elementsLabels).map((val, idx) => (
                <Button
                  key={`add_${idx}`}
                  disabled={disabled}
                  startIcon={<AddCircle />}
                  onClick={() => {
                    addElement(val[0] as SurveyElementType, activeStep)
                  }}
                >
                  {val[1]}
                </Button>
              ))}
            </Box>
          </Box>
        </DndProvider>
      ) : null}
    </Box>
  )
}
