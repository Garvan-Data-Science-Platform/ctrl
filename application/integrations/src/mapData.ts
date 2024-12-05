import type {RegisterParticipantRequest} from 'common/types/api/auth'
import {ContactMethod, ParticipantType, StateTerritory} from '../../common/types/api/users/ParticipantProfile'


// currently sets a default password and a default participant type
// deals with objects nested one layer deep only
// ask about labelling with the mapping
// assume stateterritory is a number

export function mapToParticipantRequest(
  sourceData: Record<string, string>,
  mapping: Record<string, any>
): RegisterParticipantRequest {
  const mappedData: Record<string, any> = {};

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
    }
  }

  // Add default fields
  mappedData["password"] = "default_password"; // Replace with actual default or generated password
  mappedData["participantType"] = ParticipantType.STANDARD;

  return mappedData as RegisterParticipantRequest;
}