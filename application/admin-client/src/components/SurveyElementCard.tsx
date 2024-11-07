import {
  SurveyElement,
  SurveyElementType,
  SurveyQuestionCheckbox,
  SurveyQuestionChoices,
  SurveySubHeading,
  SurveyVideo,
} from '@common/types/survey'
import { Add, Close, Delete, DragIndicator } from '@mui/icons-material'
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useDrag, useDrop } from 'react-dnd'

/**
 * Your Component
 */
interface SurveyElementCardProps {
  element: SurveyElement
  handleDelete: () => void
  handleMove: (dropIndex: number) => void
  handleAddChoice?: () => void
  handleDeleteChoice?: (choice: number) => void
  handleUpdateChoice?: (choice: number, value: string) => void
  handleUpdateField: (field: string, value: any) => void
}

interface DropResult {
  dropIndex: number
}

export function SurveyElementCard({
  element,
  handleDelete,
  handleMove,
  handleAddChoice,
  handleDeleteChoice,
  handleUpdateChoice,
  handleUpdateField,
}: SurveyElementCardProps) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: 'CARD',
      end: (item, monitor) => {
        if (monitor.didDrop()) {
          const result = monitor.getDropResult() as DropResult
          handleMove(result.dropIndex)
        }
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [],
  )

  function SubHeading(data: SurveySubHeading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Subheading</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Subheading text"
          value={data.text}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
      </Box>
    )
  }

  function QuestionCheckbox(data: SurveyQuestionCheckbox) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Checkbox Question</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.required}
              onChange={() => handleUpdateField('required', !data.required)}
            />
          }
          label="Mandatory"
        />
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Question Text"
          value={data.text}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Tooltip (optional)"
          value={data.tooltip}
          onChange={(e) => {
            handleUpdateField('tooltip', e.target.value)
          }}
        />
      </Box>
    )
  }

  function QuestionChoices(data: SurveyQuestionChoices) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Multi-choice Question</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Question Text"
          value={data.text}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Tooltip (optional)"
          value={data.tooltip}
          onChange={(e) => {
            handleUpdateField('tooltip', e.target.value)
          }}
        />
        <Typography sx={{ mt: 1, fontSize: 15 }}>Choices</Typography>
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {data.choices.map((val, idx) => (
            <Box key={`choice_${idx}`}>
              <TextField
                value={val}
                onChange={(e) => handleUpdateChoice && handleUpdateChoice(idx, e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleDeleteChoice && handleDeleteChoice(idx)}>
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          ))}
          <IconButton sx={{ width: 50, height: 50 }} onClick={handleAddChoice}>
            <Add />
          </IconButton>
        </Box>
      </Box>
    )
  }

  function Video(data: SurveyVideo) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Video/Embedded</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="URL"
          value={data.link}
          onChange={(e) => {
            handleUpdateField('link', e.target.value)
          }}
        />
      </Box>
    )
  }

  type ContentRenderer = {
    [key in SurveyElementType]: () => JSX.Element | null
  }

  const contentRenderer: ContentRenderer = {
    'question-choices': () => QuestionChoices(element.data),
    'question-checkbox': () => QuestionCheckbox(element.data),
    video: () => Video(element.data),
    subheading: () => SubHeading(element.data),
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
      {contentRenderer[element.type]()}
      <Box sx={{ flexGrow: 1 }} />
      <IconButton sx={{ width: 50, height: 50 }} onClick={handleDelete}>
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
      drop: () => ({
        dropIndex: index,
      }),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [index],
  )
  return (
    <Box
      ref={drop}
      sx={{ width: '100%', height: 15, bgcolor: isOver ? '#fffccc' : 'transparent' }}
    />
  )
}
