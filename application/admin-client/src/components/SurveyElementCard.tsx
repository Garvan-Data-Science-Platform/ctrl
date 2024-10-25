import {
  SurveyElement,
  SurveyElementType,
  SurveyQuestionCheckbox,
  SurveyQuestionChoices,
  SurveySubHeading,
  SurveyVideo,
} from '@common/types/survey'
import { Delete, DragIndicator } from '@mui/icons-material'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import { useDrag, useDrop } from 'react-dnd'

/**
 * Your Component
 */
interface SurveyElementCardProps {
  element: SurveyElement
}

function SubHeading(data: SurveySubHeading) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography fontWeight="bold">Subheading</Typography>
      <TextField multiline fullWidth sx={{ mt: 2 }} label="Subheading text" value={data.text} />
    </Box>
  )
}

function QuestionCheckbox(data: SurveyQuestionCheckbox) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography fontWeight="bold">Checkbox Question</Typography>
      <TextField multiline fullWidth sx={{ mt: 2 }} label="Question Text" value={data.text} />
      <TextField
        multiline
        fullWidth
        sx={{ mt: 2 }}
        label="Tooltip (optional)"
        value={data.tooltip}
      />
    </Box>
  )
}

function QuestionChoices(data: SurveyQuestionChoices) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography fontWeight="bold">Multi-choice Question</Typography>
      <TextField multiline fullWidth sx={{ mt: 2 }} label="Question Text" value={data.text} />
      <TextField
        multiline
        fullWidth
        sx={{ mt: 2 }}
        label="Tooltip (optional)"
        value={data.tooltip}
      />
    </Box>
  )
}

function Video(data: SurveyVideo) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography fontWeight="bold">Video/Embedded</Typography>
      <TextField multiline fullWidth sx={{ mt: 2 }} label="URL" value={data.link} />
    </Box>
  )
}

export function SurveyElementCard({ element }: SurveyElementCardProps) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: 'CARD',
      //item: { text },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [],
  )
  var contents
  switch (element.type) {
    case SurveyElementType.CHOICES:
      contents = QuestionChoices(element.data as SurveyQuestionChoices)
      break
    case SurveyElementType.CHECKBOX:
      contents = QuestionCheckbox(element.data as SurveyQuestionCheckbox)
      break
    case SurveyElementType.VIDEO:
      contents = Video(element.data as SurveyVideo)
      break
    default:
      contents = SubHeading(element.data as SurveySubHeading)
      break
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        p: 2,
        bgcolor: 'rgb(240,243,252)',
        borderRadius: 3,
        opacity,
      }}
    >
      <Box sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }} ref={dragRef}>
        <DragIndicator />
      </Box>
      {contents}
      <Box sx={{ flexGrow: 1 }} />
      <IconButton sx={{ width: 50, height: 50 }}>
        <Delete />
      </IconButton>
    </Box>
  )
}

interface SurveyDropSpaceProps {
  index: number
}
export function SurveyDropSpace({ index }: SurveyDropSpaceProps) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'CARD',
      drop: () => console.log('DROPPED at', index),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [index],
  )
  return (
    <Box ref={drop} sx={{ width: '100%', height: 15, bgcolor: isOver ? 'green' : 'transparent' }} />
  )
}
