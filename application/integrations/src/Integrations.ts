import { mapToSurveyElement, mapToParticipantRequest } from './mapData'
import { RegisterParticipantRequest } from '../../common/types/api/auth'
import { SurveyElement } from '../../common/types/survey'

export class Integrations {
  mapping: Record<string, string>
  // a series of methods for integrations
  constructor(mapping: Record<string, string>) {
    this.mapping = mapping
  }

  // returns a list of participant request to create users
  mapCSVToParticipantRequests(csv: Record<string, string>[]): RegisterParticipantRequest[] {
    const res: RegisterParticipantRequest[] = []
    for (const userData of csv) {
      res.push(mapToParticipantRequest(userData, this.mapping))
    }

    return res
  }

  // returns a list of survey elements to be created into a survey later
  mapInstrumentCSVToSurvey(csv: Record<string, string>[]): SurveyElement[] {
    return csv.flatMap((surveyQuestion) => mapToSurveyElement(surveyQuestion))
  }
}
