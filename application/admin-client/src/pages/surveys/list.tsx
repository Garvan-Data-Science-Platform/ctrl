import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Button } from '@mui/material'
import { EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Link } from 'react-router-dom'

export const SurveyList = () => {
  const { dataGridProps } = useDataGrid({
    sorters: { initial: [{ field: 'versionNumber', order: 'desc' }] },
  })

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'versionNumber',
        flex: 1,
        headerName: 'Version',
        minWidth: 200,
        valueGetter: (val) => (val.row.status == 'DRAFT' ? 'Current Draft' : val.row.versionNumber),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: function render({ row }) {
          return row.status == 'DRAFT' ? (
            <EditButton data-cy="edit-button" hideText recordItemId={row.id} />
          ) : (
            <ShowButton data-cy="view-button" hideText recordItemId={row.id} />
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
        <Link to="/surveys/import">
          <Button variant="contained">Import REDCap Instrument</Button>
        </Link>
      }
    >
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
