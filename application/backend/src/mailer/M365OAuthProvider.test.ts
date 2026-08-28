import * as nodemailer from 'nodemailer'
import type { NodemailerMock } from 'nodemailer-mock'
import { ConfidentialClientApplication } from '@azure/msal-node'
import {
  M365OAuthProvider,
  extractAddress,
  redactSecrets,
  wrapSmtpError,
} from './M365OAuthProvider'

jest.mock('@azure/msal-node')

const mockNodeMailer = nodemailer as unknown as NodemailerMock
const MockedCCA = ConfidentialClientApplication as unknown as jest.Mock

describe('M365OAuthProvider', () => {
  const validConfig = {
    tenantId: 'tenant-123',
    clientId: 'client-456',
    clientSecret: 'secret-789',
    host: 'smtp.office365.com',
    port: 587,
    sender: 'CTRL <ctrl-noreply@garvan.org.au>',
  }

  let mockAcquireToken: jest.Mock

  beforeEach(() => {
    mockNodeMailer.mock.reset()
    mockAcquireToken = jest.fn()
    MockedCCA.mockImplementation(() => ({
      acquireTokenByClientCredential: mockAcquireToken,
    }))
  })

  describe('constructor', () => {
    it('constructs with valid config', () => {
      expect(() => new M365OAuthProvider(validConfig)).not.toThrow()
    })

    it('throws when tenantId is empty', () => {
      expect(() => new M365OAuthProvider({ ...validConfig, tenantId: '' })).toThrow(
        /tenantId is empty/,
      )
    })

    it('throws when clientId is empty', () => {
      expect(() => new M365OAuthProvider({ ...validConfig, clientId: '' })).toThrow(
        /clientId is empty/,
      )
    })

    it('throws when clientSecret is empty', () => {
      expect(() => new M365OAuthProvider({ ...validConfig, clientSecret: '' })).toThrow(
        /clientSecret is empty/,
      )
    })

    it('throws when sender is empty', () => {
      expect(() => new M365OAuthProvider({ ...validConfig, sender: '' })).toThrow(/sender is empty/)
    })

    it('throws when sender is not an address', () => {
      // sender doubles as the SMTP AUTH username on this path, so a bad one fails auth
      expect(() => new M365OAuthProvider({ ...validConfig, sender: 'CTRL' })).toThrow(
        /not a usable address/,
      )
    })

    it('throws when sender has empty angle brackets', () => {
      expect(() => new M365OAuthProvider({ ...validConfig, sender: 'CTRL <>' })).toThrow(
        /not a usable address/,
      )
    })
  })

  describe('sendMail', () => {
    it('sends a mail via nodemailer with the configured sender as from', async () => {
      mockAcquireToken.mockResolvedValue({
        accessToken: 'fake-token',
        expiresOn: new Date(Date.now() + 3600 * 1000),
      })
      const provider = new M365OAuthProvider(validConfig)
      await provider.sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
        html: '<p>Hello</p>',
      })
      const sent = mockNodeMailer.mock.getSentMail()
      expect(sent).toHaveLength(1)
      expect(sent[0]).toMatchObject({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
        html: '<p>Hello</p>',
        from: 'CTRL <ctrl-noreply@garvan.org.au>',
      })
    })

    it('honours opts.from override when provided', async () => {
      mockAcquireToken.mockResolvedValue({
        accessToken: 'fake',
        expiresOn: new Date(Date.now() + 3600 * 1000),
      })
      const provider = new M365OAuthProvider(validConfig)
      await provider.sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
        from: 'Study <study@example.com>',
      })
      expect(mockNodeMailer.mock.getSentMail()[0].from).toBe('Study <study@example.com>')
    })

    it('passes replyTo through', async () => {
      mockAcquireToken.mockResolvedValue({
        accessToken: 'fake',
        expiresOn: new Date(Date.now() + 3600 * 1000),
      })
      const provider = new M365OAuthProvider(validConfig)
      await provider.sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
        replyTo: 'reply@example.com',
      })
      expect(mockNodeMailer.mock.getSentMail()[0].replyTo).toBe('reply@example.com')
    })
  })

  describe('acquireToken', () => {
    it('returns access token and expiry on MSAL success', async () => {
      const expiresOn = new Date(Date.now() + 3600 * 1000)
      mockAcquireToken.mockResolvedValue({ accessToken: 'valid-token', expiresOn })
      const provider = new M365OAuthProvider(validConfig)
      const token = await (
        provider as unknown as {
          acquireToken: () => Promise<{ accessToken: string; expiresOn: Date }>
        }
      ).acquireToken()
      expect(token.accessToken).toBe('valid-token')
      expect(token.expiresOn).toBe(expiresOn)
    })

    it('leaves MSAL caching alone on a normal acquisition', async () => {
      mockAcquireToken.mockResolvedValue({ accessToken: 't', expiresOn: new Date() })
      const provider = new M365OAuthProvider(validConfig)
      await (provider as unknown as { acquireToken: () => Promise<unknown> }).acquireToken()
      expect(mockAcquireToken).toHaveBeenCalledWith(expect.objectContaining({ skipCache: false }))
    })

    it('bypasses the MSAL cache when nodemailer asks for a renewal', async () => {
      mockAcquireToken.mockResolvedValue({ accessToken: 't', expiresOn: new Date() })
      const provider = new M365OAuthProvider(validConfig)
      await (
        provider as unknown as { acquireToken: (skipCache: boolean) => Promise<unknown> }
      ).acquireToken(true)
      expect(mockAcquireToken).toHaveBeenCalledWith(expect.objectContaining({ skipCache: true }))
    })

    it('throws when MSAL returns null', async () => {
      mockAcquireToken.mockResolvedValue(null)
      const provider = new M365OAuthProvider(validConfig)
      await expect(
        (provider as unknown as { acquireToken: () => Promise<unknown> }).acquireToken(),
      ).rejects.toThrow(/MSAL returned no token/)
    })

    it('throws when MSAL result lacks accessToken', async () => {
      mockAcquireToken.mockResolvedValue({ accessToken: '', expiresOn: new Date() })
      const provider = new M365OAuthProvider(validConfig)
      await expect(
        (provider as unknown as { acquireToken: () => Promise<unknown> }).acquireToken(),
      ).rejects.toThrow(/MSAL returned no token/)
    })

    it('does not leak the raw MSAL token in error surface (secret redaction)', async () => {
      const secretToken = 'eyJ0eXAiOiJKV1Q-DO-NOT-LEAK'
      mockAcquireToken.mockRejectedValue(
        new Error(`Auth failure {"access_token": "${secretToken}"}`),
      )
      const provider = new M365OAuthProvider(validConfig)
      const err = await (provider as unknown as { acquireToken: () => Promise<unknown> })
        .acquireToken()
        .catch((e: Error) => e)
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toContain('[REDACTED]')
      expect((err as Error).message).not.toContain(secretToken)
    })
  })
})

