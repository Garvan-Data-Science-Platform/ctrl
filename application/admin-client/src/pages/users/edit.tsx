import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { UpdateUserRequest } from '@common/types/api/users'
import { useStudyStore } from '../../studyStore'
import { useGetIdentity, useInvalidate, useNotification, useParsed, useShow } from '@refinedev/core'
import { Controller } from 'react-hook-form'
import { axiosInstance } from '../../providers/dataProvider'
import { emailRegex } from '@common/src/regex'

export const UserEdit = () => {
  type FieldValues = UpdateUserRequest
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm<any, any, FieldValues>({ refineCoreProps: { redirect: false } })

  const { query } = useShow()

  const { data } = query

  const record = data?.data

  const { data: identity } = useGetIdentity<{ role: string; id: number }>()

  const { studies } = useStudyStore()
  const { open } = useNotification()
  const invalidate = useInvalidate()
  const { id } = useParsed()

  const editingDisabled = identity?.role == 'StudyAdmin' && identity?.id !== Number(id)
  saveButtonProps.disabled = editingDisabled

  const removeFromStudy = async (studyId: number, studyName: string) => {
    try {
      await axiosInstance.post(`/users/${id}/remove-study-admin/${studyId}`)
      open?.({ type: 'success', message: `Removed as admin of study ${studyName}` })
      invalidate({ resource: 'users', invalidates: ['all'] })
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to remove as admin of study ${studyName}: ${e.response.data.details}`,
      })
    }
  }

  const addToStudy = async (studyId: number) => {
    try {
      await axiosInstance.post(`/users/${id}/make-study-admin/${studyId}`)
      open?.({ type: 'success', message: 'Added as study admin' })
      invalidate({ resource: 'users', invalidates: ['all'] })
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to make study admin: ${e.response.data.details}`,
      })
    }
  }

  return (
    <Edit
      isLoading={formLoading}
      saveButtonProps={saveButtonProps}
      canDelete={identity?.role == 'OrganisationAdmin'}
      footerButtonProps={{
        sx: { display: 'flex', justifyContent: 'flex-start', width: '100%', pl: 2, pb: 2 },
      }}
    >
      <Stack direction="row" gap={3}>
        <Box
          component="form"
          sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          autoComplete="off"
        >
          <TextField
            {...register('firstName', {
              required: 'This field is required',
            })}
            error={!!(errors as any)?.firstName}
            helperText={(errors as any)?.firstName?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'First Name'}
            name="firstName"
            disabled={editingDisabled}
            data-cy="first"
          />
          <TextField
            {...register('lastName', {
              required: 'This field is required',
            })}
            error={!!(errors as any)?.lastName}
            helperText={(errors as any)?.lastName?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'Last Name'}
            name="lastName"
            disabled={editingDisabled}
          />
          <TextField
            {...register('email', {
              required: 'This field is required',
              validate: (email: string | undefined) =>
                emailRegex.test(email || '') || 'Invalid email address',
            })}
            error={!!(errors as any)?.email}
            helperText={(errors as any)?.email?.message}
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'Email'}
            name="email"
            disabled={editingDisabled}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => {
              return (
                <TextField
                  select
                  {...field}
                  value={field?.value || 'StudyAdmin'}
                  label={'Role'}
                  sx={{ mt: 1 }}
                  disabled={identity?.role == 'StudyAdmin' || identity?.id == Number(id)}
                  data-cy="role-select"
                >
                  <MenuItem value="OrganisationAdmin">Organisation Admin</MenuItem>
                  <MenuItem value="StudyAdmin">Study Admin</MenuItem>
                </TextField>
              )
            }}
          />
        </Box>
        {record?.role == 'StudyAdmin' && (
          <>
            <Box borderLeft="1px solid lightgrey" />
            <Stack flex={1}>
              <Typography variant="body1" fontWeight="bold">
                {'Admin of Study:'}
              </Typography>
              {studies.map((val, idx) => {
                return (
                  <FormControlLabel
                    key={`stud_${idx}`}
                    disabled={
                      record?.role != 'StudyAdmin' ||
                      (identity?.role == 'StudyAdmin' && identity?.id == Number(id))
                    }
                    control={
                      <Checkbox
                        checked={
                          record?.role == 'OrganisationAdmin' ||
                          record?.adminOfStudies.map((v: any) => Number(v.id)).includes(val.id) ||
                          false
                        }
                        onChange={async (e) => {
                          if (e.target.checked) {
                            await addToStudy(val.id)
                          } else {
                            await removeFromStudy(val.id, val.name)
                          }
                        }}
                      />
                    }
                    label={val.name}
                  />
                )
              })}
            </Stack>
          </>
        )}
      </Stack>
    </Edit>
  )
}
