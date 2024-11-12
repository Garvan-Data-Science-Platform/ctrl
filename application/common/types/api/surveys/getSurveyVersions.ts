interface SurveyVersionBasic {
  id?: number
  versionNumber?: number
  published_date?: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface GetSurveyVersionsResponse {
  data: SurveyVersionBasic[]
}
