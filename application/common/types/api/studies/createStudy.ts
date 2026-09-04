import { StudyName } from '../../commonTypes'

export interface CreateStudyRequest {
  name: StudyName
}

export interface CreateStudyResponse {
  id: number
}
