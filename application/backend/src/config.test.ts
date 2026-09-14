import Ajv from 'ajv'
import { schema } from './config'

const validator = () => new Ajv({ useDefaults: true }).compile(schema)

const smtpBasic = {
  provider: 'smtp-basic',
  host: 'smtp.example.com',
  port: 587,
  username: 'user',
  password: 'pass',
  sender: 'CTRL <noreply@example.com>',
  maxConnections: 3,
}

const m365 = {
  provider: 'm365-oauth',
  tenantId: 'tenant-id',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  host: 'smtp.office365.com',
  port: 587,
  sender: 'CTRL <ctrl-noreply@garvan.org.au>',
  maxConnections: 3,
}

describe('mailer config schema', () => {
  it('compiles under AJV strict mode', () => {
    expect(validator).not.toThrow()
  })

  it('accepts the smtp-basic variant', () => {
    expect(validator()({ mailer: smtpBasic })).toBe(true)
  })

  it('accepts the m365-oauth variant', () => {
    expect(validator()({ mailer: m365 })).toBe(true)
  })

  it('accepts an m365-oauth block carrying the chart default username and password', () => {
    // Helm deep-merges the chart's values.yaml into the deployer's block and there is no
    // way to remove a key the chart declares, so the rendered config always carries both.
    expect(validator()({ mailer: { ...m365, username: '', password: '' } })).toBe(true)
  })

  it('accepts empty strings so the chart default values still boot', () => {
    const empty = { ...smtpBasic, host: '', username: '', password: '', sender: '' }
    expect(validator()({ mailer: empty })).toBe(true)
  })

  it('rejects a typo in an smtp-basic key rather than ignoring it', () => {
    // dev's smtp block had additionalProperties: false; keep the smtp-basic variant
    // strict so typos still fail at boot.
    expect(validator()({ mailer: { ...smtpBasic, senderr: 'oops' } })).toBe(false)
  })

  it('rejects a config with no mailer block', () => {
    expect(validator()({ otp: false })).toBe(false)
  })

  it('rejects a mailer block with no provider', () => {
    const noProvider = { host: 'h', port: 587, username: 'u', password: 'p', sender: 's' }
    expect(validator()({ mailer: noProvider })).toBe(false)
  })

  it('rejects an unknown provider', () => {
    expect(validator()({ mailer: { ...m365, provider: 'ms365-oauth' } })).toBe(false)
  })

  it('rejects an m365-oauth block left blank', () => {
    // nobody selects m365-oauth to try the app out, so a blank field is a deploy mistake
    // and boot is a better place to find it than the first participant invite
    expect(validator()({ mailer: { ...m365, host: '' } })).toBe(false)
    expect(validator()({ mailer: { ...m365, sender: '' } })).toBe(false)
    expect(validator()({ mailer: { ...m365, clientSecret: '' } })).toBe(false)
  })

  it('rejects m365-oauth missing clientSecret', () => {
    const noSecret = {
      provider: 'm365-oauth',
      tenantId: 't',
      clientId: 'c',
      host: 'h',
      port: 587,
      sender: 's',
    }
    expect(validator()({ mailer: noSecret })).toBe(false)
  })

  it('rejects smtp-basic missing maxConnections', () => {
    const withoutMax: Partial<typeof smtpBasic> = { ...smtpBasic }
    delete withoutMax.maxConnections
    expect(validator()({ mailer: withoutMax })).toBe(false)
  })

  it('rejects m365-oauth missing maxConnections', () => {
    const withoutMax: Partial<typeof m365> = { ...m365 }
    delete withoutMax.maxConnections
    expect(validator()({ mailer: withoutMax })).toBe(false)
  })

  it('rejects m365-oauth with maxConnections above 3', () => {
    // Exchange caps SMTP AUTH at 3 concurrent connections per mailbox and answers 432 4.3.2
    // above that. Enforced at boot so the mistake is caught here rather than on the burst.
    expect(validator()({ mailer: { ...m365, maxConnections: 4 } })).toBe(false)
  })

  it('rejects maxConnections of 0 on both variants', () => {
    // nodemailer treats 0 as unlimited, which nothing here wants.
    expect(validator()({ mailer: { ...smtpBasic, maxConnections: 0 } })).toBe(false)
    expect(validator()({ mailer: { ...m365, maxConnections: 0 } })).toBe(false)
  })

  it('accepts smtp-basic with maxConnections above 3', () => {
    // No upper bound on smtp-basic — the ceiling depends on what the relay allows.
    expect(validator()({ mailer: { ...smtpBasic, maxConnections: 50 } })).toBe(true)
  })
})
