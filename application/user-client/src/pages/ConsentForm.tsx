import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Modal,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from '@mui/material'

import { useNavigate, useParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { GetUserSurveyStepResponse } from '@common/types/api/surveys'
import { apiClient } from '../apiClient'
import { Info } from '@mui/icons-material'

import { useEffect, useState } from 'react'
import { SurveyElement } from '@common/types/survey'
import { extractSurveyStepAnswers } from '@common/src/surveys/extractSurveyStepAnswers'
import { useCurrentStudyId } from '../store'

export default function ConsentForm() {
  const nav = useNavigate()

  const params = useParams()
  const currentStep = Number(params.step)

  const studyId = useCurrentStudyId()

  const [formState, setFormState] = useState<SurveyElement[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<'save' | 'next'>('save')
  const [showError, setShowError] = useState(false)
  const [blankRadios, setBlankRadios] = useState<string[]>([])
  const [logoLoaded, setLogoLoaded] = useState(true)

  const { isPending, data } = useQuery({
    queryKey: ['form_step', currentStep],
    queryFn: async () => {
      try {
        const surveyStep = await apiClient.get(`/studies/${studyId}/survey-steps/${currentStep}`)

        return surveyStep.data.data as GetUserSurveyStepResponse['data']
        // eslint-disable-next-line
      } catch (error: any) {
        if (error.response?.status == 401) {
          nav('/login')
        }
      }
    },
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (blankRadios.length > 0) {
      checkRadios()
    }
  }, [formState])

  const checkRadios = () => {
    const blankRadiosTmp: string[] = []
    for (const i in data?.elements || []) {
      if (data?.elements[i].type == 'question-choices' && !data?.elements[i].data.value) {
        blankRadiosTmp.push(i)
      }
    }
    setBlankRadios(blankRadiosTmp)
    return blankRadiosTmp.length > 0
  }

  const saveForm = async (action: 'save' | 'next', isModal?: boolean) => {
    for (const i in data?.elements || []) {
      if (!isModal && data?.elements[i].data.required && !data?.elements[i].data.value) {
        setModalOpen(true)
        setModalAction(action)
        return
      }
    }

    if (checkRadios()) return

    try {
      await apiClient.post(`/studies/${studyId}/survey-answers`, {
        step: currentStep,
        data: extractSurveyStepAnswers(formState),
      })
      if (action == 'next') {
        setModalOpen(false)
        nav('/consent_form/' + String(currentStep + 1))
      } else {
        nav('/')
      }
    } catch {
      setShowError(true)
    }
  }
  const handleNext = async () => {
    await saveForm('next')
  }
  const handleBack = () => {
    nav('/consent_form/' + String(currentStep - 1))
  }
  const handleSave = async () => {
    await saveForm('save')
  }

  useEffect(() => {
    setFormState(data?.elements || [])
    document.title = data?.title || 'CTRL'
  }, [data])

  const renderElements = (elements: SurveyElement[]) => {
    const results = []
    for (const i in elements) {
      if (elements[i].type == 'subheading') {
        results.push(
          <Typography key={`sh_${i}`} sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>
            {elements[i].data.text}
          </Typography>,
        )
      } else if (elements[i].type == 'video') {
        results.push(
          <iframe
            key={`if_${i}`}
            width="100%"
            height="500"
            src={`https://${elements[i].data.link.replace('https://', '')}`}
          />,
        )
      } else {
        results.push(renderQuestion(elements[i], Number(i)))
      }
    }
    return results
  }

  const renderQuestion = ({ type, data }: SurveyElement, idx: number) => {
    return (
      <Card
        key={idx}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          p: 3,
          gap: 2,
          mt: 1,
          bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
          boxShadow: '0',
          [theme.breakpoints.down('sm')]: {
            p: 1,
            gap: 1,
          },
        })}
      >
        {/*
          // @ts-ignore */}
        <Typography component="label" for={`input_${idx}`} sx={{ flexGrow: 1, textAlign: 'left' }}>
          {data.text}
        </Typography>
        {data.tooltip ? (
          <Tooltip title={<Typography fontSize={13}>{data.tooltip}</Typography>}>
            <IconButton>
              <Info />
            </IconButton>
          </Tooltip>
        ) : (
          <Box width={10} />
        )}
        {type == 'question-checkbox' && (
          <Checkbox
            id={`input_${idx}`}
            checked={formState[idx].data.value}
            data-cy={`checkbox-${idx}`}
            onClick={() =>
              setFormState((state) => {
                const s = [...state]
                s[idx].data.value = !s[idx].data.value
                return s
              })
            }
          />
        )}
        {type == 'question-choices' && (
          <Box>
            <FormControl error={blankRadios.includes(String(idx))}>
              <RadioGroup value={formState[idx].data.value}>
                {data.choices?.map((val: string, i: number) => {
                  return (
                    <FormControlLabel
                      key={`choice_${idx}_${i}`}
                      value={val}
                      control={<Radio />}
                      label={val}
                      sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                      onChange={() => {
                        setFormState((state) => {
                          const s = [...state]
                          s[idx].data.value = val
                          return s
                        })
                      }}
                    />
                  )
                })}
              </RadioGroup>
              {blankRadios.includes(String(idx)) && (
                <FormHelperText>Please select an option</FormHelperText>
              )}
            </FormControl>
          </Box>
        )}
      </Card>
    )
  }

  return (
    <Container maxWidth="md">
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            mt: 10,
            ml: 'auto',
            mr: 'auto',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4">Are you sure?</Typography>
          <Typography sx={{ mt: 3 }}>You have not selected a required statement.</Typography>
          <Typography
            sx={{ mt: 3 }}
          >{`If you choose "Proceed", a Genetic Counsellor will contact you to talk about your options. It may take 7 days for the study genetic counsellor to contact you.`}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              sx={{ mr: 1 }}
              variant="outlined"
              data-cy="proceed-button"
              onClick={() => saveForm(modalAction, true)}
            >
              Proceed
            </Button>
            <Button variant="contained" onClick={() => setModalOpen(false)}>
              Review Answers
            </Button>
          </Box>
          <Typography
            fontSize={12}
            sx={{ mt: 3 }}
          >{`Please click "Review Answers" if you would like to go back and change your responses.`}</Typography>
        </Card>
      </Modal>
      <Box sx={{ position: 'absolute', top: 10, left: 40 }}>
        {logoLoaded && (
          <img
            src={import.meta.env.VITE_BACKEND_URL + '/settings/logo'}
            height={30}
            onClick={() => nav('/')}
            style={{ marginRight: 20, cursor: 'pointer' }}
            alt="logo"
            onError={() => setLogoLoaded(false)}
            onLoad={() => setLogoLoaded(true)}
          />
        )}
      </Box>
      <Stepper activeStep={Number(params.step)} sx={{ mt: 6, mb: 4 }}>
        {Array(data?.total_steps)
          .fill(0)
          .map((_, idx) => (
            <Step key={idx}>
              <StepLabel></StepLabel>
            </Step>
          ))}
      </Stepper>
      <Card
        sx={(theme) => ({
          p: 3,
          boxShadow: 0,
          border: '1px solid lightgrey',
          [theme.breakpoints.down('sm')]: { p: 1 },
        })}
      >
        {isPending ? (
          <CircularProgress />
        ) : (
          <Box component="form">
            <Typography variant="h4">{data?.title}</Typography>
            <Typography sx={{ mt: 3, mb: 3, whiteSpace: 'preserve', textAlign: 'justify' }}>
              {data?.text}
            </Typography>
            {renderElements(formState)}
            {showError && <Alert severity="error">Error saving page</Alert>}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {currentStep == 0 ? (
                <Box width={70} />
              ) : (
                <Button onClick={handleBack} variant="contained" color="secondary">
                  Back
                </Button>
              )}
              <Button variant="contained" onClick={handleSave}>
                Save and Exit
              </Button>
              {currentStep + 1 == data?.total_steps ? (
                <Box width={70} />
              ) : (
                <Button onClick={handleNext} variant="contained" color="secondary">
                  Next
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Card>
    </Container>
  )
}
