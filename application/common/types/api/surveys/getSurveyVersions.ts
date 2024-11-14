import { SurveyVersionStatus } from 'common/types/survey'

interface SurveyVersionBasic {
  id?: number
  versionNumber?: number
  published_date?: string
  status: SurveyVersionStatus
}

export interface GetSurveyVersionsResponse {
  data: SurveyVersionBasic[]
}
