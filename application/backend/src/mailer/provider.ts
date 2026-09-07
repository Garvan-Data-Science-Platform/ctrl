// Optional priority hint. Providers with an internal queue may honour it — the m365-oauth
// path uses this to prioritise urgent sends past bulk in its Bottleneck queue. Providers
// without a queue (smtp-basic) don't inspect it; nodemailer ignores unknown top-level
// options, so the field passes through harmlessly. Kept a single-value union rather than
// 'high' | 'normal' because 'normal' is just the absence of the hint.
export type MailPriority = 'high'

export interface MailOpts {
  to: string | string[]
  subject: string
  text: string
  html?: string
  replyTo?: string
  from?: string
  mailPriority?: MailPriority
}

export interface MailProvider {
  sendMail(opts: MailOpts): Promise<void>
}
