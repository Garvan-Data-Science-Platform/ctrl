import { RedcapImport } from '../../components/RedcapImport'
import { participantUploadCSVDocumentation } from './helpPageRedcap'

export const ParticipantImport = () => {
  return (
    <RedcapImport
      type="participant"
      helpDocumentation={participantUploadCSVDocumentation}
      apiEndpoint="/integrations/redcap/participant/upload/api"
      fileEndpoint="/integrations/redcap/participant/upload/csv"
      warningMessage="This will overwrite any duplicate Participants."
    />
  )
}
