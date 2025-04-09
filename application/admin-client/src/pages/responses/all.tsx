import { useShow } from '@refinedev/core'
import { GetAllResponsesResponse, GetResponsesByIdResponse } from '@common/types/api/surveys'
import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'

export const AllResponsesView = () => {
  const { queryResult } = useShow<GetAllResponsesResponse['data']>({
    resource: 'surveys/responses/all',
  })

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
        valueGetter: ({ row }) => `${row.profile.firstName}`,
        renderCell: ({ row }) =>
          `${row.profile.firstName} ${row.profile.lastName} (${new Date(row.profile.dob).toLocaleDateString()})`,
      },
      {
        field: 'family',
        headerName: 'Family Id',
        valueGetter: ({ row }) => `${row.profile.familyId}`,
      },
      ...(questions || []).map((val, idx) => {
        return {
          field: `answers[${idx}]`,
          headerName: val,
          minWidth: 200,
          valueGetter: ({ row }) => formatAnswer(row.answers.flatMap((v) => v.answers)[idx]),
          //renderCell: ({ row }) => JSON.stringify(row.answers.flatMap((v) => v.answers)[idx]),
        } as GridColDef
      }),
    ],
    [questions],
  )

  return (
    <>
      {questions && (
        <DataGrid
          getRowId={(row) => `${row.profile.firstName}${row.profile.lastName}${row.profile.dob}`}
          sortingMode="client"
          rows={rows}
          columns={inviteCols}
          autoHeight
        />
      )}
    </>
  )

  //return <Box>{JSON.stringify(data)}</Box>
}
