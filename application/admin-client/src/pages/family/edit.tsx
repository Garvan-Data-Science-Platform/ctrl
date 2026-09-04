import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Link as MLink,
} from '@mui/material'
import { useInvalidate, useNotification, useOne, useParsed } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { OnBehalf, ParticipantType } from '@common/types/api/users/ParticipantProfile'
import { useEffect, useState } from 'react'
import { ParticipantSearch } from '../../components/ParticipantSearch'
import { ArrowBack, Delete } from '@mui/icons-material'
import { Link, useNavigate } from 'react-router'
import { GetFamilyResponse } from '@common/types/api/families'
import { axiosInstance } from '../../providers/dataProvider'
import { useCurrentStudyId } from '../../studyStore'
import { useQueryClient } from '@tanstack/react-query'
import { nameRules } from '@common/src/validation'

export const FamilyEdit = () => {
  const studyId = useCurrentStudyId()

  const { id } = useParsed()

  const invalidate = useInvalidate()
  const nav = useNavigate()

  const queryClient = useQueryClient()

  const { data } = useOne<GetFamilyResponse['data']>({ resource: 'families', id }).query

  const [action, setAction] = useState<'ADD' | 'REMOVE' | null>(null)
  const [loading, setLoading] = useState(false)
  const [newMemberStatus, setNewMemberStatus] = useState<'NEW' | 'EXISTING' | null>(null)
  const [newMemberType, setNewMemberType] = useState<'DEPENDENT' | 'GUARDIAN' | 'OTHER' | null>(
    null,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null)

  useEffect(() => {
    if (data) {
      if (data.data.every((val) => !val.inStudy)) {
        // Clear the cache for this specific familiy so it doesn flash if we come back
        queryClient.removeQueries({ queryKey: ['families', 'getOne', id] })
        nav('/participants')
      }
    }
  }, [data, id, nav, queryClient])

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

  const removeFromStudy = async (profileId: number) => {
    try {
      await axiosInstance.delete(`/studies/${studyId}/participants/${profileId}`)
      open?.({ type: 'success', message: 'Removed member from study' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to remove study participant: ${e.response.data.details}`,
      })
    }
  }

  const addToStudy = async (profileId: number) => {
    try {
      await axiosInstance.post(`/studies/${studyId}/participants/${profileId}`)
      open?.({ type: 'success', message: 'Added member to study' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed: ${e.response.data.details}` })
    }
  }

  const handleRemove = async (profileId: number) => {
    try {
      await axiosInstance.post(`/studies/${studyId}/families/remove/${profileId}`)
      open?.({ type: 'success', message: 'Removed member from family' })
      invalidate({ resource: 'families', invalidates: ['all'] })
      resetForm()
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to remove family member: ${e.response.data.details}`,
      })
    }
  }

  const handleAdd = async (profileId: number) => {
    try {
      await axiosInstance.post(`/studies/${studyId}/families/${id}/add/${profileId}`)
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
      await axiosInstance.post(`/studies/${studyId}/families/${id}/add-dependent`, data)
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

  const handleCheckboxClick = (val: GetFamilyResponse['data'][0]) => {
    if (val.inStudy) {
      setPendingRemoveId(val.id)
      setDialogOpen(true)
    } else {
      addToStudy(val.id)
    }
  }

  const handleDialogConfirm = async () => {
    if (pendingRemoveId !== null) {
      await removeFromStudy(pendingRemoveId)
      setPendingRemoveId(null)
      setDialogOpen(false)
    }
  }

  const handleDialogCancel = () => {
    setPendingRemoveId(null)
    setDialogOpen(false)
  }

  return (
    <Show
      resource="family"
      headerButtons={[]}
      title={<Typography variant="h5">Edit Family</Typography>}
      goBack={
        <IconButton component={Link} to="/participants">
          <ArrowBack />
        </IconButton>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Table sx={{ width: 800 }} data-cy="current-family-members">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Is a participant in this study?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((val) => (
              <TableRow key={`row_${val.id}`}>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ml: 1 }}>
                    {action == 'REMOVE' &&
                      val.inStudy &&
                      val.participantType != 'DEPENDENT_OTHER' &&
                      val.participantType != 'DEPENDENT_AGE' && (
                        <IconButton
                          onClick={() => handleRemove(val.id)}
                          data-cy="remove-icon-button"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    <Typography>{`${val.firstName} ${val.lastName}`}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Checkbox
                    data-cy="in-study-checkbox"
                    checked={val.inStudy}
                    onClick={() => handleCheckboxClick(val)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box>
          <Button
            variant={action == 'ADD' ? 'contained' : 'outlined'}
            onClick={() => setAction('ADD')}
            data-cy="add-member-button"
          >
            Add member to this family
          </Button>
          {(data?.data.length || 0) > 1 && (
            <Button
              sx={{ ml: 1 }}
              variant={action == 'REMOVE' ? 'contained' : 'outlined'}
              onClick={() => (action == 'REMOVE' ? setAction(null) : setAction('REMOVE'))}
              data-cy="remove-member-button"
            >
              Remove member from this family
            </Button>
          )}
        </Box>

        {action == 'ADD' && (
          <>
            <FormControl>
              <FormLabel>Is this person registered as a participant in this study?</FormLabel>
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
                  <FormLabel>The new family member is a:</FormLabel>
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
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message as string}
                      {...register(`firstName`, nameRules())}
                    />
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="Family Name"
                      required
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message as string}
                      data-cy="dep-surname"
                      {...register(`lastName`, nameRules())}
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
                  exclude={(data?.data || []).map((val) => val.id)}
                />
              </>
            )}
          </>
        )}
        <Typography variant="body2">
          Dependants in a family will inherit their answers from Guardians. {` `}
          <MLink
            target="_blank"
            href="https://garvan-data-science-platform.github.io/ctrl-docs/docs/families"
          >
            Click here for more info.
          </MLink>
        </Typography>
      </Box>
      <Dialog open={dialogOpen} onClose={handleDialogCancel}>
        <DialogTitle>Are you sure</DialogTitle>
        <DialogContent>
          This person will no longer be able to access the consent form for this study. Any existing
          consent they have provided will be hidden. This action can be undone if required.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel}>Cancel</Button>
          <Button
            onClick={handleDialogConfirm}
            color="error"
            variant="contained"
            data-cy="confirm-remove"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Show>
  )
}
