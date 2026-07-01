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

  if (password.length < 14) {
    fields.Length = { message: 'Password must be at least 14 characters' }
  }
  if (/password|welcome|changeme/i.test(password)) {
    fields.CommonBase = {
      message:
        'Password must not contain easily guessable words (i.e. Password, Changeme, Welcome)',
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
