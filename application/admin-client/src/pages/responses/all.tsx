import { useParsed, useShow } from '@refinedev/core'
import { GetAllResponsesResponse } from '@common/types/api/surveys'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import { useMemo } from 'react'
import { List } from '@refinedev/mui'

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
        valueGetter: ({ row }) =>
          `${row.profile.firstName} ${row.profile.lastName} (${new Date(row.profile.dob).toLocaleDateString()})`,
      },
      {
        field: 'family',
        headerName: 'Family Id',
        minWidth: 100,
        valueGetter: ({ row }) => `${row.profile.familyId}`,
      },
      ...(questions || []).map((val, idx) => {
        return {
          field: `answers[${idx}]`,
          headerName: val,
          minWidth: 200,
          valueGetter: ({ row }) => formatAnswer(row.answers.flatMap((v: any) => v.answers)[idx]),
        } as GridColDef
      }),
    ],
    [questions],
  )

  return (
    <List title={`Responses: Survey Version ${id}`} breadcrumb={false}>
      {questions && (
        <DataGrid
          getRowId={(row) => `${row.profile.firstName}${row.profile.lastName}${row.profile.dob}`}
          sortingMode="client"
          initialState={{ sorting: { sortModel: [{ field: 'family', sort: 'asc' }] } }}
          rows={rows}
          columns={inviteCols}
          slots={{ toolbar: GridToolbar }}
          autoHeight
        />
      )}
    </List>
  )
}
