import {
  SurveyElement,
  SurveyElementType,
  SurveyQuestionCheckbox,
  SurveyQuestionChoices,
  SurveySubHeading,
  SurveyVideo,
} from '@common/types/survey'
import { Add, ArrowDropDown, Close, Delete, DragIndicator } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useDrag, useDrop } from 'react-dnd'
import { DUOEntry, DUOModal } from './DUOModal'
import { useState } from 'react'
import duoJson from './duo.json'
import { useNotification } from '@refinedev/core'

const duoEntries = duoJson as DUOEntry[]

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
  disabled?: boolean
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
  disabled,
}: SurveyElementCardProps) {
  const { open } = useNotification()
  const [duoOpen, setDuoOpen] = useState(false)

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

  function renderAdvancedOptions(data: SurveyQuestionCheckbox | SurveyQuestionChoices) {
    return (
      <Box>
        <DUOModal
          open={duoOpen}
          answers={'choices' in data ? data.choices : [true, false]}
          questionText={data.text}
          onClose={() => {
            setDuoOpen(false)
          }}
          onConfirm={(duoEntry, relatedAnswer) => {
            const newDuoCodes = [...(data.duoCodes || []), { code: duoEntry.ID, relatedAnswer }]
            handleUpdateField('duoCodes', newDuoCodes)
            setDuoOpen(false)
          }}
        />
        <Accordion sx={{ mt: 1, bgcolor: 'transparent', boxShadow: 0, border: 0 }}>
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            sx={{ padding: 0, flexDirection: 'row-reverse' }}
            data-cy="advanced-toggle"
          >
            <Typography component="span">Advanced Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {'required' in data && (
              <FormControlLabel
                sx={{ mt: -2, mb: 1 }}
                control={
                  <Checkbox
                    checked={data.required}
                    disabled={disabled}
                    onChange={() => handleUpdateField('required', !data.required)}
                  />
                }
                label="Mandatory question (user is prompted if they fail to answer)"
              />
            )}
            <Typography sx={{ fontSize: 15 }}>Ontology Terms</Typography>
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              {data.duoCodes?.map((duo) => {
                const duoEntry = duoEntries.find((val) => val.ID == duo.code)
                return (
                  <Tooltip
                    key={`duo_${duo.code}`}
                    data-cy="duo-chip"
                    title={
                      <Typography fontSize={12}>
                        {duo.code} <br />
                        Applies when answer is: {duo.relatedAnswer} <br />
                        {duoEntry?.Description}
                      </Typography>
                    }
                  >
                    <Chip
                      onClick={() => {}}
                      onDelete={() => {
                        const newDuoCodes = data.duoCodes?.filter((val) => val.code != duoEntry?.ID)
                        handleUpdateField('duoCodes', newDuoCodes)
                      }}
                      label={duoEntry?.Label}
                      disabled={disabled}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Tooltip>
                )
              })}
              <IconButton
                disabled={disabled}
                onClick={() => {
                  setDuoOpen(true)
                }}
                data-cy="add-duo"
              >
                <Add />
              </IconButton>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    )
  }

  function renderSubHeading(data: SurveySubHeading) {
    const charLimit = 200
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Subheading</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Subheading text"
          value={data.text}
          disabled={disabled}
          inputProps={{ maxLength: charLimit }}
          helperText={`${data.text?.length || 0}/${charLimit}`}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
      </Box>
    )
  }

  function renderQuestionCheckbox(data: SurveyQuestionCheckbox) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Checkbox Question</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Question Text"
          value={data.text}
          disabled={disabled}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Tooltip (optional)"
          value={data.tooltip || ''}
          disabled={disabled}
          onChange={(e) => {
            handleUpdateField('tooltip', e.target.value)
          }}
        />
        {renderAdvancedOptions(data)}
      </Box>
    )
  }

  function renderQuestionChoices(data: SurveyQuestionChoices) {
    //Removes Ontologies if an answer is changed or removed
    const checkDuos = (answer: string) => {
      const nonMatchingDUOs = data.duoCodes?.filter((duoVal) => duoVal.relatedAnswer != answer)
      if (nonMatchingDUOs?.length != data.duoCodes?.length) {
        open?.({
          type: 'error',
          message: 'Ontology terms associated with this answer have been removed.',
        })
        handleUpdateField('duoCodes', nonMatchingDUOs)
      }
    }

    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Multi-choice Question</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Question Text"
          value={data.text}
          disabled={disabled}
          onChange={(e) => {
            handleUpdateField('text', e.target.value)
          }}
        />
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="Tooltip (optional)"
          value={data.tooltip || ''}
          disabled={disabled}
          onChange={(e) => {
            handleUpdateField('tooltip', e.target.value)
          }}
        />
        <Typography sx={{ mt: 1, fontSize: 15 }}>Choices</Typography>
        <Box
          sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}
          data-cy="choices-box"
        >
          {data.choices.map((val, idx) => (
            <Box key={`choice_${idx}`}>
              <TextField
                value={val}
                disabled={disabled}
                onChange={(e) => {
                  checkDuos(val)
                  //eslint-disable-next-line
                  handleUpdateChoice && handleUpdateChoice(idx, e.target.value)
                }}
                data-cy="choice-text"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          disabled={disabled}
                          onClick={() => {
                            checkDuos(val)
                            //eslint-disable-next-line
                            handleDeleteChoice && handleDeleteChoice(idx)
                          }}
                        >
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          ))}
          {!disabled && (
            <IconButton sx={{ width: 50, height: 50 }} onClick={handleAddChoice}>
              <Add />
            </IconButton>
          )}
        </Box>
        {renderAdvancedOptions(data)}
      </Box>
    )
  }

  function renderVideo(data: SurveyVideo) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography fontWeight="bold">Video/Embedded</Typography>
        <TextField
          multiline
          fullWidth
          sx={{ mt: 2 }}
          label="URL"
          value={data.link}
          disabled={disabled}
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
    'question-choices': () => renderQuestionChoices(element.data),
    'question-checkbox': () => renderQuestionCheckbox(element.data),
    video: () => renderVideo(element.data),
    subheading: () => renderSubHeading(element.data),
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        p: 2,
        bgcolor: 'action.hover',
        borderRadius: 3,
        opacity,
      }}
      data-cy="survey-element"
    >
      {!disabled && (
        <Box
          sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
          ref={dragRef}
          data-cy="drag-handle"
        >
          <DragIndicator />
        </Box>
      )}
      {contentRenderer[element.type]()}
      <Box sx={{ flexGrow: 1 }} />
      <IconButton disabled={disabled} sx={{ width: 50, height: 50 }} onClick={handleDelete}>
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
      data-cy="drop-zone"
      sx={{ width: '100%', height: 15, bgcolor: isOver ? 'action.selected' : 'transparent' }}
    />
  )
}
