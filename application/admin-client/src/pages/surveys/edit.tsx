import { Add, AddCircle } from '@mui/icons-material'
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { SurveyElementType, type SurveyVersion } from '@common/types/survey'
import { act, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SurveyElementCard, SurveyDropSpace } from '../../components/SurveyElementCard'
import { useSurveyStore } from '../../surveyStore'

export const SurveyEditor = () => {
  const {
    data: surveyData,
    addStep,
    addElement,
    deleteElement,
    moveElement,
    addChoice,
    updateStepField,
  } = useSurveyStore()
  const [activeStep, setActiveStep] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Box sx={{ border: '1px solid lightgrey', height: '100vh', minWidth: 200, ml: -3, mt: -3 }}>
        <ListSubheader>Survey Steps</ListSubheader>
        <Divider />
        <List>
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
            <>
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
                key={`el_${activeStep}_${idx}`}
              ></SurveyElementCard>
              <SurveyDropSpace key={`space_${activeStep}_${idx}`} index={idx} />
            </>
          ))}
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Button
              startIcon={<AddCircle />}
              onClick={() => {
                addElement('subheading', activeStep)
              }}
            >
              Subheading
            </Button>
            <Button
              startIcon={<AddCircle />}
              onClick={() => {
                addElement('question-checkbox', activeStep)
              }}
            >
              Checkbox question
            </Button>
            <Button
              startIcon={<AddCircle />}
              onClick={() => {
                addElement('question-choices', activeStep)
              }}
            >
              Multi-choice question
            </Button>
            <Button
              startIcon={<AddCircle />}
              onClick={() => {
                addElement('video', activeStep)
              }}
            >
              Video/Embeded
            </Button>
          </Box>
        </Box>
      </DndProvider>
    </Box>
  )
}
