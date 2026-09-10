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

export async function sendEmail(opts: MailOpts): Promise<void> {
  // || so an empty-string from falls back to the configured sender
  const from = opts.from || config.mailer.sender
  const started = Date.now()
  const meta = {
    provider: config.mailer.provider,
    toCount: Array.isArray(opts.to) ? opts.to.length : 1,
    subject: opts.subject,
  }
  try {
    await getProvider().sendMail({ ...opts, from })
    logger.info('sendEmail', { ...meta, durationMs: Date.now() - started })
  } catch (err) {
    logger.error('sendEmail', {
      ...meta,
      durationMs: Date.now() - started,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      // redact smtp-basic errors — the SMTP reply can carry a recipient address
      reason: redactString(err instanceof Error ? err.message : String(err)),
    })
    // terse message: provider errors carry tenant detail and land in the 500 body
    throw new Error('Failed to send email')
  }
}

export function _resetProviderForTests(): void {
  providerInstance = null
}
