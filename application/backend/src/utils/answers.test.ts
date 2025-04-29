import { SurveyVersion } from '@prisma/client'
import { answersFromPreviousSurvey, combineGuardianAnswers, createDefaultAnswers } from './answers'
import { SurveyStep, UserSurveyStepState } from 'common/types/survey'
import ExampleSurveyVersion from 'common/src/surveys/exampleSurveyStepData.json'

describe('Answer functions', () => {
  const prevStep1: SurveyStep = {
    text: '',
    title: '',
    elements: [
      { type: 'subheading', data: { text: 'SUBHEADING' } },
      { type: 'question-checkbox', data: { text: 'CHECKBOX 1' } },
      { type: 'subheading', data: { text: 'SUBHEADING' } },
      { type: 'question-choices', data: { text: 'CHOICES 1', choices: ['choice1', 'choice2'] } },
    ],
  }
  const prevStep2: SurveyStep = {
    text: '',
    title: '',
    elements: [
      { type: 'question-checkbox', data: { text: 'CHECKBOX 2' } },
      {
        type: 'question-choices',
        data: { text: 'CHOICES 2', choices: ['choiceA', 'choiceB', 'choiceC'] },
      },
    ],
  }

  const prevVersion: SurveyVersion = {
    createdAt: new Date(),
    id: 1,
    studyId: 1,
    updatedAt: new Date(),
    status: 'PUBLISHED',
    data: [prevStep1, prevStep2],
  }

  const prevAnswers: PrismaJson.SurveyAnswerData = [
    { status: 'completed', answers: [true, 'choice1'] },
    { status: 'review_required', answers: [null, 'choiceA'] },
  ]

  describe('createEmptyAnswers', () => {
    it('Creates empty answers to match shape of questions', () => {
      const sampleSurveySteps = ExampleSurveyVersion as SurveyStep[]
      const defaultanswers = createDefaultAnswers(sampleSurveySteps)
      const answer1: UserSurveyStepState = { status: 'review_required', answers: [] }
      const answer2: UserSurveyStepState = {
        status: 'review_required',
        answers: [null, null],
      }
      expect(defaultanswers[0]).toStrictEqual(answer1)
      expect(defaultanswers[1]).toStrictEqual(answer2)
    })
  })

  describe('answersFromPreviousSurvey()', () => {
    it('Carries across previous answers, otherwise null', () => {
      const currentVersion = structuredClone(prevVersion)
      currentVersion.data[0].elements.push({
        type: 'question-checkbox',
        data: { text: 'NEW QUESTION' },
      })
      const newAnswers = answersFromPreviousSurvey(prevVersion, currentVersion, prevAnswers)
      expect(newAnswers[0].answers).toEqual([true, 'choice1', null])
      expect(newAnswers[1].answers).toEqual([null, 'choiceA'])
    })

    it('Does not carry across when question text changes', () => {
      const currentVersion = structuredClone(prevVersion)
      currentVersion.data[0].elements[1].data.text = 'CHECKBOX 1A'
      const newAnswers = answersFromPreviousSurvey(prevVersion, currentVersion, prevAnswers)
      expect(newAnswers[0].answers).toEqual([null, 'choice1'])
    })

    it('Does not carry across when choices change', () => {
      const currentVersion = structuredClone(prevVersion)
      currentVersion.data[0].elements[3].data.choices = ['choice1a', 'choice1b']
      const newAnswers = answersFromPreviousSurvey(prevVersion, currentVersion, prevAnswers)
      expect(newAnswers[0].answers).toEqual([true, null])
    })

    it('Carries across answers when order of steps or elements changes', () => {
      const currentVersion = structuredClone(prevVersion)
      const tmp = structuredClone(currentVersion.data[0].elements[1])
      currentVersion.data[0].elements[1] = currentVersion.data[1].elements[1]
      currentVersion.data[1].elements[1] = tmp
      const newAnswers = answersFromPreviousSurvey(prevVersion, currentVersion, prevAnswers)
      expect(newAnswers[0].answers).toEqual(['choiceA', 'choice1'])
      expect(newAnswers[1].answers).toEqual([null, true])
    })
  })
  describe('combineGuardianAnswers()', () => {
    it('Combines answers correctly', () => {
      expect(
        combineGuardianAnswers([
          [null, true, 'blue'],
          [null, false, 'blue'],
        ]),
      ).toEqual([null, null, 'blue'])
      expect(
        combineGuardianAnswers([
          [true, true, true],
          [true, false, null],
        ]),
      ).toEqual([true, null, true])
      expect(combineGuardianAnswers([[false], [false]])).toEqual([false])
      expect(combineGuardianAnswers([['red'], ['blue']])).toEqual([null])
      expect(combineGuardianAnswers([[], []])).toEqual([])
      expect(
        combineGuardianAnswers([
          [null, true, 'blue', 'blue'],
          [null, false, 'blue', null],
          [null, false, 'blue', null],
        ]),
      ).toEqual([null, null, 'blue', 'blue'])
    })
    it('Throws error on mismatch', () => {
      expect(() => combineGuardianAnswers([[true], [true, null]])).toThrow()
    })
  })
})
