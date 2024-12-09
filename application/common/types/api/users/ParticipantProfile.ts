export enum ContactMethod {
  MOBILE = 'MOBILE',
  EMAIL = 'EMAIL',
  MAIL = 'MAIL',
}

export enum StateTerritory {
  ACT = 'ACT',
  NSW = 'NSW',
  NT = 'NT',
  QLD = 'QLD',
  SA = 'SA',
  TAS = 'TAS',
  VIC = 'VIC',
  WA = 'WA',
}

export enum ParticipantType {
  STANDARD = 'STANDARD',
  GUARDIAN = 'GUARDIAN',
  DEPENDENT_AGE = 'DEPENDENT_AGE',
  DEPENDENT_OTHER = 'DEPENDENT_OTHER',
}

export interface AlternativeContact {
  firstName: string
  middleName?: string
  lastName: string
  mobile?: string
  email: string
}

export interface OnBehalf {
  firstName: string
  lastName: string
  dob: string
  permanent: boolean
}
