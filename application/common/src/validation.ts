import { REGEX } from '../types/commonTypes'

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  NAME_INVALID: 'Name contains invalid characters (only letters, spaces, hyphens allowed)',
  EMAIL_INVALID: 'Enter a valid email',
  ADDRESS_INVALID: 'Address contains invalid characters',
  POSTCODE_INVALID: 'Invalid postcode',
  MOBILE_INVALID: 'Mobile number contains invalid characters (no spaces or country code allowed)',
  EXTERNALID_INVALID: 'External ID can only consist of alpha numeric characters and -_=.:',
  URL_REQUIRED_INVALID: 'URL is empty or contains invalid characters (must include "http(s)://")',
  URL_OPTIONAL_INVALID: 'Invalid URL, must include http(s)://...',
  STUDY_NAME_INVALID: 'Study name contains invalid characters',
  STUDY_DESCRIPTION_INVALID: 'Study description contains invalid characters',
  REDCAP_TOKEN_INVALID: 'REDCap token contains invalid characters or is incorrect length',
  REDCAP_FORM_INVALID: 'REDCap form contains invalid characters',
  INVITE_EMAIL_SUBJECT_INVALID: 'Invite email subject contains invalid characters',
  INVITE_EMAIL_TEXT_INVALID: 'Invite email text contains invalid characters',
  CSS_COLOUR_INVALID:
    'Use HEX ("#a1b2c3"), RGB ("rgb(10,20,30)"), or a valid CSS colour name ("blue")',
  STEP_TITLE_INVALID: 'Step title contains invalid characters or is empty',
  STEP_DESCRIPTION_INVALID: 'Step description contains invalid characters',
  SURVEY_ELEMENT_INVALID: 'Contains invalid characters',
  SURVEY_ELEMENT_OPTIONAL_INVALID: 'Contains invalid characters',
  SURVEY_STEP_CONTAINS_INVALID_ELEMENT: 'This step contains invalid or empty fields',
  DOB_INVALID: 'Must be a valid date and format (YYYY-MM-DD or DD/MM/YYYY)',
}
export const NAME_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.NAME,
    message: VALIDATION_MESSAGES.NAME_INVALID,
  },
}

export const EMAIL_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.EMAIL,
    message: VALIDATION_MESSAGES.EMAIL_INVALID,
  },
}

export const ADDRESS_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.ADDRESS,
    message: VALIDATION_MESSAGES.ADDRESS_INVALID,
  },
}

// DOB is handled by date picker
// State is handled by drop down

export const POSTCODE_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.POSTCODE,
    message: VALIDATION_MESSAGES.POSTCODE_INVALID,
  },
}

export const MOBILE_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.MOBILE,
    message: VALIDATION_MESSAGES.MOBILE_INVALID,
  },
}

// Note: no `required` as this is optional
export const EXTERNALID_RULE = {
  pattern: {
    value: REGEX.EXTERNALID,
    message: VALIDATION_MESSAGES.EXTERNALID_INVALID,
  },
}

// For example: cannot have a video URL survey element with empty URL
export const URL_REQUIRED_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.URL,
    message: VALIDATION_MESSAGES.URL_REQUIRED_INVALID,
  },
}

// Note: no `required` as this is optional
// e.g. a study can have an empty REDCap URL field
export const URL_OPTIONAL_RULE = {
  pattern: {
    value: REGEX.URL,
    message: VALIDATION_MESSAGES.URL_OPTIONAL_INVALID,
  },
}

export const STUDY_NAME_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.STUDY_NAME,
    message: VALIDATION_MESSAGES.STUDY_NAME_INVALID,
  },
}

export const STUDY_DESCRIPTION_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.STUDY_DESCRIPTION,
    message: VALIDATION_MESSAGES.STUDY_DESCRIPTION_INVALID,
  },
}

export const REDCAP_TOKEN_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.REDCAP_TOKEN,
    message: VALIDATION_MESSAGES.REDCAP_TOKEN_INVALID,
  },
}

export const REDCAP_FORM_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.REDCAP_FORM,
    message: VALIDATION_MESSAGES.REDCAP_FORM_INVALID,
  },
}

export const INVITE_EMAIL_SUBJECT_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.INVITE_EMAIL,
    message: VALIDATION_MESSAGES.INVITE_EMAIL_SUBJECT_INVALID,
  },
}

export const INVITE_EMAIL_TEXT_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.INVITE_EMAIL,
    message: VALIDATION_MESSAGES.INVITE_EMAIL_TEXT_INVALID,
  },
}

// default not required
export const CSS_COLOUR_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.CSS_COLOUR,
    message: VALIDATION_MESSAGES.CSS_COLOUR_INVALID,
  },
}

export const STEP_TITLE_RULE = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.SURVEY_ELEMENT_REQUIRED,
    message: VALIDATION_MESSAGES.STEP_TITLE_INVALID,
  },
}

export const stepDescriptionRules = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.SURVEY_ELEMENT_REQUIRED,
    message: VALIDATION_MESSAGES.STEP_DESCRIPTION_INVALID,
  },
}

export const surveyElementRequiredRules = {
  required: VALIDATION_MESSAGES.REQUIRED,
  pattern: {
    value: REGEX.SURVEY_ELEMENT_REQUIRED,
    message: VALIDATION_MESSAGES.SURVEY_ELEMENT_INVALID,
  },
}

export const surveyElementOptionalRules = {
  pattern: {
    value: REGEX.SURVEY_ELEMENT_OPTIONAL,
    message: VALIDATION_MESSAGES.SURVEY_ELEMENT_OPTIONAL_INVALID,
  },
}
