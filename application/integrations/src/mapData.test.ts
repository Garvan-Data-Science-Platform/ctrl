import { mapToParticipantRequest, mapToSurveyElement } from './mapData'
import testMapping from './test_data/testMapping.json'
import {
  sourceData,
  sourceDataNoDOB,
  sourceDataNoNOKMobile,
} from './test_data/MapData/mapToParticipantRequest/exampleSourceData'
import { expectedMappedData } from './test_data/MapData/mapToParticipantRequest/ansMappedData'
import {
  sourceDataRadio,
  sourceDataAndSubheading,
  sourceDataMissingField,
} from './test_data/MapData/mapToSurvey/exampleSourceData'
import {
  expectedRadioMapping,
  expectedSectionHeader,
} from './test_data/MapData/mapToSurvey/ansMappedData'

describe('mapToParticipantRequest', () => {
  // Test case for normal mapping
  it('should map source data to RegisterParticipantRequest', () => {
    const result = mapToParticipantRequest(sourceData, testMapping)
    expect(result).toEqual(expectedMappedData)
  })

  // Test case for missing required fields (should throw error)
  it('should throw an error when a required field is missing', () => {
    expect(() => mapToParticipantRequest(sourceDataNoDOB, testMapping)).toThrow(
      'Missing required field: dob',
    )
  })

  // Test case for missing optional fields (no error thrown)
  it('should not throw an error for missing optional fields', () => {
    const result = mapToParticipantRequest(sourceDataNoNOKMobile, testMapping)
    expect(result.nextOfKin.mobile).toBeUndefined() // No mobile for next of kin, should be undefined
  })
})

describe('mapInstrumentToSurvey', () => {
  it('should map radio and dropdown buttons to a survey element with section header', () => {
    const result = mapToSurveyElement(sourceDataRadio)
    expect(result).toEqual(expectedRadioMapping)
  })

  it('should map the question to a question and a section header', () => {
    const result = mapToSurveyElement(sourceDataAndSubheading)
    expect(result).toEqual(expectedSectionHeader)
  })

  it('should throw an error if missing a crucial field', () => {
    expect(() => {
      mapToSurveyElement(sourceDataMissingField)
    }).toThrow('Missing required field')
  })
})
