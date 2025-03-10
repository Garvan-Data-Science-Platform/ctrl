import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import { Button, Tooltip } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Link } from 'react-router-dom'

export const statusMap = {
  incomplete: {
    color: 'grey',
    tooltip: 'Incomplete',
  },
  partially_complete: {
    color: 'orange',
    tooltip: 'Partially Complete',
  },
  complete: {
    color: 'primary',
    tooltip: 'Complete',
  },
}

export const ParticipantList = () => {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  })
  const { dataGridProps: inviteGridProps } = useDataGrid({
    syncWithLocation: true,
    resource: 'invites',
  })

  const renderAnswer = (answer: ParticipantAnswerStatus) => {
    return (
      <Link key={answer.participantId} to={`/responses/${answer.participantId}`}>
        <Tooltip title={statusMap[answer.status].tooltip}>
          <Button sx={{ color: statusMap[answer.status].color }}>V{answer.surveyVersion}</Button>
        </Tooltip>
      </Link>
    )
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
        headerName: 'Latest Answers',
        minWidth: 250,
        renderCell: ({ value }) => renderAnswer(value.at(-1)),
      },
      {
        field: 'lastUpdated',
        flex: 1,
        headerName: 'Latest Survey Response',
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
              <EditButton hideText recordItemId={row.id} />
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
