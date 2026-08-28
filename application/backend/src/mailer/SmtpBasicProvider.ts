import nodemailer, { type Transporter } from 'nodemailer'
import type { MailOpts, MailProvider } from './provider'

interface SmtpBasicConfig {
  host: string
  port: number
  username: string
  password: string
  sender: string
  requireTLS?: boolean
}

export class SmtpBasicProvider implements MailProvider {
  private transporter: Transporter | null = null

  constructor(private readonly config: SmtpBasicConfig) {
    if (!config.host) throw new Error('smtp-basic: host is empty')
    if (!config.port) throw new Error('smtp-basic: port is empty')
    if (!config.username) throw new Error('smtp-basic: username is empty')
    if (!config.password) throw new Error('smtp-basic: password is empty')
    if (!config.sender) throw new Error('smtp-basic: sender is empty')
  }

  async sendMail(opts: MailOpts): Promise<void> {
    await this.getTransporter().sendMail(opts)
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: this.config.host,
      port: this.config.port,
      // without this nodemailer only upgrades when the server advertises STARTTLS, and
      // silently sends the password in the clear when it does not
      requireTLS: this.config.requireTLS ?? true,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
    })
    return this.transporter
  }
}
