import { REGEX } from 'types/commonTypes'

export const nameRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.NAME,
    message: 'Contains invalid characters (only letters, spaces, hyphens allowed)',
  },
})

export const addressRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.ADDRESS,
    message: 'Contains invalid characters',
  },
})

export const mobileRules = (required = true) => ({
  required: required ? 'This field is required' : false,
  pattern: {
    value: REGEX.MOBILE,
    message: 'Contains invalid characters',
  },
})