describe('extractAddress', () => {
  it('extracts email from display-name-plus-brackets format', () => {
    expect(extractAddress('CTRL <ctrl-noreply@garvan.org.au>')).toBe('ctrl-noreply@garvan.org.au')
  })

  it('returns input unchanged for a bare email', () => {
    expect(extractAddress('noreply@example.com')).toBe('noreply@example.com')
  })
})

describe('redactSecrets', () => {
  it('redacts access_token JSON field', () => {
    const input = new Error('{"access_token": "eyJ0eXAiOiJKV1Q-token-should-not-leak"}')
    const output = redactSecrets(input)
    expect(output.message).toContain('[REDACTED]')
    expect(output.message).not.toContain('eyJ0eXAiOiJKV1Q-token-should-not-leak')
  })

  it('redacts client_secret JSON field', () => {
    const input = new Error('{"client_secret": "SUPER-SECRET-VALUE"}')
    const output = redactSecrets(input)
    expect(output.message).toContain('[REDACTED]')
    expect(output.message).not.toContain('SUPER-SECRET-VALUE')
  })

  it('redacts Bearer tokens in prose', () => {
    const input = new Error('Rejected: Bearer abc123.def456.ghi789')
    const output = redactSecrets(input)
    expect(output.message).toContain('Bearer [REDACTED]')
    expect(output.message).not.toContain('abc123.def456.ghi789')
  })

  it('preserves non-secret parts of the message', () => {
    const input = new Error('Error 401 tenant xyz {"access_token":"secret"} network unreachable')
    const output = redactSecrets(input)
    expect(output.message).toContain('Error 401')
    expect(output.message).toContain('tenant xyz')
    expect(output.message).toContain('network unreachable')
    expect(output.message).not.toContain('secret')
  })
})

