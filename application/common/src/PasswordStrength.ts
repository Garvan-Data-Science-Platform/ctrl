import { commonPasswordBaseWords } from '../testing/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FieldErrors {
  [name: string]: {
    message: string
    value?: any
  }
}

export interface PasswordContext {
  email?: string
  firstName?: string
  middleName?: string
  lastName?: string
  dob?: string
}

interface PasswordStrengthResult {
  isValid: boolean
  fields: FieldErrors
}

function extractPiiTokens(context: PasswordContext): string[] {
  const tokens = new Set<string>()
  const addTokens = (value: string | undefined) => {
    if (!value) return
    value
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length >= 3)
      .forEach((token) => tokens.add(token))
  }
  addTokens(context.firstName)
  addTokens(context.middleName)
  addTokens(context.lastName)
  if (context.email) {
    addTokens(context.email.split('@')[0])
  }
  if (context.dob) {
    const year = context.dob.match(/\d{4}/)?.[0]
    if (year) tokens.add(year)
  }
  return Array.from(tokens)
}

export function checkPasswordStrength(
  password: string,
  context?: PasswordContext,
): PasswordStrengthResult {
  const fields: FieldErrors = {}
  const baseWordRegex = new RegExp(commonPasswordBaseWords.join('|'), 'i')

  if (password.length < 14) {
    fields.Length = { message: 'Password must be at least 14 characters' }
  }
  if (baseWordRegex.test(password)) {
    fields.CommonBase = {
      message: `Password must not contain easily guessable words (i.e. ${commonPasswordBaseWords.join(', ')})`,
    }
  }
  if (context) {
    const tokens = extractPiiTokens(context)
    const lowerPassword = password.toLowerCase()
    const matchedToken = tokens.find((t) => lowerPassword.includes(t))
    if (matchedToken) {
      fields.PersonalInfo = {
        message: `Password contains personal information: "${matchedToken}"`,
      }
    }
  }
  if (!/[A-Z]/.test(password)) {
    fields.Uppercase = {
      message: 'Password must contain at least one uppercase letter',
    }
  }
  if (!/[a-z]/.test(password)) {
    fields.Lowercase = {
      message: 'Password must contain at least one lowercase letter',
    }
  }
  if (!/[0-9]/.test(password)) {
    fields.Number = { message: 'Password must contain at least one number' }
  }

  return {
    isValid: Object.keys(fields).length === 0,
    fields,
  }
}
