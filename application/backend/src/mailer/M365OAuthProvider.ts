import { ConfidentialClientApplication } from '@azure/msal-node'
import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'

const TOKEN_FAILURE = 'M365 token acquisition failed'

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
        cb(null, token.accessToken, token.expiresOn.getTime())
      } catch (err) {
        cb(err instanceof Error ? err : new Error(String(err)))
      }
    })
    return this.transporter
  }

  private async acquireToken(skipCache = false): Promise<{ accessToken: string; expiresOn: Date }> {
    try {
      const result = await this.cca.acquireTokenByClientCredential({
        scopes: ['https://outlook.office.com/.default'],
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

function redactString(str: string): string {
  return str
    .replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"')
    .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
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

  if (combined.includes('535 5.7.139')) {
    return new Error(
      `M365 authentication failed (535 5.7.139). Tenant-side setup likely incomplete. ` +
        `Check ITHELP-27087 checklist: SMTP.SendAsApp on app registration, ` +
        `Application Access Policy or RBAC scoping for the mailbox, ` +
        `Enterprise Application Object ID used in Add-MailboxPermission, ` +
        `SmtpClientAuthenticationDisabled=false on the sender mailbox, ` +
        `Security Defaults or Conditional Access exceptions. ` +
        `Original: ${safe}`,
    )
  }

  if (code === 'EAUTH' || combined.includes('EAUTH')) {
    return new Error(`M365 XOAUTH2 rejected by server. Original: ${safe}`)
  }

  return new Error(safe)
}
