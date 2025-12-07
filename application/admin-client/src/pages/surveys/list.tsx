import { ChecklistRtl, PictureAsPdf } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { EditButton, List, ShowButton, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Link } from 'react-router-dom'
import { useStudyStore } from '../../studyStore'
import SurveyPdf from '@common/src/PdfExport'
import { formatStudyName } from '@common/src/pdfHelpers'
import { pdf } from '@react-pdf/renderer'
import { axiosInstance } from '../../providers/dataProvider'
import { GetSurveyVersionByVersionNumberResponse } from '@common/types/api/surveys'

export const SurveyList = () => {
  const { dataGridProps } = useDataGrid({
    sorters: { mode: 'off', initial: [{ field: 'versionNumber', order: 'desc' }] },
    filters: { mode: 'off' },
  })

  const { studies, activeStudyIndex } = useStudyStore()

  const downloadPdf = async (versionNumber: number) => {
    const surveyData = (
      await axiosInstance.get(`/studies/${studies[activeStudyIndex].id}/surveys/${versionNumber}`)
    ).data as GetSurveyVersionByVersionNumberResponse

    // Generate PDF with the data
    const pdfDoc = (
      <SurveyPdf
        studyName={studies[activeStudyIndex].name}
        steps={surveyData.data.data}
        versionNumber={versionNumber}
      />
    )

    // Create a blob from the PDF document
    const blob = await pdf(pdfDoc).toBlob()

    // Format datetime for appending to filename. Ugly code but avoids adding another dependency
    const now = new Date()
    const formattedDatetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`

    const formattedStudyName = formatStudyName(studies[activeStudyIndex].name)

    // Trigger download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `CTRL-consent-form-${formattedStudyName}_${formattedDatetime}.pdf`
    link.click()
  }

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'versionNumber',
        flex: 1,
        headerName: 'Version',
        minWidth: 200,
        renderCell: ({ row }) => (row.status == 'DRAFT' ? 'Current Draft' : row.versionNumber),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <>
              {row.status == 'DRAFT' ? (
                <EditButton data-cy="edit-button" hideText recordItemId={row.versionNumber} />
              ) : (
                <>
                  <ShowButton
                    title="View survey questions"
                    data-cy="view-button"
                    hideText
                    recordItemId={row.versionNumber}
                  />
                  <IconButton
                    component={Link}
                    to={`/responses/all/${row.versionNumber}`}
                    title="View responses"
                    color="primary"
                    data-cy="response-icon-button"
                  >
                    <ChecklistRtl />
                  </IconButton>
                </>
              )}
              <IconButton
                onClick={() => downloadPdf(row.versionNumber)}
                title="Export to PDF"
                color="primary"
                data-cy="pdf-button"
              >
                <PictureAsPdf />
              </IconButton>
            </>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 140,
      },
    ],
    [activeStudyIndex],
  )

  return (
    <List
      headerButtons={
        <>
          <Button
            variant="contained"
            disabled={dataGridProps.rows.length < 2}
            component={Link}
            to={`/responses/all/${dataGridProps.rows.at(0)?.versionNumber - 1}`}
            data-cy="view-all-responses-button"
          >
            View All Responses
          </Button>

          <Button
            variant="contained"
            component={Link}
            to={`/surveys/edit/${dataGridProps.rows.at(0)?.versionNumber}`}
            data-cy="edit-draft-button"
          >
            Edit current draft
          </Button>
        </>
      }
    >
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  )
}
