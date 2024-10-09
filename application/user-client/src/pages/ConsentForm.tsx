import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'

import { useAppStore } from '../store'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GetSurveyStepResponse } from '@common/types/api/surveys'
import surveyStep from '@common/example_responses/getSurveyStep.json'

export default function ConsentForm() {
  const bears = useAppStore()

  const { register, handleSubmit } = useForm()
  const onSubmit = (data: unknown) => console.log(data)
  const params = useParams()

  const { isPending, error, data } = useQuery({
    queryKey: ['form_step'],
    //queryFn: () => fetch('/api/user/profile').then((res) => res.json()) as Promise<UserProfile>,
    queryFn: () => surveyStep as GetSurveyStepResponse,
  })

  return (
    <Container maxWidth="md">
      <Typography>Consent {JSON.stringify(params)}</Typography>
      <Button onClick={() => bears.increasePopulation(3)}>Increase</Button>
      <Stepper activeStep={Number(params.step)}>
        {Array(data?.total_steps)
          .fill(0)
          .map((_, idx) => (
            <Step key={idx}>
              <StepLabel></StepLabel>
            </Step>
          ))}
      </Stepper>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: 500, mr: 'auto', ml: 'auto' }}>
          <TextField
            helperText="Some helper text"
            fullWidth
            sx={{ m: 1 }}
            label="First Name"
            {...register('firstName')}
          />
          <FormControl fullWidth sx={{ m: 1 }}>
            <InputLabel id="demo-simple-select-label">Gender</InputLabel>
            <Select label="Gender" fullWidth defaultValue={''} {...register('gender')}>
              <MenuItem value="female">female</MenuItem>
              <MenuItem value="male">male</MenuItem>
              <MenuItem value="other">other</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit">Submit</Button>
        </Box>
      </form>
    </Container>
  )
}
