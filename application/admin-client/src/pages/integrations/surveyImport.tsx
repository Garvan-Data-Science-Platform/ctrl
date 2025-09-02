import { useNavigate } from 'react-router-dom'
import { RedcapImport } from '../../components/RedcapImport'
import { axiosInstance } from '../../providers/dataProvider'
import { instrumentUploadCSVDocumentation } from './helpPageRedcap'
import { useInvalidate, useNotification } from '@refinedev/core'
import { useCurrentStudyId } from '../../studyStore'

export const SurveyImport = () => {
  const studyId = useCurrentStudyId()
  const apiEndpoint = `studies/${studyId}/integrations/redcap/instrument/upload/api`
  const fileEndpoint = `studies/${studyId}/integrations/redcap/instrument/upload/csv`
  const successRedirect = '/surveys/edit/:versionNumber'

  const navigate = useNavigate()
  const { open } = useNotification()
  const invalidate = useInvalidate()

  const handleFileSubmit = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post(fileEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(successRedirect.replace(':versionNumber', response.data.versionNumber))
      })
      .catch((err) => {
        console.error(err)
        open?.({ type: 'error', message: 'Error uploading file' })
      })
  }

  const handleApiSubmit = (formName?: string) => {
    axiosInstance
      .post(apiEndpoint, {
        formName,
      })
      .then((response) => {
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(successRedirect.replace(':versionNumber', response.data.versionNumber))
      })
      .catch((response) => {
        open?.({
          type: 'error',
          message: `Internal Server Error: ${response.response.data.message}`,
        })
      })
  }

  return (
    <RedcapImport
      type="survey"
      helpDocumentation={instrumentUploadCSVDocumentation}
      onSubmitFile={handleFileSubmit}
      onSubmitApi={handleApiSubmit}
      warningMessage="This action will overwrite the current draft survey."
    />
  )
}
