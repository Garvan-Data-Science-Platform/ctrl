import type { RegisterParticipantRequest } from "common/types/api/auth";
import { ContactMethod, ParticipantType, StateTerritory } from "../../common/types/api/users/ParticipantProfile";

export function mapToParticipantRequest(
  sourceData: Record<string, string>,
  mapping: Record<string, string>
): RegisterParticipantRequest {
  // Helper function to throw error if a field is missing
  const getField = (field: string, isNextOfKin = false): string => {
    const fieldName = isNextOfKin ? `nextOfKin.${field}` : field;
    if (!sourceData[mapping[field]]) {
      throw new Error(`Missing required field: ${fieldName}`);
    }
    return sourceData[mapping[field]];
  };

  const mappedData: RegisterParticipantRequest = {
    firstName: getField('firstName'),
    lastName: getField('lastName'),
    email: getField('email'),
    mobile: getField('mobile'),
    preferredContact: Object.values(ContactMethod)[Number(getField('preferredContact'))], // this is wrong - indexing error discussed in meeting
    addressLine: getField('addressLine'),
    suburb: getField('suburb'),
    postcode: getField('postcode'),
    state: Object.values(StateTerritory)[Number(getField('state'))],
    password: "temporary_password", // temporary
    dob: getField('dob'),
    participantType: ParticipantType.STANDARD, // temporary
    nextOfKin: {
      firstName: getField('nokFirstName', true),
      lastName: getField('nokLastName', true),  
      email: getField('nokEmail', true)
    }
  };

  // Optionally, check and add 'nextOfKin.mobile' if exists
  if (sourceData[mapping['nokMobile']]) {
    mappedData['nextOfKin']['mobile'] = sourceData[mapping['nokMobile']];
  }

  return mappedData;
}