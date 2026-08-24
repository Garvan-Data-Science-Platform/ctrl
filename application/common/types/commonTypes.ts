// Common base types to be defined once here and used in many other places in `api/`
//
// Note: see docs for explanation of character class patterns (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)
import { Role, User } from '@prisma/client'

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[\p{L}\s\-\'\.]+$
 * @example "John"
 */
export type FirstName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[\p{L}\s\-\'\.]+$
 * @example "William"
 */
export type MiddleName = string

/**
 * @minLength 1
 * @maxLength 100
 * @pattern ^[\p{L}\s\-\'\.]+$
 * @example "Doe"
 */
export type LastName = string

/**
 * @minLength 1
 * @maxLength 254
 * @isEmail
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
 * @pattern ^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$ please provide valid phone number
 * @example "0412341432"
 */
export type Mobile = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "123 Sydney Street"
 */
export type AddressLine = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "Darlinghurst"
 */
export type Suburb = string

/**
 * @pattern ^\d{4}$
 * @example "1234"
 */
export type Postcode = string

/**
 * @isDate Date of birth must be YYYY-MM-DD format
 * @example "2000-05-21"
 */
export type DoB = string

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-Z0-9\-_=\.:]+$
 * @example "123e4567-e89b-12d3-a456-426614174000"
 */
export type ExternalId = string

/**
 * @example "OrganisationAdmin"
 */
export type RoleT = Role

// TODO: add annotations?
export type UserT = User

/**
 * @minLength 1
 * @maxLength 128
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "Acme Genomics Study"
 */
export type StudyName = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "This is a short description of the study"
 */
export type StudyDescription = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: verify max length
 * @pattern ^[a-zA-Z0-9\-_=\.:]+$
 * @example "123e4567-e89b-12d3-a456-426614174000" // TODO: improve example
 */
export type RedcapToken = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: verify max length
 * @pattern ^[a-zA-Z0-9\-_=\.:]+$
 * @example "https://redcap.orgname.com/api/"
 */
export type Url = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "Invitation to CTRL - Dynamic Consent Platform"
 */
export type InviteEmailSubject = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "You have been invited to register with CTRL dynamic consent platform"
 */
export type InviteEmailText = string

/**
 * @minLength 1
 * @maxLength 128 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "Acme Medical Research Institute"
 */
export type OrganisationName = string

/**
 * @minLength 1
 * @maxLength 900 // TODO: align this with the maxLength of the field
 * @pattern ^[a-zA-ZÀ-ÿ0-9\s\,\.\-\/\#]+$
 * @example "There was some problem with this thing that I was doing.\nBut I don't know why?\n\nCheers,\nJohn Doe"
 */
export type ContactUsText = string
