import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useMany } from '@refinedev/core'
import { DateField, DeleteButton, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'

export const UserList = () => {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  })

  const { data: categoryData } = useMany({
    resource: 'categories',
    ids: dataGridProps?.rows?.map((item: any) => item?.category?.id).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  })

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 50,
      },
      {
        field: 'firstName',
        flex: 1,
        headerName: 'First Name',
        minWidth: 200,
      },
      {
        field: 'lastName',
        flex: 1,
        headerName: 'Last Name',
        minWidth: 200,
      },
      {
        field: 'email',
        flex: 1,
        headerName: 'Email',
        minWidth: 200,
      },
      {
        field: 'role',
        flex: 1,
        headerName: 'Role',
        minWidth: 200,
      },
      {
        field: 'createdAt',
        flex: 1,
        headerName: 'Created at',
        minWidth: 250,
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
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
              <DeleteButton hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
      },
    ],
    [categoryData],
  )

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
