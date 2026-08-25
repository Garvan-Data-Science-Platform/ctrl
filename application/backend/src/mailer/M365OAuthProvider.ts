import { ConfidentialClientApplication } from '@azure/msal-node'
import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'

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

    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    })
    this.user = extractAddress(config.sender)
  }

  async sendMail(opts: MailOpts): Promise<void> {
    const transporter = this.getTransporter()
    await transporter.sendMail({
      from: this.config.sender,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    })
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

export function extractAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/)
  return match ? match[1] : sender
}

export function redactSecrets(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err)
  const redacted = raw
    .replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"')
    .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
  return new Error(redacted)
}
