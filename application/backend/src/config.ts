import JSON5 from 'json5'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import { FromSchema } from 'json-schema-to-ts'

//Validate
export const schema = {
  type: 'object',
  properties: {
    oidc: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          providerUrl: {
            type: 'string',
            minLength: 1,
          },
          clientId: {
            type: 'string',
            minLength: 1,
          },
          clientSecret: { type: 'string', minLength: 1 },
          icon: { type: 'string', minLength: 1 },
          displayInAdminPortal: { type: 'boolean', default: true },
          displayInUserPortal: { type: 'boolean', default: true },
          authorizeUrlParams: { type: 'string', default: '' },
        },
        required: ['name', 'providerUrl', 'icon', 'clientId', 'clientSecret'],
        additionalProperties: false,
      },
    },
    disableAdminPasswordLogin: { type: 'boolean' },
    otp: {
      type: 'boolean',
    },
    inviteExpiryDays: {
      type: 'number',
    },
    mailer: {
      oneOf: [
        {
          type: 'object',
          properties: {
            provider: { const: 'smtp-basic' },
            host: { type: 'string' },
            port: { type: 'number' },
            username: { type: 'string' },
            password: { type: 'string' },
            sender: { type: 'string' },
            // STARTTLS is required unless this is explicitly false. Only set it false for
            // a relay that genuinely has no TLS, such as a local mail catcher.
            requireTLS: { type: 'boolean' },
            maxConnections: { type: 'number' },
          },
          required: [
            'provider',
            'host',
            'port',
            'username',
            'password',
            'sender',
            'maxConnections',
          ],
          // Helm merges the chart's username and password into every mailer block, so the
          // m365-oauth variant cannot forbid extras. smtp-basic can, and a typo here should
          // fail at boot.
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            provider: { const: 'm365-oauth' },
            tenantId: { type: 'string', minLength: 1 },
            clientId: { type: 'string', minLength: 1 },
            clientSecret: { type: 'string', minLength: 1 },
            host: { type: 'string', minLength: 1 },
            port: { type: 'number' },
            sender: { type: 'string', minLength: 1 },
            maxConnections: { type: 'number' },
          },
          required: [
            'provider',
            'tenantId',
            'clientId',
            'clientSecret',
            'host',
            'port',
            'sender',
            'maxConnections',
          ],
        },
      ],
    },
  },
  required: ['mailer'],
  additionalProperties: false,
} as const

export type Config = FromSchema<typeof schema>

const dir = process.env['CONFIG_DIR']
let config = {}
if (process.env.NODE_ENV !== 'test') {
  if (dir) {
    fs.readdirSync(dir).map((file) => {
      if (['json', 'json5'].includes(file.toLowerCase().split('.').at(-1) || '')) {
        config = { ...config, ...JSON5.parse(fs.readFileSync(path.join(dir, file), 'ascii')) }
      }
    })
  }

  const ajv = new Ajv({ useDefaults: true })
  const validate = ajv.compile(schema)

  if (!validate(config)) {
    throw new Error(`Invalid config ${JSON.stringify(validate.errors)}`)
  }
} else {
  config = {
    mailer: {
      provider: 'smtp-basic',
      host: 'x',
      port: 1,
      username: 'x',
      password: 'x',
      sender: 'CTRL <test@example.com>',
      maxConnections: 3,
    },
  }
}

if (process.env.NODE_ENV !== 'production') {
  const redact = (key: string, value: unknown) =>
    ['password', 'clientSecret'].includes(key) ? '[REDACTED]' : value
  console.log('CONFIG', JSON.stringify(config, redact, 2))
}

export default config as Config
