import { REGEX } from '../types/commonTypes'

export const nameRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.NAME,
    message: 'Name contains invalid characters (only letters, spaces, hyphens allowed)',
  },
})

export const emailRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.EMAIL,
    message: 'Enter a valid email',
  },
})

export const addressRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.ADDRESS,
    message: 'Address contains invalid characters',
  },
})

// DOB is handled by date picker
// State is handled by drop down

export const postcodeRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.POSTCODE,
    message: 'Invalid postcode',
  },
})

export const mobileRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.MOBILE,
    message: 'Mobile number contains invalid characters (no spaces or country code allowed)',
  },
})

// Default is not required
export const externalIdRules = (required = false) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.EXTERNALID,
    message: 'External ID can only consist of alpha numeric characters and -_=.:',
  },
})
