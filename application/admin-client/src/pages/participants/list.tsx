import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InviteModal } from '../../components/InviteModal'
import { axiosInstance } from '../../providers/dataProvider'
import { useInvalidate, useNotification } from '@refinedev/core'
import { InviteStatus } from '@common/types/api/participants/invite'
import { MoreVert } from '@mui/icons-material'

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
    filters: { mode: 'off' },
    sorters: { mode: 'off' },
  })
  const { dataGridProps: inviteGridProps } = useDataGrid({
    syncWithLocation: true,
    resource: 'invites',
    filters: { mode: 'off' },
    sorters: { mode: 'off' },
  })

  const invalidate = useInvalidate()

  const [modalOpen, setModalOpen] = useState(false)

  const [loading, setLoading] = useState(false)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [inviteRowId, setInviteRowId] = useState(0)

  const { open } = useNotification()

  const sendInvites = (emails: string[]) => {
    setLoading(true)
    axiosInstance
      .post('invites', { emails })
      .then(() => {
        setModalOpen(false)
        open?.({ type: 'success', message: `Invites sent` })
        setLoading(false)
        invalidate({ resource: 'invites', invalidates: ['list'] })
      })
      .catch((error) => {
        setModalOpen(false)
        open?.({ type: 'error', message: `Could not send invites: ${error}` })
        setLoading(false)
      })
  }

  const closeInviteActionMenu = () => {
    setAnchorEl(null)
  }

  const revokeInvite = (id: number) => {
    axiosInstance
      .post(`invites/revoke/${id}`)
      .then(() => {
        open?.({ type: 'success', message: 'Invite Revoked' })
        invalidate({ resource: 'invites', invalidates: ['list'] })
      })
      .catch((error) => {
        open?.({ type: 'error', message: `Could not revoke invite: ${error}` })
      })
    closeInviteActionMenu()
  }
  const resendInvite = (id: number) => {
    axiosInstance
      .post(`invites/resend/${id}`)
      .then(() => {
        open?.({ type: 'success', message: 'Invite Resent' })
        invalidate({ resource: 'invites', invalidates: ['list'] })
      })
      .catch((error) => {
        open?.({ type: 'error', message: `Could not resend invite: ${error}` })
      })
    closeInviteActionMenu()
  }

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
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: 'lastUpdated',
        flex: 1,
        headerName: 'Latest Survey Response',
        minWidth: 100,
        type: 'date',
        valueGetter: (cell) => {
          if (!cell.value) return null
          return new Date(cell.value)
        },
        renderCell: function render({ value }) {
          return <DateField value={value} format="DD/MM/YYYY" />
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        disableColumnMenu: true,
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

  const inviteStatusMap: { [key in InviteStatus]: string } = {
    ACCEPTED: 'Accepted',
    EXPIRED: 'Expired',
    PENDING: 'Pending',
    REVOKED: 'Revoked',
  }

  const inviteCols = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        flex: 2,
      },
      {
        field: 'createdAt',
        headerName: 'Date Sent',
        flex: 1,
        type: 'date',
        valueGetter: (cell) => {
          if (!cell.value) return null
          return new Date(cell.value)
        },
        renderCell: function render({ value }) {
          return <DateField value={value} format="DD/MM/YYYY" />
        },
      },
      {
        field: 'inviteStatus',
        headerName: 'Status',
        flex: 1,
        renderCell: ({ value }) => inviteStatusMap[value as InviteStatus],
        type: 'singleSelect',
        valueOptions: Object.keys(InviteStatus),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <>
              <IconButton
                onClick={(event) => {
                  setAnchorEl(event.currentTarget)
                  setInviteRowId(row.id)
                }}
                data-cy="invite-actions"
              >
                <MoreVert />
              </IconButton>
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
      },
    ],
    [],
  )

  return (
    <>
      <Modal open={loading}>
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </Modal>
      <Modal open={modalOpen}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
          }}
        >
          <InviteModal
            onCancel={() => {
              setModalOpen(false)
            }}
            onSend={sendInvites}
          />
        </Box>
      </Modal>

      <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => closeInviteActionMenu()}>
        <MenuItem data-cy="revoke-button" onClick={() => revokeInvite(inviteRowId)}>
          Revoke
        </MenuItem>
        <MenuItem data-cy="resend-button" onClick={() => resendInvite(inviteRowId)}>
          Resend
        </MenuItem>
      </Menu>
      <List
        headerButtons={
          <Button
            variant="contained"
            onClick={() => {
              setModalOpen(true)
            }}
            data-cy="invite-button"
          >
            Invite Participants
          </Button>
        }
      >
        <DataGrid {...dataGridProps} columns={columns} autoHeight />
      </List>
      <Box sx={{ mt: 1 }} />
      <List headerProps={{ title: 'Invites' }}>
        <DataGrid {...inviteGridProps} columns={inviteCols} autoHeight data-cy="pending-list" />
      </List>
    </>
  )
}
