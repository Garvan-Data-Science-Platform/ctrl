import { GetUserByIdResponse } from '@common/types/api/users'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useMany } from '@refinedev/core'
import { DateField, DeleteButton, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'

export const roleMap: { [r in GetUserByIdResponse['data']['role']]: string } = {
  OrganisationAdmin: 'Organisation Admin',
  OperatorAdmin: 'Operator Admin',
  Participant: 'Participant',
}

export const UserList = () => {
  const { dataGridProps } = useDataGrid({
    resource: 'users/admin',
    syncWithLocation: true,
    filters: { mode: 'off' },
    sorters: { mode: 'off' },
  })

  const { data: userData } = useMany({
    resource: 'users/admin',
    ids: dataGridProps?.rows?.map((item: any) => item?.user?.id).filter(Boolean) ?? [],
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
        minWidth: 200,
      },
      {
        field: 'role',
        flex: 1,
        headerName: 'Role',
        minWidth: 100,
        renderCell: ({ value }) => roleMap[value as GetUserByIdResponse['data']['role']],
        type: 'singleSelect',
        valueOptions: Object.keys(roleMap),
      },
      {
        field: 'createdAt',
        flex: 1,
        headerName: 'Created at',
        minWidth: 100,
        type: 'date',
        valueGetter: (value) => {
          return new Date(value)
        },
        renderCell: function render({ value }) {
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
              <EditButton data-cy="edit-button" hideText recordItemId={row.id} />
              <ShowButton data-cy="view-button" hideText recordItemId={row.id} />
              <DeleteButton data-cy="delete-button" hideText recordItemId={row.id} />
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
      },
    ],
    [userData],
  )

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
