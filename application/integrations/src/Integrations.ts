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
    const elements = csv.flatMap((surveyQuestion) => mapToSurveyElement(surveyQuestion))

    // take the list of survey elements - convert it into a series of survey steps seperated on subheadings
    const steps: SurveyStep[] = []
    let currentStep: SurveyStep = {
      title: 'Imported Survey',
      text: 'Survey Imported from Redcap Instrument',
      elements: [],
    }
    elements.forEach((element) => {
      if (element.type === 'subheading' && element.data.text != 'Unrecognized question type') {
        steps.push(currentStep)

        currentStep = {
          title: element.data.text,
          text: '',
          elements: [],
        }
      } else {
        currentStep.elements.push(element)
      }
    })

    if (currentStep.elements.length > 0) {
      steps.push(currentStep)
    }

    return steps
  }
}
