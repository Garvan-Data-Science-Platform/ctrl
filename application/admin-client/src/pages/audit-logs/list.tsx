import React, { useState } from 'react'
// import { GetAllAuditLogsResponse } from '@common/types/api/audit-logs'
import { Box, Button, Chip, Collapse, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, List, useDataGrid } from '@refinedev/mui'

const ExpandableJsonCell = ({ value }: { value: any }) => {
  const [expanded, setExpanded] = useState(false)

  if (!value || Object.keys(value).length === 0) {
    return <Typography>-</Typography>
  }

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ mb: expanded ? 1 : 0, textTransform: 'none' }}
      >
        {expanded ? 'Hide Payload' : 'View Payload'}
      </Button>

      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {JSON.stringify(value, null, 2)}
        </Box>
      </Collapse>
    </Box>
  )
}

export const AuditLogList = () => {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: false,
    pagination: { mode: 'off' },
    filters: { mode: 'off' },
    sorters: { mode: 'off' },
    resource: 'audit-logs',
  })

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 10,
      },
      {
        field: 'resource',
        flex: 1,
        headerName: 'Resource',
        minWidth: 150,
      },
      {
        field: 'operation',
        headerName: 'Operation',
        width: 90,
      },
      {
        field: 'success',
        headerName: 'Success',
        width: 80,
      },
      {
        field: 'timestamp',
        headerName: 'Timestamp',
        width: 200,
        type: 'date',
        valueGetter: (value) => {
          if (!value) return null
          return new Date(value)
        },
        renderCell: function render({ value }) {
          // ISO format for good sorting properties :)
          return <DateField sx={{ p: 2 }} value={value} format="YYYY-MM-DD HH:mm:ss" />
        },
      },
      {
        field: 'userId',
        headerName: 'userId',
        width: 70,
      },
      {
        field: 'meta',
        headerName: 'Request Details',
        flex: 1,
        minWidth: 350,
        renderCell: ({ value }) => {
          if (!value || !value.method) return '-'

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={value.method}
                size="small"
                color={
                  value.method === 'DELETE'
                    ? 'error'
                    : value.method === 'POST'
                      ? 'success'
                      : 'default'
                }
                sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
              />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {value.url}
              </Typography>
            </Box>
          )
        },
      },
      {
        field: 'requestBody',
        headerName: 'RequestBody',
        flex: 2,
        minWidth: 300,
        renderCell: ({ value }) => <ExpandableJsonCell value={value} />,
      },
    ],
    [],
  )
  return (
    <Box>
      <List headerProps={{ title: 'Audit Logs' }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          getRowHeight={() => 'auto'}
          getEstimatedRowHeight={() => 52}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          slotProps={{ root: { 'data-cy': 'audit-logs-list' } }}
          disableColumnMenu // Optional: matches your cleaner UI style from the other page
        />
      </List>
    </Box>
  )
}
