import logger from 'common/src/logger'
import config from '../config'
import type { MailOpts, MailProvider } from './provider'
import { redactString } from './redact'
import { SmtpBasicProvider } from './SmtpBasicProvider'
import { M365OAuthProvider } from './M365OAuthProvider'

let providerInstance: MailProvider | null = null

function getProvider(): MailProvider {
  if (providerInstance) return providerInstance

  if (process.env.STUB_MAILER === 'true') {
    providerInstance = { sendMail: async () => {} }
    return providerInstance
  }

  const cfg = config.mailer
  if (cfg.provider === 'smtp-basic') {
    providerInstance = new SmtpBasicProvider({
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      sender: cfg.sender,
      requireTLS: cfg.requireTLS,
      maxConnections: cfg.maxConnections,
    })
    return providerInstance
  }

  if (cfg.provider === 'm365-oauth') {
    providerInstance = new M365OAuthProvider({
      tenantId: cfg.tenantId,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      host: cfg.host,
      port: cfg.port,
      sender: cfg.sender,
      maxConnections: cfg.maxConnections,
    })
    return providerInstance
  }

  throw new Error(`Unknown mailer provider: ${(cfg as { provider: string }).provider}`)
}

// The single entry point for outbound mail. New callers should route through here rather
// than constructing a nodemailer transporter directly, so provider selection, sender
// validation, redaction and error classification all stay in one place.
export async function sendEmail(opts: MailOpts): Promise<void> {
  // || not ?? so an empty-string from a caller falls back to the configured sender
  // rather than reaching nodemailer as MAIL FROM:<> and being rejected with a bare 501.
  // On the m365-oauth path, an opts.from that differs from config.mailer.sender only
  // works if the Entra app has Send As on that mailbox — otherwise Exchange returns
  // 554 5.2.252 / 5.7.60 SendAsDenied. See wrapSmtpError in M365OAuthProvider.
  const from = opts.from || config.mailer.sender
  const started = Date.now()
  // never log text, html, from, or anything token shaped
  const meta = {
    provider: config.mailer.provider,
    toCount: Array.isArray(opts.to) ? opts.to.length : 1,
    subject: opts.subject,
  }
  try {
    // inside the try so a bad provider config is logged here rather than
    // escaping as a raw message
    await getProvider().sendMail({ ...opts, from })
    logger.info('sendEmail', { ...meta, durationMs: Date.now() - started })
  } catch (err) {
    logger.error('sendEmail', {
      ...meta,
      durationMs: Date.now() - started,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      // smtp-basic errors are raw nodemailer, so the SMTP reply can carry a recipient
      // address. The M365 path is already redacted, running it twice is harmless.
      reason: redactString(err instanceof Error ? err.message : String(err)),
    })
    // provider messages carry tenant setup detail and ErrorHandler puts err.message
    // in the 500 body, so callers get the terse one
    throw new Error('Failed to send email')
  }
}

export function _resetProviderForTests(): void {
  providerInstance = null
}
