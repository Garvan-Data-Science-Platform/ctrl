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
}

const m365 = {
  provider: 'm365-oauth',
  tenantId: 'tenant-id',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  host: 'smtp.office365.com',
  port: 587,
  sender: 'CTRL <ctrl-noreply@garvan.org.au>',
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
})
