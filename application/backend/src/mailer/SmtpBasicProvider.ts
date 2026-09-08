import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'
import { extractAddress } from './sender'

interface SmtpBasicConfig {
  host: string
  port: number
  username: string
  password: string
  sender: string
  requireTLS?: boolean
  maxConnections: number
}

export class SmtpBasicProvider implements MailProvider {
  private readonly transporter: Transporter

  constructor(private readonly config: SmtpBasicConfig) {
    if (!config.host) throw new Error('smtp-basic: host is empty')
    if (!config.port) throw new Error('smtp-basic: port is empty')
    if (!config.username) throw new Error('smtp-basic: username is empty')
    if (!config.password) throw new Error('smtp-basic: password is empty')
    if (!config.sender) throw new Error('smtp-basic: sender is empty')

    // Fail-fast on a malformed sender; a bare 501 at MAIL FROM would name nothing.
    const address = extractAddress(config.sender)
    if (!address.includes('@') || /\s/.test(address)) {
      throw new Error(`smtp-basic: sender is not a usable address: ${config.sender}`)
    }

    this.transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: config.maxConnections,
      host: config.host,
      port: config.port,
      // Without this nodemailer only upgrades when the server advertises STARTTLS,
      // silently sending the password in the clear when it doesn't.
      requireTLS: config.requireTLS ?? true,
      auth: {
        user: config.username,
        pass: config.password,
      },
    })
  }

  async sendMail(opts: MailOpts): Promise<void> {
    await this.transporter.sendMail(opts)
  }
}
