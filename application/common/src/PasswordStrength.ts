import { commonPasswordBaseWords } from '../testing/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FieldErrors {
  [name: string]: {
    message: string
    value?: any
  }
}

interface PasswordStrengthResult {
  isValid: boolean
  fields: FieldErrors
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const fields: FieldErrors = {}
  const baseWordRegex = new RegExp(commonPasswordBaseWords.join('|'), 'i')

  if (password.length < 14) {
    fields.Length = { message: 'Password must be at least 14 characters' }
  }
  const commonMatch = password.match(baseWordRegex)
  if (commonMatch) {
    fields.CommonBase = {
      message: `Password contains a commonly used weak pattern: "${commonMatch[0]}". Please choose something less predictable.`,
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
