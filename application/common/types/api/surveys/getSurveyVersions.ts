import { SurveyVersionStatus } from 'common/types/survey'

interface SurveyVersionBasic {
  id?: number
  versionNumber: number
  publishedAt?: string
  status: SurveyVersionStatus
}

export interface GetSurveyVersionsResponse {
  data: SurveyVersionBasic[]
}
