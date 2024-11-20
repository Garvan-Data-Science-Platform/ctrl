import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { DateField, Show, TextFieldComponent as TextField } from '@refinedev/mui'

export const ParticipantShow = () => {
  const { queryResult } = useShow({})

  const { data, isLoading } = queryResult

  const record = data?.data

  return (
    <Show
      isLoading={isLoading}
      title={<Typography variant="h4">{`${record?.firstName} ${record?.lastName}`}</Typography>}
    >
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {'ID'}
        </Typography>
        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          {'First Name'}
        </Typography>
        <TextField value={record?.firstName} />

        <Typography variant="body1" fontWeight="bold">
          {'Last Name'}
        </Typography>
        <TextField value={record?.lastName} />

        <Typography variant="body1" fontWeight="bold">
          {'email'}
        </Typography>
        <TextField value={record?.email} />
        <Typography variant="body1" fontWeight="bold">
          {'Role'}
        </Typography>
        <TextField value={record?.role} />
        <Typography variant="body1" fontWeight="bold">
          {'CreatedAt'}
        </Typography>
        <DateField value={record?.createdAt} />
      </Stack>
    </Show>
  )
}
