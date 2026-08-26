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

  it('uses config.mailer.sender as the default from', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'World',
    })
    expect(mockNodeMailer.mock.getSentMail()[0].from).toBe('CTRL <test@example.com>')
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

  it('rethrows a send failure after logging it', async () => {
    mockNodeMailer.mock.setShouldFail(true)
    await expect(
      sendEmail({ to: 'user@example.com', subject: 'Hello', text: 'World' }),
    ).rejects.toThrow()
    mockNodeMailer.mock.setShouldFail(false)
  })

  it('shares one provider across concurrent sends', async () => {
    // ParticipantsController fans invites out over Promise.all, so the singleton
    // has to survive a burst rather than build a transporter per send
    const before = mockNodeMailer.mock.getTransporters().length
    await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map((n) =>
        sendEmail({ to: `${n}@example.com`, subject: n, text: n }),
      ),
    )
    expect(mockNodeMailer.mock.getSentMail()).toHaveLength(5)
    expect(mockNodeMailer.mock.getTransporters().length - before).toBe(1)
  })
})

// The discriminated union exists to pick a provider, so both branches need
// exercising. Config is swapped per block because send.ts reads it at call time.
describe('getProvider variant selection', () => {
  const m365Config = {
    mailer: {
      provider: 'm365-oauth',
      tenantId: 'tenant-id',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      host: 'smtp.office365.com',
      port: 587,
      sender: 'CTRL <ctrl-noreply@garvan.org.au>',
    },
  }

  beforeEach(() => {
    jest.resetModules()
  })

  // resetModules gives the re-imported send.ts a fresh nodemailer mock, so the
  // module-level handle at the top of this file no longer points at it
  const freshMock = async () => (await import('nodemailer')) as unknown as NodemailerMock

  it('builds the M365 provider when the config says m365-oauth', async () => {
    jest.doMock('../config', () => ({ __esModule: true, default: m365Config }))
    const { sendEmail: send } = await import('./send')
    const nm = await freshMock()

    await send({ to: 'user@example.com', subject: 'Hello', text: 'World' })

    const sent = nm.mock.getSentMail()
    expect(sent).toHaveLength(1)
    expect(sent[0].from).toBe('CTRL <ctrl-noreply@garvan.org.au>')
    const transporters = nm.mock.getTransporters()
    expect(transporters[transporters.length - 1].get('oauth2_provision_cb')).toBeInstanceOf(
      Function,
    )
  })

  it('throws on a provider the switch does not know', async () => {
    jest.doMock('../config', () => ({
      __esModule: true,
      default: { mailer: { provider: 'graph-api', sender: 'CTRL <a@b.com>' } },
    }))
    const { sendEmail: send } = await import('./send')

    await expect(send({ to: 'user@example.com', subject: 'Hello', text: 'World' })).rejects.toThrow(
      /Unknown mailer provider: graph-api/,
    )
  })
})
