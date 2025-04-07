import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import { GetParticipantResponse } from '@common/types/api/participants'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'
import { Link } from 'react-router-dom'
import { statusMap } from './list'
import { familyMap } from '@common/src/familyMap'
import { Edit } from '@mui/icons-material'

export const ParticipantShow = () => {
  const { queryResult } = useShow({})

  const { data, isLoading } = queryResult

  const record = data?.data as GetParticipantResponse['data']

  const renderAnswers = (answers: ParticipantAnswerStatus[]) => {
    return answers.map((val) => (
      <Link key={val.participantId} to={`/responses/${val.participantId}`}>
        <Tooltip title={statusMap[val.status].tooltip}>
          <Button sx={{ color: statusMap[val.status].color }}>V{val.surveyVersion}</Button>
        </Tooltip>
      </Link>
    ))
  }

  return (
    <Show
      isLoading={isLoading}
      title={<Typography variant="h4">{`${record?.firstName} ${record?.lastName}`}</Typography>}
    >
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {'First Name'}
        </Typography>
        <TextField value={record?.firstName} />
        <Typography variant="body1" fontWeight="bold">
          {'Last Name'}
        </Typography>
        <TextField value={record?.lastName} />
        <Typography variant="body1" fontWeight="bold">
          {'Email'}
        </Typography>
        <TextField value={record?.email} />
        <Typography variant="body1" fontWeight="bold">
          {'Date of birth'}
        </Typography>
        <TextField value={new Date(record?.profile.dob).toLocaleDateString()} />{' '}
        <Typography variant="body1" fontWeight="bold">
          {'Address'}
        </Typography>
        <TextField
          value={`${record?.profile.addressLine}, ${record?.profile?.suburb}, ${record?.profile.state}, ${record?.profile.postcode}`}
        />
        <Typography variant="body1" fontWeight="bold">
          {'Mobile'}
        </Typography>
        <TextField value={record?.profile.mobile} />
        <Typography variant="body1" fontWeight="bold">
          {'Preferred Contact Method'}
        </Typography>
        <TextField value={record?.profile.preferredContact} />
        <Typography variant="body1" fontWeight="bold">
          {'Alternative Contact'}
        </Typography>
        <TextField
          value={`${record?.profile.nextOfKin?.firstName} ${record?.profile.nextOfKin?.lastName}`}
        />
        <TextField value={record?.profile.nextOfKin?.email} />
        <TextField value={record?.profile.nextOfKin?.mobile} />
      </Stack>

      <table style={{ textAlign: 'left', tableLayout: 'fixed' }}>
        <tbody>
          <>
            <tr>
              <td>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                    Family Members
                  </Typography>
                  <IconButton
                    component={Link}
                    to={`/participants/family/edit/${record?.profile.familyId}`}
                  >
                    <Edit />
                  </IconButton>
                </Box>
              </td>
            </tr>
            {record?.profile.familyMembers.map((val, idx) => {
              return (
                <tr key={`fam_${idx}`}>
                  <td>
                    <Link to={`/participants/${val.id}`}>
                      <Typography>
                        {val.firstName} {val.lastName}
                      </Typography>
                    </Link>
                  </td>

                  <td>
                    <Typography>{familyMap[val.participantType]}</Typography>
                  </td>
                </tr>
              )
            })}
          </>
        </tbody>
      </table>

      <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
        {'Answer History (By Survey Version)'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', mt: 1 }}>
        {record?.answers && renderAnswers(record?.answers)}
      </Box>
    </Show>
  )
}
