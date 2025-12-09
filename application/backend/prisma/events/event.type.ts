import { UpdateProfileRequest } from 'common/types/api/users'
import { UserSurveyStepState } from 'common/types/survey'

export const validEventTypes = [
  'answers.updated',
  'family.updated',
  'family.created',
  'profile.updated',
  'user.updated',
]

interface AnswersUpdatedEvent {
  eventType: 'answers.updated'
  payload: {
    payloadVersion: 1
    userId: number
    studyId: number
    step: number
    surveyVersionNumber: number
    previousAnswers: UserSurveyStepState[]
    newAnswers: UserSurveyStepState[]
  }
}

interface FamilyUpdatedEvent {
  eventType: 'family.updated'
  payload: {
    payloadVersion: 1
    familyId: number
    previousMemberProfileIds: number[]
    newMemberProfileIds: number[]
  }
}

interface FamilyCreatedEvent {
  eventType: 'family.created'
  payload: {
    payloadVersion: 1
    familyId: number
    newMemberProfileIds: number[]
  }
}

interface ProfileUpdateEvent {
  eventType: 'profile.updated'
  payload: {
    payloadVersion: 1
    profileId: number
    fields: Partial<UpdateProfileRequest>
  }
}

interface UserUpdateEvent {
  eventType: 'user.updated'
  payload: {
    payloadVersion: 1
    userId: number
    fields: Partial<UpdateProfileRequest>
  }
}

interface AddProfileToStudyEvent {
  eventType: 'study.participant.added'
  payload: {
    payloadVersion: 1
    profileId: number
    studyId: number
  }
}

interface RemoveProfileFromStudyEvent {
  eventType: 'study.participant.removed'
  payload: {
    payloadVersion: 1
    profileId: number
    studyId: number
  }
}

export type CtrlEvent =
  | AnswersUpdatedEvent
  | FamilyUpdatedEvent
  | FamilyCreatedEvent
  | ProfileUpdateEvent
  | UserUpdateEvent
  | AddProfileToStudyEvent
  | RemoveProfileFromStudyEvent
