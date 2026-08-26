import logger from 'common/src/logger'
import config from '../config'
import type { MailOpts, MailProvider } from './provider'
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
    })
    return providerInstance
  }

  throw new Error(`Unknown mailer provider: ${(cfg as { provider: string }).provider}`)
}

export async function sendEmail(opts: MailOpts): Promise<void> {
  const provider = getProvider()
  const from = opts.from ?? config.mailer.sender
  const started = Date.now()
  // never log text, html, from, or anything token shaped
  const meta = {
    provider: config.mailer.provider,
    toCount: Array.isArray(opts.to) ? opts.to.length : 1,
    subject: opts.subject,
  }
  try {
    await provider.sendMail({ ...opts, from })
    logger.info('sendEmail', { ...meta, durationMs: Date.now() - started })
  } catch (err) {
    logger.error('sendEmail', {
      ...meta,
      durationMs: Date.now() - started,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
    })
    throw err
  }
}

export function _resetProviderForTests(): void {
  providerInstance = null
}
