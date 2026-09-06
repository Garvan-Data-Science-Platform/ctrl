import * as nodemailer from 'nodemailer'
import type { NodemailerMock } from 'nodemailer-mock'
import { SmtpBasicProvider } from './SmtpBasicProvider'

const mockNodeMailer = nodemailer as unknown as NodemailerMock

describe('SmtpBasicProvider', () => {
  const validConfig = {
    host: 'smtp.test.com',
    port: 587,
    username: 'test-user',
    password: 'test-pass',
    sender: 'CTRL <noreply@example.com>',
  }

  afterEach(() => {
    mockNodeMailer.mock.reset()
  })

  it('sends a mail via nodemailer', async () => {
    const provider = new SmtpBasicProvider(validConfig)
    await provider.sendMail({
      to: 'recipient@example.com',
      subject: 'Test',
      text: 'Hello',
    })
    const sent = mockNodeMailer.mock.getSentMail()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({
      to: 'recipient@example.com',
      subject: 'Test',
      text: 'Hello',
    })
  })

  it('passes replyTo when provided', async () => {
    const provider = new SmtpBasicProvider(validConfig)
    await provider.sendMail({
      to: 'recipient@example.com',
      subject: 'Test',
      text: 'Hello',
      replyTo: 'reply@example.com',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].replyTo).toBe('reply@example.com')
  })

  it('supports to as an array', async () => {
    const provider = new SmtpBasicProvider(validConfig)
    await provider.sendMail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Test',
      text: 'Hello',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].to).toEqual(['a@example.com', 'b@example.com'])
  })

  it('throws when host is empty', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, host: '' })).toThrow(/host is empty/)
  })

  it('throws when username is empty', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, username: '' })).toThrow(
      /username is empty/,
    )
  })

  it('throws when password is empty', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, password: '' })).toThrow(
      /password is empty/,
    )
  })

  it('throws when sender is empty', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, sender: '' })).toThrow(/sender is empty/)
  })

  it('throws when port is empty', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, port: 0 })).toThrow(/port is empty/)
  })

  it('throws when sender is not an address', () => {
    // #909 was a sender the server rejected at MAIL FROM with a bare 501
    expect(() => new SmtpBasicProvider({ ...validConfig, sender: 'CTRL' })).toThrow(
      /not a usable address/,
    )
  })

  it('throws when sender has empty angle brackets', () => {
    expect(() => new SmtpBasicProvider({ ...validConfig, sender: 'CTRL <>' })).toThrow(
      /not a usable address/,
    )
  })

  it('accepts a dotless domain so MailHog setups keep working', () => {
    expect(
      () => new SmtpBasicProvider({ ...validConfig, sender: 'CTRL <noreply@localhost>' }),
    ).not.toThrow()
  })

  // requireTLS defaults to true and is only turned off by config. Not unit tested, because
  // asserting it means reaching through nodemailer-mock into the real transport it wraps.
  // The MailHog e2e covers it instead: mailhog speaks no TLS, so config.e2e.json5 sets
  // requireTLS false and that suite fails outright if the option stops being plumbed through.
})
