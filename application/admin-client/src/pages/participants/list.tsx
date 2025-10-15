import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import { GetSettingsResponse } from '@common/types/api/settings'
import { GetSurveyVersionsResponse } from '@common/types/api/surveys'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DataGrid, GridFilterOperator, type GridColDef } from '@mui/x-data-grid'
import { DateField, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { InviteModal } from '../../components/InviteModal'
import { axiosInstance } from '../../providers/dataProvider'
import { useInvalidate, useNotification } from '@refinedev/core'
import { InviteStatus } from '@common/types/api/participants/invite'
import { MoreVert, People } from '@mui/icons-material'
import { useCurrentStudyId } from '../../studyStore'

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
    syncWithLocation: false,
    pagination: { pageSize: 10, mode: 'server' } as any,
    filters: { mode: 'server' },
    sorters: { mode: 'server' },
  })
  const { dataGridProps: inviteGridProps } = useDataGrid({
    syncWithLocation: false,
    resource: 'invites',
  })

  const location = useLocation()
  const invalidate = useInvalidate()

  const [initialEmails, setInitialEmails] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [inviteRowId, setInviteRowId] = useState('')
  const [emailIsSetup, setEmailIsSetup] = useState(true)
  const [publishedSurvey, setPublishedSurvey] = useState(true)

  const { open } = useNotification()

  const studyId = useCurrentStudyId()

  useEffect(() => {
    // Check Mailer Settings
    axiosInstance.get('/settings').then((res) => {
      const settings = res.data.data as GetSettingsResponse['data']
      if (
        !(
          settings.mailerHost &&
          settings.mailerPassword &&
          settings.mailerPort &&
          settings.mailerUser
        )
      ) {
        setEmailIsSetup(false)
      }
    })

    // Check Published Survey
    axiosInstance.get(`/studies/${studyId}/surveys`).then((response) => {
      const allSurveys = response.data.data as GetSurveyVersionsResponse['data']
      const publishedSurveys = allSurveys.filter((survey) => survey.status === 'PUBLISHED')
      setPublishedSurvey(true)
      if (publishedSurveys.length === 0) {
        setPublishedSurvey(false)
      }
    })

    if (location.state?.openInviteModal) {
      setModalOpen(true)
      setInitialEmails(location.state.initialEmails || [])
      // Clear the navigation state
      window.history.replaceState({}, document.title)
    }
  }, [location, studyId])

  const sendInvites = (emails: string[], subjectText: string, explanatoryText: string) => {
    setLoading(true)
    axiosInstance
      .post(`/studies/${studyId}/invites`, { emails, subjectText, explanatoryText })
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

  const revokeInvite = (id: string) => {
    axiosInstance
      .post(`studies/${studyId}/invites/${id}/revoke`)
      .then(() => {
        open?.({ type: 'success', message: 'Invite Revoked' })
        invalidate({ resource: 'invites', invalidates: ['list'] })
      })
      .catch((error) => {
        open?.({ type: 'error', message: `Could not revoke invite: ${error}` })
      })
    closeInviteActionMenu()
  }
  const resendInvite = (id: string) => {
    axiosInstance
      .post(`studies/${studyId}/invites/${id}/resend`)
      .then(() => {
        open?.({ type: 'success', message: 'Invite Resent' })
        invalidate({ resource: 'invites', invalidates: ['list'] })
      })
      .catch((error) => {
        open?.({ type: 'error', message: `Could not resend invite: ${error}` })
      })
    closeInviteActionMenu()
  }

  const renderAnswer = (profileId: number, answer: ParticipantAnswerStatus) => {
    return (
      <Link key={answer.participantId} to={`/responses/${profileId}/${answer.surveyVersionNumber}`}>
        <Tooltip title={statusMap[answer.status].tooltip}>
          <Button sx={{ color: statusMap[answer.status].color }}>
            V{answer.surveyVersionNumber}
          </Button>
        </Tooltip>
      </Link>
    )
  }

  // Debounced input component
  function DebouncedInput(props: any) {
    const { item, applyValue, InputProps } = props
    const [value, setValue] = useState(item.value ?? '')
    const debounceRef = useRef<number | undefined>()

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      setValue(newValue)
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
      debounceRef.current = window.setTimeout(() => {
        applyValue({ ...item, value: newValue })
      }, 500) // 500ms debounce
    }

    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current)
        }
      }
    }, [])

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
        <TextField
          variant="standard"
          value={value}
          onChange={handleChange}
          fullWidth
          {...InputProps}
        />
      </div>
    )
  }

  const allowedOperators: GridFilterOperator[] = [
    {
      label: 'Equals',
      value: 'equals',
      requiresFilterValue: true,
      getApplyFilterFn: (filterItem) => (value) => value === filterItem.value,
      InputComponent: DebouncedInput,
    },
    {
      label: 'Does not equal',
      value: 'doesNotEqual',
      getApplyFilterFn: (filterItem) => (value) => value !== filterItem.value,
      InputComponent: DebouncedInput,
    },
  ]

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'participantId',
        flex: 1,
        headerName: 'ID',
        filterOperators: allowedOperators,
      },
      {
        field: 'firstName',
        flex: 1,
        headerName: 'First Name',
        minWidth: 100,
        sortable: false,
        filterOperators: allowedOperators,
      },
      {
        field: 'lastName',
        flex: 1,
        headerName: 'Last Name',
        minWidth: 100,
        sortable: false,
        filterOperators: allowedOperators,
      },
      {
        field: 'email',
        flex: 1,
        headerName: 'Email',
        minWidth: 100,
        sortable: false,
        filterOperators: allowedOperators,
      },
      {
        field: 'answers',
        headerName: 'Latest Answers',
        minWidth: 250,
        renderCell: ({ value, row }) => renderAnswer(row.id, value.at(-1)),
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: 'lastUpdated',
        flex: 1,
        headerName: 'Latest Survey Response',
        minWidth: 100,
        type: 'date',
        disableColumnMenu: true,
        sortable: false,
        valueGetter: (value) => {
          if (!value) return null
          return new Date(value)
        },
        renderCell: function render({ value }) {
          //TODO: Localisation
          return <DateField sx={{ p: 2 }} value={value} format="DD/MM/YYYY" />
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
              <Tooltip title="View family">
                <IconButton
                  color="primary"
                  component={Link}
                  to={`/participants/family/edit/${row.familyId}`}
                  data-cy="family-button"
                >
                  <People />
                </IconButton>
              </Tooltip>
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 140,
      },
    ],
    [],
  )

  const inviteStatusMap: { [key in InviteStatus]: { label: string; color?: string } } = {
    ACCEPTED: { label: 'Accepted' },
    EXPIRED: { label: 'Expired' },
    PENDING: { label: 'Pending' },
    REVOKED: { label: 'Revoked' },
    FAILED_TO_SEND: { label: 'Failed to send', color: 'error.main' },
  }

  const inviteCols = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        flex: 2,
      },
      {
        field: 'sentAt',
        headerName: 'Date Sent',
        flex: 1,
        type: 'date',
        valueGetter: (value) => {
          if (!value) return null
          return new Date(value)
        },
        renderCell: function render({ value }) {
          return <DateField sx={{ p: 2 }} value={value} format="DD/MM/YYYY" />
        },
      },
      {
        field: 'inviteStatus',
        headerName: 'Status',
        flex: 1,
        renderCell: ({ value }) => (
          <Box sx={{ color: inviteStatusMap[value as InviteStatus].color }}>
            {inviteStatusMap[value as InviteStatus].label}
          </Box>
        ),
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
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
          {emailIsSetup && publishedSurvey ? (
            <InviteModal
              onCancel={() => {
                setModalOpen(false)
              }}
              onSend={sendInvites}
              initialEmails={initialEmails}
            />
          ) : (
            <Box>
              {!emailIsSetup && (
                <Box sx={{ mb: !publishedSurvey ? 3 : 0 }}>
                  <Typography sx={{ mb: 1 }}>
                    You need to set up your email SMTP settings to invite participants
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    component={Link}
                    to="/settings"
                    sx={{ textTransform: 'none' }}
                  >
                    Go to settings
                  </Button>
                </Box>
              )}
              {!emailIsSetup && !publishedSurvey && (
                <Box sx={{ my: 2 }}>
                  <hr style={{ border: 0, borderTop: '1px solid #eee' }} />
                </Box>
              )}
              {!publishedSurvey && (
                <Box data-cy="no-published-survey-modal">
                  <Typography sx={{ mb: 1 }}>
                    You need to publish a survey before inviting participants
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    component={Link}
                    to="/surveys/edit/1"
                    sx={{ textTransform: 'none' }}
                  >
                    Go to surveys
                  </Button>
                </Box>
              )}
            </Box>
          )}
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
        <DataGrid
          {...dataGridProps}
          columns={columns}
          autoHeight
          slotProps={{ root: { 'data-cy': 'participants-list' } }}
        />
      </List>
      <Box sx={{ mt: 1 }} />
      <List headerProps={{ title: 'Invites' }}>
        <DataGrid
          {...inviteGridProps}
          columns={inviteCols}
          autoHeight
          slotProps={{ root: { 'data-cy': 'pending-list' } }}
        />
      </List>
    </>
  )
}
