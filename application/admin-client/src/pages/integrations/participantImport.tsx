import { useInvalidate, useNotification } from '@refinedev/core'
import { RedcapImport } from '../../components/RedcapImport'
import { axiosInstance } from '../../providers/dataProvider'
import { participantUploadCSVDocumentation } from './helpPageRedcap'
import { useNavigate } from 'react-router-dom'

export const ParticipantImport = () => {
  const fileEndpoint = '/integrations/redcap/participant/upload/csv'
  const apiEndpoint = '/integrations/redcap/participant/upload/api'
  const successRedirect = '/participants/'

  const navigate = useNavigate()
  const { open } = useNotification()
  const invalidate = useInvalidate()

  const onSubmitFile = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post(fileEndpoint, formData, {
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
        navigate(successRedirect, {
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

  const onSubmitApi = (formName: string, redcapAPIToken: string) => {
    axiosInstance
      .post(apiEndpoint, {
        formName,
        redcapAPIToken,
      })
      .then(async (response) => {
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
        navigate(successRedirect, {
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
      warningMessage="This will overwrite any duplicate participants."
      confirmDialog={false}
    />
  )
}
