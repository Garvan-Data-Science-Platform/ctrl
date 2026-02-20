import { ParticipantAnswerStatus } from '@common/types/api/participants/participant'
import { GetResponsesByIdResponse, GetSurveyVersionsResponse } from '@common/types/api/surveys'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { InviteModal } from '../../components/InviteModal'
import { Recipient } from '@common/types/invite'
import { axiosInstance } from '../../providers/dataProvider'
import { useInvalidate, useNotification } from '@refinedev/core'
import { InviteStatus } from '@common/types/api/participants/invite'
import { MoreVert, People, PictureAsPdf, UploadFile } from '@mui/icons-material'
import ResponsesPdf from '@common/src/PdfExport'
import { pdfUtils, downloadPdfBlob } from '@common/src/pdfHelpers'
import { useStudyStore } from '../../studyStore'
import { GetParticipantResponse } from '@common/types/api/participants'
import { ReactSpreadsheetImport } from 'react-spreadsheet-import'
import { importFields } from '../../components/CSVImport'
import { unflatten } from 'flat'

export const statusMap = {
  incomplete: {
    color: 'text.disabled',
    tooltip: 'Incomplete',
  },
  partially_complete: {
    color: 'warning.main',
    tooltip: 'Partially Complete',
  },
  complete: {
    color: 'primary.main',
    tooltip: 'Complete',
  },
}

