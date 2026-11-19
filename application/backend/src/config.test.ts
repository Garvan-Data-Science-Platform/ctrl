import Ajv from 'ajv'
import { schema } from './config'

// Only the OIDC part of the schema, so these tests don't depend on the mail settings
const validator = () => new Ajv({ useDefaults: true }).compile(schema.properties.oidc)

const provider = {
  name: 'aaf',
  providerUrl: 'https://cilogon.example.org',
  icon: 'https://example.org/icon.png',
  clientId: 'client-id',
  clientSecret: 'client-secret',
}

// Validates a list with one OIDC provider. Ajv fills in defaults in place, so the provider it
// returns shows what the backend would run with.
const validateProvider = (overrides: Record<string, unknown> = {}) => {
  const oidc = [{ ...provider, ...overrides }]
  const valid = validator()(oidc)
  return { valid, provider: oidc[0] }
}

describe('OIDC config schema', () => {
  // The whole schema, as the backend compiles it at startup. Compiling needs no config values.
  it('compiles the full config schema with the options the backend uses', () => {
    expect(() => new Ajv({ useDefaults: true }).compile(schema)).not.toThrow()
  })

  it('fills in the defaults for a provider with only the required fields', () => {
    const result = validateProvider()

    expect(result.valid).toBe(true)
    expect(result.provider).toEqual({
      ...provider,
      displayInAdminPortal: true,
      displayInUserPortal: true,
      authorizeUrlParams: '',
      auditLogClaims: true,
    })
  })

  it('accepts additional scopes', () => {
    expect(validateProvider({ additionalScopes: ['org.cilogon.userinfo'] }).valid).toBe(true)
  })

  it('rejects an empty additional scope', () => {
    expect(validateProvider({ additionalScopes: [''] }).valid).toBe(false)
  })

  it.each([
    ['acr values', { acrValues: ['https://refeds.org/profile/mfa'] }],
    ['amr values', { amrValues: ['mfa'] }],
    ['both', { acrValues: ['https://refeds.org/profile/mfa'], amrValues: ['mfa'] }],
  ])('accepts an MFA warning with %s', (_case, auditLogMfaWarning) => {
    expect(validateProvider({ auditLogMfaWarning }).valid).toBe(true)
  })

  it.each([
    ['no values', {}],
    ['an empty list', { acrValues: [] }],
    ['an empty value', { amrValues: [''] }],
    ['an unknown key', { acrValues: ['https://refeds.org/profile/mfa'], values: ['mfa'] }],
  ])('rejects an MFA warning with %s', (_case, auditLogMfaWarning) => {
    expect(validateProvider({ auditLogMfaWarning }).valid).toBe(false)
  })

  // An older backend applies the same rule, which is why it won't start with settings it doesn't know
  it('rejects an unknown key in a provider', () => {
    expect(validateProvider({ unknownSetting: true }).valid).toBe(false)
  })
})
