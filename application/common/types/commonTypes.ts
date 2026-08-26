// Common base types to be defined once here and used in many other places in `api/`
//
// Note: see docs for explanation of character class patterns (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)
import { Role, User } from '@prisma/client'

// @common/types/commonTypes.ts

// Specifying these here, so that they can be defined in one place (even though its not DRY)
export const REGEX = {
  NAME: /^[a-zA-ZÀ-ÖØ-öø-ɏ\s\-'.]+$/,
  ADDRESS: /^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$/,
  MOBILE: /^04\d{8}$/,
  POSTCODE: /^\d{4}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
}

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\s\-'.]+$
 * @example "John"
 */
export type FirstName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\s\-'.]+$
 * @example "William"
 */
export type MiddleName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ\s\-'.]+$
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
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "123 Sydney Street"
 */
export type AddressLine = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Darlinghurst"
 */
export type Suburb = string

/**
 * @pattern ^\d{4}$
 * @example "1234"
 */
export type Postcode = string

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

// TODO: add annotations?
export type UserT = User

// * @minLength 1 //TODO: check if we want minLength for study name
/**
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Acme Genomics Study"
 */
export type StudyName = string

// * @minLength 1 //TODO: check if we want minLength for study description
/**
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "This is a short description of the study"
 */
export type StudyDescription = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: verify max length
 * @pattern ^[a-zA-Z0-9\-_=.:]+$
 * @example "123e4567-e89b-12d3-a456-426614174000" // TODO: improve example
 */
export type RedcapToken = string

// This is the name of the redcap instrument you are importing from.
// NOTE: These 'forms' are not the form label values that are seen on the webpages,
// but instead they are the unique form names seen in Column B of the data dictionary.

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€_+]+$
 * @example "Name of REDCap instrument (from Column B of data dictionary)"
 */
export type RedcapFormName = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: verify max length
 * @pattern ^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$
 * @example "https://redcap.orgname.com/api/"
 */
export type Url = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Invitation to CTRL - Dynamic Consent Platform"
 */
export type InviteEmailSubject = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "You have been invited to register with CTRL dynamic consent platform"
 */
export type InviteEmailText = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Acme Medical Research Institute"
 */
export type OrganisationName = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "There was some problem with this thing that I was doing.\nBut I don't know why?\n\nCheers,\nJohn Doe"
 */
export type ContactUsText = string

// * @minLength 1 TODO: confirm that an empty title is okay
// * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
/**
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]*$
 * @example "Introduction to CTRL"
 */
export type SurveyStepTitle = string

// * @minLength 1 TODO: confirm that an empty description is okay
// * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
/**
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]*$
 * @example "Watch our short video about the consent process for taking part in medical research."
 */
export type SurveyStepDescription = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Do you consent to the genomic test?"
 */
export type SurveyQuestionText = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Here is an explanation of what genomic means"
 */
export type SurveyQuestionTooltip = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÖØ-öø-ɏ0-9\s.,!?:;()'"\-/#@&%$£€+]+$
 * @example "Section with questions about consent"
 */
export type SurveySubHeadingText = string
