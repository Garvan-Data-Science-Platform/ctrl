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
  firstName: string
  middleName?: string
  lastName: string
  mobile?: string | null
  email: string
}

export interface OnBehalf {
  firstName: string
  lastName: string
  dob: string
  permanent: boolean
}
