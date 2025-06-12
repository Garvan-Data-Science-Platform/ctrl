import { ChecklistRtl } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Link } from 'react-router-dom'

export const SurveyList = () => {
  const { dataGridProps } = useDataGrid({
    sorters: { mode: 'off', initial: [{ field: 'versionNumber', order: 'desc' }] },
    filters: { mode: 'off' },
  })

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'versionNumber',
        flex: 1,
        headerName: 'Version',
        minWidth: 200,
        renderCell: ({ row }) => (row.status == 'DRAFT' ? 'Current Draft' : row.versionNumber),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return row.status == 'DRAFT' ? (
            <EditButton data-cy="edit-button" hideText recordItemId={row.versionNumber} />
          ) : (
            <>
              <ShowButton
                title="View survey questions"
                data-cy="view-button"
                hideText
                recordItemId={row.versionNumber}
              />
              <IconButton
                component={Link}
                to={`/responses/all/${row.versionNumber}`}
                title="View responses"
                color="primary"
                data-cy="response-icon-button"
              >
                <ChecklistRtl />
              </IconButton>
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

  return (
    <List
      headerButtons={
        <>
          <Button
            variant="contained"
            disabled={dataGridProps.rows.length < 2}
            component={Link}
            to={`/responses/all/${dataGridProps.rows.at(0)?.versionNumber - 1}`}
            data-cy="view-all-responses-button"
          >
            View All Responses
          </Button>

          <Button
            variant="contained"
            component={Link}
            to={`/surveys/edit/${dataGridProps.rows.at(0)?.versionNumber}`}
            data-cy="edit-draft-button"
          >
            Edit current draft
          </Button>
        </>
      }
    >
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
