import { DataGrid, getGridStringOperators, type GridColDef } from '@mui/x-data-grid'
import { EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'

export const CategoryList = () => {
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
        valueGetter: (val) => (val.row.status == 'DRAFT' ? 'Current Draft' : val.row.versionNumber),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        disableColumnMenu: true,
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
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
