import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useInvalidate, useNotification, useOne, useParsed } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { OnBehalf, ParticipantType } from '@common/types/api/users/ParticipantProfile'
import { useState } from 'react'
import { ParticipantSearch } from '../../components/ParticipantSearch'
import { ArrowBack, Delete } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { FamilyMember } from '@common/types/api/users/getParticipantProfile'
import { axiosInstance } from '../../providers/dataProvider'

export const FamilyEdit = () => {
  const { id } = useParsed()

  const invalidate = useInvalidate()

  const { data } = useOne<FamilyMember[]>({ resource: 'families', id })

  const [action, setAction] = useState<'ADD' | 'REMOVE' | null>(null)
  const [loading, setLoading] = useState(false)
  const [newMemberStatus, setNewMemberStatus] = useState<'NEW' | 'EXISTING' | null>(null)
  const [newMemberType, setNewMemberType] = useState<'DEPENDENT' | 'GUARDIAN' | 'OTHER' | null>(
    null,
  )

  //Dependents add form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnBehalf>()

  const resetForm = () => {
    reset()
    setAction(null)
    setNewMemberStatus(null)
    setNewMemberType(null)
  }

  const { open } = useNotification()

  const handleRemove = async (profileId: number) => {
    try {
      await axiosInstance.post(`/families/remove/${profileId}`)
      open?.({ type: 'success', message: 'Removed member from family' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to remove dependent: ${e.response.data.details}` })
    }
  }

  const handleAdd = async (profileId: number) => {
    try {
      await axiosInstance.post(`/families/${id}/add/${profileId}`)
      open?.({ type: 'success', message: 'Added member to family' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      invalidate({ resource: 'participants', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to add member to family: ${e.response.data.details}`,
      })
    }
  }

  const onSubmitNewDependent = async (data: any) => {
    try {
      await axiosInstance.post(`/families/${id}/add-dependent`, data)
      open?.({ type: 'success', message: 'Added dependent to family' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to add new dependent: ${e.response.data.details}` })
    }
  }

  const handleChangeType = async (profileId: number, type: ParticipantType) => {
    try {
      setLoading(true)
      await axiosInstance.patch(`/profiles/${profileId}`, { participantType: type })
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to change member type: ${e.response.data.details}` })
    } finally {
      invalidate({ resource: 'families', invalidates: ['all'] })
      setLoading(false)
    }
  }

  return (
    <Show
      resource="family"
      title={<Typography variant="h5">Edit Family</Typography>}
      goBack={
        <IconButton component={Link} to="/participants">
          <ArrowBack />
        </IconButton>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Current Family Members:</Typography>
        <Box data-cy="current-family-members">
          {data?.data.map((val) => (
            <Box
              key={val.id}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 40,
                width: 400,
                mt: 1,
                mb: 1,
                p: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: action == 'REMOVE' ? 'red' : 'lightgrey',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ml: 1 }}>
                {action == 'REMOVE' && (
                  <IconButton onClick={() => handleRemove(val.id)} data-cy="remove-icon-button">
                    <Delete />
                  </IconButton>
                )}
                <Typography>{`${val.firstName} ${val.lastName}`}</Typography>
              </Box>
              <Select
                size="small"
                sx={{ width: 200 }}
                value={val.participantType}
                disabled={loading}
                onChange={(e) => handleChangeType(val.id, e.target.value as ParticipantType)}
                data-cy="type-select"
              >
                <MenuItem value={ParticipantType.DEPENDENT_AGE}>Dependent (age based)</MenuItem>
                <MenuItem value={ParticipantType.DEPENDENT_OTHER}>Dependent (other)</MenuItem>
                <MenuItem value={ParticipantType.GUARDIAN}>Guardian</MenuItem>
                <MenuItem value={ParticipantType.STANDARD}>Non-Guardian</MenuItem>
              </Select>
            </Box>
          ))}
        </Box>

        <Box>
          <Button
            variant={action == 'ADD' ? 'contained' : 'outlined'}
            onClick={() => setAction('ADD')}
            data-cy="add-member-button"
          >
            Add member to this family
          </Button>
          <Button
            sx={{ ml: 1 }}
            variant={action == 'REMOVE' ? 'contained' : 'outlined'}
            onClick={() => setAction('REMOVE')}
            data-cy="remove-member-button"
          >
            Remove member from this family
          </Button>
        </Box>

        {action == 'ADD' && (
          <>
            <FormControl>
              <FormLabel>Is this person registered as a participant in CTRL?</FormLabel>
              <RadioGroup
                row
                onChange={(e) => {
                  setNewMemberStatus(e.target.value as any)
                }}
                value={newMemberStatus}
              >
                <FormControlLabel
                  value={'EXISTING'}
                  control={<Radio />}
                  label="Yes"
                  sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                  data-cy="registered-yes"
                />
                <FormControlLabel
                  value={'NEW'}
                  control={<Radio />}
                  label="No"
                  sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                  data-cy="registered-no"
                />
              </RadioGroup>
            </FormControl>

            {newMemberStatus == 'NEW' && (
              <>
                <FormControl>
                  <FormLabel>The new member is a:</FormLabel>
                  <RadioGroup
                    row
                    value={newMemberType}
                    onChange={(e) => setNewMemberType(e.target.value as any)}
                  >
                    <FormControlLabel
                      value={'DEPENDENT'}
                      control={<Radio />}
                      label="Dependent"
                      sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                      data-cy="new-dependent"
                    />
                    <FormControlLabel
                      value={'GUARDIAN'}
                      control={<Radio />}
                      label="Parent/Guardian"
                      sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                    />
                    <FormControlLabel
                      value={'OTHER'}
                      control={<Radio />}
                      label="Other"
                      sx={(theme) => ({ [theme.breakpoints.up('sm')]: { minWidth: 110 } })}
                    />
                  </RadioGroup>
                </FormControl>
                {newMemberType == 'DEPENDENT' && (
                  <Box
                    sx={{ maxWidth: 500 }}
                    component="form"
                    onSubmit={handleSubmit(onSubmitNewDependent)}
                  >
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="First Name"
                      data-cy="dep-first"
                      required
                      {...register(`firstName`, {
                        required: 'This field is required',
                      })}
                    />
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="Family Name"
                      required
                      data-cy="dep-surname"
                      {...register(`lastName`, {
                        required: 'This field is required',
                      })}
                    />
                    <TextField
                      type="date"
                      sx={{ m: 1 }}
                      label="Date of Birth"
                      required
                      data-cy="dep-dob"
                      {...register(`dob`, { required: 'This field is required' })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1,
                        ml: 1,
                      }}
                    >
                      <Typography>
                        This child may not be able to provide consent themselves when they reach 18
                      </Typography>
                      <Checkbox defaultChecked={false} {...register(`permanent`)} />
                    </Box>
                    <Button
                      data-cy="add-dep-button"
                      variant="contained"
                      sx={{ mt: 3 }}
                      type="submit"
                    >
                      Add Dependent
                    </Button>
                  </Box>
                )}

                {(newMemberType == 'GUARDIAN' || newMemberType == 'OTHER') && (
                  <>
                    <Typography>
                      You need to invite this person to create an account in CTRL
                    </Typography>
                    <Button
                      variant="contained"
                      component={Link}
                      to="/participants"
                      sx={{ width: 200 }}
                    >
                      Invite Participant
                    </Button>
                  </>
                )}
              </>
            )}
            {newMemberStatus == 'EXISTING' && (
              <>
                <Typography>Search and select the family member you want to add:</Typography>
                <ParticipantSearch
                  buttonText="Add to family"
                  onConfirm={handleAdd}
                  exclude={data?.data.map((val) => val.id) || []}
                />
              </>
            )}
          </>
        )}
      </Box>
    </Show>
  )
}
