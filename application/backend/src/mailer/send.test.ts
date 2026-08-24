import * as nodemailer from 'nodemailer'
import type { NodemailerMock } from 'nodemailer-mock'
import { sendEmail, _resetProviderForTests } from './send'

const mockNodeMailer = nodemailer as unknown as NodemailerMock

describe('sendEmail', () => {
  beforeEach(() => {
    _resetProviderForTests()
    mockNodeMailer.mock.reset()
  })

  it('sends a mail via the configured provider', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
    })
    const sent = mockNodeMailer.mock.getSentMail()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
    })
  })

  it('uses fromAddress as the default from', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
  })

  it('honours opts.from override when provided', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
      from: 'Custom <custom@example.com>',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].from).toBe('Custom <custom@example.com>')
  })

  it('reuses the same provider instance across calls', async () => {
    await sendEmail({ to: 'a@example.com', subject: 'A', text: 'a' })
    await sendEmail({ to: 'b@example.com', subject: 'B', text: 'b' })
    expect(mockNodeMailer.mock.getSentMail()).toHaveLength(2)
  })

  it('respects STUB_MAILER=true env var', async () => {
    const original = process.env.STUB_MAILER
    process.env.STUB_MAILER = 'true'
    _resetProviderForTests()
    try {
      await sendEmail({ to: 'user@example.com', subject: 'Hello', text: 'World' })
      expect(mockNodeMailer.mock.getSentMail()).toHaveLength(0)
    } finally {
      process.env.STUB_MAILER = original
      _resetProviderForTests()
    }
  })

  it('passes replyTo through', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
      replyTo: 'reply@example.com',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].replyTo).toBe('reply@example.com')
  })

  it('passes array to through', async () => {
    await sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hello',
      text: 'World',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].to).toEqual(['a@example.com', 'b@example.com'])
  })
})
