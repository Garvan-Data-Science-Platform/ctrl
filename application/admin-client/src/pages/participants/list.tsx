import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import { Box, Button, Tooltip } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Link } from 'react-router-dom'

export const ParticipantList = () => {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  })
  const { dataGridProps: inviteGridProps } = useDataGrid({
    syncWithLocation: true,
    resource: 'invites',
  })

  const renderAnswers = (answers: ParticipantAnswerStatus[]) => {
    const filled = answers.filter((val) => val.status == 'complete')

    if (filled && filled[filled.length - 1] == answers[answers.length - 1]) {
      const val = filled[filled.length - 1]
      return (
        <Tooltip title="Complete">
          <Link key={val.participantId} to={`/responses/${val.participantId}`}>
            <Button>V{val.surveyVersion}</Button>
          </Link>
        </Tooltip>
      )
    }

    const lastComplete = filled.length > 0 ? answers.indexOf(filled[filled.length - 1]) : 0

    return answers.slice(lastComplete).map((val) => {
      if (val.status == 'incomplete') {
        return (
          <Tooltip key={val.participantId} title="Incomplete">
            <Box>
              <Button disabled>V{val.surveyVersion}</Button>
            </Box>
          </Tooltip>
        )
      } else if (val.status == 'partially_complete') {
        return (
          <Link key={val.participantId} to={`/responses/${val.participantId}`}>
            <Tooltip title="Partially Complete">
              <Button sx={{ color: 'orange' }}>V{val.surveyVersion}</Button>
            </Tooltip>
          </Link>
        )
      } else {
        return (
          <Link key={val.participantId} to={`/responses/${val.participantId}`}>
            <Tooltip title="Complete">
              <Button>V{val.surveyVersion}</Button>
            </Tooltip>
          </Link>
        )
      }
    })
  }

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'firstName',
        flex: 1,
        headerName: 'First Name',
        minWidth: 100,
      },
      {
        field: 'lastName',
        flex: 1,
        headerName: 'Last Name',
        minWidth: 100,
      },
      {
        field: 'email',
        flex: 1,
        headerName: 'Email',
        minWidth: 100,
      },
      {
        field: 'answers',
        headerName: 'Latest answers',
        minWidth: 250,
        renderCell: ({ value }) => renderAnswers(value),
      },
      {
        field: 'lastUpdated',
        flex: 1,
        headerName: 'Last Updated',
        minWidth: 100,
        renderCell: function render({ value }) {
          return <DateField value={value} />
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: function render({ row }) {
          return (
            <>
              <ShowButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
      },
    ],
    [],
  )

  const inviteCols = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        minWidth: 300,
      },
      {
        field: 'date',
        headerName: 'Date Sent',
      },
    ],
    [],
  )

  return (
    <>
      <List headerButtons={<Button variant="contained">Invite Participants</Button>}>
        <DataGrid {...dataGridProps} columns={columns} autoHeight />
      </List>
      <List headerProps={{ title: 'Pending Invites' }}>
        <DataGrid {...inviteGridProps} columns={inviteCols} autoHeight />
      </List>
    </>
  )
}
