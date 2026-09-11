import { VALIDATION_MESSAGES } from '@common/src/validation'
import { GetParticipantProfileResponse } from '@common/types/api/users'
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'
import { REGEX } from '@common/types/commonTypes'
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
    validations: [
      { rule: 'required' },
      { rule: 'unique' },
      {
        rule: 'regex',
        value: REGEX.EMAIL.source,
        errorMessage: VALIDATION_MESSAGES.EMAIL_INVALID,
      },
    ],
  },
  {
    label: 'ID',
    key: 'studyParticipant.externalId',
    alternateMatches: ['id', 'ctrl_study_id'],
    fieldType: { type: 'input' },
    validations: [
      // { rule: 'unique' }, TODO: check if external ID should be unique
      {
        rule: 'regex',
        value: REGEX.EXTERNALID.source,
        errorMessage: VALIDATION_MESSAGES.EXTERNALID_INVALID,
      },
    ],
  },
  {
    label: 'First Name',
    key: 'profile.firstName',
    alternateMatches: ['name', 'first name', 'ctrl_pers_name'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.NAME.source,
        errorMessage: VALIDATION_MESSAGES.NAME_INVALID,
      },
    ],
  },
  {
    label: 'Last Name',
    key: 'profile.lastName',
    alternateMatches: ['surname', 'last name', 'ctrl_pers_surname'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.NAME.source,
        errorMessage: VALIDATION_MESSAGES.NAME_INVALID,
      },
    ],
  },
  {
    label: 'Date of Birth (YYYY-MM-DD or DD/MM/YYYY)',
    key: 'profile.dob',
    alternateMatches: ['dob', 'ctrl_dob'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.DOB.source,
        errorMessage: VALIDATION_MESSAGES.DOB_INVALID,
      },
    ],
  },
  {
    label: 'Mobile Number',
    key: 'profile.mobile',
    alternateMatches: ['mobile', 'ctrl_phone_no'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.MOBILE.source,
        errorMessage: VALIDATION_MESSAGES.MOBILE_INVALID,
      },
    ],
  },
  {
    label: 'Address Line',
    key: 'profile.addressLine',
    alternateMatches: ['address', 'ctrl_address'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.ADDRESS.source,
        errorMessage: VALIDATION_MESSAGES.ADDRESS_INVALID,
      },
    ],
  },
  {
    label: 'Suburb',
    key: 'profile.suburb',
    alternateMatches: ['suburb', 'ctrl_suburb'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.ADDRESS.source,
        errorMessage: VALIDATION_MESSAGES.ADDRESS_INVALID,
      },
    ],
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
    validations: [
      {
        rule: 'regex',
        value: REGEX.POSTCODE.source,
        errorMessage: VALIDATION_MESSAGES.POSTCODE_INVALID,
      },
    ],
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
    validations: [
      {
        rule: 'regex',
        value: REGEX.NAME.source,
        errorMessage: VALIDATION_MESSAGES.NAME_INVALID,
      },
    ],
  },
  {
    label: 'Alt Contact Last Name',
    key: 'profile.nextOfKin.lastName',
    alternateMatches: ['ctrl_kin_surname'],
    fieldType: { type: 'input' },
    validations: [
      {
        rule: 'regex',
        value: REGEX.NAME.source,
        errorMessage: VALIDATION_MESSAGES.NAME_INVALID,
      },
    ],
  },
  {
    label: 'Alt Contact Email',
    key: 'profile.nextOfKin.email',
    fieldType: { type: 'input' },
    alternateMatches: ['ctrl_kin_email'],
    validations: [
      {
        rule: 'regex',
        value: REGEX.EMAIL.source,
        errorMessage: VALIDATION_MESSAGES.EMAIL_INVALID,
      },
    ],
  },
]
