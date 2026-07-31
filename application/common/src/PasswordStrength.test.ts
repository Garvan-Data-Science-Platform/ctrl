import { checkPasswordStrength } from './PasswordStrength'

describe('checkPasswordStrength', () => {
  const strongPassword = 'Constellation2026'

  describe('without context (backwards compatibility)', () => {
    it('accepts a strong password with no context', () => {
      const { isValid, fields } = checkPasswordStrength(strongPassword)
      expect(isValid).toBe(true)
      expect(fields).toEqual({})
    })

    it('rejects a password shorter than 14 characters', () => {
      const { isValid, fields } = checkPasswordStrength('Short2026Aok')
      expect(isValid).toBe(false)
      expect(fields.Length).toBeDefined()
    })

    it('rejects a password without an uppercase letter', () => {
      const { isValid, fields } = checkPasswordStrength('constellation2026')
      expect(isValid).toBe(false)
      expect(fields.Uppercase).toBeDefined()
    })

    it('rejects a password without a lowercase letter', () => {
      const { isValid, fields } = checkPasswordStrength('CONSTELLATION2026')
      expect(isValid).toBe(false)
      expect(fields.Lowercase).toBeDefined()
    })

    it('rejects a password without a digit', () => {
      const { isValid, fields } = checkPasswordStrength('ConstellationOnly')
      expect(isValid).toBe(false)
      expect(fields.Number).toBeDefined()
    })

    it('rejects a password containing a common base word', () => {
      const { isValid, fields } = checkPasswordStrength('MyPassword2026Ok')
      expect(isValid).toBe(false)
      expect(fields.CommonBase).toBeDefined()
    })
  })

  describe('with context — PII rejection', () => {
    it('rejects a password containing the first name', () => {
      const { isValid, fields } = checkPasswordStrength('Tanuj2026StrongOne', {
        firstName: 'Tanuj',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
      expect(fields.PersonalInfo.message).toContain('tanuj')
    })

    it('rejects a password containing the last name', () => {
      const { isValid, fields } = checkPasswordStrength('AndersonMyPas2026', {
        lastName: 'Anderson',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
    })

    it('rejects a password containing the middle name', () => {
      const { isValid, fields } = checkPasswordStrength('RobertMyStrong26', {
        middleName: 'Robert',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
    })

    it('rejects a password containing the email local part', () => {
      const { isValid, fields } = checkPasswordStrength('Tanuj2026MyStrong', {
        email: 'tanuj@garvan.org.au',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
      expect(fields.PersonalInfo.message).toContain('tanuj')
    })

    it('does not reject a password containing only the email domain', () => {
      const { fields } = checkPasswordStrength('GarvanStaff2026Big', {
        email: 'someone@garvan.org.au',
      })
      expect(fields.PersonalInfo).toBeUndefined()
    })

    it('rejects a password containing the DOB year', () => {
      const { isValid, fields } = checkPasswordStrength('MyStrongOne1990Ok', {
        dob: '1990-05-15',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
      expect(fields.PersonalInfo.message).toContain('1990')
    })

    it('matches case-insensitively', () => {
      const { isValid, fields } = checkPasswordStrength('TANUJBrightStar26', {
        firstName: 'Tanuj',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
    })

    it('accepts a strong password with valid context', () => {
      const { isValid, fields } = checkPasswordStrength(strongPassword, {
        firstName: 'Elizabeth',
        lastName: 'Windsor',
        email: 'elizabeth@example.com',
        dob: '1926-04-21',
      })
      expect(isValid).toBe(true)
      expect(fields).toEqual({})
    })

    it('ignores tokens shorter than 4 characters', () => {
      const { fields } = checkPasswordStrength(strongPassword, {
        firstName: 'Bob',
      })
      expect(fields.PersonalInfo).toBeUndefined()
    })

    it('splits multi-word names on whitespace', () => {
      const { isValid, fields } = checkPasswordStrength('BergerKing2026Big', {
        lastName: 'Van Der Berg',
      })
      expect(isValid).toBe(false)
      expect(fields.PersonalInfo).toBeDefined()
    })

    it('handles an empty context object', () => {
      const { isValid, fields } = checkPasswordStrength(strongPassword, {})
      expect(isValid).toBe(true)
      expect(fields.PersonalInfo).toBeUndefined()
    })

    it('handles context with all undefined fields', () => {
      const { isValid, fields } = checkPasswordStrength(strongPassword, {
        firstName: undefined,
        lastName: undefined,
        email: undefined,
        dob: undefined,
      })
      expect(isValid).toBe(true)
      expect(fields.PersonalInfo).toBeUndefined()
    })

    it('returns multiple errors when password violates multiple checks', () => {
      const { isValid, fields } = checkPasswordStrength('tanuj', {
        firstName: 'Tanuj',
      })
      expect(isValid).toBe(false)
      expect(fields.Length).toBeDefined()
      expect(fields.Uppercase).toBeDefined()
      expect(fields.Number).toBeDefined()
      expect(fields.PersonalInfo).toBeDefined()
    })

    it('names the specific matched token in the error message', () => {
      const { fields } = checkPasswordStrength('Elizabeth2026Extra', {
        firstName: 'Elizabeth',
      })
      expect(fields.PersonalInfo.message).toContain('elizabeth')
    })
  })
})
