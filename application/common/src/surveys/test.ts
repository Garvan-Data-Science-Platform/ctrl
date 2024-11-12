import { SurveyStep, UserSurveyStepState } from 'types/survey'
import { createEmptyAnswers } from './createEmptyAnswers'
import { extractSurveyStepAnswers } from './extractSurveyStepAnswers'
import { populateSurveyStepAnswers } from './populateSurveyStepAnswers'
import { validateAnswers } from './validateSurveyAnswers'
import ExampleSurveyVersion from './exampleSurveyStepData.json'

describe('Survey utility tests', () => {
  const sampleSurveySteps = ExampleSurveyVersion as SurveyStep[]

  describe('createEmptyAnswers', () => {
    it('Creates empty answers to match shape of questions', () => {
      let emptyanswers = createEmptyAnswers(sampleSurveySteps)
      let answer1: UserSurveyStepState = { status: 'review_required', answers: [] }
      let answer2: UserSurveyStepState = {
        status: 'review_required',
        answers: [undefined, undefined],
      }
      expect(emptyanswers[0]).toStrictEqual(answer1)
      expect(emptyanswers[1]).toStrictEqual(answer2)
    })
  })

  describe('extractSurveyStepAnswers', () => {
    it('Extracts answers correctly', () => {
      let answers1 = extractSurveyStepAnswers(sampleSurveySteps[0].elements)
      let answers2 = extractSurveyStepAnswers(sampleSurveySteps[1].elements)
      expect(answers1).toEqual([])
      expect(answers2).toEqual([true, 'Choice 2'])
    })
  })

  describe('populateSurveyStepAnswers', () => {
    it('Populates answers correctly', () => {
      let answers1 = populateSurveyStepAnswers(sampleSurveySteps[0], [])
      let answers2 = populateSurveyStepAnswers(sampleSurveySteps[1], [false, 'Choice 1'])
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