export const ParticipantList = () => {
  const theme = useTheme()
  const { dataGridProps } = useDataGrid({
    syncWithLocation: false,
    pagination: { mode: 'off' },
    filters: { mode: 'off' },
    sorters: { mode: 'off' },
  })
  const { dataGridProps: inviteGridProps } = useDataGrid({
    syncWithLocation: false,
    resource: 'invites',
  })

  const { studies, activeStudyIndex } = useStudyStore()

  const location = useLocation()
  const invalidate = useInvalidate()

  const [initialRecipients, setInitialRecipients] = useState<Recipient[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [inviteRowId, setInviteRowId] = useState('')
  const [publishedSurvey, setPublishedSurvey] = useState(true)

  const { open } = useNotification()

  useEffect(() => {
    // Check Published Survey
    axiosInstance.get(`/studies/${studies[activeStudyIndex].id}/surveys`).then((response) => {
      const allSurveys = response.data.data as GetSurveyVersionsResponse['data']
      const publishedSurveys = allSurveys.filter((survey) => survey.status === 'PUBLISHED')
      setPublishedSurvey(true)
      if (publishedSurveys.length === 0) {
        setPublishedSurvey(false)
      }
    })

    if (location.state?.openInviteModal) {
      setModalOpen(true)
      setInitialRecipients(location.state.initialRecipients || [])
      window.history.replaceState({}, document.title)
    }
    if (location.state?.openCsvModal) {
      setCsvModalOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location, studies[activeStudyIndex].id])

  const sendInvites = (recipients: Recipient[], subjectText: string, explanatoryText: string) => {
    setLoading(true)
    axiosInstance
      .post(`/studies/${studies[activeStudyIndex].id}/invites`, {
        recipients,
        subjectText,
        explanatoryText,
      })
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
      .post(`studies/${studies[activeStudyIndex].id}/invites/${id}/revoke`)
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
      .post(`studies/${studies[activeStudyIndex].id}/invites/${id}/resend`)
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
      <Link key={answer.participantId} to={`/responses/${answer.surveyVersionNumber}/${profileId}`}>
        <Tooltip title={statusMap[answer.status].tooltip}>
          <Button sx={{ color: statusMap[answer.status].color }}>
            V{answer.surveyVersionNumber}
          </Button>
        </Tooltip>
      </Link>
    )
  }

  const generatePdf = async (id: number, version: number) => {
    try {
      const profileData = (
        await axiosInstance.get(`/studies/${studies[activeStudyIndex].id}/participants/${id}/`)
      ).data as GetParticipantResponse

      const responseData = (
        await axiosInstance.get(
          `/studies/${studies[activeStudyIndex].id}/surveys/${version}/participants/${id}/answers`,
        )
      ).data as GetResponsesByIdResponse

      const logos = pdfUtils.getLogoUrls(studies[activeStudyIndex].id)
      const participantName = `${profileData.data.firstName}_${profileData.data.lastName}`
      // Note: this formats the filename to have the current date-time.
      const fileName = pdfUtils.formatFileName(
        'CTRL-responses',
        studies[activeStudyIndex].name,
        participantName,
      )

      await downloadPdfBlob(
        <ResponsesPdf
          studyName={studies[activeStudyIndex].name}
          studyDescription={studies[activeStudyIndex].description}
          profile={profileData.data.profile}
          steps={responseData.data.steps}
          responses={responseData}
          {...logos}
        />,
        fileName,
      )
    } catch (error) {
      open?.({ type: 'error', message: `Could not generate PDF: ${error}` })
    }
  }

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'participantId',
        flex: 1,
        headerName: 'ID',
        renderCell: ({ value, row }) => (row.externalId ? `${value} (${row.externalId})` : value),
        minWidth: 180,
        //filterOperators: allowedOperators,
      },
      {
        field: 'firstName',
        flex: 1,
        headerName: 'First Name',
        minWidth: 100,
        sortable: true,
        //filterOperators: allowedOperators,
      },
      {
        field: 'lastName',
        flex: 1,
        headerName: 'Last Name',
        minWidth: 100,
        sortable: true,
        //filterOperators: allowedOperators,
      },
      {
        field: 'email',
        flex: 1,
        headerName: 'Email',
        minWidth: 100,
        sortable: true,
        //filterOperators: allowedOperators,
      },
      {
        field: 'answers',
        headerName: 'Latest Answers',
        minWidth: 120,
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
        sortable: true,
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
              <Tooltip title="Responses PDF">
                <IconButton
                  onClick={() => generatePdf(row.id, row.answers.at(-1)?.surveyVersionNumber)}
                  color="primary"
                  data-cy="pdf-button"
                >
                  <PictureAsPdf />
                </IconButton>
              </Tooltip>
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 180,
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

  const customRSITheme = {
    styles: {
      global: {
        body: {
          bg: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        ".rdg-cell-error": {
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.error.dark : theme.palette.error.light
        },
      },
    },
    colors: {
      background: theme.palette.background.default,
      secondaryBackground:
        theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main,
      textColor: theme.palette.text.primary,
      subtitleColor: theme.palette.text.secondary,
      highlight: theme.palette.info.main,
      border: theme.palette.divider,
      inactiveColor: theme.palette.error.light,
      rsi: {
        50: theme.palette.mode === 'dark' ? '#0d47a1' : '#e3f2fd',
        100: theme.palette.mode === 'dark' ? '#1565c0' : '#bbdefb',
        200: theme.palette.mode === 'dark' ? '#1976d2' : '#90caf9',
        300: theme.palette.mode === 'dark' ? '#1e88e5' : '#64b5f6',
        400: theme.palette.mode === 'dark' ? '#2196f3' : '#42a5f5',
        500: theme.palette.mode === 'dark' ? '#42a5f5' : '#2196f3',
        600: theme.palette.mode === 'dark' ? '#64b5f6' : '#1e88e5',
        700: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2',
        800: theme.palette.mode === 'dark' ? '#bbdefb' : '#1565c0',
        900: theme.palette.mode === 'dark' ? '#e3f2fd' : '#0d47a1',
      },
    },
    components: {
      MatchColumnsStep: {
        baseStyle: {
          userTable: {
            ignoreButton: {
              bg: theme.palette.divider,
            },
          },
        }
      },
      Modal: {
        baseStyle: {
          backButton: {
            color: theme.palette.text.secondary,
          },
          continueButton: {
            color: theme.palette.text.primary,
            bg: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
          }
        },
        variants: {
          rsi: {
            footer: {
              bg: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper,
            }
          }
        }
      }
    }
  }

  return (
    <Box>
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
      <ReactSpreadsheetImport
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        isNavigationEnabled
        translations={{
          uploadStep: {
            manifestTitle: 'Available fields',
            manifestDescription:
              "When you upload a file you will have a chance to match the column headers with the fields listed below. These fields will be used to: (1) determine what email address to send an invitation to. (2) Prefill the registration form (if applicable). (3) Populate the user's externalID for this study.",
          },
        }}
        onSubmit={(data: any) => {
          const recips = data.validData.map((row: any) => {
            const nested = unflatten(row) as any
            return {
              email: nested.profile.email,
              prefill: nested,
            }
          })
          setInitialRecipients(recips)
          setModalOpen(true)
        }}
        fields={importFields}
        allowInvalidSubmit={false}
        customTheme={customRSITheme}
      />
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
          {publishedSurvey ? (
            <InviteModal
              onCancel={() => {
                setModalOpen(false)
              }}
              onSend={sendInvites}
              initialRecipients={initialRecipients}
            />
          ) : (
            <Box>
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
        headerButtons={[
          <Tooltip title="Import from CSV">
            <Button
              variant="contained"
              onClick={() => {
                setCsvModalOpen(true)
              }}
              data-cy="csv-button"
            >
              <UploadFile />
            </Button>
          </Tooltip>,
          <Button
            variant="contained"
            onClick={() => {
              setModalOpen(true)
            }}
            data-cy="invite-button"
          >
            Invite Participants
          </Button>,
        ]}
      >
        <DataGrid
          {...dataGridProps}
          pageSizeOptions={[10]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
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
    </Box>
  )
}
