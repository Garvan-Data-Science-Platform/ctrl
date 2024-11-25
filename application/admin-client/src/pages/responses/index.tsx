import { useShow } from '@refinedev/core'
import { GetResponsesByIdResponse } from '@common/types/api/surveys'
import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material'

export const ResponsesView = () => {
  const { queryResult } = useShow({ resource: 'surveys/responses' })

  const data = (queryResult.data?.data || []) as GetResponsesByIdResponse['data']
  return data.map((val, idx) => {
    return (
      <Box key={idx}>
        <Typography>{val.title}</Typography>
        <Table>
          <TableBody>
            {val.elements.map((e_val, e_idx) => {
              return (
                <TableRow key={e_idx}>
                  <TableCell>{e_val.data.text}</TableCell>
                  <TableCell>{JSON.stringify(e_val.data.value)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    )
  })
}
