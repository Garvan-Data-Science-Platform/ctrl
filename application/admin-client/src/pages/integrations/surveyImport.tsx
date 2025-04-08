import { RedcapImport } from '../../components/RedcapImport'
import { instrumentUploadCSVDocumentation } from './helpPageRedcap'

export const SurveyImport = () => {
  return (
    <RedcapImport
      type="survey"
      helpDocumentation={instrumentUploadCSVDocumentation}
      apiEndpoint="/integrations/redcap/instrument/upload/api"
      fileEndpoint="/integrations/redcap/instrument/upload/csv"
      successRedirect="/surveys/edit/:surveyId"
      warningMessage="This action will overwrite the current draft survey."
    />
  )
}
