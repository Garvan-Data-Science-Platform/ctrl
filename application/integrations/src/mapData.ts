import type { ProfilePrefill } from 'common/types/invite'
import { ContactMethod, StateTerritory } from '../../common/types/api/users/ParticipantProfile'
import { SurveyElement } from 'common/types/survey'

export function mapToParticipantRequest(
  sourceData: Record<string, string>,
  mapping: Record<string, string>,
): ProfilePrefill {
  // Helper function to throw error if a field is missing
  const getField = (field: string, isNextOfKin = false, isDep = false): string => {
    const fieldName = isNextOfKin ? `nextOfKin.${field}` : isDep ? `dependents.${field}` : field
    if (!sourceData[mapping[field]]) {
      throw new Error(`Missing required field: ${fieldName}`)
    }
    return sourceData[mapping[field]]
  }

  // build nextOfKin object first
  const nextOfKin: ProfilePrefill['nextOfKin'] = {
    firstName: getField('nokFirstName', true),
    lastName: getField('nokLastName', true),
    email: getField('nokEmail', true),
  }

  // Optionally, check and add 'nextOfKin.mobile' if exists
  if (nextOfKin && sourceData[mapping['nokMobile']]) {
    nextOfKin.mobile = sourceData[mapping['nokMobile']]
  }

  // Do not populate dependents (as this isn't part of prefill currently)
  const mappedData: ProfilePrefill = {
    firstName: getField('firstName'),
    lastName: getField('lastName'),
    email: getField('email'),
    mobile: getField('mobile'),
    preferredContact: Object.values(ContactMethod)[Number(getField('preferredContact'))], // potential indexing error
    addressLine: getField('addressLine'),
    suburb: getField('suburb'),
    postcode: getField('postcode'),
    state: Object.values(StateTerritory)[Number(getField('state'))],
    dob: transformDate(getField('dob')),
    nextOfKin,
  }

  return mappedData
}

// Maps a provided REDCap Instrument csv or API response to a survey
export function mapToSurveyElement(
  sourceQuestion: Record<string, string>,
  rawFields: boolean,
): [SurveyElement, string | null] {
  const requiredField = (fieldName: string) => {
    const value = sourceQuestion[fieldName]
    if (!value || value === '') throw new Error(`Missing required field: ${fieldName}`)
    return value
  }

  // The csv downloaded from the Redcap website vs the api uses different variable names in the csv and there is no way to change them...
  // so we switch the field mappings based on where the sourceQuestions are donwloaded from
  let fieldMappings
  if (rawFields) {
    fieldMappings = {
      questionType: 'field_type',
      text: 'field_label',
      choices: 'select_choices_or_calculations',
      sectionHeader: 'section_header',
    }
  } else {
    fieldMappings = {
      questionType: 'Field Type',
      text: 'Field Label',
      choices: 'Choices, Calculations, OR Slider Labels',
      sectionHeader: 'Section Header',
    }
  }

  // Extract required fields
  const questionType = requiredField(fieldMappings.questionType)
  const text = requiredField(fieldMappings.text)

  // if there is a section header, get it and return it - will be turned into a step
  const sectionHeader = sourceQuestion[fieldMappings.sectionHeader] || null

  // Covers radio, dropdown and yesno questions - does not cover freetext ('notes' or 'text' question types)
  let element: SurveyElement
  if (questionType === 'radio' || questionType === 'dropdown') {
    const choices = sourceQuestion[fieldMappings.choices]
    const values = choices.split('|').map((item) => item.split(',')[1].trim())
    element = {
      type: 'question-choices',
      data: {
        text: text,
        value: values[0],
        choices: values,
      },
    }
  } else if (questionType === 'yesno') {
    element = {
      type: 'question-checkbox',
      data: {
        text: text,
        value: false,
      },
    }
  } else if (questionType === 'text' || questionType === 'notes') {
    element = {
      type: 'subheading',
      data: {
        text: 'Question is a text or notes field - not currently supported by CTRL',
      },
    }
  } else {
    element = {
      type: 'subheading',
      data: {
        text: 'Unrecognized question type',
      },
    }
  }

  return [element, sectionHeader]
}

export function transformDate(dateStr: string): string {
  try {
    const parts = dateStr.split(/[-/]/)

    if (parts.length !== 3) {
      throw new Error(
        `Invalid date format: ${dateStr}. Expected DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD`,
      )
    }

    const isYearFirst = parts[0].length === 4
    const [first, second, third] = parts

    // Determine date parts based on format
    const dateComponents = isYearFirst
      ? { year: first, month: second, day: third }
      : { day: first, month: second, year: third }

    // Validate the parts
    const month = parseInt(dateComponents.month, 10)
    const day = parseInt(dateComponents.day, 10)
    const year = parseInt(dateComponents.year, 10)

    if (
      isNaN(month) ||
      isNaN(day) ||
      isNaN(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > 2100
    ) {
      throw new Error(`Invalid date values in: ${dateStr}`)
    }

    // Pad with leading zeros if necessary
    const formattedMonth = month.toString().padStart(2, '0')
    const formattedDay = day.toString().padStart(2, '0')

    // return `${formattedMonth}/${formattedDay}/${year}`
    return `${year}-${formattedMonth}-${formattedDay}`
  } catch {
    throw new Error(`Failed to transform date "${dateStr}"`)
  }
}
