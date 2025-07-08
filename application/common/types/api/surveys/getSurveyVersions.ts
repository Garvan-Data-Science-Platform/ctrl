import { SurveyVersionStatus } from 'common/types/survey'

interface SurveyVersionBasic {
  id?: number
  versionNumber: number
  publishedAt?: string
  updatedAt: string
  createdAt: string
  status: SurveyVersionStatus
}

export interface GetSurveyVersionsResponse {
  data: SurveyVersionBasic[]
}
