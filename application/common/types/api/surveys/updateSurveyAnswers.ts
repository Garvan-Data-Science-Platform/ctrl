export interface UpdateSurveyAnswersRequest {
  step: number
  data: (string | boolean)[]
}

export interface UpdateSurveyAnswersResponse {
  message: string
}
