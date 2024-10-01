enum ContactMethod {
  mobile = 'mobile',
  email = 'email',
  mail = 'mail',
}

enum StateTerritory {
  ACT = 'act',
  NSW = 'nsw',
  NT = 'nt',
  QLD = 'qld',
  SA = 'sa',
  TAS = 'tas',
  VIC = 'vic',
  WA = 'wa',
}

interface AlternativeContact {
  firstName: string
  middleName?: string
  lastName: string
  phone: string
  email: string
}

interface OnBehalf {
  firstName: string
  middleName?: string
  lastName: string
  dob: string
}

export interface GetUserProfileResponse {
  firstName: string
  middleName?: string
  lastName: string
  dob: string
  participantID: string
  email: string
  mobile: string
  addressLine?: string
  suburb?: string
  state?: StateTerritory
  postcode?: string
  preferredContact: ContactMethod
  isParentOrGuardian: boolean
  alternativeContact?: AlternativeContact
  onBehalfOf?: OnBehalf
}
