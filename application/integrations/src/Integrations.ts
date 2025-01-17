import { mapToSurveyElement, mapToParticipantRequest } from './mapData'
import { RegisterParticipantRequest } from '../../common/types/api/auth'
import { SurveyStep } from '../../common/types/survey'

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
  mapInstrumentCSVToSurvey(csv: Record<string, string>[]): SurveyStep[] {
    const steps: SurveyStep[] = csv.reduce(
      (acc, surveyQuestion) => {
        const [element, sectionHeader] = mapToSurveyElement(surveyQuestion)

        if (sectionHeader) {
          acc.push({
            title: sectionHeader,
            text: '',
            elements: [],
          })
        }

        // Get the current step (the last one in the array)
        const currentStep = acc[acc.length - 1]
        currentStep.elements.push(element)

        return acc
      },
      [
        {
          title: 'Imported Survey',
          text: 'Survey Imported from Redcap Instrument',
          elements: [],
        } as SurveyStep,
      ],
    )
    return steps
  }
}
