import {
  alpha,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import { useAppStore } from '../store'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GetSurveyStepResponse } from '@common/types/api/surveys'
import surveyStep from '@common/example_responses/getSurveyStep.json'
import { Info } from '@mui/icons-material'
import { SurveyQuestion } from '@common/types/api/surveys/getSurveyStep'
import { useEffect, useState } from 'react'

export default function ConsentForm() {
  const nav = useNavigate()

  const params = useParams()
  const currentStep = Number(params.step)

  const [formState, setFormState] = useState<SurveyQuestion[]>()
  const [modalOpen, setModalOpen] = useState(false)

  const { isPending, data } = useQuery({
    queryKey: ['form_step', currentStep],
    //queryFn: () => fetch('/api/user/profile').then((res) => res.json()) as Promise<UserProfile>,
    queryFn: () => {
      return surveyStep as GetSurveyStepResponse
    },
  })

  const handleNext = () => {
    for (var i in data!!.questions) {
      if (data?.questions[i].required && !data?.questions[i].checked) {
        setModalOpen(true)
        return
      }
    }
    console.log('SENDING TO SERVER')
    nav('/consent_form/' + String(currentStep + 1))
  }
  const handleBack = () => {
    console.log('SENDING TO SERVER')
    nav('/consent_form/' + String(currentStep - 1))
  }

  useEffect(() => {
    console.log('Setting form state', data?.questions)
    setFormState(data?.questions)
  }, [data])

  const renderQuestion = ({ text, tooltip, checked }: SurveyQuestion, idx: number) => {
    return (
      <Card
        key={idx}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 3,
          gap: 2,
          mt: 1,
          bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
          boxShadow: '0',
        }}
      >
        <Typography>{text}</Typography>
        {tooltip ? (
          <Tooltip title={<Typography fontSize={13}>{tooltip}</Typography>}>
            <Info />
          </Tooltip>
        ) : (
          <Box width={10} />
        )}
        <Checkbox
          checked={formState!![idx].checked}
          onClick={() =>
            setFormState((state) => {
              const s = [...state!!]
              s[idx].checked = !checked
              console.log('SETTING FORM STATE', s)
              return s
            })
          }
        />
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
          <Typography variant="h4">{data?.refusal_text.title}</Typography>
          <Typography sx={{ mt: 3 }}>{data?.refusal_text.text}</Typography>
          <Typography
            sx={{ mt: 3 }}
          >{`If you choose "${data?.refusal_text.button_text}" an Australian Genomics Genetic Counsellor will contact you to talk about your options. It may take 7 days for the study genetic counsellor to contact you.`}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button sx={{ mr: 1 }} variant="outlined">
              {data?.refusal_text.button_text}
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
        <img
          src="/australian-genomics-logo.png"
          height={30}
          onClick={() => nav('/')}
          style={{ marginRight: 20, cursor: 'pointer' }}
        />
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
      <Card sx={{ p: 3, boxShadow: 0, border: '1px solid lightgrey' }}>
        {isPending ? (
          <CircularProgress />
        ) : (
          <>
            <Typography variant="h4">{data?.title}</Typography>
            <Typography sx={{ mt: 3, mb: 3 }}>{data?.text}</Typography>
            {formState?.map((val, idx) => renderQuestion(val, idx))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {currentStep == 0 ? (
                <Box width={70} />
              ) : (
                <Button onClick={handleBack} variant="contained" color="secondary">
                  Back
                </Button>
              )}
              <Button variant="contained">Save and Exit</Button>
              {currentStep + 1 == data?.total_steps ? (
                <Box width={70} />
              ) : (
                <Button onClick={handleNext} variant="contained" color="secondary">
                  Next
                </Button>
              )}
            </Box>
          </>
        )}
      </Card>
    </Container>
  )
}
