import { Integrations } from './Integrations'
import testMapping from './test_data/testMapping.json'
import {
  exampleSingleProfile,
  exampleMultipleProfiles,
  exampleQuestionData,
  ansSingleProfile,
  ansMultipleProfilesMapping,
  ansQuestionData,
} from './test_data/Integrations'

describe('Integrations', () => {
  const integrationProcessor = new Integrations(testMapping)

  describe('mapCSVToParticipantRequest', () => {
    it('should register one user correctly', () => {
      const res = integrationProcessor.mapCSVToParticipantRequests(exampleSingleProfile)
      expect(res).toEqual(ansSingleProfile)
    })

    it('should register multiple users correctly', () => {
      const res = integrationProcessor.mapCSVToParticipantRequests(exampleMultipleProfiles)
      expect(res).toEqual(ansMultipleProfilesMapping)
    })
  })

  describe('mapInstrumentCSVToSurvey', () => {
    it('should create a mapped list of survey elements from an instrument csv', () => {
      const res = integrationProcessor.mapInstrumentCSVToSurvey(exampleQuestionData)
      expect(res).toEqual(ansQuestionData)
    })
  })
})
