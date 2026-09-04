import {
  RedcapToken,
  StudyDescription,
  StudyName,
  OptionalUrl,
  OptionalEmail,
} from '../../commonTypes'

export interface UpdateStudyRequest {
  name?: StudyName
  description?: StudyDescription
  redcapToken?: RedcapToken
  redcapURL?: OptionalUrl
  contactUsEmail?: OptionalEmail
}
