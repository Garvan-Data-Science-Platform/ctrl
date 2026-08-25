import config from '../config'
import { fromAddress } from '../utils/mailer'
import type { MailOpts, MailProvider } from './provider'
import { SmtpBasicProvider } from './SmtpBasicProvider'

let providerInstance: MailProvider | null = null

function getProvider(): MailProvider {
  if (providerInstance) return providerInstance

  if (process.env.STUB_MAILER === 'true') {
    providerInstance = {
      sendMail: async () => {},
      verify: async () => {},
    }
    return providerInstance
  }

  const cfg = config.mailer
  if (cfg.provider === 'smtp-basic') {
    providerInstance = new SmtpBasicProvider({
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
    })
    return providerInstance
  }

  throw new Error(`Unknown mailer provider: ${(cfg as { provider: string }).provider}`)
}

export async function sendEmail(opts: MailOpts): Promise<void> {
  const provider = getProvider()
  const from = opts.from ?? fromAddress
  await provider.sendMail({ ...opts, from })
}

export function _resetProviderForTests(): void {
  providerInstance = null
}
