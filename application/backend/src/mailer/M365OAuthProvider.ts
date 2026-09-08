import { ConfidentialClientApplication } from '@azure/msal-node'
import Bottleneck from 'bottleneck'
import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'
import { redactString } from './redact'
import { extractAddress } from './sender'

const TOKEN_FAILURE = 'M365 token acquisition failed'
// 240s stays clear of MSAL's 300s cache-fresh boundary so a real fetch happens.
const TOKEN_RENEWAL_MARGIN_MS = 240_000

// Kept tight so a stalled connection doesn't hold an Exchange SMTP AUTH slot for
// nodemailer's defaults of 2 min / 30 s / 10 min.
const SMTP_TIMEOUTS = {
  connectionTimeout: 30_000,
  greetingTimeout: 15_000,
  socketTimeout: 120_000,
}

interface M365OAuthConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  host: string
  port: number
  sender: string
  maxConnections: number
}

export class M365OAuthProvider implements MailProvider {
  private readonly cca: ConfidentialClientApplication
  private readonly transporter: Transporter
  private readonly user: string
  // Exchange caps sends at 30/min per mailbox; 2100ms spacing + concurrency 2 stays under it.
  private readonly limiter: Bottleneck

  constructor(private readonly config: M365OAuthConfig) {
    if (!config.tenantId) throw new Error('m365-oauth: tenantId is empty')
    if (!config.clientId) throw new Error('m365-oauth: clientId is empty')
    if (!config.clientSecret) throw new Error('m365-oauth: clientSecret is empty')
    if (!config.host) throw new Error('m365-oauth: host is empty')
    if (!config.port) throw new Error('m365-oauth: port is empty')
    if (!config.sender) throw new Error('m365-oauth: sender is empty')

    // sender doubles as the SMTP AUTH username, so validate it here.
    this.user = extractAddress(config.sender)
    if (!this.user.includes('@') || /\s/.test(this.user)) {
      throw new Error(`m365-oauth: sender is not a usable address: ${config.sender}`)
    }

    this.limiter = new Bottleneck({
      minTime: 2100,
      maxConcurrent: Math.min(2, config.maxConnections),
    })

    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    })

    this.transporter = nodemailer.createTransport({
      pool: true,
      ...SMTP_TIMEOUTS,
      maxConnections: config.maxConnections,
      host: config.host,
      port: config.port,
      requireTLS: true,
      auth: {
        type: 'OAuth2',
        user: this.user,
      },
    })
    this.transporter.set('oauth2_provision_cb', async (_user, renew, cb) => {
      try {
        // renew means nodemailer's token was rejected, bypass MSAL cache
        const token = await this.acquireToken(renew)
        cb(null, token.accessToken, token.expiresOn.getTime() - TOKEN_RENEWAL_MARGIN_MS)
      } catch (err) {
        cb(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }

  async sendMail(opts: MailOpts): Promise<void> {
    return this.limiter.schedule({ priority: opts.mailPriority === 'high' ? 1 : 5 }, () =>
      this.doSend(opts),
    )
  }

  private async doSend(opts: MailOpts): Promise<void> {
    try {
      await this.transporter.sendMail(opts)
    } catch (err) {
      throw wrapSmtpError(err)
    }
  }

  private async acquireToken(skipCache = false): Promise<{ accessToken: string; expiresOn: Date }> {
    try {
      const result = await this.cca.acquireTokenByClientCredential({
        scopes: ['https://outlook.office365.com/.default'],
        skipCache,
      })
      if (!result || !result.accessToken || !result.expiresOn) {
        throw new Error('MSAL returned no token')
      }
      return { accessToken: result.accessToken, expiresOn: result.expiresOn }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      throw new Error(`${TOKEN_FAILURE}: ${redactString(raw)}`)
    }
  }
}

export function wrapSmtpError(err: unknown): Error {
  const errObj = err as { code?: string; response?: string; message?: string }
  const rawMessage = errObj.message ?? String(err)
  const response = errObj.response ?? ''
  const code = errObj.code ?? ''
  const combined = `${rawMessage} ${response}`.trim()
  const safe = redactString(combined)

  // EAUTH gets stamped on anything the provision callback throws — check token first.
  if (combined.includes(TOKEN_FAILURE)) {
    return new Error(safe)
  }

  if (
    ['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ESOCKET'].includes(code) ||
    combined.includes('login.microsoftonline.com')
  ) {
    return new Error(`M365 network error: ${safe}`)
  }

  // 5.7.139 / 5.7.144 / 5.7.3 all point at tenant-side auth config.
  if (
    combined.includes('535 5.7.139') ||
    combined.includes('535 5.7.3') ||
    combined.includes('535 5.7.144')
  ) {
    return new Error(
      `M365 rejected the credential for this mailbox. Tenant-side authorisation is the likely ` +
        `cause: the role assignment on the app, the management scope the sender mailbox falls ` +
        `in, or SMTP AUTH on that mailbox. Original: ${safe}`,
    )
  }

  // 550 5.2.25x = mailbox already throttled. Must sit above SendAs — 550 5.2.252 and
  // 554 5.2.252 share a number but mean different things.
  if (/550 5\.2\.25[1-5]/.test(combined)) {
    return new Error(
      `M365 has throttled this mailbox from SMTP AUTH after repeated failures of the same kind. ` +
        `Stop sending. Retrying extends it, Microsoft support cannot lift it, and the messages ` +
        `never reach Microsoft 365 so Message Trace will not show them. Fix the underlying cause, ` +
        `then wait for the period to expire, which Microsoft does not publish. The only faster ` +
        `route is a different sender mailbox. Original: ${safe}`,
    )
  }

  // 5.7.60 anchored — 550 5.7.606-649 is a different (egress-IP block) family.
  if (
    /554 5\.2\.252/.test(combined) ||
    /\b5\.7\.60\b/.test(combined) ||
    combined.includes('SendAsDenied')
  ) {
    return new Error(
      `M365 refused the sender address. The mailbox we authenticate as is not permitted to ` +
        `send as this From address. Make them the same address, or grant Send As on the ` +
        `sending mailbox in Exchange admin. Do not retry this one. Original: ${safe}`,
    )
  }

  // 432 4.3.2 also carries a recipient thread limit; disambiguate on text.
  if (combined.includes('432 4.3.2') && /concurrent connections?/i.test(combined)) {
    return new Error(
      `M365 concurrent connection limit exceeded. Exchange allows three, check maxConnections ` +
        `on the transport. Original: ${safe}`,
    )
  }

  if (combined.includes('SubmissionQuotaExceededException')) {
    return new Error(
      `M365 daily recipient limit reached, 10,000 recipients per day for this mailbox. ` +
        `Sending resumes as the window rolls forward. Original: ${safe}`,
    )
  }

  if (code === 'EAUTH' || combined.includes('EAUTH')) {
    return new Error(`M365 XOAUTH2 rejected by server. Original: ${safe}`)
  }

  return new Error(safe)
}
