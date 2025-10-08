import { useInvalidate, useNotification } from '@refinedev/core'
import { useCurrentStudyId } from '../../studyStore'
import { List, useDataGrid } from '@refinedev/mui'
import { Box, IconButton, Tooltip } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Restore } from '@mui/icons-material'
import React from 'react'
import { axiosInstance } from '../../providers/dataProvider'
import { useQueryClient } from '@tanstack/react-query'

const RestorePage = () => {
  const invalidate = useInvalidate()
  const { open } = useNotification()
  const studyId = useCurrentStudyId()
  const queryClient = useQueryClient()

  const restore = async (resource: string, endpoint: string) => {
    try {
      await axiosInstance.patch(endpoint)
      open?.({ type: 'success', message: 'Successfully restored' })
      invalidate({ resource, invalidates: ['all'] })
      queryClient.invalidateQueries({ queryKey: ['studies'] })
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to restore: ${e.response.data.details}`,
      })
    }
  }

  // Only use one useDataGrid per page with syncWithLocation: true, others must be false
  const { dataGridProps } = useDataGrid({
    syncWithLocation: false,
    resource: 'participants/deleted',
  })

  const { dataGridProps: studiesDataGridProps } = useDataGrid({
    syncWithLocation: false,
    resource: 'studies/deleted',
  })

  const { dataGridProps: usersDataGridProps } = useDataGrid({
    syncWithLocation: false,
    resource: 'users/admin/deleted',
  })

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        flex: 1,
        headerName: 'ID',
      },
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
        field: 'study',
        flex: 1,
        headerName: 'Last Name',
        minWidth: 100,
      },
      {
        field: 'actions',
        headerName: 'Restore',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <>
              <Tooltip title="Restore">
                <IconButton
                  color="primary"
                  onClick={() =>
                    restore(
                      'participants/deleted',
                      `studies/${row.studyId}/participants/${row.profileId}/restore`,
                    )
                  }
                  data-cy="restore-participant"
                >
                  <Restore />
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

  const studiesColumns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        flex: 1,
        headerName: 'ID',
      },
      {
        field: 'name',
        flex: 1,
        headerName: 'Study Name',
        minWidth: 100,
      },
      {
        field: 'actions',
        headerName: 'Restore',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <>
              <Tooltip title="Restore">
                <IconButton
                  color="primary"
                  onClick={() => restore('studies/deleted', `studies/${row.id}/restore`)}
                  data-cy="restore-study"
                >
                  <Restore />
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

  const usersColumns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        flex: 1,
        headerName: 'ID',
      },
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
        field: 'actions',
        headerName: 'Restore',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <Tooltip title="Restore">
              <IconButton
                color="primary"
                onClick={() => restore('users/admin/deleted', `users/${row.id}/restore`)}
                data-cy="restore-user"
              >
                <Restore />
              </IconButton>
            </Tooltip>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 140,
      },
    ],
    [],
  )

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <List headerProps={{ title: 'Deleted Study Participants' }} breadcrumb={false}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          autoHeight
          slotProps={{ root: { 'data-cy': 'participants-list' } }}
        />
      </List>
      <Box sx={{ mt: 1 }} />
      <List headerProps={{ title: 'Deleted Studies' }} breadcrumb={false}>
        <DataGrid
          {...studiesDataGridProps}
          columns={studiesColumns}
          autoHeight
          slotProps={{ root: { 'data-cy': 'studies-list' } }}
        />
      </List>
      <Box sx={{ mt: 1 }} />
      <List headerProps={{ title: 'Deleted Admin Users' }} breadcrumb={false}>
        <DataGrid
          {...usersDataGridProps}
          columns={usersColumns}
          autoHeight
          slotProps={{ root: { 'data-cy': 'studies-list' } }}
        />
      </List>
    </Box>
  )
}

export default RestorePage
