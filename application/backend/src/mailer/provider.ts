export interface MailOpts {
  to: string | string[]
  subject: string
  text: string
  html?: string
  replyTo?: string
  from?: string
  // Providers with an internal queue jump this ahead of unqueued sends (m365-oauth).
  // Ignored by smtp-basic.
  mailPriority?: 'high'
}

export interface MailProvider {
  sendMail(opts: MailOpts): Promise<void>
}
