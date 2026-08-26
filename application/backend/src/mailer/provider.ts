export interface MailOpts {
  to: string | string[]
  subject: string
  text: string
  html?: string
  replyTo?: string
  from?: string
}

export interface MailProvider {
  sendMail(opts: MailOpts): Promise<void>
}
