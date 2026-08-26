import { ConfidentialClientApplication } from '@azure/msal-node'
import nodemailer, { type Transporter } from 'nodemailer'
import { assertSender, type MailOpts, type MailProvider } from './provider'

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
    this.user = assertSender('m365-oauth', config.sender)

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
      await transporter.sendMail({
        from: this.config.sender,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        replyTo: opts.replyTo,
      })
    } catch (err) {
      throw wrapSmtpError(err)
    }
  }

  async verify(): Promise<void> {
    const transporter = this.getTransporter()
    await transporter.verify()
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: this.config.host,
      port: this.config.port,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: this.user,
      },
    })
    this.transporter.set('oauth2_provision_cb', async (_user, _renew, cb) => {
      try {
        const token = await this.acquireToken()
        cb(null, token.accessToken, token.expiresOn.getTime())
      } catch (err) {
        cb(err instanceof Error ? err : new Error(String(err)))
      }
    })
    return this.transporter
  }

  private async acquireToken(): Promise<{ accessToken: string; expiresOn: Date }> {
    try {
      const result = await this.cca.acquireTokenByClientCredential({
        scopes: ['https://outlook.office.com/.default'],
      })
      if (!result || !result.accessToken || !result.expiresOn) {
        throw new Error('MSAL returned no token')
      }
      return { accessToken: result.accessToken, expiresOn: result.expiresOn }
    } catch (err) {
      throw redactSecrets(err)
    }
  }
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
