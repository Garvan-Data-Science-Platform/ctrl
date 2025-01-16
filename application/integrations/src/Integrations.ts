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
    const steps: SurveyStep[] = []
    let currentStep: SurveyStep = {
      title: 'Imported Survey',
      text: 'Survey Imported from Redcap Instrument',
      elements: [],
    }

    csv.forEach((surveyQuestion) => {
      const [element, sectionHeader] = mapToSurveyElement(surveyQuestion)

      // Handle the section header
      if (sectionHeader) {
        if (currentStep.elements.length > 0) {
          steps.push(currentStep)
        }

        currentStep = {
          title: sectionHeader,
          text: '',
          elements: [],
        }
      }

      currentStep.elements.push(element)
    })

    // Add the last step if it contains any elements
    if (currentStep.elements.length > 0) {
      steps.push(currentStep)
    }

    return steps
  }
}
