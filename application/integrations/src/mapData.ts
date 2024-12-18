import type { RegisterParticipantRequest } from 'common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from '../../common/types/api/users/ParticipantProfile'

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
