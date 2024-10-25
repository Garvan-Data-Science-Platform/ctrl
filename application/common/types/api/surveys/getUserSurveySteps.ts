export interface GetSurveyStepsResponse {
  data: {
    title: string
    tooltip: string
    status: 'completed' | 'review_required' | 'viewed' // Viewed means there were no questions, just a video
    last_updated?: string
  }[]
}

export interface GetSurveyStepsRequest {
  study_id?: string
}
