import { useInvalidate, useNotification } from '@refinedev/core'
import { RedcapImport } from '../../components/RedcapImport'
import { axiosInstance } from '../../providers/dataProvider'
import { participantUploadCSVDocumentation } from './helpPageRedcap'
import { useNavigate } from 'react-router-dom'
import { useCurrentStudyId } from '../../studyStore'

export const ParticipantImport = () => {
  const studyId = useCurrentStudyId()
  const FILE_ENDPOINT = `studies/${studyId}/integrations/redcap/participant/upload/csv`
  const API_ENDPOINT = `studies/${studyId}/integrations/redcap/participant/upload/api`
  const SUCCESS_REDIRECT = '/participants/'

  const navigate = useNavigate()
  const { open } = useNotification()
  const invalidate = useInvalidate()

  const onSubmitFile = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post(FILE_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(async (response) => {
        const data = response.data
        if (data.error) {
          open?.({ type: 'error', message: data.error })
          return
        }
        invalidate({ resource: 'participants', invalidates: ['resourceAll'] })
        open?.({
          type: 'success',
          message: 'File uploaded successfully',
        })
        navigate(SUCCESS_REDIRECT, {
          state: {
            openInviteModal: true,
            initialEmails: await getInitialEmails(file),
          },
        })
      })
      .catch((response) => {
        console.error(response)
        open?.({
          type: 'error',
          message: `Internal Server Error: ${response.response.data.message}`,
        })
        return
      })
  }

  const onSubmitApi = (formName: string) => {
    axiosInstance
      .post(API_ENDPOINT, {
        formName,
      })
      .then((response) => {
        const data = response.data
        if (data.error) {
          open?.({ type: 'error', message: data.error })
          return
        }

        open?.({
          type: 'success',
          message: 'Data pulled from REDCap successfully',
        })
        invalidate({ resource: 'participants', invalidates: ['resourceAll'] })
        navigate(SUCCESS_REDIRECT, {
          state: {
            openInviteModal: true,
            initialEmails: ['initial@email.com'], // TODO
          },
        })
      })
      .catch((response) => {
        open?.({
          type: 'error',
          message: `Internal Server Error: ${response.response.data.message}`,
        })
      })
  }

  const getInitialEmails = async (file: File): Promise<string[]> => {
    const content = await file.text()
    const rows = content.split('\n').slice(1) // Skip header row
    const uniqueEmails = new Set<string>()

    rows.forEach((row: string) => {
      const columns = row.split(',')
      const participantEmail = columns[5] // ctrl_email index

      if (participantEmail && participantEmail !== 'ctrl_email') {
        uniqueEmails.add(participantEmail)
      }
    })

    return Array.from(uniqueEmails)
  }

  return (
    <RedcapImport
      type="participant"
      helpDocumentation={participantUploadCSVDocumentation}
      onSubmitFile={onSubmitFile}
      onSubmitApi={onSubmitApi}
      confirmDialog={false}
    />
  )
}
