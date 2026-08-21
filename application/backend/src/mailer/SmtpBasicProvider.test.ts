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

  it('verify calls nodemailer verify without throwing', async () => {
    const provider = new SmtpBasicProvider(validConfig)
    await expect(provider.verify()).resolves.not.toThrow()
  })
})
