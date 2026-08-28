import { ConfidentialClientApplication } from '@azure/msal-node'
import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'
import { redactString } from './redact'

const TOKEN_FAILURE = 'M365 token acquisition failed'
// MSAL treats a cached token as expired five minutes early. Nodemailer renews only once the
// expiry it was handed has passed, with no margin, so match MSAL rather than presenting a
// token that dies mid-handshake.
const TOKEN_RENEWAL_MARGIN_MS = 300_000

interface M365OAuthConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  host: string
  port: number
  sender: string
}

export class M365OAuthProvider implements MailProvider {
  private readonly cca: ConfidentialClientApplication
  private transporter: Transporter | null = null
  private readonly user: string

  constructor(private readonly config: M365OAuthConfig) {
    if (!config.tenantId) throw new Error('m365-oauth: tenantId is empty')
    if (!config.clientId) throw new Error('m365-oauth: clientId is empty')
    if (!config.clientSecret) throw new Error('m365-oauth: clientSecret is empty')
    if (!config.host) throw new Error('m365-oauth: host is empty')
    if (!config.port) throw new Error('m365-oauth: port is empty')
    if (!config.sender) throw new Error('m365-oauth: sender is empty')

    // sender doubles as the SMTP AUTH username on this path, so a malformed one
    // fails AUTH rather than just producing an odd From header
    this.user = extractAddress(config.sender)
    if (!this.user.includes('@') || /\s/.test(this.user)) {
      throw new Error(`m365-oauth: sender is not a usable address: ${config.sender}`)
    }

    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    })
  }

  async sendMail(opts: MailOpts): Promise<void> {
    const transporter = this.getTransporter()
    try {
      await transporter.sendMail({ ...opts, from: opts.from ?? this.config.sender })
    } catch (err) {
      throw wrapSmtpError(err)
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter
    this.transporter = nodemailer.createTransport({
      pool: true,
      // Exchange allows three concurrent SMTP AUTH connections and returns
      // 432 4.3.2 above that. Nodemailer defaults to five.
      maxConnections: 3,
      // and 30 messages a minute, which an invite batch will hit. Nodemailer queues
      // above this rather than letting Exchange reject them, and repeated rejections
      // are what get a mailbox throttled from SMTP AUTH for an unpublished period.
      rateDelta: 60_000,
      rateLimit: 30,
      host: this.config.host,
      port: this.config.port,
      requireTLS: true,
      auth: {
        type: 'OAuth2',
        user: this.user,
      },
    })
    this.transporter.set('oauth2_provision_cb', async (_user, renew, cb) => {
      try {
        // renew means nodemailer's token was rejected, so go past MSAL's cache
        const token = await this.acquireToken(renew)
        cb(null, token.accessToken, token.expiresOn.getTime() - TOKEN_RENEWAL_MARGIN_MS)
      } catch (err) {
        cb(err instanceof Error ? err : new Error(String(err)))
      }
    })
    return this.transporter
  }

  private async acquireToken(skipCache = false): Promise<{ accessToken: string; expiresOn: Date }> {
    try {
      const result = await this.cca.acquireTokenByClientCredential({
        // Microsoft's SMTP client-credentials guidance specifies this resource.
        // The outlook.office.com value is from the HVE doc, which pairs with a
        // different endpoint.
        scopes: ['https://outlook.office365.com/.default'],
        skipCache,
      })
      if (!result || !result.accessToken || !result.expiresOn) {
        throw new Error('MSAL returned no token')
      }
      return { accessToken: result.accessToken, expiresOn: result.expiresOn }
    } catch (err) {
      throw new Error(`${TOKEN_FAILURE}: ${redactSecrets(err).message}`)
    }
  }
}

export function extractAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/)
  return match ? match[1] : sender
}

export function redactSecrets(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err)
  return new Error(redactString(raw))
}

export function wrapSmtpError(err: unknown): Error {
  const errObj = err as { code?: string; response?: string; message?: string }
  const rawMessage = errObj.message ?? String(err)
  const response = errObj.response ?? ''
  const code = errObj.code ?? ''
  const combined = `${rawMessage} ${response}`.trim()
  const safe = redactString(combined)

  // Nodemailer stamps EAUTH on anything the provision callback throws, so this
  // check has to come first or a token failure reads as an XOAUTH2 rejection.
  if (combined.includes(TOKEN_FAILURE)) {
    return new Error(safe)
  }

  if (
    ['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ESOCKET'].includes(code) ||
    combined.includes('login.microsoftonline.com')
  ) {
    return new Error(`M365 network error: ${safe}`)
  }

  // 5.7.139 is the tenant refusing the request, 5.7.144 is invalid API permissions, and
  // 5.7.3 is the generic XOAUTH2 rejection Microsoft prints with no cause attached. Same
  // tenant-side checklist for all three.
  if (
    combined.includes('535 5.7.139') ||
    combined.includes('535 5.7.3') ||
    combined.includes('535 5.7.144')
  ) {
    return new Error(
      `M365 rejected the credential for this mailbox. Tenant-side authorisation is the likely ` +
        `cause: the role assignment on the app, the management scope the sender mailbox falls ` +
        `in, or SMTP AUTH on that mailbox. See the M365 section of the deployment docs. ` +
        `Original: ${safe}`,
    )
  }

  // 550 5.2.251 to 5.2.255 mean the mailbox is already throttled, not that one send
  // failed. Must sit above the SendAs branch, since 550 5.2.252 and 554 5.2.252 share
  // a number and mean very different things.
  if (/550 5\.2\.25[1-5]/.test(combined)) {
    return new Error(
      `M365 has throttled this mailbox from SMTP AUTH after repeated failures of the same kind. ` +
        `Stop sending. Retrying extends it, Microsoft support cannot lift it, and the messages ` +
        `never reach Microsoft 365 so Message Trace will not show them. Fix the underlying cause, ` +
        `then wait for the period to expire, which Microsoft does not publish. The only faster ` +
        `route is a different sender mailbox. Original: ${safe}`,
    )
  }

  // Repeated send-as failures are one of the triggers for the throttling above. Match the
  // 554 form and the exception name, since a bare 5.2.252 also appears in the 550 throttle.
  if (
    /554 5\.2\.252/.test(combined) ||
    combined.includes('5.7.60') ||
    combined.includes('SendAsDenied')
  ) {
    return new Error(
      `M365 refused the sender address. The mailbox we authenticate as is not permitted to ` +
        `send as this From address. Make them the same address, or see the M365 section of ` +
        `the deployment docs on granting Send As. Do not retry this one. Original: ${safe}`,
    )
  }

  // 432 4.3.2 also carries a recipient thread limit, which has nothing to do with our pool.
  if (combined.includes('432 4.3.2') && /concurrent connections?/i.test(combined)) {
    return new Error(
      `M365 concurrent connection limit exceeded. Exchange allows three, check maxConnections ` +
        `on the transport. Original: ${safe}`,
    )
  }

  // 554 5.2.0 on its own is a generic submission envelope, the exception name carries the
  // meaning, so send-as denials and spam verdicts arrive under the same status code.
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
