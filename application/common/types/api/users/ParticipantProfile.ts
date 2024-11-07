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

export enum RelationshipType {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
  CHILD = 'CHILD',
  OTHER = 'OTHER',
}

export interface AlternativeContact {
  firstName: string
  middleName?: string
  lastName: string
  mobile?: string
  email: string
  relationship: RelationshipType
}

export interface OnBehalf {
  firstName: string
  lastName: string
  dob: string
}
