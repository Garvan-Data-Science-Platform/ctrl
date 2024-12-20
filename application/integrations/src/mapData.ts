import type { RegisterParticipantRequest } from 'common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from '../../common/types/api/users/ParticipantProfile'
import { SurveyElement } from 'common/types/survey'

export function mapToParticipantRequest(
  sourceData: Record<string, string>,
  mapping: Record<string, string>,
): RegisterParticipantRequest {
  // Helper function to throw error if a field is missing
  const getField = (field: string, isNextOfKin = false, isDep = false): string => {
    const fieldName = isNextOfKin ? `nextOfKin.${field}` : isDep ? `dependents.${field}` : field
    if (!sourceData[mapping[field]]) {
      throw new Error(`Missing required field: ${fieldName}`)
    }
    return sourceData[mapping[field]]
  }

  const mappedData: RegisterParticipantRequest = {
    firstName: getField('firstName'),
    lastName: getField('lastName'),
    email: getField('email'),
    mobile: getField('mobile'),
    preferredContact: Object.values(ContactMethod)[Number(getField('preferredContact'))], // potential indexing error
    addressLine: getField('addressLine'),
    suburb: getField('suburb'),
    postcode: getField('postcode'),
    state: Object.values(StateTerritory)[Number(getField('state'))],
    password: 'temporaryPassword123', // temporary
    dob: getField('dob'),
    participantType: ParticipantType.STANDARD, // temporary
    nextOfKin: {
      firstName: getField('nokFirstName', true),
      lastName: getField('nokLastName', true),
      email: getField('nokEmail', true),
    },
    dependents: [], // Initialize as empty array by default
  }

  // Optionally, check and add 'nextOfKin.mobile' if exists
  if (sourceData[mapping['nokMobile']]) {
    mappedData['nextOfKin']['mobile'] = sourceData[mapping['nokMobile']]
  }

  // Populate dependents if all dependent fields are present
  if (sourceData[mapping['depFirstName']] || sourceData[mapping['depLastName']]) {
    mappedData.dependents.push({
      firstName: getField('depFirstName', false, true),
      lastName: getField('depLastName', false, true),
      dob: getField('depDOB', false, true),
      permanent: false, // REDCap example surveys currently don't support permanent dependents so this is always false - can be changed by users post export
    })
  }

  return mappedData
}

// Maps a provided REDCap Instrument csv to a survey
export function mapToSurveyElement(sourceQuestion: Record<string, string>): SurveyElement[] {
  const requiredField = (fieldName: string) => {
    const value = sourceQuestion[fieldName]
    if (!value) throw new Error(`Missing required field: ${fieldName}`)
    return value
  }

  const res: SurveyElement[] = []

  // Extract required fields
  const questionType = requiredField('Field Type')
  const text = requiredField('Field Label')
  const choices = sourceQuestion['Choices, Calculations, OR Slider Labels']

  // if the question has a subheading - incorporate it as a new surveyElement
  if (sourceQuestion['Section Header']) {
    res.push({
      type: 'subheading',
      data: { text: sourceQuestion['Section Header'] },
    })
  }

  // covers radio, dropdown and yesno questions - does not cover freetext('notes' or 'text' question types)
  if (questionType === 'radio' || questionType === 'dropdown') {
    const e = choices.split('|').map((item) => item.split(',')[1].trim())
    res.push({
      type: 'question-choices',
      data: {
        text: text,
        value: e[0],
        choices: e,
      },
    })
  } else if (questionType === 'yesno') {
    res.push({
      type: 'question-checkbox',
      data: {
        text: text,
        value: false,
      },
    })
  }

  return res
}
