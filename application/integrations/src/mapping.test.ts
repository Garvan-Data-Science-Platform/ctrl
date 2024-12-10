import { mapToParticipantRequest } from './mapData';
import { Integrations } from './Integrations'
import testMapping from './test_data/testMapping.json'
import exampleSingleProfile from './test_data/mapCSVToParticipantRequest/exampleSingleProfile.json'
import exampleMultipleProfiles from './test_data/mapCSVToParticipantRequest/exampleMultipleProfiles.json'
import ansSingleProfile from './test_data/mapCSVToParticipantRequest/ansSingleProfile.json'
import ansMultipleProfilesMapping from './test_data/mapCSVToParticipantRequest/ansMultipleProfilesMapping.json'
import {sourceData, sourceDataNoDOB, sourceDataNoNOKMobile} from './test_data/mapToParticipantRequest/exampleSourceData'
import { expectedMappedData } from './test_data/mapToParticipantRequest/ansMappedData'

describe('mapToParticipantRequest', () => {
  // Test case for normal mapping
  it('should map source data to RegisterParticipantRequest', () => {
    const result = mapToParticipantRequest(sourceData, testMapping);
    expect(result).toEqual(expectedMappedData);
  });

  // Test case for missing required fields (should throw error)
  it('should throw an error when a required field is missing', () => {
    expect(() => mapToParticipantRequest(sourceDataNoDOB, testMapping)).toThrow('Missing required field: dob');
  });

  // Test case for missing optional fields (no error thrown)
  it('should not throw an error for missing optional fields', () => {
    const result = mapToParticipantRequest(sourceDataNoNOKMobile, testMapping);
    expect(result.nextOfKin.mobile).toBeUndefined();  // No mobile for next of kin, should be undefined
  });


  describe('mapCSVToParticipantRequest', () => {
    it('registers one user correctly', () => {
        const integrationProcessor = new Integrations(testMapping)
        const res = integrationProcessor.mapCSVToParticipantRequests(exampleSingleProfile)
        expect(res).toEqual(ansSingleProfile)
    })

    it('registers multiple users correctly', () => {
        const integrationProcessor = new Integrations(testMapping)
        const res = integrationProcessor.mapCSVToParticipantRequests(exampleMultipleProfiles)
        expect(res).toEqual(ansMultipleProfilesMapping)
    })
  });
});