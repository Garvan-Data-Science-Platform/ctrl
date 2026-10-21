// Common base types to be defined once here and used in many other places in `api/`
//
// Note: see docs for explanation of character class patterns (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)
import { Role, User } from '@prisma/client'

// @common/types/commonTypes.ts

// Specifying REGEX here, so that they can be defined in the same file as Type definitions with `@patterns`
// (even though its not completely DRY within the file as regex are defined here and in TSOA annotations)
// Explicit Unicode ranges - safe for TSOA and frontend without the 'u' flag
const SafeText =
  /^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$/

export const REGEX = {
  NAME: /^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F\s\-'’.]+$/,
  ADDRESS: SafeText,
  MOBILE: /^04\d{8}$/,
  POSTCODE: /^\d{4}$/,
  // Source for email regex: https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email) modified to remove unnecessary escape characters
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  EXTERNALID: /^[a-zA-Z0-9\-_=.:]*$/,
  // Source for URL regex: https://regex-snippets.com/url-and-path modified to remove unnecessary escape characters
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
  STUDY_NAME: SafeText,
  STUDY_DESCRIPTION: SafeText,
  REDCAP_TOKEN: /^[a-fA-F0-9]{32}$/,
  REDCAP_FORM: SafeText,
  // Same REGEX For invite email subject and body text
  INVITE_EMAIL: SafeText,
  CSS_COLOUR:
    /^(#(?:[0-9a-fA-F]{3,4}){1,2}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)|[a-zA-Z]{3,30})?$/,
  SURVEY_ELEMENT: SafeText,
  // REGEX allows multiple date formats (see functions in application/common/src/utils.ts) in CSV imput modal
  //   note: this regex is different to that used in the DoB type as we only want one format of date in the database
  DOB: /^(\d{4}[/-](0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])|(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[0-2])[/-]\d{4})$/,
}

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F\s\-'’.]+$
 * @example "John"
 */
export type FirstName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F\s\-'’.]+$
 * @example "William"
 */
export type MiddleName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F\s\-'’.]+$
 * @example "Doe"
 */
export type LastName = string

/**
 * @minLength 1
 * @maxLength 254
 * @pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
 * @example "john.doe@email.com"
 */
export type Email = string

/**
 * @maxLength 254
 * @pattern ^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$
 * @example "contact.us@email.com"
 */
export type OptionalEmail = string

/**
 * @minLength 14
 * @maxLength 128
 * @example "Supersecret123"
 */
export type Password = string

/**
 * @pattern ^04\d{8}$
 * @example "0412341432"
 */
export type Mobile = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "123 Sydney Street"
 */
export type AddressLine = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Darlinghurst"
 */
export type Suburb = string

/**
 * @pattern ^\d{4}$
 * @example "1234"
 */
export type Postcode = string

//note: the DoB pattern regex is different to the DOB REGEX above as we only want one format of date in the database
/**
 * @pattern ^\d{4}-\d{2}-\d{2}$
 * @example "2000-05-21"
 */
export type DoB = string

/**
 * @maxLength 128
 * @pattern ^[a-zA-Z0-9\-_=.:]*$
 * @example "123e4567-e89b-12d3-a456-426614174000"
 */
export type ExternalId = string

/**
 * @example "OrganisationAdmin"
 */
export type RoleT = Role

export type UserT = User

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Acme Genomics Study"
 */
export type StudyName = string

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "This is a short description of the study"
 */
export type StudyDescription = string

/**
 * @minLength 32
 * @maxLength 32
 * @pattern ^[a-fA-F0-9]{32}$
 * @example "2F86C2FA2FE1D119C1872A89AB309ABB"
 */
export type RedcapToken = string

// This is the name of the redcap instrument you are importing from.
// NOTE: These 'forms' are not the form label values that are seen on the webpages,
// but instead they are the unique form names seen in Column B of the data dictionary.

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€_+]+$
 ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Name of REDCap instrument (from Column B of data dictionary)"
 */
export type RedcapFormName = string

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$
 * @example "https://orgname.com/tcLink/"
 */
export type Url = string

/**
 * @maxLength 2048
 * @pattern ^(https?:\/\/[a-zA-Z0-9._~:/?#@!$&'()*+,;=%-]+)?$
 * @example "https://redcap.orgname.com/api/"
 */
export type OptionalUrl = string

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Invitation to CTRL - Dynamic Consent Platform"
 */
export type InviteEmailSubject = string

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "You have been invited to register with CTRL dynamic consent platform"
 */
export type InviteEmailText = string

/**
 * @minLength 1
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Acme Medical Research Institute"
 */
export type OrganisationName = string

/**
 * @minLength 1
 * @maxLength 1000
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "There was some problem with this thing that I was doing.\nBut I don't know why?\n\nCheers,\nJohn Doe"
 */
export type ContactUsText = string

/**
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Introduction to CTRL"
 */
export type SurveyStepTitle = string

/**
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Watch our short video about the consent process for taking part in medical research."
 */
export type SurveyStepDescription = string

/**
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Do you consent to the genomic test?"
 */
export type SurveyQuestionText = string

/**
 * @maxLength 2048
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+$
 * @example "Here is an explanation of what genomic means"
 */
export type SurveyQuestionTooltip = string

/**
 * @maxLength 2048
 * @pattern ^([a-zA-ZÀ-ÖØ-öø-ɏ\u1E00-\u1EFF\u0300-\u036F0-9\s.,!?:;()'"\-/#@&%$£€+_‘’“”–—…•≥≤°=]+)?$
 * @example "Section with questions about consent"
 */
export type SurveySubHeadingText = string

/**
 * @maxLength 30
 * @pattern ^(#(?:[0-9a-fA-F]{3,4}){1,2}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[0-9.]+\s*)?\)|[a-zA-Z]{3,30})?$
 * @example "#a1b2c3"
 */
export type CssColour = string
