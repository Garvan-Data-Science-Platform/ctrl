import { GetParticipantProfileResponse } from '@common/types/api/users'
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'
import type { Fields } from 'react-spreadsheet-import/types/types'

type PrefillKey =
  | `profile.${keyof GetParticipantProfileResponse['data']}`
  | 'studyParticipant.externalId'
  | 'profile.nextOfKin.firstName'
  | 'profile.nextOfKin.lastName'
  | 'profile.nextOfKin.email'

export const importFields: Fields<PrefillKey> = [
  {
    label: 'Email',
    key: 'profile.email',
    fieldType: { type: 'input' },
    alternateMatches: ['email', 'ctrl_email'],
    validations: [{ rule: 'required' }, { rule: 'unique' }],
  },
  {
    label: 'ID',
    key: 'studyParticipant.externalId',
    alternateMatches: ['id', 'ctrl_study_id'],
    fieldType: { type: 'input' },
  },
  {
    label: 'First Name',
    key: 'profile.firstName',
    alternateMatches: ['name', 'first name', 'ctrl_pers_name'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Last Name',
    key: 'profile.lastName',
    alternateMatches: ['surname', 'last name', 'ctrl_pers_surname'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Date of Birth (d/m/y)',
    key: 'profile.dob',
    alternateMatches: ['dob', 'ctrl_dob'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: '^(0?[1-9]|[12][0-9]|3[01])/(0?[1-9]|1[0-2])/\\d{4}$',
        errorMessage: 'Must be format d/m/yyyy',
      },
    ],
  },
  {
    label: 'Mobile Number',
    key: 'profile.mobile',
    alternateMatches: ['mobile', 'ctrl_phone_no'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Address Line',
    key: 'profile.addressLine',
    alternateMatches: ['address', 'ctrl_address'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Suburb',
    key: 'profile.suburb',
    alternateMatches: ['suburb', 'ctrl_suburb'],
    fieldType: { type: 'input' },
  },
  {
    label: 'State',
    key: 'profile.state',
    alternateMatches: ['state', 'ctrl_state'],
    fieldType: {
      type: 'select',
      options: [
        { label: StateTerritory.ACT, value: StateTerritory.ACT },
        { label: StateTerritory.VIC, value: StateTerritory.VIC },
        { label: StateTerritory.NSW, value: StateTerritory.NSW },
        { label: StateTerritory.QLD, value: StateTerritory.QLD },
        { label: StateTerritory.TAS, value: StateTerritory.TAS },
        { label: StateTerritory.SA, value: StateTerritory.SA },
        { label: StateTerritory.WA, value: StateTerritory.WA },
        { label: StateTerritory.NT, value: StateTerritory.NT },
      ],
    },
  },
  {
    label: 'Postcode',
    key: 'profile.postcode',
    alternateMatches: ['postcode', 'ctrl_postcode'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Preferred Contact Method',
    key: 'profile.preferredContact',
    alternateMatches: ['ctrl_pref_contact_meth'],
    fieldType: {
      type: 'select',
      options: [
        { label: ContactMethod.EMAIL, value: ContactMethod.EMAIL },
        { label: ContactMethod.MAIL, value: ContactMethod.MAIL },
        { label: ContactMethod.MOBILE, value: ContactMethod.MOBILE },
      ],
    },
  },
  {
    label: 'Alt Contact First Name',
    key: 'profile.nextOfKin.firstName',
    alternateMatches: ['ctrl_kin_name'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Alt Contact Last Name',
    key: 'profile.nextOfKin.lastName',
    alternateMatches: ['ctrl_kin_surname'],
    fieldType: { type: 'input' },
  },
  {
    label: 'Alt Contact Email',
    key: 'profile.nextOfKin.email',
    fieldType: { type: 'input' },
    alternateMatches: ['ctrl_kin_email'],
  },
]
