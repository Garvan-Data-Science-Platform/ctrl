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




/*
import type {RegisterParticipantRequest} from 'common/types/api/auth'
import {ContactMethod, ParticipantType, StateTerritory} from '../../common/types/api/users/ParticipantProfile'

// currently sets password and participant types to a default
// ISSUE: incorrectly maps contact methods based on enum index right now - needs to be fixed
export function mapToParticipantRequest(
  sourceData: Record<string, string>,
  mapping: Record<string, string | Record<string, string>>
): RegisterParticipantRequest {
  const mappedData: Record<string, any> = {};
  const missingFields: string[] = [];

  for (const targetField in mapping) {
    const sourceField = mapping[targetField];

    if (typeof sourceField === "object" && sourceField !== null) {
      // Handle one-level nested objects
      mappedData[targetField] = Object.keys(sourceField).reduce((objField, subField) => {
        if (sourceField[subField] in sourceData) {
          objField[subField] = sourceData[sourceField[subField]];
        }
        return objField;
      }, {} as Record<string, any>);
    } else if (sourceField in sourceData) {
      mappedData[targetField] =
        targetField === "state"
          ? Object.values(StateTerritory)[Number(sourceData[sourceField])]
          : targetField === "preferredContact"
          ? Object.values(ContactMethod)[Number(sourceData[sourceField])]
          : sourceData[sourceField];
    } else {
      missingFields.push(targetField)
    }
  }

  // Add default fields
  mappedData["password"] = "default_password"; // Replace with actual default or generated password
  mappedData["participantType"] = ParticipantType.STANDARD;

  // throw error if missing fields
  if (missingFields.length > 0) {
    throw new Error(
      `Missing or invalid fields in mapping: ${missingFields.join(", ")}`
    );
  }

  return mappedData as RegisterParticipantRequest;
}*/