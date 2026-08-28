import { REGEX } from '../types/commonTypes'

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  NAME_INVALID: 'Name contains invalid characters (only letters, spaces, hyphens allowed)',
  EMAIL_INVALID: 'Enter a valid email',
  ADDRESS_INVALID: 'Address contains invalid characters',
  POSTCODE_INVALID: 'Invalid postcode',
  MOBILE_INVALID: 'Mobile number contains invalid characters (no spaces or country code allowed)',
  EXTERNALID_INVALID: 'External ID can only consist of alpha numeric characters and -_=.:',
  URL_INVALID: 'Invalid URL, must include http(s)://...',
  STUDY_NAME_INVALID: 'Study name contains invalid characters',
  STUDY_DESCRIPTION_INVALID: 'Study description contains invalid characters',
}
export const nameRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.NAME,
    message: VALIDATION_MESSAGES.NAME_INVALID,
  },
})

export const emailRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.EMAIL,
    message: VALIDATION_MESSAGES.EMAIL_INVALID,
  },
})

export const addressRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.ADDRESS,
    message: VALIDATION_MESSAGES.ADDRESS_INVALID,
  },
})

// DOB is handled by date picker
// State is handled by drop down

export const postcodeRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.POSTCODE,
    message: VALIDATION_MESSAGES.POSTCODE_INVALID,
  },
})

export const mobileRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.MOBILE,
    message: VALIDATION_MESSAGES.MOBILE_INVALID,
  },
})

// Default is not required
export const externalIdRules = (required = false) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.EXTERNALID,
    message: VALIDATION_MESSAGES.EXTERNALID_INVALID,
  },
})

// Default is not required
export const urlRules = (required = false) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.URL,
    message: VALIDATION_MESSAGES.URL_INVALID,
  },
})

export const studyNameRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.STUDY_NAME,
    message: VALIDATION_MESSAGES.STUDY_NAME_INVALID,
  },
})

export const studyDescriptionRules = (required = true) => ({
  required: required ? VALIDATION_MESSAGES.REQUIRED : false,
  pattern: {
    value: REGEX.STUDY_DESCRIPTION,
    message: VALIDATION_MESSAGES.STUDY_DESCRIPTION_INVALID,
  },
})
