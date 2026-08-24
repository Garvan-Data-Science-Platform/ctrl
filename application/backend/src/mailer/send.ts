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

  providerInstance = new SmtpBasicProvider({
    host: config.smtp.host,
    port: config.smtp.port,
    username: config.smtp.username,
    password: config.smtp.password,
  })
  return providerInstance
}

export async function sendEmail(opts: MailOpts): Promise<void> {
  const provider = getProvider()
  const from = opts.from ?? fromAddress
  await provider.sendMail({ ...opts, from })
}

export function _resetProviderForTests(): void {
  providerInstance = null
}