describe('wrapSmtpError', () => {
  it('wraps 535 5.7.139 with the tenant-config diagnostic', () => {
    const err = Object.assign(new Error('535 5.7.139 Authentication unsuccessful'), {
      code: 'EAUTH',
      response: '535 5.7.139 Authentication unsuccessful, user or tenant not allowed',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('535 5.7.139')
    expect(wrapped.message).toContain('Tenant-side authorisation')
    expect(wrapped.message).not.toContain('XOAUTH2 rejected')
  })

  it('reports a token acquisition failure as such, not as an XOAUTH2 rejection', () => {
    // nodemailer stamps EAUTH on whatever the provision callback throws, so a bad
    // clientSecret would otherwise be reported as a tenant mailbox problem
    const err = Object.assign(new Error('M365 token acquisition failed: invalid_client'), {
      code: 'EAUTH',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('M365 token acquisition failed')
    expect(wrapped.message).not.toContain('Tenant-side authorisation')
    expect(wrapped.message).not.toContain('XOAUTH2 rejected')
  })

  it('gives 535 5.7.3 the same tenant-config diagnostic as 5.7.139', () => {
    // 5.7.3 is what a wrong permission or an unscoped mailbox returns, and it is the
    // likelier first result once IT provisions, so it must not fall through to EAUTH
    const err = Object.assign(new Error('535 5.7.3 Authentication unsuccessful'), {
      code: 'EAUTH',
      response: '535 5.7.3 Authentication unsuccessful',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('535 5.7.3')
    expect(wrapped.message).toContain('Tenant-side authorisation')
    expect(wrapped.message).not.toContain('XOAUTH2 rejected')
  })

  it('names the sender address as the cause on a SendAs rejection', () => {
    const err = Object.assign(new Error('Message failed'), {
      response: '554 5.2.252 SendAsDenied',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('not permitted to send')
    expect(wrapped.message).toContain('granting Send As')
    expect(wrapped.message).toContain('Do not retry')
  })

  it('names the connection cap on 432 4.3.2', () => {
    const err = Object.assign(new Error('Concurrent connections limit exceeded'), {
      response: '432 4.3.2 Concurrent connections limit exceeded',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('concurrent connection limit')
  })

  it('reports a throttled mailbox as throttled, not as a single SendAs refusal', () => {
    // 554 5.2.252 is one refusal, 550 5.2.252 is the mailbox being blocked. They share
    // a number, so a substring match on 5.2.252 alone reports the block as the refusal.
    const err = Object.assign(new Error('Message failed'), {
      response: '550 5.2.252 Sender throttled due to continuous send as denied errors',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('throttled this mailbox')
    expect(wrapped.message).toContain('Stop sending')
    expect(wrapped.message).not.toContain('Add-RecipientPermission')
  })

  it('covers the whole 550 5.2.25x throttle family', () => {
    for (const code of ['5.2.251', '5.2.252', '5.2.253', '5.2.254', '5.2.255']) {
      const err = Object.assign(new Error('Message failed'), {
        response: `550 ${code} Sender throttled`,
      })
      expect(wrapSmtpError(err).message).toContain('throttled this mailbox')
    }
  })

  it('names the daily recipient limit on a submission quota error', () => {
    const err = Object.assign(new Error('Message failed'), {
      response: '554 5.2.0 STOREDRV.Submission.Exception:SubmissionQuotaExceededException',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('daily recipient limit')
  })

  it('does not read a send-as denial as a quota failure', () => {
    // 554 5.2.0 is a generic submission envelope, so matching the status code alone told
    // the operator to wait out a 24 hour window that was never going to clear
    const err = Object.assign(new Error('Message failed'), {
      response:
        '554 5.2.0 STOREDRV.Submission.Exception:SendAsDeniedException.MapiExceptionSendAsDenied',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('not permitted to send')
    expect(wrapped.message).not.toContain('daily recipient limit')
  })

  it('leaves an unrecognised 554 5.2.0 exception unclassified', () => {
    const err = Object.assign(new Error('Message failed'), {
      response: '554 5.2.0 STOREDRV.Submission.Exception:OutboundSpamException',
    })
    expect(wrapSmtpError(err).message).not.toContain('daily recipient limit')
  })

  it('does not blame the connection pool for a recipient thread limit', () => {
    // same status code, but this one is the recipient mailbox being flooded
    const err = Object.assign(new Error('Message failed'), {
      response: '432 4.3.2 STOREDRV.Deliver; recipient thread limit exceeded',
    })
    expect(wrapSmtpError(err).message).not.toContain('concurrent connection limit')
  })

  it('gives 535 5.7.144 the same tenant-config diagnostic', () => {
    // 5.7.144 is the code Microsoft documents for invalid API permissions, which is the
    // likeliest result of a half-finished grant
    const err = Object.assign(new Error('auth failed'), {
      code: 'EAUTH',
      response: '535 5.7.144 XOAUTH2 authentication failed. Invalid API permissions.',
    })
    expect(wrapSmtpError(err).message).not.toContain('XOAUTH2 rejected')
  })

  it('wraps generic EAUTH with an XOAUTH2 rejection message', () => {
    const err = Object.assign(new Error('auth failed'), { code: 'EAUTH' })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('XOAUTH2 rejected')
  })

  it('wraps ETIMEDOUT as an M365 network error', () => {
    const err = Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('M365 network error')
  })

  it('wraps errors mentioning login.microsoftonline.com as network errors', () => {
    const err = new Error(
      'failed to fetch https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
    )
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).toContain('M365 network error')
  })

  it('preserves secret redaction in wrapped errors', () => {
    const secretToken = 'abc123.def456.ghi789'
    const err = Object.assign(new Error(`auth failed: Bearer ${secretToken}`), {
      code: 'EAUTH',
    })
    const wrapped = wrapSmtpError(err)
    expect(wrapped.message).not.toContain(secretToken)
    expect(wrapped.message).toContain('[REDACTED]')
  })
})

// The provision callback is what actually hands MSAL's token to nodemailer for
// SMTP AUTH. nodemailer-mock never opens a connection so it never fires the
// callback on its own, which means this is the only coverage it gets.
describe('provisionCallback', () => {
  const validConfig = {
    tenantId: 'tenant-123',
    clientId: 'client-456',
    clientSecret: 'secret-789',
    host: 'smtp.office365.com',
    port: 587,
    sender: 'CTRL <ctrl-noreply@garvan.org.au>',
  }

  type ProvisionCallback = (
    user: string,
    renew: boolean,
    cb: (err: Error | null, accessToken?: string, expires?: number) => void,
  ) => Promise<void>

  let mockAcquireToken: jest.Mock

  beforeEach(() => {
    mockNodeMailer.mock.reset()
    mockAcquireToken = jest.fn()
    MockedCCA.mockImplementation(() => ({
      acquireTokenByClientCredential: mockAcquireToken,
    }))
  })

  const registeredCallback = async (provider: M365OAuthProvider): Promise<ProvisionCallback> => {
    await provider.sendMail({ to: 'a@example.com', subject: 'S', text: 'T' })
    // mock.reset() does not clear accumulated transporters, so take the newest
    const transporters = mockNodeMailer.mock.getTransporters()
    return transporters[transporters.length - 1].get('oauth2_provision_cb') as ProvisionCallback
  }

  it('is registered on the transporter', async () => {
    mockAcquireToken.mockResolvedValue({ accessToken: 't', expiresOn: new Date() })
    const cb = await registeredCallback(new M365OAuthProvider(validConfig))
    expect(typeof cb).toBe('function')
  })

  it('hands nodemailer the access token and an absolute expiry in milliseconds', async () => {
    const expiresOn = new Date(Date.now() + 3600 * 1000)
    mockAcquireToken.mockResolvedValue({ accessToken: 'real-token', expiresOn })
    const cb = await registeredCallback(new M365OAuthProvider(validConfig))

    const done = jest.fn()
    await cb('ctrl-noreply@garvan.org.au', false, done)

    // nodemailer compares this against Date.now(), so it must be absolute ms, brought
    // forward by the same margin MSAL uses so the two caches agree on stale
    expect(done).toHaveBeenCalledWith(null, 'real-token', expiresOn.getTime() - 300_000)
  })

  it('forwards nodemailer renewal requests past the MSAL cache', async () => {
    mockAcquireToken.mockResolvedValue({ accessToken: 't', expiresOn: new Date() })
    const cb = await registeredCallback(new M365OAuthProvider(validConfig))

    await cb('ctrl-noreply@garvan.org.au', true, jest.fn())

    expect(mockAcquireToken).toHaveBeenLastCalledWith(expect.objectContaining({ skipCache: true }))
  })

  it('passes an acquisition failure to nodemailer instead of throwing', async () => {
    mockAcquireToken.mockResolvedValue({ accessToken: 't', expiresOn: new Date() })
    const cb = await registeredCallback(new M365OAuthProvider(validConfig))

    mockAcquireToken.mockRejectedValue(new Error('invalid_client'))
    const done = jest.fn()
    await expect(cb('ctrl-noreply@garvan.org.au', false, done)).resolves.not.toThrow()

    const err = done.mock.calls[0][0]
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toContain('M365 token acquisition failed')
  })
})

describe('sendMail error wrapping integration', () => {
  const validConfig = {
    tenantId: 'tenant-123',
    clientId: 'client-456',
    clientSecret: 'secret-789',
    host: 'smtp.office365.com',
    port: 587,
    sender: 'CTRL <ctrl-noreply@garvan.org.au>',
  }

  let mockAcquireToken: jest.Mock

  beforeEach(() => {
    mockNodeMailer.mock.reset()
    mockAcquireToken = jest.fn()
    MockedCCA.mockImplementation(() => ({
      acquireTokenByClientCredential: mockAcquireToken,
    }))
  })

  it('propagates a thrown error out of sendMail when nodemailer fails', async () => {
    mockAcquireToken.mockResolvedValue({
      accessToken: 'valid',
      expiresOn: new Date(Date.now() + 3600 * 1000),
    })
    mockNodeMailer.mock.setShouldFail(true)
    const provider = new M365OAuthProvider(validConfig)
    await expect(
      provider.sendMail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Hello',
      }),
    ).rejects.toThrow()
  })
})
