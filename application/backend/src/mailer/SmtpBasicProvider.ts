import nodemailer, { type Transporter } from 'nodemailer'
import { assertSender, type MailOpts, type MailProvider } from './provider'

interface SmtpBasicConfig {
  host: string
  port: number
  username: string
  password: string
  sender: string
}

export class SmtpBasicProvider implements MailProvider {
  private transporter: Transporter | null = null

  constructor(private readonly config: SmtpBasicConfig) {
    if (!config.host) throw new Error('smtp-basic: host is empty')
    if (!config.port) throw new Error('smtp-basic: port is empty')
    if (!config.username) throw new Error('smtp-basic: username is empty')
    if (!config.password) throw new Error('smtp-basic: password is empty')
    assertSender('smtp-basic', config.sender)
  }

  async sendMail(opts: MailOpts): Promise<void> {
    await this.getTransporter().sendMail(opts)
  }

  async verify(): Promise<void> {
    await this.getTransporter().verify()
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter
    this.transporter = nodemailer.createTransport({
      pool: true,
      host: this.config.host,
      port: this.config.port,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
    })
    return this.transporter
  }
}
