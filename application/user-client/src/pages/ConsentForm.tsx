import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import NavBar from '../components/NavBar'
import { useAppStore } from '../store'
import { useForm } from 'react-hook-form'

export default function ConsentForm() {
  const bears = useAppStore()

  const { register, handleSubmit } = useForm()
  const onSubmit = (data: unknown) => console.log(data)

  return (
    <>
      <NavBar />
      <Typography>Dashboard Page {bears.bears}</Typography>
      <Button onClick={() => bears.increasePopulation(3)}>Increase</Button>

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
    </>
  )
}
