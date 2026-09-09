import { DoB, Email, FirstName, LastName, MiddleName, Mobile } from '../../commonTypes'

export enum ContactMethod {
  EMAIL = 'EMAIL',
  MOBILE = 'MOBILE',
  MAIL = 'MAIL',
} // ordering here is important, must be identical order to REDCap survey for exports to function correctly

export enum StateTerritory {
  ACT = 'ACT',
  NSW = 'NSW',
  NT = 'NT',
  QLD = 'QLD',
  SA = 'SA',
  TAS = 'TAS',
  VIC = 'VIC',
  WA = 'WA',
} // ordering here is important, must be identical order to REDCap survey for exports to function correctly

export enum ParticipantType {
  STANDARD = 'STANDARD',
  GUARDIAN = 'GUARDIAN',
  DEPENDENT_AGE = 'DEPENDENT_AGE',
  DEPENDENT_OTHER = 'DEPENDENT_OTHER',
}

export interface AlternativeContact {
  firstName: FirstName
  middleName?: MiddleName
  lastName: LastName
  mobile?: Mobile | null
  email: Email
}

export interface OnBehalf {
  firstName: FirstName
  lastName: LastName
  dob: DoB
  permanent: boolean
}
