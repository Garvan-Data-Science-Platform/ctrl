interface SurveyVersionBasic {
  id?: number
  version_number?: number
  published_date?: string
}

export interface GetSurveyVersionsResponse {
  data: SurveyVersionBasic[]
}
