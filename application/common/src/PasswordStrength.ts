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

export async function checkPasswordStrength(password: string): Promise<PasswordStrengthResult> {
  const fields: FieldErrors = {}

  if (password.length < 8) {
    fields.Length = { message: 'Password must be at least 8 characters' }
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
