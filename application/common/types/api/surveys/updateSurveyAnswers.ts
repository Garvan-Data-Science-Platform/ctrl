export interface UpdateSurveyAnswersRequest {
  surveyVersionId: number
  step: number
  data: (string | boolean)[]
}

export interface UpdateSurveyAnswersResponse {
  message: string
}
