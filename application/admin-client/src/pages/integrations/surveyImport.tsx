import { useNavigate } from 'react-router-dom'
import { RedcapImport } from '../../components/RedcapImport'
import { axiosInstance } from '../../providers/dataProvider'
import { instrumentUploadCSVDocumentation } from './helpPageRedcap'
import { useInvalidate, useNotification } from '@refinedev/core'

export const SurveyImport = () => {
  const apiEndpoint = '/integrations/redcap/instrument/upload/api'
  const fileEndpoint = '/integrations/redcap/instrument/upload/csv'
  const successRedirect = '/surveys/edit/:surveyId'

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
        console.log(response)
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(successRedirect.replace(':surveyId', response.data.id))
      })
      .catch((err) => {
        console.error(err)
        open?.({ type: 'error', message: 'Error uploading file' })
      })
  }

  const handleApiSubmit = (formName: string) => {
    axiosInstance
      .post(apiEndpoint, {
        formName,
      })
      .then((response) => {
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(successRedirect.replace(':surveyId', response.data.id))
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
