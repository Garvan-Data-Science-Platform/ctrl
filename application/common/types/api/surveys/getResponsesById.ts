import { SurveyStep } from '../../survey'
export interface GetResponsesByIdResponse {
  data: { steps: SurveyStep[]; derived_from?: string }
}
