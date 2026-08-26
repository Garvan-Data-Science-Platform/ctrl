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
  verify?(): Promise<void>
}

export function extractAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/)
  return match ? match[1] : sender
}

// Returns the bare address. The m365-oauth path hands it to nodemailer as the
// SMTP AUTH username, so a sender that does not resolve to one fails auth
// rather than just producing an odd From header.
export function assertSender(provider: string, sender: string): string {
  if (!sender) throw new Error(`${provider}: sender is empty`)
  const address = extractAddress(sender)
  if (!address.includes('@') || /\s/.test(address)) {
    throw new Error(`${provider}: sender is not a usable address: ${sender}`)
  }
  return address
}
