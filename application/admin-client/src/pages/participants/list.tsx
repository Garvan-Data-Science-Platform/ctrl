import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useMany } from '@refinedev/core'
import { DateField, DeleteButton, EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'

export const ParticipantList = () => {
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
        field: 'surveyVersion',
        headerName: 'Survey Version',
        type: 'number',
        minWidth: 100,
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
        field: 'lastUpdated',
        flex: 1,
        headerName: 'Last Updated',
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
              <ShowButton hideText recordItemId={row.id} />
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
