import { useParsed, useShow } from '@refinedev/core'
import { GetAllResponsesResponse } from '@common/types/api/surveys'
import {
  ColumnsPanelTrigger,
  DataGrid,
  ExportCsv,
  FilterPanelTrigger,
  GridColDef,
  GridFilterListIcon,
  GridSearchIcon,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  ToolbarButton,
  Toolbar,
  GridViewColumnIcon,
  useGridApiContext,
  useGridSelector,
  gridFilterActiveItemsSelector,
  gridColumnVisibilityModelSelector,
} from '@mui/x-data-grid'
import { useMemo } from 'react'
import { List } from '@refinedev/mui'
import { styled } from '@mui/material/styles'
import { Badge, Divider, InputAdornment, TextField, Tooltip } from '@mui/material'
import { Cancel, FileDownload } from '@mui/icons-material'
import { ParticipantData } from '@common/types/api/surveys/getAllResponses'

export const AllResponsesView = () => {
  const { queryResult } = useShow<GetAllResponsesResponse['data']>({
    resource: 'surveys/responses/all',
  })

  const { id } = useParsed()

  const rows = useMemo(() => {
    return queryResult.data?.data.participants || []
  }, [queryResult.data])

  const questions = queryResult.data?.data.surveyData
    .flatMap((val) => val.elements)
    .filter((val) => val.type.includes('question'))
    .map((val) => val.data.text)

  const formatAnswer = (answer: string | boolean | null): string => {
    if (answer === true) {
      return 'True'
    } else if (answer === false) {
      return 'False'
    } else if (typeof answer == 'string') {
      return answer
    } else {
      return 'No Answer'
    }
  }

  const inviteCols: GridColDef[] = useMemo(
    () => [
      {
        field: 'profile',
        headerName: 'Participant',
        minWidth: 200,
        valueGetter: (val: ParticipantData['profile']) =>
          `${val.firstName} ${val.lastName} (${new Date(val.dob).toLocaleDateString()})`,
      },
      {
        field: 'family',
        headerName: 'Family Id',
        minWidth: 100,
        valueGetter: (val, row) => `${row.profile.familyId}`,
      },
      {
        field: 'versionId',
        headerName: 'Survey Version',
        minWidth: 100,
      },
      ...(questions || []).map((val, idx) => {
        return {
          field: `answers[${idx}]`,
          headerName: val,
          minWidth: 200,
          valueGetter: (val, row) => formatAnswer(row.answers.flatMap((v: any) => v.answers)[idx]),
          //formatAnswer(val.flatMap((v: any) => v.answers)[idx]),
        } as GridColDef
      }),
    ],
    [questions],
  )

  type OwnerState = {
    expanded: boolean
  }

  const StyledQuickFilter = styled(QuickFilter)({
    display: 'grid',
    alignItems: 'center',
  })

  const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
    ({ theme, ownerState }) => ({
      gridArea: '1 / 1',
      width: 'min-content',
      height: 'min-content',
      zIndex: 1,
      opacity: ownerState.expanded ? 0 : 1,
      pointerEvents: ownerState.expanded ? 'none' : 'auto',
      transition: theme.transitions.create(['opacity']),
    }),
  )

  const StyledTextField = styled(TextField)<{
    ownerState: OwnerState
  }>(({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    overflowX: 'clip',
    width: ownerState.expanded ? 260 : 'var(--trigger-width)',
    opacity: ownerState.expanded ? 1 : 0,
    transition: theme.transitions.create(['width', 'opacity']),
  }))

  function CustomToolbar() {
    const apiRef = useGridApiContext()
    const activeFilters = useGridSelector(apiRef, gridFilterActiveItemsSelector)
    const cols = useGridSelector(apiRef, gridColumnVisibilityModelSelector)
    const isFilter = activeFilters.length > 0 || Object.values(cols).some((val) => !val)
    return (
      <Toolbar>
        <Tooltip title="Select Columns">
          <ColumnsPanelTrigger
            render={(props) => (
              <ToolbarButton {...props} color="default">
                <Badge
                  badgeContent={Object.values(cols).filter((val) => !val).length}
                  color="primary"
                  variant="dot"
                >
                  <GridViewColumnIcon fontSize="small" />
                </Badge>
              </ToolbarButton>
            )}
          />
        </Tooltip>
        <Tooltip title="Filter Rows">
          <FilterPanelTrigger
            render={(props, state) => (
              <ToolbarButton {...props} color="default">
                <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                  <GridFilterListIcon fontSize="small" />
                </Badge>
              </ToolbarButton>
            )}
          />
        </Tooltip>
        <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Export current view as csv">
          <ExportCsv
            render={<ToolbarButton />}
            options={{
              fileName: `ctrl-responses-survey-v${id}-${new Date().toLocaleDateString()}${isFilter ? '-filtered' : ''}`,
            }}
          >
            <FileDownload fontSize="small" />
          </ExportCsv>
        </Tooltip>
        <StyledQuickFilter>
          <QuickFilterTrigger
            render={(triggerProps, state) => (
              <Tooltip title="Search" enterDelay={0}>
                <StyledToolbarButton
                  {...triggerProps}
                  ownerState={{ expanded: state.expanded }}
                  color="default"
                  aria-disabled={state.expanded}
                >
                  <GridSearchIcon fontSize="small" />
                </StyledToolbarButton>
              </Tooltip>
            )}
          />
          <QuickFilterControl
            render={({ ref, ...controlProps }, state) => (
              <StyledTextField
                {...controlProps}
                ownerState={{ expanded: state.expanded }}
                inputRef={ref}
                aria-label="Search"
                placeholder="Search..."
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <GridSearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: state.value ? (
                      <InputAdornment position="end">
                        <QuickFilterClear
                          edge="end"
                          size="small"
                          aria-label="Clear search"
                          material={{ sx: { marginRight: -0.75 } }}
                        >
                          <Cancel fontSize="small" />
                        </QuickFilterClear>
                      </InputAdornment>
                    ) : null,
                    ...controlProps.slotProps?.input,
                  },
                  ...controlProps.slotProps,
                }}
              />
            )}
          />
        </StyledQuickFilter>
      </Toolbar>
    )
  }

  return (
    <List title={`Responses: Survey Version ${id}`} breadcrumb={false}>
      {questions && (
        <DataGrid
          getRowId={(row) => `${row.profile.firstName}${row.profile.lastName}${row.profile.dob}`}
          sortingMode="client"
          initialState={{ sorting: { sortModel: [{ field: 'family', sort: 'asc' }] } }}
          rows={rows}
          columns={inviteCols}
          showToolbar
          slots={{ toolbar: CustomToolbar }}
          autoHeight
        />
      )}
    </List>
  )
}
