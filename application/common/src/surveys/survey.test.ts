import { SurveyStep } from 'types/survey'
import { extractSurveyStepAnswers } from './extractSurveyStepAnswers'
import { populateSurveyStepAnswers } from './populateSurveyStepAnswers'
import { validateAnswers } from './validateSurveyAnswers'
import ExampleSurveyVersion from './exampleSurveyStepData.json'

describe('Survey utility tests', () => {
  const sampleSurveySteps = ExampleSurveyVersion as SurveyStep[]

  describe('extractSurveyStepAnswers', () => {
    it('Extracts answers correctly', () => {
      const answers1 = extractSurveyStepAnswers(sampleSurveySteps[0].elements)
      const answers2 = extractSurveyStepAnswers(sampleSurveySteps[1].elements)
      expect(answers1).toEqual([])
      expect(answers2).toEqual([true, 'Choice 1'])
    })
  })

  describe('populateSurveyStepAnswers', () => {
    it('Populates answers correctly', () => {
      const answers1 = populateSurveyStepAnswers(sampleSurveySteps[0], [])
      const answers2 = populateSurveyStepAnswers(sampleSurveySteps[1], [false, 'Choice 1'])
      expect(answers1).toStrictEqual(sampleSurveySteps[0])
      expect(answers2.elements[0].data.value).toBe(false)
      expect(answers2.elements[2].data.value).toBe('Choice 1')
    })
  })

  describe('validateSurveyAnswers', () => {
    it('Returns true for valid answers', () => {
      expect(validateAnswers(sampleSurveySteps[0], [])).toBe(true)
      expect(validateAnswers(sampleSurveySteps[1], [true, 'Choice 1'])).toBe(true)
    })
    it('Returns false for invalid answers', () => {
      expect(validateAnswers(sampleSurveySteps[0], [true])).toBe(false)
      expect(validateAnswers(sampleSurveySteps[1], ['true', 'Choice 1'])).toBe(false)
      expect(validateAnswers(sampleSurveySteps[1], ['Choice 1'])).toBe(false)
      expect(validateAnswers(sampleSurveySteps[1], [true, 'Choice 1', false])).toBe(false)
      expect(validateAnswers(sampleSurveySteps[1], [])).toBe(false)
      expect(validateAnswers(sampleSurveySteps[1], [true, 'Choice 3'])).toBe(false)
    })
  })
})
