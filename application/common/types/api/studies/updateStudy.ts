import { Email, RedcapToken, StudyDescription, StudyName, Url } from '../../commonTypes'

export interface UpdateStudyRequest {
  name?: StudyName
  description?: StudyDescription
  redcapToken?: RedcapToken
  redcapURL?: Url
  contactUsEmail?: Email
}
