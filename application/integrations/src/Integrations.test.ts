import { Integrations } from './Integrations'
import testMapping from './test_data/testMapping.json'
import {
  exampleSingleProfile,
  exampleMultipleProfiles,
  exampleQuestionDataNoHeader,
  exampleQuestionDataHeader,
  ansSingleProfile,
  ansMultipleProfilesMapping,
  ansQuestionDataNoHeader,
  ansQuestionDataHeader,
} from './test_data/Integrations'

describe('Integrations', () => {
  const integrationProcessor = new Integrations(testMapping)

  describe('mapCSVToParticipantRequest', () => {
    it('should register one user correctly', () => {
      const res = integrationProcessor.mapRecordToParticipantRequests(exampleSingleProfile)
      expect(res).toEqual(ansSingleProfile)
    })

    it('should register multiple users correctly', () => {
      const res = integrationProcessor.mapRecordToParticipantRequests(exampleMultipleProfiles)
      expect(res).toEqual(ansMultipleProfilesMapping)
    })
  })

  describe('mapInstrumentCSVToSurvey', () => {
    it('should create a mapped list of survey elements from an instrument csv with no header', () => {
      const res = integrationProcessor.mapInstrumentCSVToSurvey(exampleQuestionDataNoHeader, false)
      expect(res).toEqual(ansQuestionDataNoHeader)
    })

    it('should create a mapped list of survey elements from an instrument csv with an initial header', () => {
      const res = integrationProcessor.mapInstrumentCSVToSurvey(exampleQuestionDataHeader, false)
      expect(res).toEqual(ansQuestionDataHeader)
    })
  })
})
