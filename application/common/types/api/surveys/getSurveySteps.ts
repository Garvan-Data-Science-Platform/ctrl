export interface GetSurveyStepsResponse {
  steps: {
    title: string
    tooltip: string
    status: 'reviewed' | 'review_required'
    last_updated?: string
  }[]
}

export interface GetSurveyStepsRequest {
  study_id?: string
}
