import { Add, AddCircle } from '@mui/icons-material'
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
} from '@mui/material'
import { SurveyElementType } from '@common/types/survey'
import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SurveyElementCard, SurveyDropSpace } from '../../components/SurveyElementCard'
import { useSurveyStore } from '../../surveyStore'
import { axiosInstance } from '../../providers/dataProvider'
import { API_URL } from '../../App'
import { useOnError, useResource, useShow, useUpdate } from '@refinedev/core'

export const SurveyEditor = () => {
  const {
    data: surveyData,
    setData,
    addStep,
    addElement,
    deleteElement,
    moveElement,
    addChoice,
    deleteChoice,
    updateChoice,
    updateStepField,
    updateElementField,
  } = useSurveyStore()
  const [activeStep, setActiveStep] = useState(0)
  const [savePending, setSavePending] = useState(false)

  const { id } = useResource()

  const { queryResult } = useShow({ resource: 'surveys' })

  const { mutate } = useUpdate({
    resource: 'surveys',
    successNotification: false,
    errorNotification: {
      message: 'Error reaching server, could not save your changes',
      type: 'error',
    },
    invalidates: [],
  })

  const { data: queryData, isLoading } = queryResult

  useEffect(() => {
    if (queryData && !isLoading) {
      setData(queryData.data.data)
    }
  }, [isLoading])

  useEffect(() => {
    if (!savePending && surveyData && !isLoading) {
      setSavePending(true)
      setTimeout(() => {
        mutate({ id, values: { data: surveyData } })
        //axiosInstance.patch(API_URL + `/surveys/${id}X`, { data: surveyData }).catch((error) => {
        //  console.log("ERROR")
        //})
        //TODO: Handle errors: expired token, server unreachable
        setSavePending(false)
      }, 4000)
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
  return isLoading ? null : (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Box sx={{ border: '1px solid lightgrey', height: '100vh', ml: -3, mt: -3 }}>
        <ListSubheader>Survey Steps</ListSubheader>
        <Divider />
        <List sx={{ width: 250 }}>
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
            <ListItemButton>
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText
                primary={'New Step'}
                onClick={() => {
                  addStep()
                  setActiveStep(surveyData.length)
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      {surveyData.length > 0 ? (
        <DndProvider backend={HTML5Backend}>
          <Box sx={{ flexGrow: 1, ml: 3 }}>
            <TextField
              fullWidth
              label="Title"
              onChange={(e) => updateStepField(activeStep, 'title', e.target.value)}
              value={surveyData[activeStep].title}
            ></TextField>
            <TextField
              fullWidth
              multiline
              sx={{ mt: 3 }}
              label="Description"
              onChange={(e) => updateStepField(activeStep, 'text', e.target.value)}
              value={surveyData[activeStep].text}
            ></TextField>
            <Divider sx={{ mt: 3, mb: 1 }} />
            <SurveyDropSpace key={`space_${activeStep}_${-1}`} index={-1} />
            {surveyData[activeStep].elements.map((val, idx) => (
              <Box key={`el_${activeStep}_${idx}`}>
                <SurveyElementCard
                  element={val}
                  handleDelete={() => {
                    deleteElement(activeStep, idx)
                  }}
                  handleMove={(dropIndex) => {
                    console.log('Move', idx, dropIndex)
                    moveElement(activeStep, idx, dropIndex)
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
