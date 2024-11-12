import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DeleteButton, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'

export const CategoryList = () => {
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
            <EditButton hideText recordItemId={row.id} />
          ) : (
            <ShowButton hideText recordItemId={row.id} />
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
