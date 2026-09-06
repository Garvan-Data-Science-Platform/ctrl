import { redactString } from './redact'

describe('redactString', () => {
  it('redacts an access_token JSON field', () => {
    const out = redactString('{"access_token": "eyJ0eXAiOiJKV1Q-do-not-leak"}')
    expect(out).toContain('[REDACTED]')
    expect(out).not.toContain('do-not-leak')
  })

  it('redacts a client_secret JSON field', () => {
    expect(redactString('{"client_secret": "SUPER-SECRET"}')).not.toContain('SUPER-SECRET')
  })

  it('redacts a refresh_token JSON field', () => {
    expect(redactString('{"refresh_token": "0.AXoA-secret"}')).not.toContain('0.AXoA-secret')
  })

  it('redacts a secret passed as a form field', () => {
    const out = redactString('grant_type=client_credentials&client_secret=abc123&scope=x')
    expect(out).toContain('client_secret=[REDACTED]')
    expect(out).not.toContain('abc123')
    expect(out).toContain('grant_type=client_credentials')
  })

  it('redacts a Bearer token', () => {
    expect(redactString('Rejected: Bearer abc123.def456.ghi789')).toBe(
      'Rejected: Bearer [REDACTED]',
    )
  })

  it('redacts a bare JWT that is not behind a Bearer prefix', () => {
    // a token loses its JSON field and its Bearer prefix as soon as something
    // interpolates it into a sentence, which is exactly when it reaches a log
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.abc-def'
    const out = redactString(`token was ${jwt} and it failed`)
    expect(out).not.toContain(jwt)
    expect(out).toContain('token was [REDACTED] and it failed')
  })

  it('redacts a recipient address out of an SMTP rejection', () => {
    // User.email is encrypted at rest, so it should not arrive in a log via a 550 either
    const out = redactString('550 5.1.1 <participant@example.org> recipient rejected')
    expect(out).not.toContain('participant@example.org')
    expect(out).toContain('550 5.1.1')
  })

  it('keeps the diagnostic parts that are not secrets', () => {
    const out = redactString('Error 401 tenant xyz {"access_token":"secret"} network unreachable')
    expect(out).toContain('Error 401')
    expect(out).toContain('tenant xyz')
    expect(out).toContain('network unreachable')
    expect(out).not.toContain('"secret"')
  })

  it('leaves a clean message untouched', () => {
    const clean = '432 4.3.2 Concurrent connections limit exceeded'
    expect(redactString(clean)).toBe(clean)
  })
})
