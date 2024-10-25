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
import survey from '@common/example_responses/getSurvey.json'
import type { SurveyVersion } from '@common/types/survey'
import { act, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { SurveyElementCard, SurveyDropSpace } from '../../components/SurveyElementCard'

export const SurveyEditor = () => {
  const [surveyState, setSurveyState] = useState(survey as SurveyVersion)
  const [activeStep, setActiveStep] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Box sx={{ border: '1px solid lightgrey', height: '100vh', minWidth: 200, ml: -3, mt: -3 }}>
        <ListSubheader>Survey Steps</ListSubheader>
        <Divider />
        <List>
          {surveyState.data.map((val, index) => (
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
              <ListItemText primary={'New Step'} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <DndProvider backend={HTML5Backend}>
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          <TextField fullWidth label="Title" value={survey.data[activeStep].title}></TextField>
          <TextField
            fullWidth
            multiline
            sx={{ mt: 3 }}
            label="Description"
            value={survey.data[activeStep].text}
          ></TextField>
          <Divider sx={{ mt: 3, mb: 1 }} />
          <SurveyDropSpace key={`space_${activeStep}_${-1}`} index={-1} />
          {survey.data[activeStep].elements.map((val, idx) => (
            <>
              <SurveyElementCard element={val} key={`el_${activeStep}_${idx}`}></SurveyElementCard>
              <SurveyDropSpace key={`space_${activeStep}_${idx}`} index={idx} />
            </>
          ))}
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Button startIcon={<AddCircle />}>Subheading</Button>
            <Button startIcon={<AddCircle />}>Checkbox question</Button>
            <Button startIcon={<AddCircle />}>Multi-choice question</Button>
            <Button startIcon={<AddCircle />}>Video/Embeded</Button>
          </Box>
        </Box>
      </DndProvider>
    </Box>
  )
}
