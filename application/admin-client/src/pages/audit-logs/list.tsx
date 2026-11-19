import React, { useState } from 'react'
import { defaultAuditLogsPageSize } from '@common/src/config'
import { Box, Button, Chip, Collapse, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { DateField, List, useDataGrid } from '@refinedev/mui'
import { AUDIT_LOG_SORTABLE_FIELDS } from '@common/types/api/audit-logs/getAuditLogs'
import type { OIDCAuditMeta } from '@common/types/oidc'

const isOIDCAuditMeta = (value: unknown): value is OIDCAuditMeta =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { provider?: unknown }).provider === 'string'

// Provider, institution and MFA result recorded for an OIDC login. When the ID token couldn't be
// read there's no MFA result, and the reason is shown as text instead.
const OIDCLoginDetails = ({ oidc }: { oidc: OIDCAuditMeta }) => (
  <Box
    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    data-cy="oidc-login-details"
  >
    <Chip label={oidc.provider} size="small" variant="outlined" />
    {oidc.claims?.idp_name && <Typography variant="body2">{oidc.claims.idp_name}</Typography>}
    {oidc.mfaSignal === true && (
      <Chip label="MFA signal" size="small" color="success" data-cy="mfa-signal" />
    )}
    {oidc.mfaSignal === false && (
      <Chip label="No MFA signal" size="small" color="warning" data-cy="no-mfa-signal" />
    )}
    {oidc.claimsError && (
      <>
        <Chip
          label="Claims unavailable"
          size="small"
          color="warning"
          variant="outlined"
          data-cy="claims-unavailable"
        />
        <Typography variant="caption" color="text.secondary" data-cy="claims-error">
          {oidc.claimsError}
        </Typography>
      </>
    )}
  </Box>
)

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
        data-cy="toggle-payload-view"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ mb: expanded ? 1 : 0, textTransform: 'none' }}
      >
        {expanded ? 'Hide Payload' : 'View Payload'}
      </Button>

      <Collapse in={expanded} unmountOnExit data-cy="payload-viewer">
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
    // Note: By default Refined uses 'server' mode for pagination, sorting and filtering
    // pagination: { mode: 'off' },
    // sorters: { mode: 'off' },
    filters: { mode: 'off' },
    resource: 'audit-logs',
    sorters: {
      initial: [{ field: 'timestamp', order: 'desc' }],
    },
  })

  const columns = React.useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = [
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
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
              {isOIDCAuditMeta(value.oidc) && <OIDCLoginDetails oidc={value.oidc} />}
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
    ]
    return baseColumns.map((col) => ({
      ...col,
      sortable: col.sortable ?? AUDIT_LOG_SORTABLE_FIELDS.includes(col.field as any),
    }))
  }, [])
  return (
    <Box>
      <List headerProps={{ title: 'Audit Logs' }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          getRowHeight={() => 'auto'}
          getEstimatedRowHeight={() => 52}
          pageSizeOptions={[10, defaultAuditLogsPageSize, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: defaultAuditLogsPageSize } },
          }}
          slotProps={{ root: { 'data-cy': 'audit-logs-list' } }}
          disableColumnMenu
          sx={{
            '& .MuiDataGrid-columnHeaderTitleContainer': {
              justifyContent: 'center',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </List>
    </Box>
  )
}
